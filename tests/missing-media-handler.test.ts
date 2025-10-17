/**
 * Tests for missing media handler (TASK-I6)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  validateMediaFile, 
  getMediaFilePath, 
  scanForMissingMedia,
  relinkMediaFile,
  validateLibraryOnStartup,
  exportMissingMediaReport,
  type MissingMediaInfo,
} from '../src/missing-media-handler';
import { StorageManager } from '../src/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Missing Media Handler', () => {
  let testDir: string;
  let mediaRoot: string;
  let storage: StorageManager;
  
  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chilly-test-'));
    mediaRoot = path.join(testDir, 'media');
    fs.mkdirSync(mediaRoot, { recursive: true });
    
    storage = new StorageManager({
      dbPath: path.join(testDir, 'test.db'),
      mediaRoot,
    });
  });
  
  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  describe('validateMediaFile', () => {
    it('should return true when media file exists', () => {
      const id = 'test-movie-1';
      const filePath = path.join(mediaRoot, `${id}.mp4`);
      fs.writeFileSync(filePath, 'test content');
      
      const result = validateMediaFile(mediaRoot, id);
      expect(result).toBe(true);
    });
    
    it('should return false when media file does not exist', () => {
      const id = 'non-existent';
      const result = validateMediaFile(mediaRoot, id);
      expect(result).toBe(false);
    });
    
    it('should detect files with different extensions', () => {
      const id = 'test-movie-2';
      const filePath = path.join(mediaRoot, `${id}.mkv`);
      fs.writeFileSync(filePath, 'test content');
      
      const result = validateMediaFile(mediaRoot, id);
      expect(result).toBe(true);
    });
    
    it('should detect partial files', () => {
      const id = 'test-movie-3';
      const filePath = path.join(mediaRoot, `${id}.mp4.partial`);
      fs.writeFileSync(filePath, 'test content');
      
      const result = validateMediaFile(mediaRoot, id);
      expect(result).toBe(true);
    });
  });
  
  describe('getMediaFilePath', () => {
    it('should return correct path for existing file', () => {
      const id = 'test-movie-4';
      const filePath = path.join(mediaRoot, `${id}.mp4`);
      fs.writeFileSync(filePath, 'test content');
      
      const result = getMediaFilePath(mediaRoot, id);
      expect(result).toBe(filePath);
    });
    
    it('should return null for non-existent file', () => {
      const id = 'non-existent';
      const result = getMediaFilePath(mediaRoot, id);
      expect(result).toBeNull();
    });
    
    it('should find file with any supported extension', () => {
      const id = 'test-movie-5';
      const filePath = path.join(mediaRoot, `${id}.mkv`);
      fs.writeFileSync(filePath, 'test content');
      
      const result = getMediaFilePath(mediaRoot, id);
      expect(result).toBe(filePath);
    });
  });
  
  describe('scanForMissingMedia', () => {
    it('should find missing media files', async () => {
      // Add items to storage but don't create files
      storage.addMediaItem('movie-1', 'The Matrix', { tmdbId: 603 });
      storage.addMediaItem('movie-2', 'Inception', { tmdbId: 27205 });
      
      const missing = await scanForMissingMedia(storage);
      
      expect(missing).toHaveLength(2);
      expect(missing[0].id).toBe('movie-1');
      expect(missing[0].title).toBe('The Matrix');
      expect(missing[1].id).toBe('movie-2');
      expect(missing[1].title).toBe('Inception');
    });
    
    it('should return empty array when all files exist', async () => {
      storage.addMediaItem('movie-3', 'Interstellar', { tmdbId: 157336 });
      
      // Create the file
      const filePath = path.join(mediaRoot, 'movie-3.mp4');
      fs.writeFileSync(filePath, 'test content');
      
      const missing = await scanForMissingMedia(storage);
      
      expect(missing).toHaveLength(0);
    });
    
    it('should include metadata in missing items', async () => {
      const metadata = { tmdbId: 603, genre: 'sci-fi', year: 1999 };
      storage.addMediaItem('movie-4', 'The Matrix', metadata);
      
      const missing = await scanForMissingMedia(storage);
      
      expect(missing).toHaveLength(1);
      expect(missing[0].metadata).toEqual(metadata);
    });
  });
  
  describe('relinkMediaFile', () => {
    it('should relink media file from new path', async () => {
      const id = 'movie-5';
      storage.addMediaItem(id, 'Test Movie', {});
      
      // Create source file in a different location
      const sourcePath = path.join(testDir, 'source.mp4');
      fs.writeFileSync(sourcePath, 'test video content');
      
      const result = await relinkMediaFile(storage, id, sourcePath);
      
      expect(result).toBe(true);
      
      // Verify file was copied to media root
      const targetPath = path.join(mediaRoot, `${id}.mp4`);
      expect(fs.existsSync(targetPath)).toBe(true);
      expect(fs.readFileSync(targetPath, 'utf8')).toBe('test video content');
    });
    
    it('should reject non-existent source file', async () => {
      const id = 'movie-6';
      storage.addMediaItem(id, 'Test Movie', {});
      
      const result = await relinkMediaFile(storage, id, '/path/to/nowhere.mp4');
      
      expect(result).toBe(false);
    });
    
    it('should reject invalid file extensions', async () => {
      const id = 'movie-7';
      storage.addMediaItem(id, 'Test Movie', {});
      
      // Create a non-video file
      const sourcePath = path.join(testDir, 'document.txt');
      fs.writeFileSync(sourcePath, 'not a video');
      
      const result = await relinkMediaFile(storage, id, sourcePath);
      
      expect(result).toBe(false);
    });
    
    it('should preserve file extension when relinking', async () => {
      const id = 'movie-8';
      storage.addMediaItem(id, 'Test Movie', {});
      
      const sourcePath = path.join(testDir, 'source.mkv');
      fs.writeFileSync(sourcePath, 'test video content');
      
      const result = await relinkMediaFile(storage, id, sourcePath);
      
      expect(result).toBe(true);
      
      const targetPath = path.join(mediaRoot, `${id}.mkv`);
      expect(fs.existsSync(targetPath)).toBe(true);
    });
  });
  
  describe('validateLibraryOnStartup', () => {
    it('should validate all library items', async () => {
      storage.addMediaItem('movie-9', 'Movie with File', {});
      storage.addMediaItem('movie-10', 'Missing Movie', {});
      
      // Create file for only one movie
      fs.writeFileSync(path.join(mediaRoot, 'movie-9.mp4'), 'content');
      
      const results = await validateLibraryOnStartup(storage);
      
      expect(results).toHaveLength(2);
      
      const validItem = results.find(r => r.id === 'movie-9');
      expect(validItem?.exists).toBe(true);
      expect(validItem?.actualPath).toBeDefined();
      
      const missingItem = results.find(r => r.id === 'movie-10');
      expect(missingItem?.exists).toBe(false);
      expect(missingItem?.actualPath).toBeUndefined();
    });
    
    it('should return empty array for empty library', async () => {
      const results = await validateLibraryOnStartup(storage);
      expect(results).toHaveLength(0);
    });
  });
  
  describe('exportMissingMediaReport', () => {
    it('should generate JSON report of missing media', () => {
      const missing: MissingMediaInfo[] = [
        { id: 'm1', title: 'Movie 1', expectedPath: '/media/m1.mp4', metadata: {} },
        { id: 'm2', title: 'Movie 2', expectedPath: '/media/m2.mp4', metadata: {} },
      ];
      
      const report = exportMissingMediaReport(missing);
      
      const parsed = JSON.parse(report);
      expect(parsed.missingCount).toBe(2);
      expect(parsed.items).toHaveLength(2);
      expect(parsed.items[0].id).toBe('m1');
      expect(parsed.items[0].title).toBe('Movie 1');
      expect(parsed.generated).toBeDefined();
    });
    
    it('should handle empty missing array', () => {
      const report = exportMissingMediaReport([]);
      
      const parsed = JSON.parse(report);
      expect(parsed.missingCount).toBe(0);
      expect(parsed.items).toHaveLength(0);
    });
  });
});
