import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import type { ScheduleEvent } from '@/types';
import { format } from 'date-fns';

interface EventCardProps {
  event: ScheduleEvent;
}

const eventTypeConfig = {
  field_trip: {
    label: 'Field Trip',
    color: 'bg-terracotta/10 text-terracotta-dark border-terracotta/20',
    icon: '🚗',
  },
  visit: {
    label: 'Visit',
    color: 'bg-sage/10 text-sage border-sage/20',
    icon: '🤝',
  },
  event: {
    label: 'Event',
    color: 'bg-amber-warm/10 text-amber-warm border-amber-warm/20',
    icon: '🎉',
  },
  meeting: {
    label: 'Meeting',
    color: 'bg-sand text-earth-mid border-sand-dark',
    icon: '📋',
  },
};

export default function EventCard({ event }: EventCardProps) {
  const config = eventTypeConfig[event.type];
  const eventDate = new Date(event.date);

  return (
    <div className="bg-white border border-sand rounded-2xl p-5 hover:shadow-lg hover:border-terracotta-light transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${config.color}`}>
          <span>{config.icon}</span>
          {config.label}
        </span>
        {event.isPublic && (
          <span className="text-xs bg-amber-light/50 text-amber-warm px-2.5 py-1 rounded-full font-medium">
            Public
          </span>
        )}
      </div>

      <h3 className="text-lg font-serif font-semibold text-earth-dark mb-3 tracking-wide">
        {event.title}
      </h3>

      <div className="space-y-2 text-sm text-earth-mid">
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4 text-terracotta" />
          <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-terracotta" />
          <span>{event.startTime} - {event.endTime}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 text-terracotta" />
          <span>{event.location}</span>
        </div>
        {event.maxParticipants && (
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-terracotta" />
            <span>Max {event.maxParticipants} participants</span>
          </div>
        )}
      </div>

      {event.description && (
        <p className="mt-4 text-earth-light text-sm leading-relaxed border-t border-sand pt-4">
          {event.description}
        </p>
      )}
    </div>
  );
}