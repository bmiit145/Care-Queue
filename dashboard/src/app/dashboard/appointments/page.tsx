"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Appointment {
  _id: string;
  patientId: any;
  practitionerId: any;
  serviceId: any;
  locationId: any;
  scheduledAt: string;
  status: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lookups for the form
  const [patients, setPatients] = useState<any[]>([]);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ 
    patientId: "", 
    practitionerId: "", 
    serviceId: "", 
    locationId: "",
    scheduledAt: "" 
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchLookups();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/appointments");
      setAppointments(res.data);
    } catch (error) {
      console.error("Failed to fetch appointments", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [patRes, pracRes, srvRes, locRes] = await Promise.all([
        api.get("/patients"),
        api.get("/practitioners"),
        api.get("/services"),
        api.get("/locations")
      ]);
      setPatients(patRes.data);
      setPractitioners(pracRes.data);
      setServices(srvRes.data);
      setLocations(locRes.data);
    } catch (error) {
      console.error("Failed to fetch lookups", error);
    }
  }

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post("/appointments", newAppointment);
      setAppointments([...appointments, res.data]);
      setIsModalOpen(false);
      // reset form
      setNewAppointment({ patientId: "", practitionerId: "", serviceId: "", locationId: "", scheduledAt: "" });
    } catch (error) {
      console.error("Failed to create appointment", error);
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
          <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
          <p className="text-muted-foreground">Schedule and manage patient visits.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>Book Appointment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>
                Schedule a patient for a service.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAppointment} className="space-y-4 pt-4">
              <SelectInput 
                id="patientId" label="Patient" 
                value={newAppointment.patientId} 
                onChange={(val: string) => setNewAppointment({...newAppointment, patientId: val})}
                options={patients.map(p => ({value: p._id, label: `${p.firstName} ${p.lastName}`}))}
              />
              <SelectInput 
                id="practitionerId" label="Practitioner" 
                value={newAppointment.practitionerId} 
                onChange={(val: string) => setNewAppointment({...newAppointment, practitionerId: val})}
                options={practitioners.map(p => ({value: p._id, label: `Dr. ${p.lastName}`}))}
              />
              <SelectInput 
                id="serviceId" label="Service" 
                value={newAppointment.serviceId} 
                onChange={(val: string) => setNewAppointment({...newAppointment, serviceId: val})}
                options={services.map(s => ({value: s._id, label: s.name}))}
              />
              <SelectInput 
                id="locationId" label="Location" 
                value={newAppointment.locationId} 
                onChange={(val: string) => setNewAppointment({...newAppointment, locationId: val})}
                options={locations.map(l => ({value: l._id, label: l.name}))}
              />
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Date & Time</Label>
                <Input 
                  id="scheduledAt" 
                  type="datetime-local"
                  value={newAppointment.scheduledAt} 
                  onChange={(e) => setNewAppointment({...newAppointment, scheduledAt: e.target.value})} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Booking..." : "Book Appointment"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50 border-dashed">
          <p className="text-muted-foreground">No appointments found. Book one to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((apt) => (
            <Card key={apt._id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  {new Date(apt.scheduledAt).toLocaleString()}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 
                    apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                    apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {apt.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Patient ID:</strong> {apt.patientId}</p>
                <p><strong>Practitioner ID:</strong> {apt.practitionerId}</p>
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
