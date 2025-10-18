/**
 * Library Export/Import Tooling (TASK-R6)
 * Provides backup and restore functionality for library metadata
 * Supports JSON export format for portability
 */

import * as fs from 'fs';
import * as path from 'path';
import { StorageManager } from './storage';
import { getLogger } from './logger';

const logger = getLogger();

export interface ExportedLibrary {
  version: string;
  exportDate: string;
  itemCount: number;
  items: ExportedMediaItem[];
}

export interface ExportedMediaItem {
  id: string;
  title: string;
  metadata: any;
  createdAt: string;
  hasMediaFile?: boolean;
  mediaFilePath?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface ImportOptions {
  overwrite?: boolean; // Overwrite existing items
  skipExisting?: boolean; // Skip items that already exist
  validateFiles?: boolean; // Check if media files exist
}

/**
 * Export library metadata to JSON format
 */
export async function exportLibrary(
  storage: StorageManager,
  outputPath?: string
): Promise<string> {
  const allItems = storage.getAllItems();
  const mediaRoot = storage.getMediaRoot();
  
  logger.info('Starting library export', { itemCount: allItems.length });
  
  const exportedItems: ExportedMediaItem[] = allItems.map((item: any) => {
    // Check if media file exists
    const mediaFilePath = findMediaFile(mediaRoot, item.id);
    
    return {
      id: item.id,
      title: item.title,
      metadata: item.metadata || {},
      createdAt: item.createdAt || new Date().toISOString(),
      hasMediaFile: !!mediaFilePath,
      mediaFilePath: mediaFilePath || undefined,
    };
  });
  
  const exportData: ExportedLibrary = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    itemCount: exportedItems.length,
    items: exportedItems,
  };
  
  const jsonContent = JSON.stringify(exportData, null, 2);
  
  // Write to file if path provided
  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, jsonContent, 'utf8');
    logger.info('Library exported to file', { path: outputPath, itemCount: exportedItems.length });
  }
  
  return jsonContent;
}

/**
 * Import library metadata from JSON format
 */
export async function importLibrary(
  storage: StorageManager,
  jsonContent: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const { overwrite = false, skipExisting = true, validateFiles = false } = options;
  
  logger.info('Starting library import', { options });
  
  let importData: ExportedLibrary;
  try {
    importData = JSON.parse(jsonContent);
  } catch (error) {
    logger.error('Failed to parse import JSON', error instanceof Error ? error : undefined);
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['Invalid JSON format'],
    };
  }
  
  // Validate import format
  if (!importData.version || !importData.items || !Array.isArray(importData.items)) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['Invalid export format: missing required fields'],
    };
  }
  
  const result: ImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
  };
  
  const mediaRoot = storage.getMediaRoot();
  
  for (const item of importData.items) {
    try {
      // Check if item already exists
      const existing = storage.getMediaItem(item.id);
      
      if (existing) {
        if (skipExisting && !overwrite) {
          result.skipped++;
          logger.debug('Skipping existing item', { id: item.id });
          continue;
        }
        
        if (!overwrite) {
          result.errors.push(`Item ${item.id} already exists (use overwrite option)`);
          result.skipped++;
          continue;
        }
      }
      
      // Validate media file if requested
      if (validateFiles && item.hasMediaFile) {
        const mediaFilePath = findMediaFile(mediaRoot, item.id);
        if (!mediaFilePath) {
          result.errors.push(`Media file not found for item ${item.id}`);
          result.skipped++;
          continue;
        }
      }
      
      // Import the item
      storage.addMediaItem(item.id, item.title, item.metadata);
      result.imported++;
      logger.debug('Imported item', { id: item.id, title: item.title });
      
    } catch (error) {
      const errorMsg = `Failed to import item ${item.id}: ${error}`;
      result.errors.push(errorMsg);
      logger.error('Import error', error instanceof Error ? error : undefined, { itemId: item.id });
    }
  }
  
  logger.info('Library import completed', {
    imported: result.imported,
    skipped: result.skipped,
    errors: result.errors.length,
  });
  
  return result;
}

/**
 * Export library to file
 */
export async function exportLibraryToFile(
  storage: StorageManager,
  filePath: string
): Promise<void> {
  await exportLibrary(storage, filePath);
}

/**
 * Import library from file
 */
export async function importLibraryFromFile(
  storage: StorageManager,
  filePath: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  if (!fs.existsSync(filePath)) {
    logger.error('Import file not found', undefined, { filePath });
    throw new Error(`Import file not found: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  return importLibrary(storage, content, options);
}

/**
 * Find media file for a given media ID
 */
function findMediaFile(mediaRoot: string, mediaId: string): string | null {
  const extensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];
  
  for (const ext of extensions) {
    const filePath = path.join(mediaRoot, `${mediaId}${ext}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  return null;
}

/**
 * Validate export file format
 */
export function validateExportFormat(jsonContent: string): {
  valid: boolean;
  errors: string[];
  version?: string;
  itemCount?: number;
} {
  try {
    const data = JSON.parse(jsonContent);
    const errors: string[] = [];
    
    if (!data.version) {
      errors.push('Missing version field');
    }
    
    if (!data.exportDate) {
      errors.push('Missing exportDate field');
    }
    
    if (!data.items || !Array.isArray(data.items)) {
      errors.push('Missing or invalid items array');
    } else {
      // Validate item structure
      for (let i = 0; i < Math.min(data.items.length, 5); i++) {
        const item = data.items[i];
        if (!item.id) {
          errors.push(`Item at index ${i} missing id field`);
        }
        if (!item.title) {
          errors.push(`Item at index ${i} missing title field`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      version: data.version,
      itemCount: data.itemCount,
    };
  } catch (error) {
    return {
      valid: false,
      errors: ['Invalid JSON format'],
    };
  }
}

/**
 * Create a backup of the current library
 */
export async function createBackup(
  storage: StorageManager,
  backupDir?: string
): Promise<string> {
  const dir = backupDir || path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `library-backup-${timestamp}.json`;
  const filePath = path.join(dir, filename);
  
  await exportLibraryToFile(storage, filePath);
  
  logger.info('Backup created', { filePath });
  return filePath;
}

/**
 * List available backups
 */
export function listBackups(backupDir?: string): string[] {
  const dir = backupDir || path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  const files = fs.readdirSync(dir);
  return files
    .filter(f => f.startsWith('library-backup-') && f.endsWith('.json'))
    .map(f => path.join(dir, f))
    .sort()
    .reverse(); // Most recent first
}

/**
 * Restore from backup
 */
export async function restoreFromBackup(
  storage: StorageManager,
  backupPath: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  logger.info('Restoring from backup', { backupPath });
  return importLibraryFromFile(storage, backupPath, options);
}
