"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Location {
  _id: string;
  name: string;
  address: string;
  contactNumber: string;
  isActive: boolean;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: "", address: "", contactNumber: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/locations");
      setLocations(res.data);
    } catch (error) {
      console.error("Failed to fetch locations", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post("/locations", newLocation);
      setLocations([...locations, res.data]);
      setIsModalOpen(false);
      setNewLocation({ name: "", address: "", contactNumber: "" });
    } catch (error) {
      console.error("Failed to create location", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Locations</h2>
          <p className="text-muted-foreground">Manage physical branches for your organization.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>Add Location</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Location</DialogTitle>
              <DialogDescription>
                Add a new physical branch to your organization.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLocation} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Location Name</Label>
                <Input 
                  id="name" 
                  value={newLocation.name} 
                  onChange={(e) => setNewLocation({...newLocation, name: e.target.value})} 
                  required 
                  placeholder="e.g. Main Campus" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  value={newLocation.address} 
                  onChange={(e) => setNewLocation({...newLocation, address: e.target.value})} 
                  required 
                  placeholder="123 Health St, City" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Phone</Label>
                <Input 
                  id="contactNumber" 
                  value={newLocation.contactNumber} 
                  onChange={(e) => setNewLocation({...newLocation, contactNumber: e.target.value})} 
                  placeholder="+1234567890" 
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Location"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading locations...</div>
      ) : locations.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50 border-dashed">
          <p className="text-muted-foreground">No locations found. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc._id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  {loc.name}
                  <span className={`text-xs px-2 py-1 rounded-full ${loc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {loc.isActive ? "Active" : "Inactive"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Address:</strong> {loc.address}</p>
                <p><strong>Phone:</strong> {loc.contactNumber || "N/A"}</p>
                
                <div className="pt-4 flex justify-end space-x-2">
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
