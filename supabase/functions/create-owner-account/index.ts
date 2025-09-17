import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAccountRequest {
  upiId: string;
  ownerName: string;
  phone?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Create owner account function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? ''
          }
        }
      }
    );

    // Get user from token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    const user = data.user;
    console.log('Authenticated user:', user.id);

    const { upiId, ownerName, phone }: CreateAccountRequest = await req.json();

    // Validate required parameters
    if (!upiId || !ownerName) {
      throw new Error('Missing required parameters: upiId and ownerName');
    }

    console.log('Creating Razorpay account for:', { upiId, ownerName, userId: user.id });

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    
    console.log('Razorpay credentials check:', { 
      keyIdExists: !!razorpayKeyId, 
      keySecretExists: !!razorpayKeySecret,
      keyIdLength: razorpayKeyId?.length || 0
    });
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials missing', { razorpayKeyId: !!razorpayKeyId, razorpayKeySecret: !!razorpayKeySecret });
      throw new Error('Payment service configuration error');
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    // Create Razorpay account
    const accountResponse = await fetch('https://api.razorpay.com/v2/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email || `${user.id}@livenzo.app`,
        phone: phone || '9999999999',
        type: 'route',
        reference_id: user.id,
        legal_business_name: ownerName,
        business_type: 'individual',
        contact_name: ownerName,
        profile: {
          category: 'housing',
          subcategory: 'rental',
          addresses: {
            registered: {
              street1: 'Property Address',
              street2: '',
              city: 'Mumbai',
              state: 'Maharashtra',
              postal_code: '400001',
              country: 'IN'
            }
          }
        },
        legal_info: {
          pan: 'AAAPA1234C',
          gst: ''
        },
        brand: {
          color: '000000'
        },
        notes: {
          internal_reference_id: user.id
        }
      }),
    });

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error('Razorpay account creation failed:', {
        status: accountResponse.status,
        statusText: accountResponse.statusText,
        error: errorText
      });
      
      let razorpayError = 'Account creation failed';
      try {
        const errorJson = JSON.parse(errorText);
        razorpayError = errorJson.error?.description || errorJson.message || razorpayError;
      } catch (parseError) {
        console.error('Failed to parse Razorpay error:', parseError);
      }
      
      throw new Error(`Failed to create Razorpay account: ${razorpayError}`);
    }

    const accountData = await accountResponse.json();
    console.log('Razorpay account created:', accountData.id);

    // Create stakeholder (beneficial owner)
    const stakeholderResponse = await fetch(`https://api.razorpay.com/v2/accounts/${accountData.id}/stakeholders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: ownerName,
        email: user.email || `${user.id}@livenzo.app`,
        percentage_ownership: 100,
        notes: {
          random_key_by_partner: 'random_value'
        }
      }),
    });

    if (!stakeholderResponse.ok) {
      const errorText = await stakeholderResponse.text();
      console.error('Stakeholder creation failed:', errorText);
    }

    // Update user profile with Razorpay account ID
    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({
        razorpay_account_id: accountData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to save account details');
    }

    console.log('User profile updated with account ID:', accountData.id);

    return new Response(JSON.stringify({
      success: true,
      accountId: accountData.id,
      status: accountData.status,
      message: 'Razorpay account created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-owner-account:', error);
    const safeMessage = (error as Error)?.message || 'Unknown error';

    let errorMessage = 'Account creation failed';
    let statusCode = 500;
    
    if (safeMessage.includes('Payment service configuration')) {
      errorMessage = 'Payment service temporarily unavailable';
      statusCode = 503;
    } else if (safeMessage.includes('Failed to create Razorpay account')) {
      errorMessage = safeMessage;
      statusCode = 502;
    } else if (safeMessage.includes('Unauthorized')) {
      errorMessage = 'Authentication required';
      statusCode = 401;
    } else if (safeMessage.includes('Missing required parameters')) {
      errorMessage = safeMessage;
      statusCode = 400;
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      debug: safeMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
};

serve(handler);