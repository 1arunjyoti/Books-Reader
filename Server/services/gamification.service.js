const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

const ACHIEVEMENTS = {
  // Book Count Milestones
  FIRST_BOOK: {
    id: 'first_book',
    name: 'First Steps',
    description: 'Read your first book',
    icon: '📖',
    xp: 50
  },
  BOOKWORM: {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Read 5 books',
    icon: '🐛',
    xp: 150
  },
  BIBLIOPHILE: {
    id: 'bibliophile',
    name: 'Bibliophile',
    description: 'Read 10 books',
    icon: '📚',
    xp: 300
  },
  LEGEND: {
    id: 'legend',
    name: 'Literary Legend',
    description: 'Read 25 books',
    icon: '👑',
    xp: 1000
  },

  // Page Count Milestones
  PAGE_TURNER: {
    id: 'page_turner',
    name: 'Page Turner',
    description: 'Read 100 pages',
    icon: '📄',
    xp: 100
  },
  SCHOLAR: {
    id: 'scholar',
    name: 'Scholar',
    description: 'Read 500 pages',
    icon: '🎓',
    xp: 250
  },
  RESEARCHER: {
    id: 'researcher',
    name: 'Researcher',
    description: 'Read 1,000 pages',
    icon: '🔎',
    xp: 500
  },
  ENCYCLOPEDIC: {
    id: 'encyclopedic',
    name: 'Encyclopedic',
    description: 'Read 5,000 pages',
    icon: '🧠',
    xp: 2000
  },

  // Time Milestones
  DEDICATED_READER: {
    id: 'dedicated_reader',
    name: 'Dedicated',
    description: 'Read for 1 hour total',
    icon: '🕐',
    xp: 100
  },
  MARATHON_RUNNER: {
    id: 'marathon_runner',
    name: 'Marathon Runner',
    description: 'Read for 5 hours total',
    icon: '🏃',
    xp: 300
  },
  OBSESSED: {
    id: 'obsessed',
    name: 'Obsessed',
    description: 'Read for 24 hours total',
    icon: '🔥',
    xp: 1000
  },

  // Upload Milestones
  LIBRARIAN: {
    id: 'librarian',
    name: 'Librarian',
    description: 'Upload 5 books',
    icon: '📂',
    xp: 75
  }
};

class GamificationService {
  
  /**
   * Add XP to user and check for level up
   */
  async addXp(userId, amount) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;

      const newXp = user.xp + amount;
      // Simple level formula: Level = 1 + floor(XP / 1000)
      const newLevel = 1 + Math.floor(newXp / 1000);

      await prisma.user.update({
        where: { id: userId },
        data: { 
          xp: newXp,
          level: newLevel
        }
      });

      if (newLevel > user.level) {
        logger.info('User leveled up!', { userId, newLevel });
        // Could trigger a notification here
      }

      return { newXp, newLevel, leveledUp: newLevel > user.level };
    } catch (error) {
      logger.error('Error adding XP:', error);
    }
  }

  /**
   * Check and award achievements based on stats
   */
  async checkAchievements(userId) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;

      const currentAchievements = user.achievements || [];
      const newAchievements = [];

      // Get stats
      const booksRead = await prisma.book.count({ 
        where: { userId, status: 'completed' } 
      });
      
      const booksUploaded = await prisma.book.count({ 
        where: { userId } 
      });

      const totalReadingTime = await prisma.readingSession.aggregate({
        where: { userId },
        _sum: { duration: true }
      });
      const totalMinutes = (totalReadingTime._sum.duration || 0) / 60;

      const totalPages = await prisma.readingSession.aggregate({
        where: { userId },
        _sum: { pagesRead: true }
      });
      const pagesRead = totalPages._sum.pagesRead || 0;

      // Check specific achievements
      
      // 1. Book Count Milestones
      if (booksRead >= 1 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.FIRST_BOOK.id)) {
        newAchievements.push(ACHIEVEMENTS.FIRST_BOOK);
      }
      if (booksRead >= 5 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.BOOKWORM.id)) {
        newAchievements.push(ACHIEVEMENTS.BOOKWORM);
      }
      if (booksRead >= 10 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.BIBLIOPHILE.id)) {
        newAchievements.push(ACHIEVEMENTS.BIBLIOPHILE);
      }
      if (booksRead >= 25 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.LEGEND.id)) {
        newAchievements.push(ACHIEVEMENTS.LEGEND);
      }

      // 2. Upload Milestones
      if (booksUploaded >= 5 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.LIBRARIAN.id)) {
        newAchievements.push(ACHIEVEMENTS.LIBRARIAN);
      }

      // 3. Time Milestones
      if (totalMinutes >= 60 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.DEDICATED_READER.id)) {
        newAchievements.push(ACHIEVEMENTS.DEDICATED_READER);
      }
      if (totalMinutes >= 300 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.MARATHON_RUNNER.id)) {
        newAchievements.push(ACHIEVEMENTS.MARATHON_RUNNER);
      }
      if (totalMinutes >= 1440 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.OBSESSED.id)) {
        newAchievements.push(ACHIEVEMENTS.OBSESSED);
      }

      // 4. Page Count Milestones
      if (pagesRead >= 100 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.PAGE_TURNER.id)) {
        newAchievements.push(ACHIEVEMENTS.PAGE_TURNER);
      }
      if (pagesRead >= 500 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.SCHOLAR.id)) {
        newAchievements.push(ACHIEVEMENTS.SCHOLAR);
      }
      if (pagesRead >= 1000 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.RESEARCHER.id)) {
        newAchievements.push(ACHIEVEMENTS.RESEARCHER);
      }
      if (pagesRead >= 5000 && !this.hasAchievement(currentAchievements, ACHIEVEMENTS.ENCYCLOPEDIC.id)) {
        newAchievements.push(ACHIEVEMENTS.ENCYCLOPEDIC);
      }

      if (newAchievements.length > 0) {
        // Award XP for new achievements
        const xpGain = newAchievements.reduce((acc, ach) => acc + ach.xp, 0);
        await this.addXp(userId, xpGain);

        // Update user achievements
        const updatedAchievements = [...currentAchievements, ...newAchievements];
        
        await prisma.user.update({
          where: { id: userId },
          data: { achievements: updatedAchievements }
        });

        logger.info('New achievements awarded', { userId, achievements: newAchievements.map(a => a.name) });
        return newAchievements;
      }

      return [];

    } catch (error) {
      logger.error('Error checking achievements:', error);
      return [];
    }
  }

  hasAchievement(currentList, achievementId) {
    return currentList.some(a => a.id === achievementId);
  }
}

module.exports = new GamificationService();
