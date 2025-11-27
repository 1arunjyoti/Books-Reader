'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, LogOut, Menu, User, X, ChevronRight } from 'lucide-react';

interface NavbarClientProps {
  user: {
    sub: string;
    name?: string;
    nickname?: string;
    picture?: string;
    email?: string;
  } | null;
}

import { usePathname } from 'next/navigation';

export default function NavbarClient({ user }: NavbarClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { signOut } = useClerk();
  const pathname = usePathname();

  const isStaticPage = pathname?.startsWith('/library') || pathname?.startsWith('/profile');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          className="rounded-full border border-gray-200 dark:border-gray-700 ring-2 ring-transparent hover:ring-blue-500/20 transition-all duration-200 focus:outline-none"
          aria-label="Open user menu"
        >
          <Avatar className="h-9 w-9 border border-gray-200 dark:border-gray-700">
            {/* <AvatarImage src={user.picture} alt={user.name || 'User'} /> */}
            <AvatarFallback className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 z-50 rounded-xl shadow-xl ring-1 ring-black/5 border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-2" align="end">
        <div className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name || user.nickname || 'User'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
        </div>
        
        <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20">  
          <Link href="/library" className="flex items-center gap-2.5 py-2.5 px-3">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-medium">My Library</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-900/20 mt-1">
          <Link href="/profile" className="flex items-center gap-2.5 py-2.5 px-3">
            <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <User className="h-4 w-4" />
            </div>
            <span className="font-medium">Profile & Settings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-2 bg-gray-100 dark:bg-gray-800" />
        
        <DropdownMenuItem 
          className="rounded-lg cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700 dark:focus:text-red-300"
          onClick={handleLogout}
        >
          <div className="flex items-center gap-2.5 py-2 px-3 w-full">
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Sign out</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`${isStaticPage ? 'absolute' : 'fixed'} top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled || isMenuOpen
            ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm' 
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/"
                className="flex items-center gap-2 group"
                aria-label="BooksReader Home"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-all duration-300">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                  BooksReader
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {!user && (
                <div className="flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <Link href="/#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</Link>
                  <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link>
                  <Link href="/pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</Link>
                </div>
              )}

              {!user && <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />}

              <div className="flex items-center gap-4">
                <ThemeSwitcher />
                {user ? (
                  userMenu
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      asChild
                      variant="ghost"
                      className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-full px-6">
                      <Link href="/sign-up">Get Started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-4 md:hidden">
              <ThemeSwitcher />
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-16 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 md:hidden overflow-hidden"
          >
            <div className="px-4 py-6 space-y-6">
              {user && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <Avatar className="h-12 w-12 border border-gray-200 dark:border-gray-700">
                    <AvatarImage src={user.picture} alt={user.name || 'User'} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{user.name || 'User'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              )}
              
              {!user && (
              <div className="space-y-2">
                <Link 
                  href="/#features" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
                >
                  Features
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link 
                  href="/about" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
                >
                  About
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link 
                  href="/pricing" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
                >
                  Pricing
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
              )}

              {!user && (
              <div className="h-px bg-gray-100 dark:bg-gray-800" />
              )}

              <div className="flex flex-col gap-4">
                {user ? (
                  <>
                    <Link href="/library" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full justify-start gap-2" variant="outline">
                        <BookOpen className="w-4 h-4" />
                        My Library
                      </Button>
                    </Link>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full justify-start gap-2" variant="outline">
                        <User className="w-4 h-4" />
                        Profile
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
