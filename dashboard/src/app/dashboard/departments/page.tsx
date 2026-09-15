"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Department {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/departments");
      setDepartments(res.data);
    } catch (error) {
      console.error("Failed to fetch departments", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post("/departments", newDepartment);
      setDepartments([...departments, res.data]);
      setIsModalOpen(false);
      setNewDepartment({ name: "", description: "" });
    } catch (error) {
      console.error("Failed to create department", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">Manage clinical and administrative departments.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>Add Department</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Add a new department to your organization.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDepartment} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name</Label>
                <Input 
                  id="name" 
                  value={newDepartment.name} 
                  onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})} 
                  required 
                  placeholder="e.g. Cardiology" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={newDepartment.description} 
                  onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})} 
                  placeholder="Optional description" 
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Department"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading departments...</div>
      ) : departments.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50 border-dashed">
          <p className="text-muted-foreground">No departments found. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept._id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  {dept.name}
                  <span className={`text-xs px-2 py-1 rounded-full ${dept.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {dept.isActive ? "Active" : "Inactive"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{dept.description || "No description provided."}</p>
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
