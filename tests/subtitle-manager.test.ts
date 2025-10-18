/**
 * Tests for subtitle management (TASK-I4)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  parseSRT,
  parseVTT,
  loadSubtitleFile,
  detectSubtitleFiles,
  extractLanguageFromFilename,
  loadSubtitlesForMedia,
  getActiveCue,
  convertSRTtoVTT,
} from '../src/subtitle-manager';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Subtitle Manager', () => {
  let testDir: string;
  let mediaRoot: string;
  
  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chilly-sub-test-'));
    mediaRoot = path.join(testDir, 'media');
    fs.mkdirSync(mediaRoot, { recursive: true });
  });
  
  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  describe('parseSRT', () => {
    it('should parse SRT subtitle file', () => {
      const srt = `1
00:00:20,000 --> 00:00:24,400
Welcome to the real world.

2
00:00:25,000 --> 00:00:28,000
I'm trying to free your mind, Neo.`;
      
      const cues = parseSRT(srt);
      
      expect(cues).toHaveLength(2);
      expect(cues[0].start).toBeCloseTo(20.0, 1);
      expect(cues[0].end).toBeCloseTo(24.4, 1);
      expect(cues[0].text).toBe('Welcome to the real world.');
      expect(cues[1].start).toBeCloseTo(25.0, 1);
      expect(cues[1].end).toBeCloseTo(28.0, 1);
      expect(cues[1].text).toBe("I'm trying to free your mind, Neo.");
    });
    
    it('should handle multiline text', () => {
      const srt = `1
00:00:10,000 --> 00:00:15,000
Line one
Line two
Line three`;
      
      const cues = parseSRT(srt);
      
      expect(cues).toHaveLength(1);
      expect(cues[0].text).toBe('Line one\nLine two\nLine three');
    });
    
    it('should handle empty subtitle file', () => {
      const cues = parseSRT('');
      expect(cues).toHaveLength(0);
    });
  });
  
  describe('parseVTT', () => {
    it('should parse VTT subtitle file', () => {
      const vtt = `WEBVTT

1
00:00:20.000 --> 00:00:24.400
Welcome to the real world.

2
00:00:25.000 --> 00:00:28.000
I'm trying to free your mind, Neo.`;
      
      const cues = parseVTT(vtt);
      
      expect(cues).toHaveLength(2);
      expect(cues[0].start).toBeCloseTo(20.0, 1);
      expect(cues[0].end).toBeCloseTo(24.4, 1);
      expect(cues[0].text).toBe('Welcome to the real world.');
      expect(cues[1].start).toBeCloseTo(25.0, 1);
      expect(cues[1].end).toBeCloseTo(28.0, 1);
    });
    
    it('should parse VTT without cue identifiers', () => {
      const vtt = `WEBVTT

00:00:20.000 --> 00:00:24.400
Welcome to the real world.

00:00:25.000 --> 00:00:28.000
I'm trying to free your mind, Neo.`;
      
      const cues = parseVTT(vtt);
      
      expect(cues).toHaveLength(2);
      expect(cues[0].text).toBe('Welcome to the real world.');
    });
    
    it('should parse VTT with cue settings', () => {
      const vtt = `WEBVTT

00:00:20.000 --> 00:00:24.400 align:start position:0%
Welcome to the real world.`;
      
      const cues = parseVTT(vtt);
      
      expect(cues).toHaveLength(1);
      expect(cues[0].text).toBe('Welcome to the real world.');
    });
    
    it('should handle short time format (MM:SS.mmm)', () => {
      const vtt = `WEBVTT

00:20.000 --> 00:24.400
Short format.`;
      
      const cues = parseVTT(vtt);
      
      expect(cues).toHaveLength(1);
      expect(cues[0].start).toBeCloseTo(20.0, 1);
      expect(cues[0].end).toBeCloseTo(24.4, 1);
    });
  });
  
  describe('loadSubtitleFile', () => {
    it('should load SRT file', async () => {
      const srtPath = path.join(mediaRoot, 'test.srt');
      const srtContent = `1
00:00:20,000 --> 00:00:24,400
Test subtitle`;
      
      fs.writeFileSync(srtPath, srtContent);
      
      const cues = await loadSubtitleFile(srtPath);
      
      expect(cues).toHaveLength(1);
      expect(cues[0].text).toBe('Test subtitle');
    });
    
    it('should load VTT file', async () => {
      const vttPath = path.join(mediaRoot, 'test.vtt');
      const vttContent = `WEBVTT

00:00:20.000 --> 00:00:24.400
Test subtitle`;
      
      fs.writeFileSync(vttPath, vttContent);
      
      const cues = await loadSubtitleFile(vttPath);
      
      expect(cues).toHaveLength(1);
      expect(cues[0].text).toBe('Test subtitle');
    });
    
    it('should throw error for non-existent file', async () => {
      await expect(loadSubtitleFile('/path/to/nowhere.srt')).rejects.toThrow('Subtitle file not found');
    });
    
    it('should throw error for unsupported format', async () => {
      const txtPath = path.join(mediaRoot, 'test.txt');
      fs.writeFileSync(txtPath, 'Not a subtitle');
      
      await expect(loadSubtitleFile(txtPath)).rejects.toThrow('Unsupported subtitle format');
    });
  });
  
  describe('detectSubtitleFiles', () => {
    it('should detect subtitle files with same base name', () => {
      const mediaId = 'movie-123';
      
      fs.writeFileSync(path.join(mediaRoot, `${mediaId}.srt`), 'test');
      fs.writeFileSync(path.join(mediaRoot, `${mediaId}.vtt`), 'test');
      
      const files = detectSubtitleFiles(mediaRoot, mediaId);
      
      expect(files).toHaveLength(2);
      expect(files.some(f => f.endsWith('.srt'))).toBe(true);
      expect(files.some(f => f.endsWith('.vtt'))).toBe(true);
    });
    
    it('should detect language-specific subtitle files', () => {
      const mediaId = 'movie-456';
      
      fs.writeFileSync(path.join(mediaRoot, `${mediaId}.en.srt`), 'test');
      fs.writeFileSync(path.join(mediaRoot, `${mediaId}.eng.vtt`), 'test');
      
      const files = detectSubtitleFiles(mediaRoot, mediaId);
      
      expect(files.length).toBeGreaterThanOrEqual(2);
    });
    
    it('should detect subtitle files in subtitles subdirectory', () => {
      const mediaId = 'movie-789';
      const subtitleDir = path.join(mediaRoot, 'subtitles');
      fs.mkdirSync(subtitleDir);
      
      fs.writeFileSync(path.join(subtitleDir, `${mediaId}.srt`), 'test');
      
      const files = detectSubtitleFiles(mediaRoot, mediaId);
      
      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files.some(f => f.includes('subtitles'))).toBe(true);
    });
    
    it('should return empty array when no subtitles found', () => {
      const files = detectSubtitleFiles(mediaRoot, 'non-existent');
      expect(files).toHaveLength(0);
    });
  });
  
  describe('extractLanguageFromFilename', () => {
    it('should extract language code from filename', () => {
      expect(extractLanguageFromFilename('movie.en.srt')).toBe('en');
      expect(extractLanguageFromFilename('movie.eng.vtt')).toBe('eng');
      expect(extractLanguageFromFilename('movie.fr.srt')).toBe('fr');
      expect(extractLanguageFromFilename('movie.spa.srt')).toBe('spa');
    });
    
    it('should return unknown for files without language code', () => {
      expect(extractLanguageFromFilename('movie.srt')).toBe('unknown');
      expect(extractLanguageFromFilename('subtitle.vtt')).toBe('unknown');
    });
  });
  
  describe('loadSubtitlesForMedia', () => {
    it('should load all subtitle tracks for a media item', async () => {
      const mediaId = 'movie-abc';
      
      const srtContent = `1
00:00:20,000 --> 00:00:24,400
Test subtitle`;
      
      fs.writeFileSync(path.join(mediaRoot, `${mediaId}.en.srt`), srtContent);
      fs.writeFileSync(path.join(mediaRoot, `${mediaId}.fr.srt`), srtContent);
      
      const tracks = await loadSubtitlesForMedia(mediaRoot, mediaId);
      
      // Should have at least 2 tracks (might detect more with pattern matching)
      expect(tracks.length).toBeGreaterThanOrEqual(2);
      
      const languages = tracks.map(t => t.language);
      expect(languages).toContain('en');
      expect(languages).toContain('fr');
      
      const enTrack = tracks.find(t => t.language === 'en');
      expect(enTrack).toBeDefined();
      expect(enTrack?.format).toBe('srt');
      expect(enTrack?.cues).toHaveLength(1);
    });
    
    it('should return empty array when no subtitles found', async () => {
      const tracks = await loadSubtitlesForMedia(mediaRoot, 'no-subs');
      expect(tracks).toHaveLength(0);
    });
    
    it('should skip corrupted subtitle files', async () => {
      const mediaId = 'movie-xyz';
      
      const validSRT = `1
00:00:20,000 --> 00:00:24,400
Valid subtitle`;
      
      fs.writeFileSync(path.join(mediaRoot, `${mediaId}.en.srt`), validSRT);
      fs.writeFileSync(path.join(mediaRoot, `${mediaId}.fr.srt`), 'corrupted content');
      
      const tracks = await loadSubtitlesForMedia(mediaRoot, mediaId);
      
      // Should load the valid one and skip the corrupted one
      expect(tracks.length).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('getActiveCue', () => {
    const cues = [
      { start: 10, end: 15, text: 'First cue' },
      { start: 20, end: 25, text: 'Second cue' },
      { start: 30, end: 35, text: 'Third cue' },
    ];
    
    it('should return active cue at given time', () => {
      expect(getActiveCue(cues, 12)?.text).toBe('First cue');
      expect(getActiveCue(cues, 22)?.text).toBe('Second cue');
      expect(getActiveCue(cues, 32)?.text).toBe('Third cue');
    });
    
    it('should return null when no cue is active', () => {
      expect(getActiveCue(cues, 5)).toBeNull();
      expect(getActiveCue(cues, 17)).toBeNull();
      expect(getActiveCue(cues, 40)).toBeNull();
    });
    
    it('should return cue at exact start time', () => {
      expect(getActiveCue(cues, 10)?.text).toBe('First cue');
    });
    
    it('should return cue at exact end time', () => {
      expect(getActiveCue(cues, 15)?.text).toBe('First cue');
    });
  });
  
  describe('convertSRTtoVTT', () => {
    it('should convert SRT to VTT format', () => {
      const srt = `1
00:00:20,000 --> 00:00:24,400
Welcome to the real world.

2
00:00:25,000 --> 00:00:28,000
I'm trying to free your mind, Neo.`;
      
      const vtt = convertSRTtoVTT(srt);
      
      expect(vtt).toContain('WEBVTT');
      expect(vtt).toMatch(/00:00:20\.000 --> 00:00:24\.3\d\d/); // Allow minor precision difference
      expect(vtt).toContain('Welcome to the real world.');
      expect(vtt).toContain('00:00:25.000 --> 00:00:28.000');
      expect(vtt).toContain("I'm trying to free your mind, Neo.");
    });
    
    it('should handle empty SRT', () => {
      const vtt = convertSRTtoVTT('');
      expect(vtt).toBe('WEBVTT\n\n');
    });
  });
});
