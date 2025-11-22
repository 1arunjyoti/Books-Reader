'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { useClerk } from '@clerk/nextjs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookOpen, LogOut, Menu, User, X } from 'lucide-react';

interface NavbarClientProps {
  user: {
    sub: string;
    name?: string;
    nickname?: string;
    picture?: string;
    email?: string;
  } | null;
}

export default function NavbarClient({ user }: NavbarClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut({ redirectUrl: '/' });
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.nickname) {
      return user.nickname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const userMenu = user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className=" rounded-full border border-gray-300 dark:border-gray-700  hover:bg-gray-100 dark:hover:bg-gray-700 p-0.5"
          aria-label="Open user menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 z-10 rounded-lg shadow-lg ring-1 ring-border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" align="end">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name || user.nickname || 'User'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>  
          <Link href="/library" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Library
        </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <User className="h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          variant="destructive" 
          className="flex items-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm py-4">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Logo and Mobile Controls */}
        <div className="flex w-full items-center justify-between md:w-auto">
          <Link
            href="/"
            className="text-xl font-bold text-gray-800 hover:text-gray-600 dark:text-white dark:hover:text-gray-200 transition-colors"
            aria-label="BooksReader Home"
          >
            BooksReader
          </Link>
          {/* Mobile menu button */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeSwitcher />
            {user && userMenu}
            {!user && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className=" rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? 
                  <X className="h-6 w-6" /> : <Menu className="h-6 w-6" 
                />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <ThemeSwitcher />
              {userMenu}
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2 ml-2">
                <Button
                  asChild
                  variant="outline"
                  className="text-gray-700 dark:text-gray-200"
                  aria-label="Sign In"
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild className="mr-2" aria-label="Sign Up">
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
              <ThemeSwitcher />
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pt-4 mx-2 space-y-2">
          {user ? (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start text-gray-700 dark:text-gray-200"
              >
                <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Link>
              </Button>
              <Button
                asChild
                variant="default"
                className="w-full justify-start"
              >
                <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
