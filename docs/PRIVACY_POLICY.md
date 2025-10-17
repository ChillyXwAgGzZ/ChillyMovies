# ChillyMovies - Privacy Policy

**Effective Date**: January 15, 2024  
**Last Updated**: January 15, 2024  
**Version**: 1.0

---

## Introduction

This Privacy Policy explains how ChillyMovies ("we", "us", "our", "the Application", "the App") collects, uses, stores, and protects your information. We are committed to protecting your privacy and being transparent about our data practices.

**Key Points**:
- ✓ All data is stored **locally** on your device
- ✓ We do **not** operate servers that collect your data
- ✓ We do **not** sell your data to third parties
- ✓ Telemetry is **disabled by default** and requires explicit opt-in
- ✓ You control your data completely

By using ChillyMovies, you agree to the practices described in this Privacy Policy.

---

## Table of Contents

1. [Information We Collect](#1-information-we-collect)
2. [How We Use Information](#2-how-we-use-information)
3. [Data Storage and Security](#3-data-storage-and-security)
4. [Third-Party Services](#4-third-party-services)
5. [Data Sharing and Disclosure](#5-data-sharing-and-disclosure)
6. [Your Privacy Rights](#6-your-privacy-rights)
7. [Children's Privacy](#7-childrens-privacy)
8. [International Users](#8-international-users)
9. [Data Retention](#9-data-retention)
10. [Changes to Privacy Policy](#10-changes-to-privacy-policy)
11. [Contact Information](#11-contact-information)
12. [GDPR Compliance](#12-gdpr-compliance-eu-users)
13. [CCPA Compliance](#13-ccpa-compliance-california-users)

---

## 1. Information We Collect

### 1.1 Information You Actively Provide

When you use the Application, you may provide:

**Library Metadata**:
- Movie titles, descriptions, release years
- File paths and locations on your device
- User-assigned ratings, tags, or notes
- Playback history and resume positions

**Settings and Preferences**:
- Display language (English/Swahili)
- Theme preferences (light/dark mode)
- Download directories
- Subtitle preferences
- Feature toggles (e.g., torrent search enabled/disabled)

**API Credentials** (Optional):
- TMDB API key (if you provide your own)
- Stored encrypted in platform-specific secure storage

**User Input**:
- Search queries
- Filter selections
- Sort preferences

### 1.2 Information Automatically Collected

**Application Logs**:
- Error messages and stack traces
- Performance metrics (response times, load times)
- Feature usage (which views are accessed)
- Download events (start, complete, error)

**Device Information**:
- Operating system (Windows, macOS, Linux) and version
- Application version
- Screen resolution (for responsive UI)
- Available disk space (for download management)

**Network Information** (when applicable):
- IP address (for regional compliance warnings)
- Network status (online/offline)

**Telemetry Data** (ONLY if explicitly enabled):
- Aggregated usage statistics
- Feature adoption metrics
- Error rates
- Performance benchmarks

### 1.3 Information We Do NOT Collect

We explicitly **do NOT** collect:

✗ Your name, email address, or contact information (unless you provide it for support)  
✗ Payment or financial information (the Application is free)  
✗ Precise location data (only country-level via IP for legal warnings)  
✗ Browsing history outside the Application  
✗ Contacts or social connections  
✗ Biometric data  
✗ Content of media files you download or watch  
✗ Personal communications  

---

## 2. How We Use Information

### 2.1 Core Functionality

We use collected information to:

**Provide Core Features**:
- Display your media library
- Search and filter your content
- Fetch metadata from TMDB
- Manage downloads
- Resume playback from last position
- Provide subtitles

**Improve User Experience**:
- Remember your preferences across sessions
- Provide region-appropriate legal warnings
- Optimize performance based on your device
- Cache data to reduce API calls

**Troubleshooting**:
- Debug errors and crashes
- Identify performance issues
- Improve application stability

**Legal Compliance**:
- Provide region-appropriate warnings
- Track opt-in consent for features
- Respond to legal requests if required

### 2.2 Telemetry (Opt-In Only)

If you explicitly enable telemetry, we use aggregated, anonymized data to:

- Understand which features are most used
- Identify areas for improvement
- Prioritize bug fixes based on impact
- Make product decisions

**Note**: Telemetry is **disabled by default**. You must opt-in in Settings.

### 2.3 Purposes We Do NOT Use Data For

We do **NOT** use your data for:

✗ Advertising or marketing  
✗ Selling to third parties  
✗ Profiling or behavioral tracking  
✗ Training machine learning models (without consent)  
✗ Cross-device tracking  

---

## 3. Data Storage and Security

### 3.1 Local Storage Only

**All data is stored locally on your device**:

**SQLite Database**:
- Path: `~/.chillymovies/chilly.db` (or platform-specific location)
- Contents: Library metadata, settings, download history
- Access: Only by the Application

**JSON Configuration Files**:
- Path: `~/.chillymovies/config/`
- Contents: User preferences, cache data
- Format: Human-readable JSON

**Log Files**:
- Path: `~/.chillymovies/logs/`
- Contents: Application logs (errors, events)
- Rotation: Automatic, keeps last 7 days by default

**Cache**:
- Path: `~/.chillymovies/.cache/`
- Contents: TMDB metadata cache, torrent search cache
- TTL: Varies by data type (30 min to 1 hour)

**Secure Storage** (Platform-Specific):
- macOS: Keychain
- Windows: Credential Manager
- Linux: libsecret/Secret Service API
- Contents: API keys (encrypted)

### 3.2 No Cloud Synchronization

We do **NOT**:
- Upload your data to our servers (we don't have servers)
- Sync data across devices
- Store data in the cloud
- Transmit usage data (unless telemetry explicitly enabled)

### 3.3 Security Measures

**Encryption**:
- API keys stored in platform-specific encrypted storage
- Fallback encryption uses AES-256-GCM with machine-specific key
- Sensitive logs sanitized (passwords, tokens redacted)

**Access Control**:
- Database files use OS-level file permissions
- Application runs with user-level privileges (not admin/root)

**Code Security**:
- Regular dependency updates
- Automated security audits (`npm audit`)
- Open-source code (community review)

**Limitations**:
- No system is 100% secure
- Physical access to your device can compromise data
- Malware or keyloggers can intercept data
- **Use at your own risk**

### 3.4 Data Integrity

- Regular automatic backups to `~/.chillymovies/backups/`
- Export feature allows manual backups (JSON format)
- Database corruption recovery mechanisms

---

## 4. Third-Party Services

### 4.1 The Movie Database (TMDB)

**When Used**:
- When you search for movies
- When you fetch metadata (posters, descriptions)

**Data Shared with TMDB**:
- Search queries
- Movie IDs
- Your IP address
- API key (if you provide your own)

**TMDB's Privacy Policy**:
- https://www.themoviedb.org/privacy-policy
- TMDB's policy governs their data practices
- We have no control over TMDB's data handling

**Our Role**:
- We act as a client, not a data controller
- Requests go directly from your device to TMDB
- We cache responses locally to minimize API calls

### 4.2 Torrent Networks (Optional Feature)

**When Used**:
- When you enable torrent search
- When you download via torrents

**Data Shared**:
- Your IP address is visible to:
  - Torrent search providers (e.g., yts.mx)
  - Torrent peers during downloads
  - Torrent trackers
- Search queries sent to torrent APIs

**Privacy Risks**:
- Your ISP can see torrent traffic
- Copyright holders may monitor torrent swarms
- Consider using a VPN for privacy

**Our Role**:
- We index public metadata; we don't host content
- We don't control third-party torrent sites
- We're not responsible for their privacy practices

### 4.3 Subtitle Providers (Future Feature)

**When Used**:
- When you search for subtitles

**Data Shared**:
- Movie title and identifiers
- Your IP address
- Preferred languages

**Third-Party Policies**:
- OpenSubtitles: https://www.opensubtitles.org/en/privacy
- Each provider has their own policy

### 4.4 Analytics (Opt-In Only)

If we implement analytics in the future:
- Would be explicitly opt-in
- Would use privacy-respecting services (e.g., Plausible, Matomo)
- Would anonymize data
- Would be documented here

**Current Status**: No analytics implemented.

---

## 5. Data Sharing and Disclosure

### 5.1 General Policy

We do **NOT** share, sell, rent, or trade your personal information with third parties for their commercial purposes.

### 5.2 When We MAY Share Data

We may disclose information in limited circumstances:

**Legal Obligations**:
- If required by law, regulation, or court order
- To comply with subpoenas or government requests
- To comply with DMCA takedown notices

**Protection of Rights**:
- To protect our legal rights or property
- To prevent fraud or abuse
- To enforce our Terms of Service

**With Your Consent**:
- If you explicitly authorize disclosure
- When participating in surveys or beta programs (opt-in)

**Business Transfer**:
- If the project is transferred to another entity
- Users would be notified and given opt-out opportunity

### 5.3 Aggregated/Anonymized Data

We may share aggregated, anonymized data that cannot identify individuals:
- Usage statistics (e.g., "80% of users prefer dark mode")
- Performance metrics
- Bug reports (with PII redacted)

### 5.4 Open Source Community

As an open-source project:
- Bug reports may be public (on GitHub)
- **Never include personal data in bug reports**
- We redact any PII accidentally included

---

## 6. Your Privacy Rights

### 6.1 Access Your Data

**Right**: View all data the Application stores about you

**How**: 
- Your data is on your device at `~/.chillymovies/`
- Use "Export Library" feature to get JSON export
- Open SQLite database with any SQLite browser

### 6.2 Modify Your Data

**Right**: Change or correct your data

**How**:
- Edit library items directly in the Application
- Modify settings in Settings view
- Manually edit configuration files

### 6.3 Delete Your Data

**Right**: Delete all or part of your data

**How**:
- Delete individual items from library
- Clear cache in Settings
- Clear all data: Uninstall Application and delete `~/.chillymovies/`

### 6.4 Export Your Data

**Right**: Receive your data in a portable format

**How**:
- Use "Export Library" feature (outputs JSON)
- JSON is human-readable and portable
- Can import into other applications

### 6.5 Opt-Out of Telemetry

**Right**: Disable data collection beyond core functionality

**How**:
- Telemetry is disabled by default
- If enabled, toggle off in Settings > Privacy

### 6.6 No Account Deletion

**Not Applicable**: The Application doesn't use accounts. Just uninstall to stop using.

---

## 7. Children's Privacy

### 7.1 Age Restriction

ChillyMovies is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.

### 7.2 Parental Consent

Users between 13 and 18 should have parental or guardian permission before using the Application.

### 7.3 If We Learn of Child Data

If we become aware that we have collected data from a child under 13 without parental consent, we will take steps to delete that information.

### 7.4 Content Ratings

The Application does not filter content by age-appropriateness. Parents should supervise children's use.

---

## 8. International Users

### 8.1 Where Data is Stored

Your data is stored **on your device**, wherever your device is located.

### 8.2 Cross-Border Transfers

When you use third-party services (TMDB, torrent networks):
- Data may be transferred internationally
- Subject to those services' privacy policies
- We have no control over international transfers by third parties

### 8.3 Regional Laws

We attempt to comply with privacy laws including:
- **GDPR** (European Union)
- **CCPA** (California, USA)
- **LGPD** (Brazil)
- Other applicable data protection laws

See sections 12 and 13 for specific compliance information.

---

## 9. Data Retention

### 9.1 Library Data

**Retention**: Indefinite, until you delete it

**Reason**: Core functionality requires persistent storage

**Your Control**: Delete items anytime; uninstall to delete all

### 9.2 Logs

**Retention**: 7 days (default), configurable

**Reason**: Debugging and troubleshooting

**Automatic Deletion**: Logs older than 7 days are auto-deleted

**Your Control**: Clear logs in Settings or delete log directory

### 9.3 Cache

**Retention**: Varies by cache type (30 min to 1 hour TTL)

**Reason**: Reduce API calls, improve performance

**Automatic Expiration**: Cache entries expire based on TTL

**Your Control**: Clear cache in Settings

### 9.4 Settings

**Retention**: Indefinite, until you change or uninstall

**Reason**: Preserve user preferences

**Your Control**: Reset to defaults in Settings; delete config files

### 9.5 Telemetry

**Retention**: N/A (not transmitted anywhere unless opt-in)

**If Enabled**: Would be subject to retention policy of analytics service

---

## 10. Changes to Privacy Policy

### 10.1 Right to Modify

We reserve the right to update this Privacy Policy at any time to reflect:
- Changes in data practices
- New features
- Legal requirements
- User feedback

### 10.2 Notification of Changes

**Material Changes**: We will notify users by:
- Displaying a prominent notice in the Application
- Updating the "Last Updated" date at the top of this document
- (Optional) Posting on website or repository

**Minor Changes**: May be made without additional notice

### 10.3 Continued Use

Continued use of the Application after changes constitutes acceptance of the updated Privacy Policy.

### 10.4 Disagreement with Changes

If you disagree with changes, stop using the Application and delete all data.

---

## 11. Contact Information

### 11.1 Privacy Questions

For privacy-related questions or concerns:

**Email**: privacy@chillymovies.example.com  
**Response Time**: 5-7 business days

### 11.2 Data Rights Requests

To exercise privacy rights (access, deletion, etc.):

**Email**: privacy@chillymovies.example.com  
**Subject Line**: "Data Rights Request - [Your Request]"

### 11.3 Security Issues

To report security vulnerabilities:

**Email**: security@chillymovies.example.com  
**GitHub**: [SECURITY.md] (for responsible disclosure)

### 11.4 General Inquiries

For non-privacy questions:

**Email**: support@chillymovies.example.com  
**GitHub**: [ISSUES]

---

## 12. GDPR Compliance (EU Users)

If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, the General Data Protection Regulation (GDPR) grants you additional rights.

### 12.1 Data Controller

**Identity**: [YOUR LEGAL ENTITY OR INDIVIDUAL NAME]  
**Contact**: privacy@chillymovies.example.com  
**Location**: [YOUR LOCATION]

### 12.2 Legal Basis for Processing

We process your data based on:

**Legitimate Interest** (Art. 6(1)(f)):
- Providing core functionality
- Improving the Application
- Debugging and security

**Consent** (Art. 6(1)(a)):
- Torrent search feature (opt-in)
- Telemetry (opt-in)
- Third-party API usage (implicit consent)

**Contract Performance** (Art. 6(1)(b)):
- To provide services you've requested

### 12.3 Your GDPR Rights

**Right to Access** (Art. 15):
- Request copy of your data
- Data is already on your device; use export feature

**Right to Rectification** (Art. 16):
- Correct inaccurate data
- Edit directly in Application

**Right to Erasure** (Art. 17):
- "Right to be forgotten"
- Delete data by uninstalling

**Right to Restrict Processing** (Art. 18):
- Disable features in Settings

**Right to Data Portability** (Art. 20):
- Export data in JSON format

**Right to Object** (Art. 21):
- Object to processing for legitimate interests
- Stop using Application

**Rights Related to Automated Decision-Making** (Art. 22):
- Not applicable (no automated decisions made)

### 12.4 Supervisory Authority

You have the right to lodge a complaint with your local data protection authority:

**Find Your Authority**:
- https://edpb.europa.eu/about-edpb/board/members_en

**Example Authorities**:
- Germany: Bundesbeauftragter für den Datenschutz und die Informationsfreiheit
- France: Commission Nationale de l'Informatique et des Libertés (CNIL)
- UK: Information Commissioner's Office (ICO)

### 12.5 Data Transfers

We do not transfer data outside the EEA except:
- Data stored locally on your device (you control location)
- TMDB API calls (TMDB is US-based; their policy governs)
- Torrent networks (if you enable the feature)

### 12.6 Data Protection Officer

**Status**: Not required (processing not large-scale)

**Contact**: privacy@chillymovies.example.com

---

## 13. CCPA Compliance (California Users)

If you are a California resident, the California Consumer Privacy Act (CCPA) grants you specific rights regarding your personal information.

### 13.1 Categories of Information Collected

In the last 12 months, we have collected:

| Category | Examples | Collected? |
|----------|----------|------------|
| Identifiers | Name, email, IP address | IP only (for region detection) |
| Commercial information | Purchase history | No (app is free) |
| Internet activity | Browsing history, search queries | Search queries (local only) |
| Geolocation | GPS coordinates | No (country-level only via IP) |
| Sensory information | Audio, video | No |
| Professional information | Job, employer | No |
| Education information | School records | No |
| Inferences | Preferences, behavior | Usage preferences (local only) |

### 13.2 Sources of Information

- Directly from you (user input)
- Automatically from your device (logs, device info)

### 13.3 Purpose of Collection

- Providing core functionality
- Improving user experience
- Troubleshooting
- Legal compliance

### 13.4 Information Sharing

**We DO NOT sell personal information.**

We may share information with:
- Service providers: TMDB (for metadata)
- Legal authorities (if required by law)
- Nobody else

### 13.5 Your CCPA Rights

**Right to Know**:
- What personal information we collect
- Sources, purposes, categories shared
- **How to Exercise**: Email privacy@chillymovies.example.com

**Right to Delete**:
- Request deletion of your personal information
- **How to Exercise**: Uninstall Application; email for confirmation

**Right to Opt-Out of Sale**:
- We do NOT sell personal information
- **No action needed**

**Right to Non-Discrimination**:
- We will not discriminate for exercising CCPA rights

**Right to Correct**:
- Request correction of inaccurate information
- **How to Exercise**: Edit directly in Application

**Right to Limit Use of Sensitive Personal Information**:
- Not applicable (we don't collect sensitive info as defined by CCPA)

### 13.6 Authorized Agent

You may designate an authorized agent to make requests on your behalf:

**Requirements**:
- Provide written authorization signed by you
- Verify your identity

**Contact**: privacy@chillymovies.example.com

### 13.7 Verification Process

To verify your identity for CCPA requests:
- We may ask for information to match with our records
- Since we don't collect much PII, verification may be simplified

### 13.8 Response Time

We will respond to CCPA requests within:
- **45 days** (may extend to 90 days if needed)
- Will notify you if extension is required

---

## 14. Additional Regional Privacy Laws

### 14.1 Brazil (LGPD)

If you are in Brazil, the Lei Geral de Proteção de Dados (LGPD) applies. You have rights similar to GDPR.

**Contact**: privacy@chillymovies.example.com

### 14.2 Canada (PIPEDA)

If you are in Canada, the Personal Information Protection and Electronic Documents Act (PIPEDA) applies.

**Contact**: privacy@chillymovies.example.com

### 14.3 Other Jurisdictions

We strive to comply with privacy laws worldwide. Contact us for jurisdiction-specific questions.

---

## 15. Cookies and Tracking

### 15.1 No Cookies

**The Application is a desktop application, not a website. It does not use cookies.**

### 15.2 No Web Tracking

We do not use:
- Tracking pixels
- Web beacons
- Fingerprinting
- Cross-site tracking

### 15.3 Local Storage

The Application uses local file storage (SQLite, JSON) for functionality, not tracking.

---

## 16. Do Not Track Signals

The Application does not track users across websites or services, so "Do Not Track" (DNT) signals are not applicable.

If DNT support is added in the future, we will honor it.

---

## 17. Privacy by Design

ChillyMovies is built with privacy as a core principle:

✓ **Local-first**: All data stays on your device  
✓ **Minimal collection**: Only collect what's necessary  
✓ **Opt-in**: Features that involve data sharing are opt-in  
✓ **Transparency**: Open-source code can be audited  
✓ **User control**: You own and control your data  
✓ **Encryption**: Sensitive data is encrypted  
✓ **No dark patterns**: Clear, honest privacy choices  

---

## 18. Open Source and Transparency

### 18.1 Auditable Code

ChillyMovies is open-source. Anyone can:
- Review the code on GitHub
- Verify privacy claims
- Audit data handling practices
- Contribute improvements

**Repository**: [GITHUB_URL]

### 18.2 Community Trust

We rely on community trust, not obscurity. If you find privacy issues, please report them.

---

## Acknowledgment

BY USING CHILLYMOVIES, YOU ACKNOWLEDGE THAT:

1. You have read and understood this Privacy Policy
2. You consent to the data practices described herein
3. You understand that data is stored locally on your device
4. You understand the privacy implications of using third-party services (TMDB, torrent networks)
5. You are responsible for securing your device

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-15 | Initial Privacy Policy |

---

**Last Updated**: January 15, 2024

**Effective Date**: January 15, 2024

---

**END OF PRIVACY POLICY**
