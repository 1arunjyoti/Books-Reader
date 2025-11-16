const DEFAULT_AUTH_USER = 'test-user-auth';

const authState = {
  mode: 'valid', // valid, missing, invalid, expired, passthrough
  userId: DEFAULT_AUTH_USER
};

const rateLimiterState = {
  bookOperations: { max: 3, count: 0 },
  welcomeScreen: { max: 5, count: 0 },
  upload: { max: 3, count: 0 },
};

function setAuthState({ mode, userId } = {}) {
  if (mode) {
    authState.mode = mode;
  }
  if (userId) {
    authState.userId = userId;
  }
}

function resetAuthState() {
  authState.mode = 'valid';
  authState.userId = DEFAULT_AUTH_USER;
}

function setRateLimiterLimit(key, max) {
  if (rateLimiterState[key]) {
    rateLimiterState[key].max = max;
  }
}

function resetRateLimiterState() {
  Object.values(rateLimiterState).forEach((state) => {
    state.count = 0;
  });
}

module.exports = {
  authState,
  rateLimiterState,
  setAuthState,
  resetAuthState,
  setRateLimiterLimit,
  resetRateLimiterState
};
