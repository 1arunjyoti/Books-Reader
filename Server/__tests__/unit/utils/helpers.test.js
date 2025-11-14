/**
 * Unit tests for helpers utility functions
 */
const { randomFileName } = require('../../../utils/helpers');

describe('helpers.js - Utility Functions', () => {
  describe('randomFileName', () => {
    test('should generate a random hex string', () => {
      const filename = randomFileName();
      expect(filename).toBeDefined();
      expect(typeof filename).toBe('string');
      expect(filename.length).toBeGreaterThan(0);
    });

    test('should generate different filenames on each call', () => {
      const filename1 = randomFileName();
      const filename2 = randomFileName();
      expect(filename1).not.toBe(filename2);
    });

    test('should default to 32 characters (16 bytes)', () => {
      const filename = randomFileName();
      expect(filename.length).toBe(32); // 16 bytes * 2 hex chars per byte
    });

    test('should generate specified byte length', () => {
      const filename8 = randomFileName(8);
      const filename32 = randomFileName(32);
      expect(filename8.length).toBe(16);  // 8 bytes * 2
      expect(filename32.length).toBe(64); // 32 bytes * 2
    });

    test('should only contain hex characters', () => {
      const filename = randomFileName();
      expect(filename).toMatch(/^[0-9a-f]+$/);
    });

    test('should handle edge cases', () => {
      const filename1 = randomFileName(1);
      expect(filename1.length).toBe(2);
      
      const filename0 = randomFileName(0);
      expect(filename0.length).toBe(0);
    });

    test('should be cryptographically random', () => {
      const filenames = new Set();
      // Generate 1000 filenames and check for collisions
      for (let i = 0; i < 1000; i++) {
        filenames.add(randomFileName());
      }
      // Should have 1000 unique filenames (no collisions)
      expect(filenames.size).toBe(1000);
    });
  });
});
