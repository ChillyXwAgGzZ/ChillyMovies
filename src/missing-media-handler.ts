/**
 * Missing Media Handler (TASK-I6)
 * Detects when media files are missing (moved/deleted) and provides
 * re-link (file picker) or re-download options.
 */

import * as fs from 'fs';
import * as path from 'path';
import { StorageManager } from './storage';
import { getLogger } from './logger';

const logger = getLogger();

export interface MediaValidationResult {
  id: string;
  title: string;
  expectedPath: string;
  exists: boolean;
  actualPath?: string; // If re-linked
}

export interface MissingMediaInfo {
  id: string;
  title: string;
  expectedPath: string;
  metadata: any;
}

/**
 * Checks if a media file exists at the expected location
 */
export function validateMediaFile(mediaRoot: string, id: string): boolean {
  const expectedPath = path.join(mediaRoot, `${id}.mp4`); // Default extension
  
  // Check for common video extensions
  const extensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.mp4.partial'];
  for (const ext of extensions) {
    const testPath = path.join(mediaRoot, `${id}${ext}`);
    if (fs.existsSync(testPath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get the actual path of a media file if it exists
 */
export function getMediaFilePath(mediaRoot: string, id: string): string | null {
  const extensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];
  
  for (const ext of extensions) {
    const testPath = path.join(mediaRoot, `${id}${ext}`);
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }
  
  return null;
}

/**
 * Scan library for missing media files
 * Returns list of media items that have missing files
 */
export async function scanForMissingMedia(storage: StorageManager): Promise<MissingMediaInfo[]> {
  const missing: MissingMediaInfo[] = [];
  const allItems = storage.getAllItems();
  const mediaRoot = storage.getMediaRoot();
  
  logger.info('Scanning library for missing media files', { itemCount: allItems.length });
  
  for (const item of allItems) {
    const id = item.id;
    const title = item.title;
    
    if (!validateMediaFile(mediaRoot, id)) {
      const expectedPath = path.join(mediaRoot, `${id}.mp4`);
      missing.push({
        id,
        title,
        expectedPath,
        metadata: item.metadata,
      });
      
      logger.warn('Missing media file detected', { id, title, expectedPath });
    }
  }
  
  logger.info('Scan complete', { missingCount: missing.length });
  return missing;
}

/**
 * Re-link a media item to a new file path
 * Updates the internal tracking (if we add path tracking to storage)
 */
export async function relinkMediaFile(
  storage: StorageManager, 
  id: string, 
  newFilePath: string
): Promise<boolean> {
  // Validate the new file exists
  if (!fs.existsSync(newFilePath)) {
    logger.error('Cannot relink: new file path does not exist', { id, newFilePath });
    return false;
  }
  
  // Validate it's a video file (basic check)
  const ext = path.extname(newFilePath).toLowerCase();
  const validExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];
  if (!validExtensions.includes(ext)) {
    logger.error('Cannot relink: invalid video file extension', { id, ext });
    return false;
  }
  
  // Copy or move the file to the media root
  const mediaRoot = storage.getMediaRoot();
  const targetPath = path.join(mediaRoot, `${id}${ext}`);
  
  try {
    // Copy the file (don't delete original for safety)
    fs.copyFileSync(newFilePath, targetPath);
    logger.info('Media file relinked successfully', { id, oldPath: newFilePath, newPath: targetPath });
    return true;
  } catch (error) {
    logger.error('Failed to relink media file', { id, error });
    return false;
  }
}

/**
 * Validate library on startup
 * Returns validation results for all items
 */
export async function validateLibraryOnStartup(storage: StorageManager): Promise<MediaValidationResult[]> {
  const results: MediaValidationResult[] = [];
  const allItems = storage.getAllItems();
  const mediaRoot = storage.getMediaRoot();
  
  logger.info('Validating library on startup', { itemCount: allItems.length });
  
  for (const item of allItems) {
    const id = item.id;
    const title = item.title;
    const expectedPath = path.join(mediaRoot, `${id}.mp4`);
    const exists = validateMediaFile(mediaRoot, id);
    const actualPath = exists ? getMediaFilePath(mediaRoot, id) || undefined : undefined;
    
    results.push({
      id,
      title,
      expectedPath,
      exists,
      actualPath,
    });
  }
  
  const missingCount = results.filter(r => !r.exists).length;
  logger.info('Library validation complete', { 
    total: results.length, 
    missing: missingCount, 
    valid: results.length - missingCount 
  });
  
  return results;
}

/**
 * Export missing media report (for user to review)
 */
export function exportMissingMediaReport(missing: MissingMediaInfo[]): string {
  const report = {
    generated: new Date().toISOString(),
    missingCount: missing.length,
    items: missing.map(m => ({
      id: m.id,
      title: m.title,
      expectedPath: m.expectedPath,
    })),
  };
  
  return JSON.stringify(report, null, 2);
}
