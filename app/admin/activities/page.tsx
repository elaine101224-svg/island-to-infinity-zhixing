"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Plus, Pencil, Trash2, X as XIcon, Check, Users, Calendar } from "lucide-react";
import type { ActivityRecord, EventType, Family, TeamMember, ScheduleEvent } from "@/types";
import { useToast } from "@/components/admin/Toast";
import { adminFetch } from "@/lib/adminFetch";

const typeLabels: Record<EventType, string> = {
  field_trip: "Field Trip",
  visit: "Visit",
  event: "Event",
  meeting: "Meeting",
};

const typeEmoji: Record<EventType, string> = {
  field_trip: "🏝️",
  visit: "🫂",
  event: "🎉",
  meeting: "📋",
};

interface RecordFormData {
  eventId: string;
  title: string;
  type: EventType;
  date: string;
  familyIds: string[];
  memberIds: string[];
  summary: string;
  outcomes: string;
  followUps: string;
}

const emptyForm: RecordFormData = {
  eventId: "",
  title: "",
  type: "visit",
  date: new Date().toISOString().split("T")[0],
  familyIds: [],
  memberIds: [],
  summary: "",
  outcomes: "",
  followUps: "",
};

export default function AdminActivitiesPage() {
  const toast = useToast();
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ActivityRecord | null>(null);
  const [formData, setFormData] = useState<RecordFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recRes, famRes, memRes, evRes] = await Promise.all([
        adminFetch("/api/admin/activities"),
        adminFetch("/api/admin/families"),
        adminFetch("/api/admin/team"),
        adminFetch("/api/admin/schedule"),
      ]);
      if (recRes.ok) setRecords(await recRes.json());
      if (famRes.ok) setFamilies(await famRes.json());
      if (memRes.ok) setMembers(await memRes.json());
      if (evRes.ok) setEvents(await evRes.json());
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (record?: ActivityRecord) => {
    if (record) {
      setEditing(record);
      setFormData({
        eventId: record.eventId || "",
        title: record.title,
        type: record.type,
        date: record.date,
        familyIds: [...(record.familyIds || [])],
        memberIds: [...(record.memberIds || [])],
        summary: record.summary || "",
        outcomes: record.outcomes || "",
        followUps: record.followUps || "",
      });
    } else {
      setEditing(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData(emptyForm);
  };

  // Prefill from a planned event when selected
  const handleEventLink = (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    setFormData((prev) => ({
      ...prev,
      eventId,
      ...(ev
        ? {
            title: prev.title || ev.title,
            type: ev.type,
            date: ev.date,
            familyIds: prev.familyIds.length ? prev.familyIds : [...(ev.familiesInvolved || [])],
          }
        : {}),
    }));
  };

  const toggle = (key: "familyIds" | "memberIds", id: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((x) => x !== id) : [...prev[key], id],
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    setIsSaving(true);
    try {
      const url = editing ? `/api/admin/activities/${editing.id}` : "/api/admin/activities";
      const method = editing ? "PUT" : "POST";
      const res = await adminFetch(url, {
        method,
        json: { ...formData, photos: editing?.photos || [] },
      });
      if (res.ok) {
        const saved = await res.json();
        if (editing) {
          setRecords((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
        } else {
          setRecords((prev) => [...prev, saved]);
        }
        toast.success(editing ? "Record updated" : "Activity recorded");
        handleCloseModal();
      } else {
        toast.error("Couldn't save the record. Please try again.");
      }
    } catch (error) {
      console.error("Error saving record:", error);
      toast.error("Something went wrong while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this activity record?")) return;
    try {
      const res = await adminFetch(`/api/admin/activities/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        toast.success("Record deleted");
      } else {
        toast.error("Couldn't delete the record. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Something went wrong while deleting. Please try again.");
    }
  };

  const sorted = [...records].sort((a, b) => (a.date < b.date ? 1 : -1));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-2">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-earth-dark tracking-tight">Activity Log</h1>
          <p className="text-earth-mid text-sm mt-1">Record what happened at each session</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-terracotta text-white px-4 py-2.5 rounded-xl hover:bg-terracotta-dark transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Record Activity
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-sand shadow-sm py-16 px-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center mb-4">
            <ClipboardList className="h-6 w-6 text-terracotta" />
          </div>
          <h3 className="text-earth-dark font-semibold mb-1">No activities recorded yet</h3>
          <p className="text-earth-mid text-sm mb-5">Log your first session to start building a history.</p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2.5 rounded-xl hover:bg-terracotta-dark transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Record Activity
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((rec) => (
            <div key={rec.id} className="bg-white rounded-xl border border-sand shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{typeEmoji[rec.type]}</span>
                    <h3 className="font-semibold text-earth-dark">{rec.title}</h3>
                    <span className="text-xs bg-sand/60 text-earth-mid px-2 py-0.5 rounded-full">{typeLabels[rec.type]}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-earth-mid">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(rec.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{rec.familyIds?.length || 0} families · {rec.memberIds?.length || 0} members</span>
                  </div>
                  {rec.summary && <p className="text-sm text-earth-mid mt-2.5 leading-relaxed line-clamp-2">{rec.summary}</p>}
                  {rec.followUps && (
                    <p className="text-xs text-amber-warm mt-2 bg-amber-warm/10 inline-block px-2.5 py-1 rounded-lg">Follow-up: {rec.followUps}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm flex-shrink-0">
                  <button onClick={() => handleOpenModal(rec)} className="text-sage hover:text-sage/80 font-medium flex items-center gap-1">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(rec.id)} className="text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-earth-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-sand sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-semibold text-earth-dark">{editing ? "Edit Record" : "Record Activity"}</h2>
              <button onClick={handleCloseModal} className="text-earth-light hover:text-earth-dark p-1.5 rounded-lg hover:bg-sand/50 transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {events.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Link to a planned event (optional)</label>
                  <select
                    value={formData.eventId}
                    onChange={(e) => handleEventLink(e.target.value)}
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark bg-white"
                  >
                    <option value="">— None (standalone) —</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {new Date(ev.date).toLocaleDateString()} · {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="e.g., Weekend home visit"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as EventType }))}
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark bg-white"
                  >
                    <option value="visit">Visit</option>
                    <option value="field_trip">Field Trip</option>
                    <option value="event">Event</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Families involved</label>
                {families.length === 0 ? (
                  <p className="text-sm text-earth-light">No families available.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {families.map((f) => {
                      const checked = formData.familyIds.includes(f.id);
                      return (
                        <button type="button" key={f.id} onClick={() => toggle("familyIds", f.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-colors ${checked ? "bg-terracotta/10 border-terracotta/40 text-earth-dark" : "bg-white border-sand text-earth-mid hover:bg-cream/60"}`}>
                          <span className={`w-4 h-4 rounded flex items-center justify-center border ${checked ? "bg-terracotta border-terracotta" : "border-sand-dark"}`}>
                            {checked && <Check className="h-3 w-3 text-white" />}
                          </span>
                          {f.pseudonym}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Members who attended</label>
                {members.length === 0 ? (
                  <p className="text-sm text-earth-light">No team members yet. Add them under Team.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {members.map((m) => {
                      const checked = formData.memberIds.includes(m.id);
                      return (
                        <button type="button" key={m.id} onClick={() => toggle("memberIds", m.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-colors ${checked ? "bg-sage/10 border-sage/40 text-earth-dark" : "bg-white border-sand text-earth-mid hover:bg-cream/60"}`}>
                          <span className={`w-4 h-4 rounded flex items-center justify-center border ${checked ? "bg-sage border-sage" : "border-sand-dark"}`}>
                            {checked && <Check className="h-3 w-3 text-white" />}
                          </span>
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">What happened</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="Summary of the session..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Outcomes / impact</label>
                <textarea
                  value={formData.outcomes}
                  onChange={(e) => setFormData((p) => ({ ...p, outcomes: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="What went well, observations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Follow-ups</label>
                <input
                  type="text"
                  value={formData.followUps}
                  onChange={(e) => setFormData((p) => ({ ...p, followUps: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="Anything to act on next time"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-sand bg-cream/50 rounded-b-2xl">
              <button onClick={handleCloseModal} className="px-5 py-2.5 text-earth-mid bg-white border border-sand rounded-xl hover:bg-sand/50 font-medium text-sm shadow-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.title.trim()}
                className="px-5 py-2.5 bg-terracotta text-white rounded-xl hover:bg-terracotta-dark font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
