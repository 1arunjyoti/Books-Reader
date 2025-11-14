/**
 * Direct Email Update Script
 * Updates a user's email directly in the database
 * Use this to fix placeholder emails
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUserEmail(userId, newEmail) {
  try {
    console.log(`\n🔍 Updating email for user: ${userId}`);
    console.log(`📧 New email: ${newEmail}\n`);

    // First, check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });

    if (!existingUser) {
      console.error('❌ User not found!');
      process.exit(1);
    }

    console.log('Current user data:');
    console.log(`   ID: ${existingUser.id}`);
    console.log(`   Email: ${existingUser.email}`);
    console.log(`   Name: ${existingUser.name}\n`);

    // Check if the new email is already in use by another user
    const emailConflict = await prisma.user.findUnique({
      where: { email: newEmail }
    });

    if (emailConflict && emailConflict.id !== userId) {
      console.error(`❌ Email ${newEmail} is already in use by another user!`);
      process.exit(1);
    }

    // Update the email
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
      select: { id: true, email: true, name: true }
    });

    console.log('✅ Email updated successfully!');
    console.log('\nUpdated user data:');
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Name: ${updatedUser.name}\n`);

    console.log('🎉 Done! You can now delete your account using:', newEmail);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get arguments from command line
const userId = process.argv[2];
const newEmail = process.argv[3];

if (!userId || !newEmail) {
  console.log('Usage: node scripts/update-email-directly.js <userId> <newEmail>');
  console.log('\nExample:');
  console.log('  node scripts/update-email-directly.js auth0|69157c56f57343989427a0f3 new@gmail.com');
  console.log('\nThis will update the user\'s email in the database directly.');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(newEmail)) {
  console.error('❌ Invalid email format!');
  process.exit(1);
}

updateUserEmail(userId, newEmail);
