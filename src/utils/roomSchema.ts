import { Room } from '@/types/room';
import { SITE_URL } from '@/components/seo/Seo';

const schemaTypeFor = (propertyType?: string | null): string => {
  switch ((propertyType || '').toUpperCase()) {
    case 'HOSTEL':
      return 'Hostel';
    case 'PG':
    case 'PG_HOSTEL':
    case 'CO-LIVING':
    case 'COLIVING':
      return 'LodgingBusiness';
    case 'BHK':
      return 'Apartment';
    default:
      return 'Accommodation';
  }
};

const amenityList = (room: Room): { '@type': string;name: string;value: boolean }[] => {
  const f = room.facilities || {};
  const items: [string, boolean][] = [
  ['WiFi', !!f.wifi],
  ['Attached bathroom', !!f.bathroom],
  ['Laundry', !!f.laundry],
  ['Electricity bill included', !!f.electricBill],
  ['Air conditioning', f.coolingType === 'ac'],
  ['Air cooler', f.coolingType === 'cooler'],
  ['Meals included', f.food === 'included']];

  return items.
  filter(([, value]) => value).
  map(([name]) => ({ '@type': 'LocationFeatureSpecification', name, value: true }));
};

/**
 * Schema.org structured data for a single room / PG / hostel / co-living listing.
 */
export const buildRoomJsonLd = (room: Room, price: number) => {
  const url = `${SITE_URL}/room/${room.id}`;
  const propertyLabel = room.property_type || 'Room';

  return {
    '@context': 'https://schema.org',
    '@type': schemaTypeFor(room.property_type),
    '@id': url,
    url,
    name: room.house_name ? `${room.title} — ${room.house_name}` : room.title,
    description: room.description || `${propertyLabel} for rent in ${room.location}, Kota.`,
    ...(room.images?.length ? { image: room.images.slice(0, 5) } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: [room.house_no, room.house_name, room.location].filter(Boolean).join(', '),
      addressLocality: 'Kota',
      addressRegion: 'Rajasthan',
      addressCountry: 'IN'
    },
    ...(room.latitude && room.longitude ?
    {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: room.latitude,
        longitude: room.longitude
      }
    } :
    {}),
    ...(room.facilities?.roomType ?
    { occupancy: { '@type': 'QuantitativeValue', value: room.facilities.roomType === 'single' ? 1 : 2 } } :
    {}),
    amenityFeature: amenityList(room),
    ...(room.facilities?.gender && room.facilities.gender !== 'any' ?
    { audience: { '@type': 'Audience', audienceType: `${room.facilities.gender} students` } } :
    {}),
    offers: {
      '@type': 'Offer',
      url,
      price,
      priceCurrency: 'INR',
      availability: room.available === false ?
      'https://schema.org/SoldOut' :
      'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price,
        priceCurrency: 'INR',
        unitCode: 'MON',
        billingIncrement: 1
      }
    }
  };
};
