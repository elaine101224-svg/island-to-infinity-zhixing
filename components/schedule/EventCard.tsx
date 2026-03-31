import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import type { ScheduleEvent } from '@/types';
import { format } from 'date-fns';

interface EventCardProps {
  event: ScheduleEvent;
}

const eventTypeConfig = {
  field_trip: {
    label: 'Field Trip',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: '🚗',
  },
  visit: {
    label: 'Visit',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: '🤝',
  },
  event: {
    label: 'Event',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: '🎉',
  },
  meeting: {
    label: 'Meeting',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: '📋',
  },
};

export default function EventCard({ event }: EventCardProps) {
  const config = eventTypeConfig[event.type];
  const eventDate = new Date(event.date);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
          <span>{config.icon}</span>
          {config.label}
        </span>
        {event.isPublic && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
            Public
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {event.title}
      </h3>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{event.startTime} - {event.endTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span>{event.location}</span>
        </div>
        {event.maxParticipants && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span>Max {event.maxParticipants} participants</span>
          </div>
        )}
      </div>

      <p className="mt-4 text-gray-600 text-sm leading-relaxed">
        {event.description}
      </p>
    </div>
  );
}
