const axios = require('axios');
const { config } = require('../config');
const logger = require('./logger');

/**
 * Fetch user information from Auth0's /userinfo endpoint
 * This is useful when the JWT access token doesn't contain all user details (like email)
 * 
 * @param {string} accessToken - The Auth0 access token from the request
 * @returns {Promise<{email: string, name: string, picture: string, nickname: string}>}
 * @throws {Error} If the request fails
 */
async function fetchAuth0UserInfo(accessToken) {
  try {
    const issuerBaseURL = config.auth0.issuerBaseURL;
    
    if (!issuerBaseURL) {
      throw new Error('AUTH0_DOMAIN is not configured');
    }

    const userInfoUrl = `${issuerBaseURL}/userinfo`;
    
    logger.info('Fetching user info from Auth0', { url: userInfoUrl });
    
    const response = await axios.get(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      timeout: 10000, // 10 second timeout
    });

    logger.info('Auth0 userinfo retrieved successfully', { 
      hasEmail: !!response.data.email,
      hasName: !!response.data.name,
    });

    return {
      email: response.data.email,
      name: response.data.name,
      picture: response.data.picture,
      nickname: response.data.nickname,
      sub: response.data.sub, // User ID
    };
  } catch (error) {
    if (error.response) {
      logger.error('Auth0 userinfo request failed', {
        status: error.response.status,
        data: error.response.data,
      });
      throw new Error(`Failed to fetch user info from Auth0: ${error.response.status}`);
    } else if (error.request) {
      logger.error('Auth0 userinfo request timeout or network error', { error: error.message });
      throw new Error('Network error while fetching user info from Auth0');
    } else {
      logger.error('Auth0 userinfo error', { error: error.message });
      throw error;
    }
  }
}

module.exports = { fetchAuth0UserInfo };
