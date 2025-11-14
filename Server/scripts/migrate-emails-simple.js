/**
 * Simple Email Migration Tool
 * 
 * Shows all placeholder emails and allows you to update them
 * Doesn't require Auth0 API credentials
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Find all users with placeholder emails
 */
async function findPlaceholderUsers() {
  const placeholderUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: '@internal.local' } },
        { email: { contains: '@creating.user' } },
        { email: { contains: '@sync.required' } },
        { email: { contains: '@pending.email' } },
        { email: { contains: '@pending.sync' } },
        { email: { startsWith: 'noemail-' } },
        { email: { startsWith: 'placeholder-' } },
        { email: { startsWith: 'temp-' } },
      ]
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });

  return placeholderUsers;
}

/**
 * Interactive migration
 */
async function interactiveMigration() {
  try {
    console.log('\n====================================');
    console.log('  Email Migration Tool');
    console.log('====================================\n');

    // Find placeholder users
    const placeholderUsers = await findPlaceholderUsers();

    if (placeholderUsers.length === 0) {
      console.log('✅ No users with placeholder emails found!\n');
      rl.close();
      process.exit(0);
    }

    console.log(`Found ${placeholderUsers.length} user(s) with placeholder emails:\n`);

    let migrated = 0;

    for (let i = 0; i < placeholderUsers.length; i++) {
      const user = placeholderUsers[i];

      console.log(`\n[${i + 1}/${placeholderUsers.length}] User: ${user.name || 'Unnamed'}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Current Email: ${user.email}`);
      console.log(`  Created: ${user.createdAt.toLocaleDateString()}`);

      const action = await question('\nWhat would you like to do?\n  [u] Update email\n  [s] Skip\n  [q] Quit\n\nChoice: ');

      if (action.toLowerCase() === 'q') {
        break;
      }

      if (action.toLowerCase() === 's') {
        console.log('Skipped.');
        continue;
      }

      if (action.toLowerCase() === 'u') {
        const newEmail = await question('Enter new email: ');

        // Validate email
        if (!newEmail.includes('@')) {
          console.log('❌ Invalid email format.');
          continue;
        }

        // Check for conflicts
        const conflict = await prisma.user.findUnique({
          where: { email: newEmail }
        });

        if (conflict && conflict.id !== user.id) {
          console.log('❌ Email already in use by another user.');
          continue;
        }

        // Update
        try {
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: { email: newEmail }
          });

          console.log(`✅ Updated to: ${updated.email}`);
          migrated++;
        } catch (error) {
          console.log(`❌ Error updating: ${error.message}`);
        }
      }
    }

    console.log(`\n====================================`);
    console.log(`  Migration Complete`);
    console.log(`====================================`);
    console.log(`✅ Migrated: ${migrated} user(s)\n`);

    rl.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Batch migration from CSV/JSON
 */
async function batchMigration(filePath) {
  try {
    console.log('\n====================================');
    console.log('  Batch Email Migration');
    console.log('====================================\n');

    let migrations = [];

    // Check file type
    if (filePath.endsWith('.json')) {
      migrations = require(filePath);
    } else if (filePath.endsWith('.csv')) {
      // Simple CSV parsing
      const fs = require('fs');
      const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        const [userId, newEmail] = line.split(',').map(s => s.trim());
        if (userId && newEmail) {
          migrations.push({ userId, newEmail });
        }
      }
    } else {
      console.error('❌ Unsupported file format. Use .json or .csv');
      process.exit(1);
    }

    console.log(`Found ${migrations.length} migration(s) to process\n`);

    let successful = 0;
    let failed = 0;

    for (const migration of migrations) {
      const { userId, newEmail } = migration;

      try {
        // Validate user exists
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true }
        });

        if (!user) {
          console.log(`⏭️  User not found: ${userId}`);
          failed++;
          continue;
        }

        // Check for conflicts
        const conflict = await prisma.user.findUnique({
          where: { email: newEmail }
        });

        if (conflict && conflict.id !== userId) {
          console.log(`⏭️  Email in use: ${userId} → ${newEmail}`);
          failed++;
          continue;
        }

        // Update
        await prisma.user.update({
          where: { id: userId },
          data: { email: newEmail }
        });

        console.log(`✅ ${userId} → ${newEmail}`);
        successful++;

      } catch (error) {
        console.log(`❌ ${userId}: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n====================================`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}\n`);

    rl.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Interactive mode
  interactiveMigration();
} else if (args[0] === '--batch' && args[1]) {
  // Batch mode
  batchMigration(args[1]);
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
Email Migration Tool

Usage:
  Interactive mode:
    node scripts/migrate-emails-simple.js

  Batch from JSON:
    node scripts/migrate-emails-simple.js --batch migrations.json

  Batch from CSV:
    node scripts/migrate-emails-simple.js --batch migrations.csv

JSON Format:
  [
    { "userId": "auth0|xxx", "newEmail": "user@example.com" },
    { "userId": "auth0|yyy", "newEmail": "another@example.com" }
  ]

CSV Format:
  userId,newEmail
  auth0|xxx,user@example.com
  auth0|yyy,another@example.com

  `);
  process.exit(0);
} else {
  console.log('Invalid arguments. Use --help for usage information.');
  process.exit(1);
}
