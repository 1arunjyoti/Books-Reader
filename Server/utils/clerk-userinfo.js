const { clerkClient } = require('@clerk/express');
const logger = require('./logger');

/**
 * Fetch user information from Clerk
 * @param {string} userId - Clerk user ID
 * @returns {Promise<Object>} User information
 */
async function fetchClerkUserInfo(userId) {
  try {
    const user = await clerkClient.users.getUser(userId);
    
    return {
      sub: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName || user.lastName || user.username,
      picture: user.imageUrl,
      nickname: user.username,
    };
  } catch (error) {
    logger.error('Failed to fetch user info from Clerk', {
      userId,
      error: error.message,
    });
    return null;
  }
}

module.exports = { fetchClerkUserInfo };
