/**
 * Bulk Migration Script: Fix All Placeholder Emails
 * 
 * This script finds all users with placeholder emails and updates them
 * to their actual Auth0 emails by fetching from Auth0's API.
 * 
 * Prerequisites:
 * - AUTH0_DOMAIN env variable
 * - AUTH0_CLIENT_ID env variable  
 * - AUTH0_CLIENT_SECRET env variable
 * 
 * These should be set in your .env file
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
require('dotenv').config();

const prisma = new PrismaClient();

// Auth0 Management API credentials
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

let auth0Token = null;
let tokenExpiry = null;

/**
 * Get a valid Auth0 Management API access token
 */
async function getAuth0Token() {
  try {
    // Check if we have a valid cached token
    if (auth0Token && tokenExpiry && Date.now() < tokenExpiry) {
      return auth0Token;
    }

    console.log('🔐 Fetching Auth0 Management API token...');

    const response = await axios.post(`https://${AUTH0_DOMAIN}/oauth/token`, {
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: `https://${AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials'
    });

    auth0Token = response.data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 300000;

    console.log('✅ Auth0 token obtained\n');
    return auth0Token;
  } catch (error) {
    console.error('❌ Failed to get Auth0 token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get user data from Auth0 by user ID
 */
async function getAuth0User(userId) {
  try {
    const token = await getAuth0Token();

    const response = await axios.get(`https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.warn(`⚠️  Could not fetch Auth0 data for ${userId}:`, error.response?.status, error.message);
    return null;
  }
}

/**
 * Find all users with placeholder emails
 */
async function findPlaceholderUsers() {
  console.log('🔍 Finding users with placeholder emails...\n');

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
 * Main migration function
 */
async function migrateEmails() {
  try {
    // Check Auth0 credentials
    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
      console.error('❌ Auth0 credentials not found in .env file');
      console.error('Please set:');
      console.error('  - AUTH0_DOMAIN');
      console.error('  - AUTH0_CLIENT_ID');
      console.error('  - AUTH0_CLIENT_SECRET\n');
      process.exit(1);
    }

    console.log('====================================');
    console.log('  Email Migration Script');
    console.log('====================================\n');

    // Find placeholder users
    const placeholderUsers = await findPlaceholderUsers();

    if (placeholderUsers.length === 0) {
      console.log('✅ No users with placeholder emails found!\n');
      process.exit(0);
    }

    console.log(`Found ${placeholderUsers.length} user(s) with placeholder emails:\n`);
    placeholderUsers.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Current Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}\n`);
    });

    // Migration stats
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    console.log('====================================');
    console.log('  Starting Migration');
    console.log('====================================\n');

    // Process each user
    for (const user of placeholderUsers) {
      console.log(`Processing: ${user.id}`);

      try {
        // Fetch user from Auth0
        const auth0User = await getAuth0User(user.id);

        if (!auth0User || !auth0User.email) {
          console.warn(`  ⚠️  No email found in Auth0, skipping...\n`);
          skipped++;
          continue;
        }

        const newEmail = auth0User.email;

        // Check if email is different
        if (newEmail.toLowerCase() === user.email.toLowerCase()) {
          console.log(`  ℹ️  Email already matches Auth0, skipping...\n`);
          skipped++;
          continue;
        }

        // Check for email conflicts
        const conflict = await prisma.user.findUnique({
          where: { email: newEmail }
        });

        if (conflict && conflict.id !== user.id) {
          console.warn(`  ⚠️  Email already in use by another user, skipping...\n`);
          skipped++;
          continue;
        }

        // Update the email
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { email: newEmail },
          select: { id: true, email: true }
        });

        console.log(`  ✅ Updated to: ${updated.email}\n`);
        successful++;

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}\n`);
        failed++;
      }
    }

    // Summary
    console.log('====================================');
    console.log('  Migration Complete');
    console.log('====================================\n');
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`Total: ${placeholderUsers.length}\n`);

    if (failed > 0) {
      console.log('⚠️  Some migrations failed. Please check the errors above.\n');
      process.exit(1);
    }

    console.log('🎉 Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateEmails();
