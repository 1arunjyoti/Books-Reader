/**
 * Quick sync script to update user email from Auth0
 * This will fix the placeholder email issue
 */

// Run this in your browser console on http://localhost:3000 while logged in
async function syncProfile() {
  try {
    const response = await fetch('/api/user/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Sync failed:', error);
      return;
    }

    const data = await response.json();
    console.log('Profile synced successfully!', data);
    console.log('Your email has been updated to:', data.user.email);
    console.log('You can now delete your account using this email.');
  } catch (error) {
    console.error('Error syncing profile:', error);
  }
}

syncProfile();
