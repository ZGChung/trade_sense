import { motion } from 'framer-motion';

interface CountdownBarProps {
  secondsLeft: number;
  progress: number;
  isRunning: boolean;
}

export function CountdownBar({ secondsLeft, progress, isRunning }: CountdownBarProps) {
  if (!isRunning && secondsLeft > 0) return null;

  const urgent = secondsLeft <= 5;
  const barColor = urgent
    ? 'from-red-500 to-red-600'
    : 'from-amber-400 to-orange-500';

  return (
    <div className="w-full max-w-xs mx-auto mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className={`font-medium ${urgent ? 'text-red-500 animate-pulse' : 'text-orange-600 dark:text-orange-400'}`}>
          ⏱ {secondsLeft}s
        </span>
        <span className="text-gray-400">挑战计时</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
