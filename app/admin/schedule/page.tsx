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

const eventTypeColors: Record<EventType, { bg: string; border: string; text: string }> = {
  field_trip: { bg: "bg-ocean-100", border: "border-ocean-500", text: "text-ocean-700" },
  visit: { bg: "bg-coral-100", border: "border-coral-500", text: "text-coral-700" },
  event: { bg: "bg-sand-200", border: "border-sand-500", text: "text-sand-700" },
  meeting: { bg: "bg-seafoam-100", border: "border-seafoam-500", text: "text-seafoam-700" },
};

const eventTypeEmoji: Record<EventType, string> = {
  field_trip: "🏝️",
  visit: "🫂",
  event: "🎉",
  meeting: "📋",
};

const eventTypeBgColors: Record<EventType, string> = {
  field_trip: "bg-ocean-100 border-ocean-300",
  visit: "bg-coral-100 border-coral-300",
  event: "bg-sand-200 border-sand-400",
  meeting: "bg-seafoam-100 border-seafoam-300",
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
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-semibold text-sand-700 bg-sand-200 rounded-lg"
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
            className={`min-h-[100px] p-4 rounded-lg border border-sand-300 flex flex-col cursor-pointer transition-all ${
              !isCurrentMonth
                ? "bg-sand-50/70"
                : isSelected
                ? "bg-ocean-50 border-ocean-300"
                : "bg-white hover:bg-sand-50/50"
            }`}
          >
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${
                isTodayDate
                  ? "bg-ocean-500 text-white"
                  : isCurrentMonth
                  ? "text-sand-700 bg-sand-100"
                  : "text-sand-400"
              }`}
            >
              {format(day, "d")}
            </div>
            <div className="mt-2 flex-1 overflow-y-auto">
              {dayEvents.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal(undefined, event);
                  }}
                  className={`px-2 py-1 rounded-md text-xs mb-1 cursor-pointer hover:opacity-80 transition-opacity ${eventTypeBgColors[event.type]} border ${eventTypeColors[event.type].text} truncate`}
                  title={`${event.startTime} - ${event.endTime}: ${event.title}`}
                >
                  <span className="mr-1">{eventTypeEmoji[event.type]}</span>
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 4 && (
                <div className="text-xs text-sand-500 px-2 font-medium">
                  +{dayEvents.length - 4} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-4">
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sand-100 to-ocean-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-ocean-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sand-600 text-lg">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sand-100 to-ocean-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-sand-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-ocean-500 to-coral-500 p-2.5 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sand-800">Event Calendar</h1>
              <p className="text-sand-600 text-xs">Manage your activities</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal(new Date())}
            className="bg-gradient-to-r from-ocean-500 to-coral-500 text-white px-4 py-2 rounded-lg hover:from-ocean-600 hover:to-coral-600 transition-all text-sm font-medium flex items-center gap-2"
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-sand-200">
              {/* Calendar Header */}
              <div className="bg-sand-100 px-6 py-4 flex items-center justify-between border-b border-sand-200">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-sand-200 rounded-lg transition-colors text-sand-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-sand-800">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1 text-sm text-sand-700 hover:bg-sand-200 rounded-lg transition-colors font-medium"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-sand-200 rounded-lg transition-colors text-sand-700"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Days Header */}
              <div className="px-6 pt-4">
                {renderDaysHeader()}
              </div>

              {/* Calendar Grid - Scrollable */}
              <div className="max-h-[600px] overflow-y-auto px-6 py-4">
                <div className="space-y-4">{renderCells()}</div>
              </div>
            </div>

            {/* Event Type Legend */}
            <div className="mt-4 bg-white rounded-xl shadow-md p-4 border border-sand-200">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-ocean-500" />
                  <span className="text-xs text-sand-600">🏝️ Field Trip</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-coral-500" />
                  <span className="text-xs text-sand-600">🫂 Visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-sand-500" />
                  <span className="text-xs text-sand-600">🎉 Event</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-seafoam-500" />
                  <span className="text-xs text-sand-600">📋 Meeting</span>
                </div>
              </div>
            </div>
          </div>

          {/* Event List Side Panel */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-sand-200 sticky top-24">
              <div className="bg-sand-100 px-4 py-3 border-b border-sand-200">
                <h3 className="text-sand-800 font-semibold text-sm">
                  {selectedDate
                    ? format(selectedDate, "EEEE, MMM d")
                    : "Events"}
                </h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {selectedDate ? (
                  selectedDateEvents.length > 0 ? (
                    <div className="divide-y divide-sand-100">
                      {selectedDateEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleOpenModal(undefined, event)}
                          className={`p-3 hover:bg-sand-50 cursor-pointer transition-colors border-l-4 ${eventTypeColors[event.type].border}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sand-800 text-sm">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-sand-500 mt-1">
                                <Clock className="h-3 w-3" />
                                {event.startTime} - {event.endTime}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-sand-500">
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
                      <p className="text-sand-500 text-xs">No events</p>
                      <button
                        onClick={() => handleOpenModal(selectedDate)}
                        className="mt-2 text-xs text-ocean-500 hover:text-ocean-600 font-medium"
                      >
                        + Add event
                      </button>
                    </div>
                  )
                ) : (
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-2">👆</div>
                    <p className="text-sand-500 text-xs">Click a date to view events</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-sand-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-sand-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-sand-200 bg-sand-100">
              <h2 className="text-lg font-bold text-sand-800">
                {editingEvent ? "✏️ Edit Event" : "➕ Add Event"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-sand-200 rounded-lg transition-colors text-sand-600"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none text-sm text-sand-800"
                  placeholder="Event title"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as EventType }))}
                    className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 outline-none text-sm text-sand-800"
                  >
                    <option value="field_trip">🏝️ Field Trip</option>
                    <option value="visit">🫂 Visit</option>
                    <option value="event">🎉 Event</option>
                    <option value="meeting">📋 Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">Public</label>
                  <div className="flex items-center h-full px-3">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                      className="w-4 h-4 text-ocean-500 border-sand-300 rounded focus:ring-ocean-500"
                    />
                    <span className="ml-2 text-xs text-sand-600">Show publicly</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">📅 Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 outline-none text-sm text-sand-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">🕐 Start</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 outline-none text-sm text-sand-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-700 mb-1">🕐 End</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 outline-none text-sm text-sand-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">📍 Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 outline-none text-sm text-sand-800"
                  placeholder="Event location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sand-700 mb-1">📝 Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 outline-none text-sm text-sand-800"
                  placeholder="Event description"
                />
              </div>
            </div>

            <div className="flex justify-between p-4 border-t border-sand-200 bg-sand-50">
              <div>
                {editingEvent && (
                  <button
                    onClick={() => handleDelete(editingEvent.id)}
                    className="px-3 py-1.5 text-coral-500 hover:bg-coral-50 rounded-lg transition-colors text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-1.5 text-sand-600 bg-white border border-sand-300 rounded-lg hover:bg-sand-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formData.title || !formData.date}
                  className="px-4 py-1.5 bg-gradient-to-r from-ocean-500 to-coral-500 text-white rounded-lg hover:from-ocean-600 hover:to-coral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {isSaving ? "🌊" : "💾 Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
