"use client";

import { useState, useEffect } from "react";
import { Users, FileText, Calendar } from "lucide-react";
import type { Family, SupportPlan, ScheduleEvent } from "@/types";

export default function AdminDashboardPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [plans, setPlans] = useState<SupportPlan[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || "";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [familiesRes, plansRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/families`),
        fetch(`${API_BASE}/api/admin/plans`),
        fetch(`${API_BASE}/api/admin/schedule`),
      ]);
      if (familiesRes.ok) setFamilies(await familiesRes.json());
      if (plansRes.ok) setPlans(await plansRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-yellow-900 font-semibold">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-yellow-50">
      <h1 className="text-3xl font-bold text-yellow-900 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-yellow-100 shadow-md rounded-xl p-6 flex flex-col items-center">
          <div className="bg-yellow-200 p-3 rounded-full mb-2">
            <Users className="h-8 w-8 text-yellow-700" />
          </div>
          <h2 className="text-xl font-semibold text-yellow-900 mb-1">Families</h2>
          <p className="text-yellow-800 text-3xl font-bold">{families.length}</p>
        </div>

        <div className="bg-yellow-100 shadow-md rounded-xl p-6 flex flex-col items-center">
          <div className="bg-yellow-200 p-3 rounded-full mb-2">
            <FileText className="h-8 w-8 text-yellow-700" />
          </div>
          <h2 className="text-xl font-semibold text-yellow-900 mb-1">Support Plans</h2>
          <p className="text-yellow-800 text-3xl font-bold">{plans.length}</p>
        </div>

        <div className="bg-yellow-100 shadow-md rounded-xl p-6 flex flex-col items-center">
          <div className="bg-yellow-200 p-3 rounded-full mb-2">
            <Calendar className="h-8 w-8 text-yellow-700" />
          </div>
          <h2 className="text-xl font-semibold text-yellow-900 mb-1">Scheduled Events</h2>
          <p className="text-yellow-800 text-3xl font-bold">{events.length}</p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-yellow-100 rounded-xl shadow-md p-4">
          <h3 className="text-yellow-900 font-semibold mb-2">Latest Families</h3>
          <ul className="text-yellow-800 text-sm">
            {families.slice(-5).map((f) => (
              <li key={f.id}>{f.pseudonym}</li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-100 rounded-xl shadow-md p-4">
          <h3 className="text-yellow-900 font-semibold mb-2">Latest Plans</h3>
          <ul className="text-yellow-800 text-sm">
            {plans.slice(-5).map((p) => (
              <li key={p.id}>{p.title}</li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-100 rounded-xl shadow-md p-4">
          <h3 className="text-yellow-900 font-semibold mb-2">Upcoming Events</h3>
          <ul className="text-yellow-800 text-sm">
            {events.slice(-5).map((e) => (
              <li key={e.id}>{e.title}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}