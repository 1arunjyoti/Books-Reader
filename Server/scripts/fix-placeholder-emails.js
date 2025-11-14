/**
 * Migration Script: Fix Placeholder Emails
 * 
 * This script finds all users with placeholder emails and logs them
 * You should then sync these users' profiles to get their real Auth0 emails
 */

const prisma = require('../config/database');

async function fixPlaceholderEmails() {
  try {
    console.log('🔍 Searching for users with placeholder emails...\n');

    // Find all users with placeholder emails
    const placeholderUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: '@internal.local' } },
          { email: { contains: '@creating.user' } },
          { email: { contains: '@sync.required' } },
          { email: 'unknown' }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    if (placeholderUsers.length === 0) {
      console.log('✅ No users with placeholder emails found!');
      return;
    }

    console.log(`⚠️  Found ${placeholderUsers.length} user(s) with placeholder emails:\n`);
    
    placeholderUsers.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    console.log('\n📝 ACTION REQUIRED:');
    console.log('These users need to sync their profiles to update their emails.');
    console.log('Each user should:');
    console.log('1. Log in to the application');
    console.log('2. Call POST /api/user/sync (happens automatically on login)');
    console.log('3. Or manually refresh their profile page');
    console.log('\nThis will update their email from Auth0.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPlaceholderEmails();
