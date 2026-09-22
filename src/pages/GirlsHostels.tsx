import React, { useEffect } from 'react';
import { useRooms } from '@/context/RoomContext';
import Layout from '@/components/Layout';
import RoomResults from '@/components/room/RoomResults';
import Seo, { OG_ROOMS } from '@/components/seo/Seo';
import { buildRoomJsonLd } from '@/utils/roomSchema';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GirlsHostels: React.FC = () => {
  const {
    filteredRooms,
    setFilters,
    isLoading,
    clearAllFilters,
    searchText,
  } = useRooms();

  useEffect(() => {
    // Set initial filters for girls hostels
    setFilters({ gender: 'female' });
    
    return () => {
      // Clear filters when leaving the page if desired, 
      // but usually we want to keep them if the user navigates back and forth
    };
  }, [setFilters]);

  const handleClearFilters = () => {
    clearAllFilters();
    setFilters({ gender: 'female' });
  };

  return (
    <Layout>
      <Seo
        title="Best Girls Hostels in Kota & Female PGs | Livenzo"
        description="Find verified girls hostels in Kota and female-only PGs near Allen, Resonance, and other coaching institutes. Compare rent, facilities, and book a free visit."
        path="/girls-hostels-in-kota"
        image={OG_ROOMS}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Girls Hostels and PGs in Kota',
          numberOfItems: filteredRooms.length,
          itemListElement: filteredRooms.slice(0, 20).map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: buildRoomJsonLd(r, r.minimum_price ?? r.price)
          }))
        }}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Girls Hostels in Kota</h1>
          <p className="text-muted-foreground">
            Explore the best verified female-only hostels and PGs in Kota, Rajasthan.
          </p>
        </div>

        {/* No rooms empty state */}
        {!isLoading && filteredRooms.length === 0 && (
          <Card className="mb-6 overflow-hidden border border-border/60 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h2 className="text-lg font-semibold text-foreground tracking-tight">
                    No girls hostels found at the moment
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Our team can help you find the right girls hostel on WhatsApp.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const phoneNumber = '917488698970';
                    const message = encodeURIComponent(`Hi, I'm looking for a girls hostel in Kota.\n\nBudget: ₹____\nLocation: ____`);
                    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                  }}
                  className="h-11 rounded-full px-6 bg-[#25D366] hover:bg-[#1DA851] text-white font-medium shadow-md transition-all"
                >
                  Chat with Room Expert
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <RoomResults
              isLoading={isLoading}
              filteredRooms={filteredRooms}
              clearFilters={handleClearFilters}
              searchText={searchText}
              searchContext={{ searchQuery: 'Girls Hostels in Kota', selectedCategory: 'all' }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GirlsHostels;
