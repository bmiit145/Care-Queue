"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Organization {
  _id: string;
  name: string;
  type: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/organizations");
      setOrganizations(res.data);
    } catch (error) {
      console.error("Failed to fetch organizations", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
          <p className="text-muted-foreground">Manage all hospital and clinic tenants across the platform.</p>
        </div>
        <Button>Add Organization</Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading organizations...</div>
      ) : organizations.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50 border-dashed">
          <p className="text-muted-foreground">No organizations found. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org._id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  {org.name}
                  <span className={`text-xs px-2 py-1 rounded-full ${org.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {org.isActive ? "Active" : "Inactive"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Type:</strong> {org.type}</p>
                <p><strong>Email:</strong> {org.contactEmail || "N/A"}</p>
                <p><strong>Phone:</strong> {org.contactPhone || "N/A"}</p>
                
                <div className="pt-4 flex justify-end space-x-2">
                  <Button variant="outline" size="sm">Manage Users</Button>
                  <Button variant="secondary" size="sm">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
