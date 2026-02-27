export type MoodOption = {
  key: string;
  label: string;
  icon: string;
};

export const MOOD_OPTIONS: MoodOption[] = [
  { key: 'happy', label: 'Happy', icon: 'assets/moods/happy.png' },
  { key: 'sad', label: 'Sad', icon: 'assets/moods/sad.png' },
  { key: 'angry', label: 'Angry', icon: 'assets/moods/angry.png' },
  { key: 'excited', label: 'Excited', icon: 'assets/moods/excited.png' },
  { key: 'sick', label: 'Sick', icon: 'assets/moods/sick.png' },
  { key: 'tired', label: 'Tired', icon: 'assets/moods/tired.png' },
  { key: 'loved', label: 'Loved', icon: 'assets/moods/loved.png' },
  { key: 'anxious', label: 'Anxious', icon: 'assets/moods/anxious.png' },
  { key: 'peaceful', label: 'Peaceful', icon: 'assets/moods/peaceful.png' },
  { key: 'bored', label: 'Bored', icon: 'assets/moods/bored.png' },
  { key: 'silly', label: 'Silly', icon: 'assets/moods/silly.png' },
  { key: 'fine', label: 'Fine', icon: 'assets/moods/fine.png' },
];

export const filterMoodOptions = (allowed?: string[] | null): MoodOption[] => {
  if (!allowed || allowed.length === 0) return MOOD_OPTIONS;
  const set = new Set(allowed);
  return MOOD_OPTIONS.filter((mood) => set.has(mood.key));
};
