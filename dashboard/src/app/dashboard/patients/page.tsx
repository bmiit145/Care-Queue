"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  mrn?: string; // Medical Record Number
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ 
    firstName: "", 
    lastName: "", 
    dateOfBirth: "", 
    gender: "MALE",
    contactNumber: "" 
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get("/patients");
      setPatients(res.data);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post("/patients", newPatient);
      setPatients([...patients, res.data]);
      setIsModalOpen(false);
      setNewPatient({ firstName: "", lastName: "", dateOfBirth: "", gender: "MALE", contactNumber: "" });
    } catch (error) {
      console.error("Failed to create patient", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
          <p className="text-muted-foreground">Manage patient records and demographics.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>Register Patient</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Patient</DialogTitle>
              <DialogDescription>
                Enter patient demographic details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePatient} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={newPatient.firstName} 
                    onChange={(e) => setNewPatient({...newPatient, firstName: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={newPatient.lastName} 
                    onChange={(e) => setNewPatient({...newPatient, lastName: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input 
                    id="dob" 
                    type="date"
                    value={newPatient.dateOfBirth} 
                    onChange={(e) => setNewPatient({...newPatient, dateOfBirth: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select 
                    id="gender" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Phone</Label>
                <Input 
                  id="contactNumber" 
                  value={newPatient.contactNumber} 
                  onChange={(e) => setNewPatient({...newPatient, contactNumber: e.target.value})} 
                  placeholder="+1234567890" 
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Registering..." : "Register Patient"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading patients...</div>
      ) : patients.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50 border-dashed">
          <p className="text-muted-foreground">No patients found. Register a new patient to get started.</p>
        </Card>
      ) : (
        <div className="border rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">MRN</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">DOB</th>
                <th className="px-4 py-3 font-medium">Gender</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {patients.map((patient) => (
                <tr key={patient._id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs">{patient.mrn || "N/A"}</td>
                  <td className="px-4 py-3 font-medium">{patient.firstName} {patient.lastName}</td>
                  <td className="px-4 py-3">{new Date(patient.dateOfBirth).toLocaleDateString()}</td>
                  <td className="px-4 py-3 capitalize">{patient.gender.toLowerCase()}</td>
                  <td className="px-4 py-3">{patient.contactNumber || "N/A"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
