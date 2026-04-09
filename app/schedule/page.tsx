"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X as XIcon, Calendar, Clock, MapPin } from "lucide-react";
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

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
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
            className="py-3 text-center text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg"
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
            className={`min-h-[100px] p-4 rounded-lg border border-slate-200 flex flex-col cursor-pointer transition-all ${
              !isCurrentMonth
                ? "bg-slate-50/70"
                : isSelected
                ? "bg-rose-50 border-rose-200"
                : "bg-white hover:bg-slate-50/50"
            }`}
          >
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${
                isTodayDate
                  ? "bg-rose-500 text-white"
                  : isCurrentMonth
                  ? "text-slate-700 bg-slate-100"
                  : "text-slate-400"
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
                    setSelectedEvent(event);
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
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-rose-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <div className="bg-gradient-to-br from-rose-400 to-rose-500 p-2.5 rounded-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-serif font-bold text-slate-800 tracking-wide">Event Calendar</h1>
            <p className="text-slate-500 text-xs">Join us for our activities</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Calendar + Event List Layout */}
        <div className="flex gap-6">
          {/* Calendar */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
              {/* Calendar Header */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center">
                  <h2 className="text-xl font-serif font-bold text-slate-800 tracking-wide">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
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
            <div className="mt-4 bg-white rounded-xl shadow-md p-4 border border-slate-200">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-rose-500" />
                  <span className="text-xs text-slate-600">🏝️ Field Trip</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-rose-400" />
                  <span className="text-xs text-slate-600">🫂 Visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-violet-500" />
                  <span className="text-xs text-slate-600">🎉 Event</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-xs text-slate-600">📋 Meeting</span>
                </div>
              </div>
            </div>
          </div>

          {/* Event List Side Panel */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 sticky top-24">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="text-slate-800 font-semibold text-sm">
                  {selectedDate
                    ? format(selectedDate, "EEEE, MMM d")
                    : "Events"}
                </h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {selectedDate ? (
                  selectedDateEvents.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {selectedDateEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors border-l-4 ${eventTypeColors[event.type].border}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800 text-sm">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                <Clock className="h-3 w-3" />
                                {event.startTime} - {event.endTime}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
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
                      <p className="text-slate-500 text-xs">No events on this day</p>
                    </div>
                  )
                ) : (
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-2">👆</div>
                    <p className="text-slate-500 text-xs">Click a date to view events</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-serif font-bold text-slate-800 flex items-center gap-2 tracking-wide">
                {eventTypeEmoji[selectedEvent.type]} {selectedEvent.title}
              </h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-rose-500" />
                </div>
                <span className="text-sm font-medium">{format(new Date(selectedEvent.date), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-violet-500" />
                </div>
                <span className="text-sm font-medium">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-slate-500" />
                </div>
                <span className="text-sm font-medium">{selectedEvent.location}</span>
              </div>
              {selectedEvent.description && (
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-sm text-slate-700">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-lg hover:from-rose-500 hover:to-rose-600 transition-all text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note about private events */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-slate-100/50 rounded-xl p-4 text-center text-xs text-slate-600 border border-slate-200">
          🌊 Some activities involving specific families are private. Contact us to learn more about volunteering.
        </div>
      </div>
    </div>
  );
}
