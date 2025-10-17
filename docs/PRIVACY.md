# Privacy Policy & Telemetry

**Last Updated**: 2025-10-16

## Overview

Chilly Movies is designed with privacy as a core principle. This document explains what data we collect, how we use it, and your rights.

## Data Collection

### Local Data Only (Always)

The following data is stored locally on your device and **never** sent to external servers:

- **Library Metadata**: Movie and TV show information from TMDB (titles, posters, descriptions, ratings)
- **Download History**: Records of your downloads, including source URLs and file paths
- **User Preferences**: Settings like language, storage location, bandwidth limits, and theme
- **Resume Data**: Incomplete download states for resuming after app restart
- **Logs**: Structured logs of app events, errors, and diagnostics (stored in `logs/` directory)

All local data is stored in:
- SQLite database: `chilly.db` (or `chilly.db.json` fallback)
- Media files: User-configured storage location (default: system Downloads folder)
- Logs: `logs/` directory with daily rotation (7-day retention by default)

### Optional Telemetry (Opt-In Only)

Telemetry is **disabled by default** and requires explicit user consent through the Settings UI.

#### What We Collect (When Enabled)

When you enable telemetry, we collect minimal, pseudonymous usage data to help improve the app:

- **Session Information**:
  - Random session ID (generated each time the app starts)
  - App version
  - Platform (Windows, macOS, Linux)
  - Timestamp of events

- **Usage Events**:
  - Features used (e.g., "search", "download", "playback")
  - Download statistics (number of downloads, completion rate)
  - Error events (type of error, not personal details)
  - Performance metrics (load times, memory usage)

#### What We DON'T Collect

We **never** collect:
- Personal information (name, email, phone, address)
- Authentication credentials (passwords, API keys, tokens)
- File paths that could reveal your identity
- Content you download or watch
- IP addresses or precise location data
- Device identifiers (MAC address, serial numbers)

#### PII Sanitization

All telemetry data passes through automatic PII (Personally Identifiable Information) sanitization:
- Email addresses → `[REDACTED]`
- Usernames → `[REDACTED]`
- Passwords/tokens/keys → `[REDACTED]`
- File paths with user directories → `[PATH_REDACTED]`

This sanitization happens **before** any data leaves your device.

## Your Rights

### Access Your Data

All locally stored data is accessible on your device:
- Database: `chilly.db` or `chilly.db.json` (can be opened with SQLite tools or text editor)
- Logs: `logs/` directory (JSON line format, human-readable)
- Settings: Stored in browser localStorage (can be exported from Settings)

### Delete Your Data

You can delete your data at any time:
- **Clear Library**: Settings → Clear Library Data
- **Delete Download History**: Settings → Clear Download History
- **Remove Logs**: Manually delete files in `logs/` directory
- **Reset Settings**: Settings → Reset to Defaults

### Disable Telemetry

Telemetry can be disabled at any time:
1. Go to Settings → Privacy & Telemetry
2. Uncheck "Enable telemetry"
3. Click Save

No further telemetry data will be sent. Previously collected data cannot be deleted from our servers (since it's already pseudonymous and not linked to you).

## Third-Party Services

### TMDB (The Movie Database)

Chilly Movies uses TMDB API to fetch movie and TV show metadata. When you search for content:
- Your search queries are sent to TMDB servers
- TMDB may log these requests per their privacy policy
- See: https://www.themoviedb.org/privacy-policy

**Note**: TMDB API calls use an app-managed API key. For heavy usage, you can provide your own TMDB API key in Settings.

### Content Sources

When you download content:
- Torrent downloads connect to the BitTorrent network (decentralized, no central server)
- Direct downloads (HTTP/HTTPS) connect directly to the file source
- We do not track or log the content you access

## Data Retention

### Local Data
- Logs: 7 days (configurable, automatic rotation and cleanup)
- Resume data: 30 days for stale entries (automatic cleanup)
- Library and download history: Indefinite (until you delete)

### Telemetry Data (If Enabled)
- Stored on our servers for up to 90 days
- Used for aggregate analytics only
- Not linked to individual users

## Security

### Local Storage
- Database files stored with filesystem permissions (OS-level protection)
- Sensitive settings (API keys) stored in OS secure storage when available:
  - macOS: Keychain
  - Windows: Credential Manager
  - Linux: libsecret/Secret Service
  - Fallback: Encrypted file

### Telemetry Transport
- Sent over HTTPS only
- No authentication required (data is already pseudonymous)

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be documented in:
- This file (with updated "Last Updated" date)
- Release notes for new versions
- In-app notification if significant changes

## Contact

For questions or concerns about privacy:
- Open an issue: https://github.com/salminhabibu/ChilluMovies/issues
- Email: [Contact information]

## Open Source

Chilly Movies is open source. You can:
- Review the code: https://github.com/salminhabibu/ChilluMovies
- Verify telemetry implementation: `src/telemetry.ts`
- Audit PII sanitization: `src/telemetry.ts` (sanitizeProperties method)
- Check logging behavior: `src/logger.ts`

## Compliance

This software is provided "as is" for personal, non-commercial use. Users are responsible for:
- Complying with copyright laws in their jurisdiction
- Obtaining proper licenses for content they download
- Understanding and accepting the privacy policies of third-party services (TMDB, content sources)

Chilly Movies does not host, distribute, or promote copyrighted content.
