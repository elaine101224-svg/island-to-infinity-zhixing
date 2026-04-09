import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import type { ScheduleEvent } from '@/types';
import { format } from 'date-fns';

interface EventCardProps {
  event: ScheduleEvent;
}

const eventTypeConfig = {
  field_trip: {
    label: 'Field Trip',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: '🚗',
  },
  visit: {
    label: 'Visit',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    icon: '🤝',
  },
  event: {
    label: 'Event',
    color: 'bg-violet-50 text-violet-700 border-violet-100',
    icon: '🎉',
  },
  meeting: {
    label: 'Meeting',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: '📋',
  },
};

export default function EventCard({ event }: EventCardProps) {
  const config = eventTypeConfig[event.type];
  const eventDate = new Date(event.date);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${config.color}`}>
          <span>{config.icon}</span>
          {config.label}
        </span>
        {event.isPublic && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
            Public
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-slate-900 mb-3">
        {event.title}
      </h3>

      <div className="space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-slate-400" />
          <span>{event.startTime} - {event.endTime}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span>{event.location}</span>
        </div>
        {event.maxParticipants && (
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-slate-400" />
            <span>Max {event.maxParticipants} participants</span>
          </div>
        )}
      </div>

      {event.description && (
        <p className="mt-4 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
          {event.description}
        </p>
      )}
    </div>
  );
}
