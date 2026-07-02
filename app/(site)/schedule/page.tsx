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
  field_trip: { bg: "bg-terracotta/10", border: "border-terracotta", text: "text-terracotta-dark" },
  visit: { bg: "bg-sage/10", border: "border-sage", text: "text-sage" },
  event: { bg: "bg-amber-warm/10", border: "border-amber-warm", text: "text-amber-warm" },
  meeting: { bg: "bg-sand", border: "border-sand-dark", text: "text-earth-mid" },
};

const eventTypeEmoji: Record<EventType, string> = {
  field_trip: "🏝️",
  visit: "🫂",
  event: "🎉",
  meeting: "📋",
};

const eventTypeBgColors: Record<EventType, string> = {
  field_trip: "bg-terracotta/10 border-terracotta/30",
  visit: "bg-sage/10 border-sage/30",
  event: "bg-amber-warm/10 border-amber-warm/30",
  meeting: "bg-sand border-sand-dark/30",
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
      <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-earth-mid bg-sand/40 rounded-lg"
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
            className={`min-h-[68px] sm:min-h-[100px] p-1.5 sm:p-3 rounded-lg border flex flex-col cursor-pointer transition-all ${
              !isCurrentMonth
                ? "bg-sand/30 border-sand"
                : isSelected
                ? "bg-terracotta/5 border-terracotta/30"
                : "bg-white border-sand hover:bg-cream/50"
            }`}
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-full text-xs sm:text-sm font-semibold ${
                isTodayDate
                  ? "bg-terracotta text-white"
                  : isCurrentMonth
                  ? "text-earth-dark bg-sand/60"
                  : "text-earth-light"
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
                <div className="text-xs text-earth-mid px-2 font-medium">
                  +{dayEvents.length - 4} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1.5 sm:gap-3">
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
          <div className="animate-spin w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-earth-mid text-lg">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-sand px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <div className="bg-gradient-to-br from-terracotta to-terracotta-dark p-2.5 rounded-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="heading-display text-xl font-semibold text-earth-dark">Event Calendar</h1>
            <p className="text-earth-mid text-xs">Join us for our activities</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Calendar + Event List Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-sand">
              {/* Calendar Header */}
              <div className="bg-cream px-6 py-4 flex items-center justify-between border-b border-sand">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-sand/50 rounded-lg transition-colors text-earth-mid"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center">
                  <h2 className="heading-display text-xl font-semibold text-earth-dark">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1 text-sm text-earth-mid hover:bg-sand/50 rounded-lg transition-colors font-medium"
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
              <div className="px-2 sm:px-6 pt-4">
                {renderDaysHeader()}
              </div>

              {/* Calendar Grid - Scrollable */}
              <div className="max-h-[600px] overflow-y-auto px-2 sm:px-6 py-4">
                <div className="space-y-4">{renderCells()}</div>
              </div>
            </div>

            {/* Event Type Legend */}
            <div className="mt-4 bg-white rounded-xl shadow-md p-4 border border-sand">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-terracotta" />
                  <span className="text-xs text-earth-mid">🏝️ Field Trip</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-sage" />
                  <span className="text-xs text-earth-mid">🫂 Visit</span>
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
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-sand sticky top-24">
              <div className="bg-cream px-4 py-3 border-b border-sand">
                <h3 className="text-earth-dark font-semibold text-sm">
                  {selectedDate
                    ? format(selectedDate, "EEEE, MMM d")
                    : "Events"}
                </h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {selectedDate ? (
                  selectedDateEvents.length > 0 ? (
                    <div className="divide-y divide-sand/60">
                      {selectedDateEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`p-3 hover:bg-cream/50 cursor-pointer transition-colors border-l-4 ${eventTypeColors[event.type].border}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-earth-dark text-sm">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-earth-mid mt-1">
                                <Clock className="h-3 w-3" />
                                {event.startTime} - {event.endTime}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-earth-mid">
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
                      <p className="text-earth-mid text-xs">No events on this day</p>
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

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-earth-dark/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-sand">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-sand bg-cream">
                <h2 className="heading-display text-lg font-semibold text-earth-dark flex items-center gap-2">
                {eventTypeEmoji[selectedEvent.type]} {selectedEvent.title}
              </h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 hover:bg-sand/50 rounded-lg transition-colors text-earth-mid"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center gap-3 text-earth-dark">
                <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-terracotta" />
                </div>
                <span className="text-sm font-medium">{format(new Date(selectedEvent.date), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-3 text-earth-dark">
                <div className="w-8 h-8 rounded-full bg-amber-warm/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-warm" />
                </div>
                <span className="text-sm font-medium">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
              </div>
              <div className="flex items-center gap-3 text-earth-dark">
                <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-earth-mid" />
                </div>
                <span className="text-sm font-medium">{selectedEvent.location}</span>
              </div>
              {selectedEvent.description && (
                <div className="pt-3 border-t border-sand">
                  <p className="text-sm text-earth-mid">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-sand bg-cream">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-gradient-to-r from-terracotta to-terracotta-dark text-white rounded-lg hover:opacity-90 transition-all text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note about private events */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-amber-light/30 rounded-xl p-4 text-center text-xs text-earth-mid border border-sand">
          🌊 Some activities involving specific families are private. Contact us to learn more about volunteering.
        </div>
      </div>
    </div>
  );
}
