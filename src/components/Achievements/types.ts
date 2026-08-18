export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Key for Lucide icon
  unlockedAt?: string;
}
