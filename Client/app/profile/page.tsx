import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import { currentUser, auth } from '@clerk/nextjs/server';
import { fetchUserProfile } from '@/lib/api/user-profile';
import DeleteAccountSection from '@/components/profile/delete-account';
import ChangeEmailSection from '@/components/profile/change-email';
import ChangePasswordSection from '@/components/profile/change-password';
import ChangeNameSection from '@/components/profile/change-name';
import { redirect } from 'next/navigation';
import { ReadingStatsDashboard } from '@/components/analytics/reading-stats-dashboard';
import { ReadingGoals } from '@/components/analytics/reading-goals';

export default async function ProfilePage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const { getToken } = await auth();
  const accessToken = await getToken() || '';

  // Fetch user profile from database using shared utility
  const userProfile = await fetchUserProfile(user.id, accessToken, [
    'id',
    'email',
    'name',
    'picture',
    'nickname',
    'updatedAt',
  ]);

  const getUserInitials = () => {
    // Use stored name if available, otherwise fall back to Clerk name
    const displayName = userProfile?.name || (user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName || user.lastName || user.username);
    
    if (displayName) {
      return displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user.emailAddresses[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    return userProfile?.name || (user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName || user.lastName || user.username || 'User');
  };

  const userEmail = user.emailAddresses[0]?.emailAddress;
  const emailVerified = user.emailAddresses[0]?.verification?.status === 'verified';

  return (
    <div className="container mx-auto px-4 py-8 bg-white dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Profile Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className='text-4xl'>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 w-full">
                  <h2 className="text-xl font-semibold">{getDisplayName()}</h2>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                  {emailVerified && (
                    <span className="inline-block text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                      Verified
                    </span>
                  )}
                </div>

                {/* Change Name Section */}
                <div className="w-full pt-4 border-t border-gray-300 dark:border-gray-600">
                  <ChangeNameSection 
                    initialName={getDisplayName()} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              {/* <TabsTrigger value="library">Library</TabsTrigger> */}
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="mt-6">
              <ReadingStatsDashboard accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="goals" className="mt-6">
              <ReadingGoals accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Account Information</h3>
                    <div className="space-y-2 text-sm">
                      {/* <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID:</span>
                        <span className="font-mono text-xs">{user.id}</span>
                      </div> */}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{userEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email Verified:</span>
                        <span>{emailVerified ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  <ChangeEmailSection userEmail={userEmail} />
                  <ChangePasswordSection />

                    <div className="flex items-end justify-end my-2 mt-6">
                      <Button asChild variant="destructive">
                        <a href="/api/auth/logout">
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </a>
                      </Button>
                    </div>

                    
                  <DeleteAccountSection userEmail={userEmail} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
