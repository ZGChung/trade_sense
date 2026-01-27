import type { EventGroup } from "../models/types";

interface EventCardProps {
  eventGroup: EventGroup;
}

export function EventCard({ eventGroup }: EventCardProps) {
  return (
    <div className="w-full p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">
        {eventGroup.stockName} ({eventGroup.stockSymbol})
      </h2>
      <div className="space-y-3">
        {eventGroup.events.map((event, index) => (
          <div key={event.id} className="flex items-start gap-4 py-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {event.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                日期: {event.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
