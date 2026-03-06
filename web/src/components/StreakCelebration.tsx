import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MILESTONES = [3, 5, 10, 15, 20, 30, 50, 100];

const MESSAGES: Record<number, string> = {
  3: "不错的开始！",
  5: "连胜5局！",
  10: "太强了！",
  15: "势不可挡！",
  20: "交易大师！",
  30: "传奇连胜！",
  50: "神级操盘手！",
  100: "前无古人！",
};

const EMOJIS = ["🔥", "⚡", "💥", "🎉", "🏆", "🌟", "💎", "🚀"];

interface StreakCelebrationProps {
  streak: number;
}

export function StreakCelebration({ streak }: StreakCelebrationProps) {
  const [show, setShow] = useState(false);
  const [milestone, setMilestone] = useState(0);

  useEffect(() => {
    if (MILESTONES.includes(streak)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMilestone(streak);
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [streak]);

  const message = MESSAGES[milestone] || `连胜${milestone}局！`;
  const emoji = EMOJIS[MILESTONES.indexOf(milestone) % EMOJIS.length] || "🔥";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.3, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -30 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-7xl mb-3"
            >
              {emoji}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl shadow-lg"
            >
              <div className="text-2xl font-bold">{message}</div>
              <div className="text-sm opacity-80">🔥 连胜 {milestone}</div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
