/**
 * Script to fix user email by syncing from Auth0
 * Run this to update your email from the placeholder to your real Auth0 email
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');

async function fixUserEmail(userId) {
  try {
    console.log(`Looking for user with ID: ${userId}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Current user data:', user);
    console.log('\nTo fix this, please:');
    console.log('1. Make a POST request to: http://localhost:5000/api/user/sync');
    console.log('2. Include your Auth0 JWT token in the Authorization header');
    console.log('3. This will update your email to the correct one from Auth0');
    console.log('\nOr simply log out and log back in to trigger the sync automatically.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get userId from command line
const userId = process.argv[2];

if (!userId) {
  console.log('Usage: node fix-user-email.js <userId>');
  console.log('Example: node fix-user-email.js auth0|6914221cdbfdd62da0f1fffd');
  process.exit(1);
}

fixUserEmail(userId);
