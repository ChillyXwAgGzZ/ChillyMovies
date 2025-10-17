/**
 * Subtitle Management (TASK-I4)
 * Handles subtitle file detection, loading, parsing, and synchronization
 * Supports SRT and VTT formats
 */

import * as fs from 'fs';
import * as path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

export interface SubtitleCue {
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  format: 'srt' | 'vtt';
  filePath: string;
  cues: SubtitleCue[];
}

export interface SubtitleSearchResult {
  mediaId: string;
  tracks: SubtitleTrack[];
}

/**
 * Parse SRT timestamp to seconds
 * Format: 00:00:20,000 --> 00:00:24,400
 */
function parseSRTTimestamp(timestamp: string): number {
  const [hours, minutes, secondsMs] = timestamp.trim().split(':');
  const [seconds, milliseconds] = secondsMs.split(',');
  
  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(seconds) +
    parseInt(milliseconds) / 1000
  );
}

/**
 * Parse VTT timestamp to seconds
 * Format: 00:00:20.000 --> 00:00:24.400
 */
function parseVTTTimestamp(timestamp: string): number {
  const parts = timestamp.trim().split(':');
  let hours = 0;
  let minutes = 0;
  let secondsMs = '';
  
  if (parts.length === 3) {
    // HH:MM:SS.mmm
    [hours, minutes, secondsMs] = parts.map((p, i) => i < 2 ? parseInt(p) : p);
  } else if (parts.length === 2) {
    // MM:SS.mmm
    [minutes, secondsMs] = parts.map((p, i) => i < 1 ? parseInt(p) : p);
  } else {
    secondsMs = parts[0];
  }
  
  const [seconds, milliseconds] = secondsMs.toString().split('.');
  
  return (
    (typeof hours === 'number' ? hours : 0) * 3600 +
    (typeof minutes === 'number' ? minutes : 0) * 60 +
    parseInt(seconds) +
    (milliseconds ? parseInt(milliseconds) / 1000 : 0)
  );
}

/**
 * Parse SRT subtitle file
 */
export function parseSRT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = content.trim().split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    
    // Line 1: sequence number (we ignore this)
    // Line 2: timestamp
    // Line 3+: text
    
    const timeLine = lines[1];
    const match = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    
    if (match) {
      const start = parseSRTTimestamp(match[1]);
      const end = parseSRTTimestamp(match[2]);
      const text = lines.slice(2).join('\n').trim();
      
      cues.push({ start, end, text });
    }
  }
  
  logger.info('Parsed SRT subtitle file', { cueCount: cues.length });
  return cues;
}

/**
 * Parse VTT subtitle file
 */
export function parseVTT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  
  // Remove WEBVTT header and any metadata
  let vttContent = content.replace(/^WEBVTT.*?\n\n/s, '');
  
  // Remove cue settings (e.g., "align:start position:0%")
  vttContent = vttContent.replace(/\s+(align|position|size|line):[^\s]+/g, '');
  
  const blocks = vttContent.trim().split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;
    
    // Find the timestamp line (may or may not have a cue identifier before it)
    let timeLineIndex = 0;
    if (!lines[0].includes('-->')) {
      timeLineIndex = 1;
    }
    
    const timeLine = lines[timeLineIndex];
    const match = timeLine.match(/(\d{1,2}:?(?:\d{2}:)?\d{2}\.\d{3})\s*-->\s*(\d{1,2}:?(?:\d{2}:)?\d{2}\.\d{3})/);
    
    if (match) {
      const start = parseVTTTimestamp(match[1]);
      const end = parseVTTTimestamp(match[2]);
      const text = lines.slice(timeLineIndex + 1).join('\n').trim();
      
      cues.push({ start, end, text });
    }
  }
  
  logger.info('Parsed VTT subtitle file', { cueCount: cues.length });
  return cues;
}

/**
 * Load and parse subtitle file
 */
export async function loadSubtitleFile(filePath: string): Promise<SubtitleCue[]> {
  if (!fs.existsSync(filePath)) {
    logger.error('Subtitle file not found', { filePath });
    throw new Error(`Subtitle file not found: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.srt') {
    return parseSRT(content);
  } else if (ext === '.vtt') {
    return parseVTT(content);
  } else {
    logger.error('Unsupported subtitle format', { filePath, ext });
    throw new Error(`Unsupported subtitle format: ${ext}`);
  }
}

/**
 * Detect subtitle files for a media item
 * Looks for files with same name as media file but with .srt or .vtt extension
 */
export function detectSubtitleFiles(mediaRoot: string, mediaId: string): string[] {
  const subtitleFiles: string[] = [];
  
  // Check all files in media root
  if (fs.existsSync(mediaRoot)) {
    const files = fs.readdirSync(mediaRoot);
    for (const file of files) {
      if (file.startsWith(mediaId) && (file.endsWith('.srt') || file.endsWith('.vtt'))) {
        subtitleFiles.push(path.join(mediaRoot, file));
      }
    }
  }
  
  // Also check for subtitle files in a subdirectory
  const subtitleDir = path.join(mediaRoot, 'subtitles');
  if (fs.existsSync(subtitleDir)) {
    const files = fs.readdirSync(subtitleDir);
    for (const file of files) {
      if (file.startsWith(mediaId) && (file.endsWith('.srt') || file.endsWith('.vtt'))) {
        subtitleFiles.push(path.join(subtitleDir, file));
      }
    }
  }
  
  logger.info('Detected subtitle files', { mediaId, count: subtitleFiles.length });
  return subtitleFiles;
}

/**
 * Extract language code from subtitle filename
 * Examples: movie.en.srt -> en, movie.eng.vtt -> eng
 */
export function extractLanguageFromFilename(filename: string): string {
  const basename = path.basename(filename, path.extname(filename));
  const parts = basename.split('.');
  
  // Look for language code (2-3 characters)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part.length >= 2 && part.length <= 3 && /^[a-z]+$/i.test(part)) {
      return part.toLowerCase();
    }
  }
  
  return 'unknown';
}

/**
 * Load all subtitle tracks for a media item
 */
export async function loadSubtitlesForMedia(
  mediaRoot: string, 
  mediaId: string
): Promise<SubtitleTrack[]> {
  const tracks: SubtitleTrack[] = [];
  const files = detectSubtitleFiles(mediaRoot, mediaId);
  
  for (const filePath of files) {
    try {
      const cues = await loadSubtitleFile(filePath);
      const language = extractLanguageFromFilename(filePath);
      const format = path.extname(filePath).toLowerCase().slice(1) as 'srt' | 'vtt';
      
      tracks.push({
        id: `${mediaId}-${language}-${format}`,
        language,
        label: `${language.toUpperCase()} (${format.toUpperCase()})`,
        format,
        filePath,
        cues,
      });
    } catch (err) {
      logger.error('Failed to load subtitle file', err instanceof Error ? err : undefined, { filePath });
    }
  }
  
  logger.info('Loaded subtitle tracks', { mediaId, trackCount: tracks.length });
  return tracks;
}

/**
 * Find active cue at a given time
 */
export function getActiveCue(cues: SubtitleCue[], currentTime: number): SubtitleCue | null {
  for (const cue of cues) {
    if (currentTime >= cue.start && currentTime <= cue.end) {
      return cue;
    }
  }
  return null;
}

/**
 * Convert SRT to VTT format
 */
export function convertSRTtoVTT(srtContent: string): string {
  const cues = parseSRT(srtContent);
  
  let vtt = 'WEBVTT\n\n';
  
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const start = formatVTTTime(cue.start);
    const end = formatVTTTime(cue.end);
    
    vtt += `${i + 1}\n`;
    vtt += `${start} --> ${end}\n`;
    vtt += `${cue.text}\n\n`;
  }
  
  return vtt;
}

/**
 * Format time in VTT format (HH:MM:SS.mmm)
 */
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
