import { motion } from "framer-motion";
import type { EventGroup } from "../models/types";

interface EventCardProps {
  eventGroup: EventGroup;
}

export function EventCard({ eventGroup }: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          {eventGroup.stockName} ({eventGroup.stockSymbol})
        </h2>
        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
          {eventGroup.events.length} 个事件
        </span>
      </div>
      <div className="space-y-3">
        {eventGroup.events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4 py-2"
          >
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
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
