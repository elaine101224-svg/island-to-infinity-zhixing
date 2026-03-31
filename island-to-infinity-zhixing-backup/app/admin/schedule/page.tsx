import { getScheduleEvents } from '@/lib/data';
import { Calendar, MapPin, ArrowRight, Check, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const eventTypeLabels = {
  field_trip: 'Field Trip',
  visit: 'Visit',
  event: 'Event',
  meeting: 'Meeting',
};

const eventTypeColors = {
  field_trip: 'bg-blue-100 text-blue-700',
  visit: 'bg-green-100 text-green-700',
  event: 'bg-purple-100 text-purple-700',
  meeting: 'bg-gray-100 text-gray-700',
};

export default async function AdminSchedulePage() {
  const events = await getScheduleEvents();
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">Manage events and activities</p>
        </div>
        <button className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors text-sm">
          Add Event
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Public
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEvents.map((event) => (
              <tr key={event.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-900">{event.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{format(new Date(event.date), 'MMM d, yyyy')}</div>
                  <div className="text-xs text-gray-500">{event.startTime} - {event.endTime}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${eventTypeColors[event.type]}`}>
                    {eventTypeLabels[event.type]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {event.isPublic ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <Check className="h-4 w-4" />
                      Public
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <X className="h-4 w-4" />
                      Private
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-center">
        <Link href="/schedule" className="text-gray-500 hover:text-rose-500 text-sm">
          View Public Schedule Page
        </Link>
      </div>
    </div>
  );
}
