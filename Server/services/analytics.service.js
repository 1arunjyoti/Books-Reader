const prisma = require('../config/database');
const logger = require('../utils/logger');
const { randomUUID } = require('crypto');

/**
 * Analytics Service
 * Handles all business logic related to reading analytics and goals
 */

class AnalyticsService {
  /**
   * Log a reading session
   * @param {string} userId - User ID
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Created session
   */
  async logSession(userId, sessionData) {
    const { bookId, duration, pagesRead, startPage, endPage, progressDelta } = sessionData;

    const session = await prisma.readingSession.create({
      data: {
        id: randomUUID(),
        bookId,
        userId,
        duration: Math.floor(duration), // Ensure it's an integer
        pagesRead: pagesRead || 0,
        startPage: startPage || 0,
        endPage: endPage || 0,
        progressDelta: progressDelta || 0,
      }
    });

    logger.info('Reading session logged', { 
      sessionId: session.id, 
      userId, 
      bookId, 
      duration 
    });

    // Auto-update reading goals based on this session
    await this.autoUpdateGoals(userId, session);

    return session;
  }

  /**
   * Automatically update reading goals based on a logged session
   * @param {string} userId - User ID
   * @param {Object} session - Reading session data
   */
  async autoUpdateGoals(userId, session) {
    try {
      const now = new Date();
      
      // Get active goals for this user
      const activeGoals = await prisma.readingGoal.findMany({
        where: {
          userId,
          endDate: { gte: now } // Only active goals
        }
      });

      if (activeGoals.length === 0) {
        return; // No active goals to update
      }

      // Update each goal based on its type
      for (const goal of activeGoals) {
        let increment = 0;
        let shouldUpdate = true;

        switch (goal.type) {
          case 'books':
            // For books goal, check if this is a book completion
            // We only increment when a book changes status to 'finished'
            // This is handled separately in the book update logic
            // Skip auto-update here to prevent double-counting
            shouldUpdate = false;
            break;

          case 'pages':
            // Increment by pages read
            increment = session.pagesRead || 0;
            break;

          case 'time':
            // Increment by duration (in minutes)
            increment = Math.floor(session.duration / 60);
            break;

          default:
            shouldUpdate = false;
        }

        if (shouldUpdate && increment > 0) {
          // Update goal current value
          await prisma.readingGoal.update({
            where: { id: goal.id },
            data: { 
              current: { 
                increment 
              }
            }
          });

          logger.info('Goal auto-updated', { 
            goalId: goal.id, 
            userId, 
            type: goal.type, 
            increment 
          });
        }
      }
    } catch (error) {
      // Log error but don't fail the session creation
      logger.error('Error auto-updating goals:', { 
        error: error.message, 
        userId,
        sessionId: session.id 
      });
    }
  }

  /**
   * Update goals when a book is marked as finished
   * @param {string} userId - User ID
   * @param {string} bookId - Book ID
   */
  async updateBooksGoal(userId, bookId) {
    try {
      const now = new Date();
      
      // Get active books goals
      const booksGoals = await prisma.readingGoal.findMany({
        where: {
          userId,
          type: 'books',
          endDate: { gte: now }
        }
      });

      // Increment each active books goal
      for (const goal of booksGoals) {
        await prisma.readingGoal.update({
          where: { id: goal.id },
          data: { 
            current: { 
              increment: 1 
            }
          }
        });

        logger.info('Books goal incremented', { 
          goalId: goal.id, 
          userId, 
          bookId 
        });
      }
    } catch (error) {
      logger.error('Error updating books goal:', { 
        error: error.message, 
        userId,
        bookId 
      });
    }
  }

  /**
   * Calculate date filter based on period
   * @param {string} period - Period (all, week, month, year)
   * @returns {Object} Date filter object
   */
  calculateDateFilter(period) {
    const now = new Date();
    let dateFilter = {};

    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: monthAgo };
    } else if (period === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: yearAgo };
    }

    return dateFilter;
  }

  /**
   * Calculate current reading streak (consecutive days)
   * @param {Array} sessions - Reading sessions
   * @returns {number} Current streak in days
   */
  calculateStreak(sessions) {
    const now = new Date();
    const uniqueDates = [...new Set(sessions.map(s => 
      new Date(s.createdAt).toDateString()
    ))].sort((a, b) => new Date(b) - new Date(a));

    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

    if (uniqueDates.length > 0) {
      // Check if user read today or yesterday
      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i - 1]);
          const currDate = new Date(uniqueDates[i]);
          const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    return currentStreak;
  }

  /**
   * Group sessions by date for chart data
   * @param {Array} sessions - Reading sessions
   * @returns {Array} Daily statistics
   */
  groupSessionsByDate(sessions) {
    const dailyStats = {};
    
    sessions.forEach(session => {
      const date = new Date(session.createdAt).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { date, duration: 0, pages: 0 };
      }
      dailyStats[date].duration += session.duration;
      dailyStats[date].pages += session.pagesRead;
    });

    return Object.values(dailyStats).map(day => ({
      date: day.date,
      minutes: Math.round(day.duration / 60),
      pages: day.pages
    }));
  }

  /**
   * Get reading statistics for a user
   * @param {string} userId - User ID
   * @param {string} period - Period filter (all, week, month, year)
   * @returns {Promise<Object>} Statistics data
   */
  async getStatistics(userId, period = 'all') {
    const dateFilter = this.calculateDateFilter(period);

    // Get reading sessions
    const sessions = await prisma.readingSession.findMany({
      where: {
        userId,
        ...(period !== 'all' && { createdAt: dateFilter })
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get books statistics
    const books = await prisma.book.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        progress: true,
        totalPages: true,
      }
    });

    // Calculate basic statistics
    const totalReadingTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalPagesRead = sessions.reduce((sum, s) => sum + s.pagesRead, 0);
    const booksFinished = books.filter(b => b.status === 'finished').length;
    const booksReading = books.filter(b => b.status === 'reading').length;

    // Calculate current streak
    const currentStreak = this.calculateStreak(sessions);

    // Calculate reading speed (pages per hour)
    const readingSpeed = totalReadingTime > 0 
      ? Math.round((totalPagesRead / (totalReadingTime / 3600)) * 10) / 10 
      : 0;

    // Get daily reading time for the last 30 days (for charts)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSessions = await prisma.readingSession.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: 'asc' }
    });

    const chartData = this.groupSessionsByDate(recentSessions);

    logger.info('Statistics calculated', { 
      userId, 
      period, 
      sessionsCount: sessions.length 
    });

    return {
      totalReadingTime, // in seconds
      totalPagesRead,
      booksFinished,
      booksReading,
      currentStreak,
      readingSpeed, // pages per hour
      sessionsCount: sessions.length,
      chartData,
      period
    };
  }

  /**
   * Get all reading goals for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of goals
   */
  async getGoals(userId) {
    const goals = await prisma.readingGoal.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' }
    });

    logger.debug('Goals fetched', { userId, count: goals.length });
    return goals;
  }

  /**
   * Calculate end date based on period
   * @param {string} period - Period (daily, weekly, monthly, yearly)
   * @returns {Object} End date and period info
   */
  calculateGoalPeriod(period) {
    const now = new Date();
    let endDate;
    let year = now.getFullYear();
    let month = null;
    let week = null;

    if (period === 'daily') {
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      week = Math.ceil((now.getDate()) / 7);
    } else if (period === 'monthly') {
      month = now.getMonth() + 1;
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else if (period === 'yearly') {
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    } else {
      throw new Error('Invalid period');
    }

    return { endDate, year, month, week };
  }

  /**
   * Create or update a reading goal
   * @param {string} userId - User ID
   * @param {Object} goalData - Goal data
   * @returns {Promise<Object>} Created or updated goal
   */
  async createOrUpdateGoal(userId, goalData) {
    const { type, period, target } = goalData;

    // Calculate period info
    const { endDate, year, month, week } = this.calculateGoalPeriod(period);

    // Check if goal already exists
    const existingGoal = await prisma.readingGoal.findFirst({
      where: {
        userId,
        type,
        period,
        year,
        month,
        week
      }
    });

    let goal;
    if (existingGoal) {
      // Update existing goal
      goal = await prisma.readingGoal.update({
        where: { id: existingGoal.id },
        data: { target }
      });
      logger.info('Goal updated', { goalId: goal.id, userId, type, period });
    } else {
      // Create new goal
      goal = await prisma.readingGoal.create({
        data: {
          id: randomUUID(),
          userId,
          type,
          period,
          target,
          year,
          month,
          week,
          endDate
        }
      });
      logger.info('Goal created', { goalId: goal.id, userId, type, period });
    }

    return goal;
  }

  /**
   * Verify goal ownership
   * @param {string} goalId - Goal ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Goal object
   * @throws {Error} If goal not found or doesn't belong to user
   */
  async verifyGoalOwnership(goalId, userId) {
    const goal = await prisma.readingGoal.findUnique({
      where: { id: goalId }
    });

    if (!goal || goal.userId !== userId) {
      throw new Error('Goal not found');
    }

    return goal;
  }

  /**
   * Update goal progress
   * @param {string} goalId - Goal ID
   * @param {string} userId - User ID
   * @param {number} current - Current progress
   * @returns {Promise<Object>} Updated goal
   */
  async updateGoalProgress(goalId, userId, current) {
    // Verify ownership
    await this.verifyGoalOwnership(goalId, userId);

    const updatedGoal = await prisma.readingGoal.update({
      where: { id: goalId },
      data: { current }
    });

    logger.info('Goal progress updated', { goalId, userId, current });
    return updatedGoal;
  }

  /**
   * Delete a goal
   * @param {string} goalId - Goal ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteGoal(goalId, userId) {
    // Verify ownership
    await this.verifyGoalOwnership(goalId, userId);

    await prisma.readingGoal.delete({
      where: { id: goalId }
    });

    logger.info('Goal deleted', { goalId, userId });
  }
}

module.exports = new AnalyticsService();
