import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import RoomResults from '@/components/room/RoomResults';
import Seo, { OG_ROOMS } from '@/components/seo/Seo';
import { useRooms } from '@/context/RoomContext';
import { buildRoomJsonLd } from '@/utils/roomSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const GirlsHostels: React.FC = () => {
  const { rooms, isLoading } = useRooms();

  const girlsHostels = useMemo(
    () => rooms.filter((room) => {
      const propertyType = room.property_type?.toUpperCase();
      const isHostelOrPg = propertyType === 'HOSTEL' || propertyType === 'PG' || propertyType === 'PG_HOSTEL';
      return room.available !== false && room.facilities?.gender === 'female' && isHostelOrPg;
    }),
    [rooms],
  );

  return (
    <Layout>
      <Seo
        title="Girls Hostels and PGs in Kota | Livenzo"
        description="Find girls hostels and PGs in Kota. Compare verified listings, monthly rent, photos, facilities and locations near coaching areas on Livenzo."
        path="/girls-hostels-in-kota"
        image={OG_ROOMS}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Girls hostels and PGs in Kota',
          numberOfItems: girlsHostels.length,
          itemListElement: girlsHostels.slice(0, 20).map((room, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: buildRoomJsonLd(room, room.minimum_price ?? room.price),
          })),
        }}
      />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6 max-w-3xl">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Girls Hostels and PGs in Kota
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Compare available girls hostels and PGs across Kota by rent, photos, facilities and location.
          </p>
        </header>

        <section aria-labelledby="girls-hostel-listings">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="girls-hostel-listings" className="text-xl font-semibold text-foreground">
              Available girls accommodation
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link to="/find-room">View all rooms</Link>
            </Button>
          </div>

          {!isLoading && girlsHostels.length === 0 && (
            <Card className="mb-6 border border-border/60 bg-card/50">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <MessageCircle className="h-6 w-6 text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  No girls hostel listings are available right now. Browse all rooms for more options.
                </p>
                <Button asChild size="sm">
                  <Link to="/find-room">Browse all rooms</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <RoomResults
            isLoading={isLoading}
            filteredRooms={girlsHostels}
            clearFilters={() => undefined}
            searchText=""
            searchContext={{ selectedCategory: 'Girls Hostel' }}
          />
        </section>
      </div>
    </Layout>
  );
};

export default GirlsHostels;