import { currentUser } from '@clerk/nextjs/server';
import NavbarClient from './navbar-client';
import { fetchUserProfile } from '@/lib/api/user-profile';
import { auth } from '@clerk/nextjs/server';

export default async function Navbar() {
  const user = await currentUser();
  
  if (!user) {
    return <NavbarClient user={null} />;
  }

  // Get Clerk token for API calls
  const { getToken } = await auth();
  const accessToken = await getToken();

  // Fetch user profile from database to get saved name
  let userProfile = null;
  if (user && accessToken) {
    userProfile = await fetchUserProfile(user.id, accessToken, ['name', 'email']);
  }

  // Merge Clerk user data with database profile data
  const mergedUser = {
    sub: user.id,
    name: userProfile?.name || (user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName || user.lastName || user.username || 'User'),
    email: user.emailAddresses[0]?.emailAddress,
    picture: user.imageUrl,
    nickname: user.username ?? undefined,
  };

  return <NavbarClient user={mergedUser} />;
}
