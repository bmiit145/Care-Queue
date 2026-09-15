"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Service {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  isActive: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "", duration: 30, price: 0 });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      setServices(res.data);
    } catch (error) {
      console.error("Failed to fetch services", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post("/services", newService);
      setServices([...services, res.data]);
      setIsModalOpen(false);
      setNewService({ name: "", description: "", duration: 30, price: 0 });
    } catch (error) {
      console.error("Failed to create service", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Services</h2>
          <p className="text-muted-foreground">Manage consultation types and procedures.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>Add Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>
                Add a new service offering for patients to book.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateService} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input 
                  id="name" 
                  value={newService.name} 
                  onChange={(e) => setNewService({...newService, name: e.target.value})} 
                  required 
                  placeholder="e.g. Initial Consultation" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={newService.description} 
                  onChange={(e) => setNewService({...newService, description: e.target.value})} 
                  placeholder="Details about the service" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    value={newService.duration} 
                    onChange={(e) => setNewService({...newService, duration: parseInt(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (Optional)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    value={newService.price} 
                    onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Service"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading services...</div>
      ) : services.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50 border-dashed">
          <p className="text-muted-foreground">No services found. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Card key={svc._id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  {svc.name}
                  <span className={`text-xs px-2 py-1 rounded-full ${svc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {svc.isActive ? "Active" : "Inactive"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{svc.description || "No description provided."}</p>
                <div className="pt-2 flex justify-between items-center text-xs border-t mt-2">
                  <span>⏱ {svc.duration} mins</span>
                  <span>💰 ${svc.price}</span>
                </div>
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
