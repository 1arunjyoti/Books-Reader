/**
 * Auth middleware compatibility layer
 * Re-exports Clerk authentication for backwards compatibility with tests
 */

const { checkJwt, getUserFromToken } = require('./clerk-auth');

module.exports = {
  checkJwt,
  getUserFromToken
};
