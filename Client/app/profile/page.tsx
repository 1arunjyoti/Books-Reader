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
import SyncProfileButton from '@/components/profile/sync-profile-button';
import UsedStorageSection from '@/components/profile/used-storage';
import { redirect } from 'next/navigation';
import { ReadingStatsDashboard } from '@/components/analytics/reading-stats-dashboard';
import { ReadingGoals } from '@/components/analytics/reading-goals';
import { SignOutButton } from '@clerk/nextjs';
import GamificationDashboard from '@/components/profile/gamification-dashboard';

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
    'createdAt',
    'usedStorage',
    'level',
    'xp',
    'achievements',
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
    <div className="container mx-auto px-4 py-8 pt-24 md:pt-32 min-h-screen">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Profile Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-30 group-hover:opacity-70 blur transition duration-500"></div>
                  <Avatar className="h-28 w-28 border-4 border-white dark:border-gray-800 shadow-lg relative">
                    <AvatarFallback className='text-4xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900'>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="space-y-1 w-full">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                    {getDisplayName()}
                  </h2>
                  <div className="pb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      Level {userProfile?.level || 1} Reader
                    </span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{userEmail}</p>
                  {userProfile?.createdAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Member since {new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  {emailVerified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 mt-2 border border-green-200 dark:border-green-800">
                      Verified Account
                    </span>
                  )}
                </div>

                {/* Change Name Section */}
                <div className="w-full pt-6 mt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                  <ChangeNameSection 
                    initialName={getDisplayName()} 
                  />
                </div>

                {/* Used Storage Section */}
                <div className="w-full pt-6 mt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                  <UsedStorageSection usedStorage={userProfile?.usedStorage || 0} />
                </div>

                {/* Sync Profile Button */}
                <div className="w-full">
                  <SyncProfileButton />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl h-auto border border-gray-200/50 dark:border-gray-700/50">
              <TabsTrigger 
                value="analytics" 
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="goals" 
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
              >
                Goals
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
              >
                Achievements
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
              >
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ReadingStatsDashboard />
            </TabsContent>

            <TabsContent value="goals" className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ReadingGoals />
            </TabsContent>

            <TabsContent value="achievements" className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GamificationDashboard 
                level={userProfile?.level || 1} 
                xp={userProfile?.xp || 0} 
                achievements={userProfile?.achievements || []} 
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-6">
                  <CardTitle className="text-xl">Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences and security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  <div className="grid gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Profile Information</h3>
                      <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200/50 dark:border-gray-700/50 last:border-0">
                          <span className="text-sm text-muted-foreground">Email Address</span>
                          <span className="text-sm font-medium">{userEmail}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200/50 dark:border-gray-700/50 last:border-0">
                          <span className="text-sm text-muted-foreground">Verification Status</span>
                          <span className={`text-sm font-medium ${emailVerified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600'}`}>
                            {emailVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Security</h3>
                      <div className="space-y-6">
                        <ChangeEmailSection userEmail={userEmail} />
                        <ChangePasswordSection />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-red-500 dark:text-red-400 uppercase tracking-wider mb-4">Danger Zone</h3>
                      <div className="bg-red-50/30 dark:bg-red-900/10 rounded-xl p-6 border border-red-100 dark:border-red-900/30 space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Sign Out</h4>
                            <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
                          </div>
                          <SignOutButton>
                            <Button variant="outline" className="border-red-200 hover:bg-red-50 text-red-600 dark:border-red-900 dark:hover:bg-red-900/20 dark:text-red-400">
                              <LogOut className="h-4 w-4 mr-2" />
                              Sign Out
                            </Button>
                          </SignOutButton>
                        </div>
                        
                        <div className="pt-6 border-t border-red-200/50 dark:border-red-900/30">
                          <DeleteAccountSection userEmail={userEmail} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
