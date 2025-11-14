import { getSession } from '@/lib/session';
import NavbarClient from './navbar-client';
import { fetchUserProfile } from '@/lib/api/user-profile';

export default async function Navbar() {
  const session = await getSession();
  const user = session?.user;
  const accessToken = session?.tokenSet?.accessToken || '';

  // Fetch user profile from database to get saved name
  // Uses shared utility with:
  // - 5-minute cache
  // - 10-second timeout
  // - Selective fields (only 'name' and 'email' needed for navbar)
  // This reduces payload by ~70% compared to fetching all fields
  let userProfile = null;
  if (user && accessToken) {
    // Request only name and email (navbar doesn't need picture, nickname, or updatedAt)
    userProfile = await fetchUserProfile(user.sub, accessToken, ['name', 'email']);
  }

  // Merge Auth0 user data with database profile data
  const mergedUser = user ? {
    ...user,
    name: userProfile?.name || user.name, // Use saved name if available
  } : null;

  return <NavbarClient user={mergedUser || null} />;
}
