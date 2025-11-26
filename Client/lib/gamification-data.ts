import { Achievement } from './api/user-profile';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Book Count Milestones
  {
    id: 'first_book',
    name: 'First Steps',
    description: 'Read your first book',
    icon: '📖',
    xp: 50
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Read 5 books',
    icon: '🐛',
    xp: 150
  },
  {
    id: 'bibliophile',
    name: 'Bibliophile',
    description: 'Read 10 books',
    icon: '📚',
    xp: 300
  },
  {
    id: 'legend',
    name: 'Literary Legend',
    description: 'Read 25 books',
    icon: '👑',
    xp: 1000
  },

  // Page Count Milestones
  {
    id: 'page_turner',
    name: 'Page Turner',
    description: 'Read 100 pages',
    icon: '📄',
    xp: 100
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Read 500 pages',
    icon: '🎓',
    xp: 250
  },
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Read 1,000 pages',
    icon: '🔎',
    xp: 500
  },
  {
    id: 'encyclopedic',
    name: 'Encyclopedic',
    description: 'Read 5,000 pages',
    icon: '🧠',
    xp: 2000
  },

  // Time Milestones
  {
    id: 'dedicated_reader',
    name: 'Dedicated',
    description: 'Read for 1 hour total',
    icon: '🕐',
    xp: 100
  },
  {
    id: 'marathon_runner',
    name: 'Marathon Runner',
    description: 'Read for 5 hours total',
    icon: '🏃',
    xp: 300
  },
  {
    id: 'obsessed',
    name: 'Obsessed',
    description: 'Read for 24 hours total',
    icon: '🔥',
    xp: 1000
  },

  // Upload Milestones
  {
    id: 'librarian',
    name: 'Librarian',
    description: 'Upload 5 books',
    icon: '📂',
    xp: 75
  }
];
