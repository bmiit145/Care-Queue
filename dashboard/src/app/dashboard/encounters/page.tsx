"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Encounter {
  _id: string;
  patientId: any;
  practitionerId: any;
  notes: string;
  diagnosis: string[];
  status: string;
  createdAt: string;
}

export default function EncountersPage() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lookups for the form
  const [patients, setPatients] = useState<any[]>([]);
  const [practitioners, setPractitioners] = useState<any[]>([]);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEncounter, setNewEncounter] = useState({ 
    patientId: "", 
    practitionerId: "", 
    notes: "", 
    diagnosis: ""
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEncounters();
    fetchLookups();
  }, []);

  const fetchEncounters = async () => {
    try {
      setLoading(true);
      // Fallback to empty array if endpoint isn't fully ready
      const res = await api.get("/encounters").catch(() => ({ data: [] }));
      setEncounters(res.data || []);
    } catch (error) {
      console.error("Failed to fetch encounters", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [patRes, pracRes] = await Promise.all([
        api.get("/patients"),
        api.get("/practitioners")
      ]);
      setPatients(patRes.data);
      setPractitioners(pracRes.data);
    } catch (error) {
      console.error("Failed to fetch lookups", error);
    }
  }

  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      // Transform comma separated diagnosis to array
      const payload = {
        ...newEncounter,
        diagnosis: newEncounter.diagnosis.split(',').map(d => d.trim()).filter(Boolean)
      };
      const res = await api.post("/encounters", payload);
      setEncounters([...encounters, res.data]);
      setIsModalOpen(false);
      // reset form
      setNewEncounter({ patientId: "", practitionerId: "", notes: "", diagnosis: "" });
    } catch (error) {
      console.error("Failed to create encounter", error);
    } finally {
      setCreating(false);
    }
  };

  const SelectInput = ({ id, label, value, options, onChange }: any) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select 
        id={id} 
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="" disabled>Select {label}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clinical Encounters</h2>
          <p className="text-muted-foreground">Record notes, diagnoses, and prescriptions.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>Record Encounter</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Record Clinical Encounter</DialogTitle>
              <DialogDescription>
                Document the patient visit details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEncounter} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <SelectInput 
                  id="patientId" label="Patient" 
                  value={newEncounter.patientId} 
                  onChange={(val: string) => setNewEncounter({...newEncounter, patientId: val})}
                  options={patients.map(p => ({value: p._id, label: `${p.firstName} ${p.lastName}`}))}
                />
                <SelectInput 
                  id="practitionerId" label="Attending Practitioner" 
                  value={newEncounter.practitionerId} 
                  onChange={(val: string) => setNewEncounter({...newEncounter, practitionerId: val})}
                  options={practitioners.map(p => ({value: p._id, label: `Dr. ${p.lastName}`}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis (comma separated)</Label>
                <Input 
                  id="diagnosis" 
                  value={newEncounter.diagnosis} 
                  onChange={(e) => setNewEncounter({...newEncounter, diagnosis: e.target.value})} 
                  placeholder="e.g. Hypertension, Type 2 Diabetes" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Clinical Notes / SOAP</Label>
                <textarea 
                  id="notes" 
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newEncounter.notes} 
                  onChange={(e) => setNewEncounter({...newEncounter, notes: e.target.value})} 
                  placeholder="Subjective, Objective, Assessment, Plan..." 
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Saving..." : "Save Encounter"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading encounters...</div>
      ) : encounters.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50 border-dashed">
          <p className="text-muted-foreground">No encounters recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {encounters.map((enc) => (
            <Card key={enc._id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  Encounter on {new Date(enc.createdAt).toLocaleString()}
                  <span className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700`}>
                    {enc.status || 'DRAFT'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="grid grid-cols-2 gap-4 border-b pb-3">
                  <p><strong>Patient ID:</strong> {enc.patientId}</p>
                  <p><strong>Practitioner ID:</strong> {enc.practitionerId}</p>
                </div>
                
                <div>
                  <strong className="text-black">Diagnoses:</strong>
                  <div className="flex gap-2 mt-1">
                    {enc.diagnosis?.map((d, i) => (
                      <span key={i} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">{d}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <strong className="text-black">Notes:</strong>
                  <p className="mt-1 p-3 bg-gray-50 rounded border whitespace-pre-wrap">{enc.notes}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
