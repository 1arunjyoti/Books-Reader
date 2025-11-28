import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Book } from './api';

const DB_NAME = 'books-reader-offline';
const STORE_NAME = 'books';
const DB_VERSION = 1;

export interface OfflineBook {
  id: string;
  book: Book;
  fileBlob: Blob;
  timestamp: number;
}

interface BooksReaderDB extends DBSchema {
  books: {
    key: string;
    value: OfflineBook;
  };
}

let dbPromise: Promise<IDBPDatabase<BooksReaderDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<BooksReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const offlineStorage = {
  async saveBookOffline(book: Book, fileBlob: Blob): Promise<void> {
    const db = await getDB();
    await db.put(STORE_NAME, {
      id: book.id,
      book,
      fileBlob,
      timestamp: Date.now(),
    });
  },

  async getOfflineBook(id: string): Promise<OfflineBook | undefined> {
    const db = await getDB();
    return db.get(STORE_NAME, id);
  },

  async removeOfflineBook(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  },

  async isBookOffline(id: string): Promise<boolean> {
    const db = await getDB();
    const book = await db.get(STORE_NAME, id);
    return !!book;
  },

  async getAllOfflineBooks(): Promise<OfflineBook[]> {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  },
};
