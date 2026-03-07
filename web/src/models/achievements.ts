export type AchievementId = 
  | 'first_prediction'
  | 'streak_3'
  | 'streak_5'
  | 'streak_10'
  | 'streak_15'
  | 'streak_25'
  | 'streak_30'
  | 'streak_50'
  | 'streak_100'
  | 'perfect_10'
  | 'perfect_20'
  | 'challenge_starter'
  | 'challenge_master'
  | 'challenge_legend'
  | 'dedicated_trader'
  | 'volume_300'
  | 'century_club'
  | 'volume_2000'
  | 'daily_streak_3'
  | 'daily_streak_7'
  | 'daily_streak_30';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  requirement: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_prediction',
    title: '初试身手',
    description: '完成第一次预测',
    icon: '🎯',
    requirement: '完成 1 次预测'
  },
  {
    id: 'streak_3',
    title: '热身状态',
    description: '连续答对 3 题',
    icon: '✨',
    requirement: '连胜 3 次'
  },
  {
    id: 'streak_5',
    title: '五连胜',
    description: '连续答对 5 题',
    icon: '🔥',
    requirement: '连胜 5 次'
  },
  {
    id: 'streak_10',
    title: '十连胜',
    description: '连续答对 10 题',
    icon: '💫',
    requirement: '连胜 10 次'
  },
  {
    id: 'streak_15',
    title: '稳定输出',
    description: '连续答对 15 题',
    icon: '🎯',
    requirement: '连胜 15 次'
  },
  {
    id: 'streak_25',
    title: '势如破竹',
    description: '连续答对 25 题',
    icon: '⚡',
    requirement: '连胜 25 次'
  },
  {
    id: 'streak_30',
    title: '连胜机器',
    description: '连续答对 30 题',
    icon: '🚀',
    requirement: '连胜 30 次'
  },
  {
    id: 'streak_50',
    title: '交易天才',
    description: '连续答对 50 题',
    icon: '🧠',
    requirement: '连胜 50 次'
  },
  {
    id: 'streak_100',
    title: '传奇交易员',
    description: '连续答对 100 题',
    icon: '👑',
    requirement: '连胜 100 次'
  },
  {
    id: 'perfect_10',
    title: '小试牛刀',
    description: '连续 10 次预测全对',
    icon: '🎖️',
    requirement: '10 题全对'
  },
  {
    id: 'perfect_20',
    title: '完美交易',
    description: '连续 20 次预测全对',
    icon: '🏆',
    requirement: '20 题全对'
  },
  {
    id: 'challenge_starter',
    title: '挑战新星',
    description: '挑战模式得分达到 10',
    icon: '🧩',
    requirement: '挑战得分 ≥ 10'
  },
  {
    id: 'challenge_master',
    title: '挑战大师',
    description: '挑战模式得分达到 50',
    icon: '🎮',
    requirement: '挑战得分 ≥ 50'
  },
  {
    id: 'challenge_legend',
    title: '挑战传说',
    description: '挑战模式得分达到 100',
    icon: '🛡️',
    requirement: '挑战得分 ≥ 100'
  },
  {
    id: 'dedicated_trader',
    title: '勤勉交易员',
    description: '累计完成 100 次预测',
    icon: '📈',
    requirement: '完成 100 次预测'
  },
  {
    id: 'volume_300',
    title: '高频练习者',
    description: '累计完成 300 次预测',
    icon: '📊',
    requirement: '完成 300 次预测'
  },
  {
    id: 'century_club',
    title: '百次大关',
    description: '累计完成 1000 次预测',
    icon: '💎',
    requirement: '完成 1000 次预测'
  },
  {
    id: 'volume_2000',
    title: '量化狂热',
    description: '累计完成 2000 次预测',
    icon: '🧱',
    requirement: '完成 2000 次预测'
  },
  {
    id: 'daily_streak_3',
    title: '三天打鱼',
    description: '连续 3 天每天都有练习',
    icon: '📅',
    requirement: '连续练习 3 天'
  },
  {
    id: 'daily_streak_7',
    title: '一周坚持',
    description: '连续 7 天每天都有练习',
    icon: '🌟',
    requirement: '连续练习 7 天'
  },
  {
    id: 'daily_streak_30',
    title: '月度冠军',
    description: '连续 30 天每天都有练习',
    icon: '🏅',
    requirement: '连续练习 30 天'
  }
];
