#!/usr/bin/env node

/**
 * Quick Server Test Script
 * Run this to verify server is working correctly
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 BooksReader Server Quick Test\n');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(msg) {
  console.log('✅', msg);
  passed++;
}

function fail(msg) {
  console.log('❌', msg);
  failed++;
}

function warn(msg) {
  console.log('⚠️ ', msg);
  warnings++;
}

function section(title) {
  console.log('\n' + '='.repeat(50));
  console.log(`  ${title}`);
  console.log('='.repeat(50) + '\n');
}

// Test 1: Check required files exist
section('Phase 1: File Structure');

const requiredFiles = [
  'server.js',
  'package.json',
  '.env',
  'config/index.js',
  'config/database.js',
  'config/storage.js',
  'utils/logger.js',
  'middleware/auth.js',
  'middleware/errorHandler.js',
  'middleware/upload.js',
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    pass(`File exists: ${file}`);
  } else {
    fail(`Missing file: ${file}`);
  }
});

// Check logs directory
if (fs.existsSync(path.join(__dirname, 'logs'))) {
  pass('logs/ directory exists');
} else {
  warn('logs/ directory not found - will be created on first run');
}

// Test 2: Check environment variables
section('Phase 2: Environment Variables');

require('dotenv').config();

const requiredEnvVars = [
  'PORT',
  'CLIENT_URL',
  'AUTH0_DOMAIN',
  'AUTH0_AUDIENCE',
  'B2_ENDPOINT',
  'B2_KEY_ID',
  'B2_APPLICATION_KEY',
  'B2_BUCKET_NAME',
  'DATABASE_URL'
];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    pass(`Environment variable set: ${varName}`);
  } else {
    fail(`Missing environment variable: ${varName}`);
  }
});

// Test 3: Load modules
section('Phase 3: Module Loading');

try {
  const { config, validateConfig } = require('./config');
  pass('Config module loads');
  
  try {
    validateConfig();
    pass('Config validation passed');
  } catch (error) {
    fail(`Config validation failed: ${error.message}`);
  }
} catch (error) {
  fail(`Config module error: ${error.message}`);
}

try {
  const logger = require('./utils/logger');
  pass('Logger module loads');
  
  // Test logger methods
  if (typeof logger.info === 'function' &&
      typeof logger.error === 'function' &&
      typeof logger.warn === 'function' &&
      typeof logger.debug === 'function') {
    pass('Logger has all required methods');
  } else {
    fail('Logger missing required methods');
  }
} catch (error) {
  fail(`Logger module error: ${error.message}`);
}

try {
  const prisma = require('./config/database');
  pass('Database module loads');
} catch (error) {
  fail(`Database module error: ${error.message}`);
}

try {
  const { uploadToB2, generatePresignedUrl } = require('./config/storage');
  pass('Storage module loads');
} catch (error) {
  fail(`Storage module error: ${error.message}`);
}

// Test 4: Check dependencies
section('Phase 4: Dependencies');

try {
  const packageJson = require('./package.json');
  const requiredDeps = [
    'express',
    'cors',
    'dotenv',
    'winston',
    'winston-daily-rotate-file',
    '@prisma/client',
    'express-oauth2-jwt-bearer',
    'multer',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner'
  ];
  
  const installedDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  requiredDeps.forEach(dep => {
    if (installedDeps[dep]) {
      pass(`Dependency installed: ${dep}`);
    } else {
      fail(`Missing dependency: ${dep}`);
    }
  });
} catch (error) {
  fail(`Package.json error: ${error.message}`);
}

// Test 5: Syntax check services (NEW!)
section('Phase 5: Service Layer');

const services = [
  'services/upload.service.js',
  'services/books.service.js',
  'services/bookmarks.service.js',
  'services/analytics.service.js',
  'services/collections.service.js'
];

services.forEach(service => {
  try {
    require(`./${service}`);
    pass(`Service loads: ${service}`);
  } catch (error) {
    fail(`Service error ${service}: ${error.message}`);
  }
});

// Test 6: Syntax check controllers
section('Phase 6: Controller Syntax');

const controllers = [
  'controllers/upload.controller.js',
  'controllers/books.controller.js',
  'controllers/bookmarks.controller.js',
  'controllers/analytics.controller.js',
  'controllers/collections.controller.js'
];

controllers.forEach(controller => {
  try {
    require(`./${controller}`);
    pass(`Controller loads: ${controller}`);
  } catch (error) {
    fail(`Controller error ${controller}: ${error.message}`);
  }
});

// Test 7: Check routes
section('Phase 7: Routes');

const routes = [
  'routes/index.js',
  'routes/upload.routes.js',
  'routes/books.routes.js',
  'routes/bookmarks.routes.js',
  'routes/analytics.routes.js',
  'routes/collections.routes.js'
];

routes.forEach(route => {
  try {
    require(`./${route}`);
    pass(`Route loads: ${route}`);
  } catch (error) {
    fail(`Route error ${route}: ${error.message}`);
  }
});

// Final Summary
section('Test Summary');

console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Server is ready to start.');
  console.log('\nNext steps:');
  console.log('  1. Run: npm start');
  console.log('  2. Test health endpoint: curl http://localhost:3001/health');
  console.log('  3. Check logs: Get-Content logs/combined.log\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please fix the issues above before starting the server.\n');
  process.exit(1);
}
