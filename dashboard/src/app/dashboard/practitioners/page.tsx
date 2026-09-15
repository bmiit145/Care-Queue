"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Practitioner {
  _id: string;
  firstName: string;
  lastName: string;
  type: string;
  isActive: boolean;
}

export default function PractitionersPage() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPractitioner, setNewPractitioner] = useState({ firstName: "", lastName: "", type: "DOCTOR" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPractitioners();
  }, []);

  const fetchPractitioners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/practitioners");
      setPractitioners(res.data);
    } catch (error) {
      console.error("Failed to fetch practitioners", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePractitioner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post("/practitioners", newPractitioner);
      setPractitioners([...practitioners, res.data]);
      setIsModalOpen(false);
      setNewPractitioner({ firstName: "", lastName: "", type: "DOCTOR" });
    } catch (error) {
      console.error("Failed to create practitioner", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Practitioners</h2>
          <p className="text-muted-foreground">Manage doctors, dentists, and specialists.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>Add Practitioner</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Practitioner</DialogTitle>
              <DialogDescription>
                Add a new practitioner profile.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePractitioner} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={newPractitioner.firstName} 
                    onChange={(e) => setNewPractitioner({...newPractitioner, firstName: e.target.value})} 
                    required 
                    placeholder="Dr. John" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={newPractitioner.lastName} 
                    onChange={(e) => setNewPractitioner({...newPractitioner, lastName: e.target.value})} 
                    required 
                    placeholder="Doe" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input 
                  id="type" 
                  value={newPractitioner.type} 
                  onChange={(e) => setNewPractitioner({...newPractitioner, type: e.target.value.toUpperCase()})} 
                  placeholder="DOCTOR, DENTIST, etc." 
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Practitioner"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading practitioners...</div>
      ) : practitioners.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50 border-dashed">
          <p className="text-muted-foreground">No practitioners found. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {practitioners.map((prac) => (
            <Card key={prac._id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  {prac.firstName} {prac.lastName}
                  <span className={`text-xs px-2 py-1 rounded-full ${prac.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {prac.isActive ? "Active" : "Inactive"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Type:</strong> {prac.type}</p>
                
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
