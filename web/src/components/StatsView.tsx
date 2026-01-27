interface StatsViewProps {
  totalAttempts: number;
  currentStreak: number;
  maxStreak: number;
  formattedAccuracy: string;
}

export function StatsView({
  totalAttempts,
  currentStreak,
  maxStreak,
  formattedAccuracy,
}: StatsViewProps) {
  const statItems = [
    {
      title: "总次数",
      value: totalAttempts.toString(),
      icon: "🔢",
    },
    {
      title: "准确率",
      value: formattedAccuracy,
      icon: "🎯",
    },
    {
      title: "当前连胜",
      value: currentStreak.toString(),
      icon: "🔥",
    },
    {
      title: "最高连胜",
      value: maxStreak.toString(),
      icon: "🏆",
    },
  ];

  return (
    <div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
        训练统计
      </h3>
      <div className="grid grid-cols-4 gap-4">
        {statItems.map((item) => (
          <div key={item.title} className="text-center">
            <div className="text-xl mb-1">{item.icon}</div>
            <div className="text-lg font-bold">{item.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {item.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
