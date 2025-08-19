"use client";

import { useProperties } from "@/lib/electric/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconBuilding, IconMapPin } from "@tabler/icons-react";

export function PropertiesWithElectric() {
  const { data, isLoading, error } = useProperties();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error loading properties: {error.message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No properties found. Properties will appear here once they are synced from the database.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {data.map((property: any) => (
        <Card key={property.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <IconBuilding className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{property.name}</CardTitle>
              </div>
              <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                {property.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <IconMapPin className="h-4 w-4 mr-1" />
                {property.address}
              </div>
              {property.city && property.state && (
                <div className="text-sm text-muted-foreground">
                  {property.city}, {property.state} {property.zipCode}
                </div>
              )}
              <div className="pt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{property.type?.replace('_', ' ')}</span>
              </div>
              {property.monthlyRent && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rent:</span>
                  <span className="font-medium">${property.monthlyRent}/mo</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}