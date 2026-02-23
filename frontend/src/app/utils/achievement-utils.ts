import { AppNotification } from '../core/notification.service';

type AchievementMeta = {
  title: string;
  message: string;
  iconUrl: string;
};

const ACHIEVEMENT_META: Record<string, AchievementMeta> = {
  mood_7_day: {
    title: 'Mood Keeper',
    message: 'You kept checking in. That consistency is growing 🌱',
    iconUrl: 'assets/achievements/moodkeeper.png',
  },
  mood_30_day: {
    title: 'Mood Maestro',
    message: 'Thirty moods logged. You’re building a real rhythm ✨',
    iconUrl: 'assets/achievements/moodmaestro.png',
  },
  habit_10: {
    title: 'Habit Hero',
    message: 'Ten habit check-ins. Small steps add up 💛',
    iconUrl: 'assets/achievements/habithero.png',
  },
  journal_5: {
    title: 'Storyteller',
    message: 'Five journal entries logged. Your story is unfolding 📖',
    iconUrl: 'assets/achievements/storyteller.png',
  },
  planner_7: {
    title: 'Planner Pro',
    message: 'Seven planner events set. You’ve got a calm plan ahead 🗓️',
    iconUrl: 'assets/achievements/plannerpro.png',
  },
};

export const getAchievementIcon = (key: string): string | undefined =>
  ACHIEVEMENT_META[key]?.iconUrl;

export const buildAchievementToast = (key: string): AppNotification => {
  const meta = ACHIEVEMENT_META[key];
  if (!meta) {
    return {
      type: 'achievement',
      title: 'New badge unlocked',
      message: 'A new achievement just landed.',
      icon: '🏆',
    };
  }
  return {
    type: 'achievement',
    title: meta.title,
    message: meta.message,
    iconUrl: meta.iconUrl,
  };
};

export const extractAwarded = (value: unknown): string[] => {
  if (!value || typeof value !== 'object') return [];
  const awarded = (value as { awarded?: unknown }).awarded;
  return Array.isArray(awarded) ? (awarded as string[]) : [];
};
