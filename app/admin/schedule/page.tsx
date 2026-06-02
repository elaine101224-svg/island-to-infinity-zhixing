"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, ChevronLeft, ChevronRight, X as XIcon, Calendar, Clock, MapPin } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns";
import type { ScheduleEvent, EventType } from "@/types";

const eventTypeColors: Record<EventType, { bg: string; border: string; text: string; dot: string }> = {
  field_trip: { bg: "bg-terracotta/10", border: "border-terracotta/30", text: "text-terracotta-dark", dot: "bg-terracotta" },
  visit: { bg: "bg-sage/10", border: "border-sage/30", text: "text-sage", dot: "bg-sage" },
  event: { bg: "bg-amber-warm/10", border: "border-amber-warm/30", text: "text-amber-warm", dot: "bg-amber-warm" },
  meeting: { bg: "bg-sand", border: "border-sand-dark", text: "text-earth-mid", dot: "bg-earth-mid" },
};

const eventTypeEmoji: Record<EventType, string> = {
  field_trip: "🚗",
  visit: "🤝",
  event: "🎉",
  meeting: "📋",
};

const eventTypeBgColors: Record<EventType, string> = {
  field_trip: "bg-terracotta/10 border-terracotta/30",
  visit: "bg-sage/10 border-sage/30",
  event: "bg-amber-warm/10 border-amber-warm/30",
  meeting: "bg-sand border-sand-dark",
};

interface EventFormData {
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  isPublic: boolean;
}

const emptyForm: EventFormData = {
  title: "",
  type: "event",
  date: new Date().toISOString().split("T")[0],
  startTime: "10:00",
  endTime: "11:00",
  location: "",
  description: "",
  isPublic: false,
};

export default function AdminSchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/schedule");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getEventsForDate = (date: Date) => {
    return events
      .filter((event) => isSameDay(new Date(event.date), date))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleOpenModal = (date?: Date, event?: ScheduleEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        type: event.type,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        description: event.description,
        isPublic: event.isPublic,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        ...emptyForm,
        date: date ? format(date, "yyyy-MM-dd") : emptyForm.date,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData(emptyForm);
    setSelectedDate(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = editingEvent
        ? `/api/admin/schedule/${editingEvent.id}`
        : "/api/admin/schedule";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const savedEvent = await res.json();
        if (editingEvent) {
          setEvents((prev) => prev.map((e) => (e.id === savedEvent.id ? savedEvent : e)));
        } else {
          setEvents((prev) => [...prev, savedEvent]);
        }
        handleCloseModal();
      } else {
        console.error("Failed to save event");
      }
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/admin/schedule/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const renderDaysHeader = () => {
    return (
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-xs font-semibold text-earth-mid bg-sand/40 rounded-lg uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayEvents = getEventsForDate(currentDay);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate && isSameDay(currentDay, selectedDate);
        const isTodayDate = isToday(day);

        days.push(
          <div
            key={day.toString()}
            onClick={() => setSelectedDate(currentDay)}
            className={`min-h-[100px] p-3 rounded-xl border transition-all cursor-pointer ${
              !isCurrentMonth
                ? "bg-sand/30 border-sand"
                : isSelected
                ? "bg-terracotta/5 border-terracotta/30"
                : "bg-white border-sand hover:bg-cream/50"
            }`}
          >
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${
                isTodayDate
                  ? "bg-terracotta text-white"
                  : isCurrentMonth
                  ? "text-earth-dark bg-sand/60"
                  : "text-earth-light"
              }`}
            >
              {format(day, "d")}
            </div>
            <div className="mt-2 space-y-1.5">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal(undefined, event);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:opacity-80 transition-opacity border-l-2 ${eventTypeBgColors[event.type]} ${eventTypeColors[event.type].text}`}
                  title={`${event.startTime} - ${event.endTime}: ${event.title}`}
                >
                  <span className="mr-1">{eventTypeEmoji[event.type]}</span>
                  <span className="truncate">{event.title}</span>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-earth-mid px-2 font-medium">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-3">
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-earth-mid text-lg">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-sand px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-terracotta to-terracotta-dark p-2.5 rounded-xl shadow-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-earth-dark">Event Calendar</h1>
              <p className="text-earth-mid text-xs">Manage your activities</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal(new Date())}
            className="bg-terracotta text-white px-4 py-2.5 rounded-xl hover:bg-terracotta-dark transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Calendar + Event List Layout */}
        <div className="flex gap-6">
          {/* Calendar */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-sand">
              {/* Calendar Header */}
              <div className="bg-cream px-6 py-4 flex items-center justify-between border-b border-sand">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-sand/50 rounded-lg transition-colors text-earth-mid"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center">
                  <h2 className="text-xl font-serif font-bold text-earth-dark">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1.5 text-sm text-earth-mid hover:bg-sand/50 rounded-lg transition-colors font-medium"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-sand/50 rounded-lg transition-colors text-earth-mid"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Days Header */}
              <div className="px-6 pt-4">
                {renderDaysHeader()}
              </div>

              {/* Calendar Grid */}
              <div className="max-h-[600px] overflow-y-auto px-6 py-4">
                <div className="space-y-3">{renderCells()}</div>
              </div>
            </div>

            {/* Event Type Legend */}
            <div className="mt-4 bg-white rounded-xl shadow-sm p-4 border border-sand">
              <div className="flex flex-wrap gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-terracotta" />
                  <span className="text-xs text-earth-mid">🚗 Field Trip</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-sage" />
                  <span className="text-xs text-earth-mid">🤝 Visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-warm" />
                  <span className="text-xs text-earth-mid">🎉 Event</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-earth-mid" />
                  <span className="text-xs text-earth-mid">📋 Meeting</span>
                </div>
              </div>
            </div>
          </div>

          {/* Event List Side Panel */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-sand sticky top-24">
              <div className="bg-cream px-4 py-3 border-b border-sand">
                <h3 className="text-earth-dark font-semibold text-sm">
                  {selectedDate
                    ? format(selectedDate, "EEEE, MMM d")
                    : "Select a date"}
                </h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {selectedDate ? (
                  selectedDateEvents.length > 0 ? (
                    <div className="divide-y divide-sand/60">
                      {selectedDateEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleOpenModal(undefined, event)}
                          className={`p-3.5 hover:bg-cream/50 cursor-pointer transition-colors border-l-4 ${eventTypeColors[event.type].border}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-earth-dark text-sm">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-1.5 text-xs text-earth-mid mt-1.5">
                                <Clock className="h-3 w-3" />
                                {event.startTime} - {event.endTime}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-earth-mid">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            </div>
                            <span className="text-lg">{eventTypeEmoji[event.type]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <div className="text-4xl mb-2">🏝️</div>
                      <p className="text-earth-mid text-xs">No events</p>
                      <button
                        onClick={() => handleOpenModal(selectedDate)}
                        className="mt-2 text-xs text-terracotta hover:text-terracotta-dark font-medium"
                      >
                        + Add event
                      </button>
                    </div>
                  )
                ) : (
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-2">👆</div>
                    <p className="text-earth-mid text-xs">Click a date to view events</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-earth-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-sand sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-earth-dark">
                {editingEvent ? "Edit Event" : "Add Event"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-sand/50 rounded-lg transition-colors text-earth-mid"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="Event title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as EventType }))}
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  >
                    <option value="field_trip">🚗 Field Trip</option>
                    <option value="visit">🤝 Visit</option>
                    <option value="event">🎉 Event</option>
                    <option value="meeting">📋 Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Public</label>
                  <div className="flex items-center h-full px-3 py-2.5 bg-sand/30 rounded-xl">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                      className="w-4 h-4 text-terracotta border-sand rounded focus:ring-terracotta"
                    />
                    <span className="ml-2 text-xs text-earth-mid">Show publicly</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-mid mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="Event location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-mid mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-sand rounded-xl focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-sm text-earth-dark"
                  placeholder="Event description"
                />
              </div>
            </div>

            <div className="flex justify-between p-4 border-t border-sand bg-cream/50 rounded-b-2xl">
              <div>
                {editingEvent && (
                  <button
                    onClick={() => handleDelete(editingEvent.id)}
                    className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 text-earth-mid bg-white border border-sand rounded-xl hover:bg-sand/50 transition-colors text-sm font-medium shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formData.title || !formData.date}
                  className="px-4 py-2.5 bg-terracotta text-white rounded-xl hover:bg-terracotta-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}