import { getPublicEvents } from '@/lib/data';
import EventCard from '@/components/schedule/EventCard';
import { Calendar } from 'lucide-react';

export default async function SchedulePage() {
  const events = await getPublicEvents();
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Upcoming Activities
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Join us for our public events. All are welcome to participate in our
          community workshops, field trips, and gatherings.
        </p>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            No public events scheduled at the moment. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Note about private events */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
        <p>
          Some activities involving specific families are private to respect their privacy.
          If you are interested in volunteering or learning more about our work,
          please reach out through our school.
        </p>
      </div>
    </div>
  );
}
