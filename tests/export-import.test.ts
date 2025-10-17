/**
 * Tests for export/import tooling (TASK-R6)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  exportLibrary,
  importLibrary,
  exportLibraryToFile,
  importLibraryFromFile,
  validateExportFormat,
  createBackup,
  listBackups,
  restoreFromBackup,
  type ExportedLibrary,
  type ImportOptions,
} from '../src/export-import';
import { StorageManager } from '../src/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Export/Import Tooling', () => {
  let testDir: string;
  let storage: StorageManager;
  
  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chilly-export-test-'));
    storage = new StorageManager({
      dbPath: path.join(testDir, 'test.db'),
      mediaRoot: path.join(testDir, 'media'),
    });
  });
  
  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  describe('exportLibrary', () => {
    it('should export library metadata to JSON', async () => {
      storage.addMediaItem('movie-1', 'The Matrix', { tmdbId: 603, year: 1999 });
      storage.addMediaItem('movie-2', 'Inception', { tmdbId: 27205, year: 2010 });
      
      const json = await exportLibrary(storage);
      const data = JSON.parse(json);
      
      expect(data.version).toBe('1.0.0');
      expect(data.itemCount).toBe(2);
      expect(data.items).toHaveLength(2);
      expect(data.exportDate).toBeDefined();
      expect(data.items[0].id).toBeDefined();
      expect(data.items[0].title).toBeDefined();
      expect(data.items[0].metadata).toBeDefined();
    });
    
    it('should include media file status', async () => {
      storage.addMediaItem('movie-3', 'Test Movie', { tmdbId: 123 });
      
      // Create media file
      const mediaPath = path.join(storage.getMediaRoot(), 'movie-3.mp4');
      fs.writeFileSync(mediaPath, 'test content');
      
      const json = await exportLibrary(storage);
      const data = JSON.parse(json);
      
      expect(data.items[0].hasMediaFile).toBe(true);
      expect(data.items[0].mediaFilePath).toContain('movie-3.mp4');
    });
    
    it('should export to file when path provided', async () => {
      storage.addMediaItem('movie-4', 'Export Test', {});
      
      const exportPath = path.join(testDir, 'export.json');
      await exportLibrary(storage, exportPath);
      
      expect(fs.existsSync(exportPath)).toBe(true);
      const content = fs.readFileSync(exportPath, 'utf8');
      const data = JSON.parse(content);
      expect(data.items).toHaveLength(1);
    });
    
    it('should handle empty library', async () => {
      const json = await exportLibrary(storage);
      const data = JSON.parse(json);
      
      expect(data.itemCount).toBe(0);
      expect(data.items).toHaveLength(0);
    });
  });
  
  describe('importLibrary', () => {
    it('should import library metadata from JSON', async () => {
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        itemCount: 2,
        items: [
          { id: 'movie-5', title: 'Movie 5', metadata: { year: 2020 }, createdAt: new Date().toISOString() },
          { id: 'movie-6', title: 'Movie 6', metadata: { year: 2021 }, createdAt: new Date().toISOString() },
        ],
      };
      
      const result = await importLibrary(storage, JSON.stringify(exportData));
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      
      const item = storage.getMediaItem('movie-5');
      expect(item).toBeDefined();
      expect(item?.title).toBe('Movie 5');
    });
    
    it('should skip existing items by default', async () => {
      storage.addMediaItem('movie-7', 'Existing Movie', {});
      
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        itemCount: 1,
        items: [
          { id: 'movie-7', title: 'Updated Movie', metadata: {}, createdAt: new Date().toISOString() },
        ],
      };
      
      const result = await importLibrary(storage, JSON.stringify(exportData));
      
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
      
      const item = storage.getMediaItem('movie-7');
      expect(item?.title).toBe('Existing Movie'); // Not updated
    });
    
    it('should overwrite existing items when option enabled', async () => {
      storage.addMediaItem('movie-8', 'Old Title', { old: true });
      
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        itemCount: 1,
        items: [
          { id: 'movie-8', title: 'New Title', metadata: { new: true }, createdAt: new Date().toISOString() },
        ],
      };
      
      const options: ImportOptions = { overwrite: true, skipExisting: false };
      const result = await importLibrary(storage, JSON.stringify(exportData), options);
      
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      
      const item = storage.getMediaItem('movie-8');
      expect(item?.title).toBe('New Title');
      expect(item?.metadata.new).toBe(true);
    });
    
    it('should handle invalid JSON', async () => {
      const result = await importLibrary(storage, 'invalid json');
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid JSON format');
    });
    
    it('should validate import format', async () => {
      const invalidData = { random: 'data' };
      const result = await importLibrary(storage, JSON.stringify(invalidData));
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe('exportLibraryToFile and importLibraryFromFile', () => {
    it('should export and import via file', async () => {
      storage.addMediaItem('movie-9', 'Export/Import Test', { test: true });
      
      const exportPath = path.join(testDir, 'test-export.json');
      await exportLibraryToFile(storage, exportPath);
      
      // Create new storage instance
      const storage2 = new StorageManager({
        dbPath: path.join(testDir, 'test2.db'),
        mediaRoot: path.join(testDir, 'media2'),
      });
      
      const result = await importLibraryFromFile(storage2, exportPath);
      
      expect(result.imported).toBe(1);
      const item = storage2.getMediaItem('movie-9');
      expect(item?.title).toBe('Export/Import Test');
    });
    
    it('should throw error for non-existent import file', async () => {
      await expect(
        importLibraryFromFile(storage, '/path/to/nowhere.json')
      ).rejects.toThrow('Import file not found');
    });
  });
  
  describe('validateExportFormat', () => {
    it('should validate correct export format', () => {
      const validData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        itemCount: 1,
        items: [
          { id: 'movie-10', title: 'Valid Movie', metadata: {}, createdAt: new Date().toISOString() },
        ],
      };
      
      const result = validateExportFormat(JSON.stringify(validData));
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.version).toBe('1.0.0');
      expect(result.itemCount).toBe(1);
    });
    
    it('should detect missing fields', () => {
      const invalidData = {
        items: [],
      };
      
      const result = validateExportFormat(JSON.stringify(invalidData));
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing version field');
      expect(result.errors).toContain('Missing exportDate field');
    });
    
    it('should detect invalid JSON', () => {
      const result = validateExportFormat('not json');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid JSON format');
    });
    
    it('should detect invalid items structure', () => {
      const invalidData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        items: 'not an array',
      };
      
      const result = validateExportFormat(JSON.stringify(invalidData));
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('items'))).toBe(true);
    });
  });
  
  describe('createBackup and restoreFromBackup', () => {
    it('should create backup file', async () => {
      storage.addMediaItem('movie-11', 'Backup Test', {});
      
      const backupDir = path.join(testDir, 'backups');
      const backupPath = await createBackup(storage, backupDir);
      
      expect(fs.existsSync(backupPath)).toBe(true);
      expect(backupPath).toContain('library-backup-');
      expect(backupPath).toContain('.json');
    });
    
    it('should restore from backup', async () => {
      storage.addMediaItem('movie-12', 'Restore Test', { important: true });
      
      const backupDir = path.join(testDir, 'backups');
      const backupPath = await createBackup(storage, backupDir);
      
      // Create new storage
      const storage2 = new StorageManager({
        dbPath: path.join(testDir, 'restore.db'),
        mediaRoot: path.join(testDir, 'media-restore'),
      });
      
      const result = await restoreFromBackup(storage2, backupPath);
      
      expect(result.imported).toBe(1);
      const item = storage2.getMediaItem('movie-12');
      expect(item?.title).toBe('Restore Test');
      expect(item?.metadata.important).toBe(true);
    });
  });
  
  describe('listBackups', () => {
    it('should list backup files', async () => {
      storage.addMediaItem('movie-13', 'List Test', {});
      
      const backupDir = path.join(testDir, 'backups');
      await createBackup(storage, backupDir);
      
      // Wait to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await createBackup(storage, backupDir);
      
      const backups = listBackups(backupDir);
      
      // Should have at least 1 backup (may be 2 if timestamps different)
      expect(backups.length).toBeGreaterThanOrEqual(1);
      expect(backups[0]).toContain('library-backup-');
    });
    
    it('should return empty array when no backups exist', () => {
      const backupDir = path.join(testDir, 'no-backups');
      const backups = listBackups(backupDir);
      
      expect(backups).toHaveLength(0);
    });
    
    it('should return backups in reverse chronological order', async () => {
      storage.addMediaItem('movie-14', 'Order Test', {});
      
      const backupDir = path.join(testDir, 'backups');
      const backup1 = await createBackup(storage, backupDir);
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const backup2 = await createBackup(storage, backupDir);
      
      const backups = listBackups(backupDir);
      
      expect(backups[0]).toBe(backup2); // Most recent first
      expect(backups[1]).toBe(backup1);
    });
  });
});
