"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QueueItem {
  _id: string;
  patientId: any;
  status: string; // WAITING, IN_CONSULTATION, COMPLETED
  priority: number;
  checkInTime: string;
}

export default function QueuesPage() {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueues();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchQueues, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueues = async () => {
    try {
      const res = await api.get("/queues");
      setQueues(res.data);
    } catch (error) {
      console.error("Failed to fetch queues", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/queues/${id}`, { status: newStatus });
      fetchQueues(); // refresh
    } catch (error) {
      console.error("Failed to update queue status", error);
    }
  };

  const getColumn = (status: string) => queues.filter(q => q.status === status);

  const QueueCard = ({ item }: { item: QueueItem }) => (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between items-center">
          Patient {item.patientId}
          {item.priority > 1 && (
             <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Urgent</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground pb-3 space-y-2">
        <p>Checked In: {new Date(item.checkInTime).toLocaleTimeString()}</p>
        <div className="flex gap-2 pt-2">
          {item.status === 'WAITING' && (
            <Button size="sm" className="w-full h-7 text-xs" onClick={() => updateStatus(item._id, 'IN_CONSULTATION')}>
              Call Patient
            </Button>
          )}
          {item.status === 'IN_CONSULTATION' && (
            <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => updateStatus(item._id, 'COMPLETED')}>
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Queue</h2>
          <p className="text-muted-foreground">Monitor and manage the active patient flow.</p>
        </div>
        <Button variant="outline" onClick={fetchQueues}>Refresh</Button>
      </div>

      {loading && queues.length === 0 ? (
        <div className="text-center py-10">Loading active queues...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Waiting Column */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-4 flex justify-between">
              Waiting 
              <span className="bg-gray-200 text-gray-700 px-2 rounded-full text-xs flex items-center">
                {getColumn('WAITING').length}
              </span>
            </h3>
            {getColumn('WAITING').length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No patients waiting.</p>
            ) : (
              getColumn('WAITING').map(item => <QueueCard key={item._id} item={item} />)
            )}
          </div>

          {/* In Consultation Column */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold mb-4 flex justify-between text-blue-900">
              In Consultation
              <span className="bg-blue-200 text-blue-800 px-2 rounded-full text-xs flex items-center">
                {getColumn('IN_CONSULTATION').length}
              </span>
            </h3>
            {getColumn('IN_CONSULTATION').length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 text-blue-600/50">No active consultations.</p>
            ) : (
              getColumn('IN_CONSULTATION').map(item => <QueueCard key={item._id} item={item} />)
            )}
          </div>

          {/* Completed Column */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-semibold mb-4 flex justify-between text-green-900">
              Completed (Today)
              <span className="bg-green-200 text-green-800 px-2 rounded-full text-xs flex items-center">
                {getColumn('COMPLETED').length}
              </span>
            </h3>
            {getColumn('COMPLETED').length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 text-green-600/50">No completed visits.</p>
            ) : (
              getColumn('COMPLETED').map(item => <QueueCard key={item._id} item={item} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
