const { auth } = require('express-oauth2-jwt-bearer');
const { config } = require('../config');

/**
 * Auth0 JWT validation middleware
 * Validates JWT tokens from Auth0 for protected routes
 */
const checkJwt = auth({
  audience: config.auth0.audience,
  issuerBaseURL: config.auth0.issuerBaseURL,
  tokenSigningAlg: 'RS256'
});

module.exports = { checkJwt };
