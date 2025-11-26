"use client";

import { ALL_ACHIEVEMENTS } from '@/lib/gamification-data';
import { Lock, Trophy, Star, Medal } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Achievement } from '@/lib/api/user-profile';

interface GamificationDashboardProps {
  level: number;
  xp: number;
  achievements: Achievement[];
}

export default function GamificationDashboard({ level = 1, xp = 0, achievements = [] }: GamificationDashboardProps) {
  // Calculate XP for next level (simple formula: level * 1000)
  const currentLevelXp = xp % 1000; // Assuming linear 1000 XP per level for simplicity in UI
  const progress = Math.min((currentLevelXp / 1000) * 100, 100);

  // Merge user achievements with all achievements to determine status
  const achievementsList = ALL_ACHIEVEMENTS.map(ach => {
    const isUnlocked = achievements.some(ua => ua.id === ach.id);
    return { ...ach, isUnlocked };
  }).sort((a, b) => {
    // Sort: Unlocked first, then by XP value
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    return a.xp - b.xp;
  });

  return (
    <div className="space-y-6">
      {/* Level Progress Card */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="w-32 h-32" />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-indigo-100">Current Level</h3>
              <div className="text-4xl font-bold mt-1 flex items-baseline gap-2">
                {level}
                <span className="text-sm font-normal text-indigo-200">Reader</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-indigo-200 mb-1">Total XP</div>
              <div className="text-2xl font-bold">{xp.toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-indigo-100">
              <span>{currentLevelXp} XP</span>
              <span>1,000 XP</span>
            </div>
            <Progress value={progress} className="h-3 bg-indigo-900/30" indicatorClassName="bg-white/90" />
            <p className="text-xs text-indigo-200 text-center mt-2">
              {1000 - currentLevelXp} XP to reach Level {level + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Medal className="w-5 h-5 text-yellow-500" />
          Achievements
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-auto">
            {achievements.length} / {ALL_ACHIEVEMENTS.length} Unlocked
          </span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievementsList.map((achievement) => (
            <div 
              key={achievement.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl border shadow-sm transition-all",
                achievement.isUnlocked 
                  ? "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-md hover:scale-[1.02]" 
                  : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-70"
              )}
            >
              <div className={cn(
                "p-3 rounded-full text-2xl flex items-center justify-center w-12 h-12",
                achievement.isUnlocked 
                  ? "bg-yellow-100 dark:bg-yellow-900/20" 
                  : "bg-gray-200 dark:bg-gray-800 grayscale"
              )}>
                {achievement.isUnlocked ? (achievement.icon || '🏆') : <Lock className="w-5 h-5 text-gray-400" />}
              </div>
              <div>
                <h4 className={cn(
                  "font-semibold",
                  achievement.isUnlocked ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                )}>
                  {achievement.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                  {achievement.description}
                </p>
                <div className={cn(
                  "mt-2 text-xs font-medium flex items-center gap-1",
                  achievement.isUnlocked ? "text-yellow-600 dark:text-yellow-500" : "text-gray-400"
                )}>
                  <Star className={cn("w-3 h-3", achievement.isUnlocked && "fill-current")} />
                  {achievement.xp} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
