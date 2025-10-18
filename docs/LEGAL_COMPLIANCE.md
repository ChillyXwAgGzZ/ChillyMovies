# Legal Compliance Guide

## Overview

ChillyMovies is designed as a personal media management tool that allows users to organize and access their legally obtained media content. This document provides guidance on legal compliance, particularly regarding the optional torrent search feature.

**⚠️ Important Legal Disclaimer:**
This application is provided for lawful purposes only. Users are solely responsible for ensuring their use complies with all applicable laws in their jurisdiction.

---

## Table of Contents

1. [Legal Checklist](#legal-checklist)
2. [Torrent Indexing Opt-In Flow](#torrent-indexing-opt-in-flow)
3. [Takedown Reporting Process](#takedown-reporting-process)
4. [Regional Compliance Guidance](#regional-compliance-guidance)
5. [DMCA Compliance](#dmca-compliance)
6. [Terms of Service](#terms-of-service)
7. [Privacy Policy](#privacy-policy)
8. [User Responsibility](#user-responsibility)

---

## Legal Checklist

### Before Enabling Torrent Search

- [ ] **Jurisdiction Review**: Confirm that torrent indexing is legal in target deployment regions
- [ ] **Content Policy**: Understand that the app indexes public torrent metadata, not content itself
- [ ] **User Agreement**: Ensure users accept terms before enabling torrent search
- [ ] **Age Verification**: Consider age restrictions based on content ratings
- [ ] **Liability Disclaimer**: Display clear disclaimers about user responsibility
- [ ] **DMCA Agent**: Register a DMCA agent if operating in the US (https://www.copyright.gov)
- [ ] **Takedown Process**: Implement and document content removal procedures
- [ ] **Regional Blocking**: Consider geo-restrictions in high-risk jurisdictions
- [ ] **Legal Counsel**: Consult with a lawyer familiar with copyright and internet law

### Ongoing Compliance

- [ ] **Monitoring**: Regularly review reported content and takedown requests
- [ ] **Updates**: Keep terms of service and privacy policy current
- [ ] **Documentation**: Maintain records of takedown requests and responses
- [ ] **User Communication**: Inform users of policy changes
- [ ] **Security**: Protect user data and privacy per local regulations (GDPR, CCPA, etc.)

---

## Torrent Indexing Opt-In Flow

### Implementation Requirements

The torrent search feature MUST be:
1. **Disabled by default** - Users must explicitly opt-in
2. **Clearly explained** - Users understand what they're enabling
3. **Revocable** - Users can disable at any time
4. **Logged** - Record opt-in timestamp for legal purposes

### Suggested UI Flow

#### First-Time Enablement

```
┌─────────────────────────────────────────────────────┐
│  Enable Torrent Search?                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Torrent search allows you to find content from    │
│  public torrent networks. This feature indexes     │
│  publicly available torrent metadata.               │
│                                                     │
│  ⚠️  IMPORTANT LEGAL NOTICE:                       │
│                                                     │
│  • You are responsible for ensuring your use       │
│    complies with all applicable laws               │
│  • Downloading copyrighted material without        │
│    permission is illegal in most jurisdictions     │
│  • This tool is intended for legal content only    │
│  • We do not host, store, or distribute content    │
│                                                     │
│  By enabling this feature, you acknowledge that:   │
│  • You will only download legally obtained content │
│  • You understand the legal risks                  │
│  • You accept full responsibility for your actions │
│                                                     │
│  [ ] I have read and agree to these terms          │
│                                                     │
│  [Cancel]                    [Enable Torrent Search]│
└─────────────────────────────────────────────────────┘
```

#### Settings Panel

```
Settings > Torrent Search

[X] Enable torrent search
    Status: Enabled
    Enabled on: 2024-01-15 14:30 UTC
    
    ⚠️  You are responsible for ensuring your downloads
        comply with copyright laws in your jurisdiction.
        
    [View Legal Terms] [Disable Feature]
```

### In-App Legal Language (Draft)

**Title**: Torrent Search Feature - Legal Notice

**Body**:
```
LEGAL NOTICE: TORRENT SEARCH FEATURE

1. PURPOSE
   ChillyMovies provides torrent search as an optional feature to help
   you find legally available content on public torrent networks.

2. YOUR RESPONSIBILITY
   You are solely responsible for:
   - Ensuring you have legal rights to download content
   - Complying with copyright laws in your jurisdiction
   - Understanding and accepting the legal risks of P2P file sharing
   - Verifying content licenses before downloading

3. WHAT WE DON'T DO
   ChillyMovies does NOT:
   - Host, store, or distribute copyrighted content
   - Verify the legal status of indexed torrents
   - Provide legal advice or authorization to download
   - Take responsibility for your downloading activities

4. PROHIBITED USES
   You may NOT use this feature to:
   - Download copyrighted content without authorization
   - Violate any applicable laws or regulations
   - Infringe on intellectual property rights
   - Circumvent digital rights management (DRM)

5. DISCLAIMER
   This feature is provided "AS IS" without warranties. We disclaim
   all liability for your use of torrent search and downloading.

6. TERMINATION
   We reserve the right to disable this feature at any time, with or
   without notice, for any reason including legal requirements.

By enabling torrent search, you acknowledge that you have read,
understood, and agree to these terms. If you do not agree, do not
enable this feature.
```

---

## Takedown Reporting Process

### DMCA Takedown Request Handling

#### Step 1: Provide Clear Contact Information

Create a dedicated page/section for DMCA notices:

```markdown
## DMCA Takedown Notices

If you believe content indexed by ChillyMovies infringes your copyright,
please submit a DMCA takedown notice containing:

1. Your contact information (name, address, phone, email)
2. Identification of the copyrighted work
3. Identification of the infringing material (torrent hash/magnet link)
4. A statement of good faith belief that use is not authorized
5. A statement under penalty of perjury that information is accurate
6. Your physical or electronic signature

Send notices to:
Email: dmca@chillymovies.example.com
Physical: [Your DMCA Agent Address]

We will respond within 48 hours during business days.
```

#### Step 2: Implement Takedown Workflow

```typescript
// Example takedown tracking structure
interface TakedownRequest {
  id: string;
  requestDate: Date;
  requesterEmail: string;
  copyrightHolder: string;
  contentIdentifier: string; // torrent hash or magnet link
  description: string;
  status: 'pending' | 'processed' | 'rejected';
  processedDate?: Date;
  notes?: string;
}
```

**Workflow**:
1. **Receive Request** → Log all details, send acknowledgment within 24 hours
2. **Verify Request** → Ensure request meets DMCA requirements
3. **Remove Content** → Blacklist torrent hash from search results
4. **Notify User** → If applicable, inform affected users (if downloads in progress)
5. **Counter-Notice** → Provide process for counter-notifications
6. **Document** → Keep records for at least 3 years

#### Step 3: Counter-Notification Process

Allow users to submit counter-notices if they believe content was wrongly removed:

```markdown
## DMCA Counter-Notification

If your content was removed and you believe it was a mistake:

1. Your contact information
2. Identification of removed content
3. Statement under penalty of perjury that removal was erroneous
4. Consent to jurisdiction of federal court
5. Your physical or electronic signature

Send to: dmca@chillymovies.example.com

We will forward to original complainant and may restore content
after 10-14 business days unless complainant files legal action.
```

### Implementation in Code

Add to `src/torrent-search.ts`:

```typescript
// Blacklist management
const blacklistedHashes = new Set<string>();

export function blacklistTorrent(infoHash: string, reason: string): void {
  blacklistedHashes.add(infoHash.toLowerCase());
  logger.info('Torrent blacklisted', { infoHash, reason });
  // Persist to database
}

export function isBlacklisted(infoHash: string): boolean {
  return blacklistedHashes.has(infoHash.toLowerCase());
}

// Filter blacklisted torrents from results
function filterResults(results: TorrentResult[]): TorrentResult[] {
  return results.filter(t => !isBlacklisted(t.infoHash));
}
```

Add API endpoint to `src/api-server.ts`:

```typescript
// POST /admin/torrents/blacklist (requires admin auth)
app.post('/admin/torrents/blacklist', async (req, res) => {
  const { infoHash, reason } = req.body;
  
  // Verify admin authentication
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  blacklistTorrent(infoHash, reason);
  
  res.json({ success: true, message: 'Torrent blacklisted' });
});
```

---

## Regional Compliance Guidance

### High-Risk Jurisdictions

Countries with strict copyright enforcement or P2P restrictions:

**Tier 1 - Very High Risk**:
- 🇺🇸 United States - Aggressive DMCA enforcement, ISP monitoring
- 🇩🇪 Germany - High fines for copyright infringement
- 🇯🇵 Japan - Criminal penalties for copyright violation
- 🇬🇧 United Kingdom - Copyright infringement letters, ISP blocking
- 🇦🇺 Australia - ISP cooperation with rights holders

**Recommendation**: Consider disabling torrent search by default or showing additional warnings in these regions.

**Tier 2 - Moderate Risk**:
- 🇨🇦 Canada - Notice-and-notice system
- 🇫🇷 France - HADOPI system (graduated response)
- 🇮🇹 Italy - ISP blocking of torrent sites
- 🇪🇸 Spain - Some enforcement, less aggressive

**Recommendation**: Show standard legal warnings, provide VPN recommendations.

**Tier 3 - Lower Risk**:
- Many African, Eastern European, and Asian countries have less enforcement
- Still illegal to download copyrighted content without permission
- Laws exist but enforcement may be limited

**Recommendation**: Still require opt-in and legal disclaimers.

### Implementation: Geo-Detection

```typescript
// src/geo-compliance.ts
import { lookupCountry } from 'geoip-lite';

export interface RegionPolicy {
  countryCode: string;
  riskLevel: 'high' | 'moderate' | 'low';
  torrentEnabled: boolean;
  additionalWarning?: string;
}

const REGION_POLICIES: Record<string, RegionPolicy> = {
  'US': {
    countryCode: 'US',
    riskLevel: 'high',
    torrentEnabled: false, // Require explicit override
    additionalWarning: 'Copyright infringement is a federal crime in the US with penalties up to $150,000 per work.'
  },
  'DE': {
    countryCode: 'DE',
    riskLevel: 'high',
    torrentEnabled: false,
    additionalWarning: 'Germany has very strict copyright enforcement with automatic fines.'
  },
  // ... more countries
};

export function getRegionPolicy(ip: string): RegionPolicy {
  const geo = lookupCountry(ip);
  if (!geo) {
    return { countryCode: 'UNKNOWN', riskLevel: 'high', torrentEnabled: false };
  }
  
  return REGION_POLICIES[geo] || {
    countryCode: geo,
    riskLevel: 'moderate',
    torrentEnabled: true
  };
}
```

### Suggested UI Based on Region

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  HIGH-RISK JURISDICTION DETECTED                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Your IP address appears to be in the United States│
│                                                     │
│  Copyright infringement is a federal crime in the  │
│  US with penalties up to $150,000 per work and     │
│  possible criminal charges.                         │
│                                                     │
│  ISPs in your region actively monitor P2P traffic  │
│  and forward copyright notices to users.            │
│                                                     │
│  STRONG RECOMMENDATION:                             │
│  • Only use this feature for public domain content │
│  • Consider using a VPN service                     │
│  • Consult with a lawyer if unsure                  │
│                                                     │
│  [Cancel]  [I Understand The Risks, Enable Anyway] │
└─────────────────────────────────────────────────────┘
```

---

## DMCA Compliance

### Safe Harbor Provisions

To qualify for DMCA "safe harbor" protections (17 U.S.C. § 512):

1. **Designate an Agent**: Register with U.S. Copyright Office
   - Online: https://www.copyright.gov/dmca-directory/
   - Cost: ~$6 fee
   - Must update every 3 years

2. **Implement Notice-and-Takedown**: Respond promptly to valid DMCA notices

3. **Adopt and Implement Repeat Infringer Policy**:
   ```markdown
   ## Repeat Infringer Policy
   
   ChillyMovies will terminate accounts of users who repeatedly
   infringe copyrights:
   
   - First violation: Warning notice
   - Second violation: Temporary suspension (30 days)
   - Third violation: Permanent account termination
   
   We reserve the right to terminate any account at any time for
   serious or repeated violations.
   ```

4. **No Red Flag Knowledge**: Don't actively seek out infringing content

5. **No Financial Benefit**: Don't profit directly from infringing activity

### DMCA Notice Template

Provide this template for copyright holders:

```
DMCA TAKEDOWN NOTICE

To: dmca@chillymovies.example.com

I, [NAME], am the [owner/agent] of certain intellectual property rights.

I have a good faith belief that the following material indexed by your
service infringes my copyright:

Copyrighted Work: [Title, registration number if applicable]
Infringing Material: [Torrent hash, magnet link, or search query]
Location: [URL where indexed material appears]

I swear, under penalty of perjury, that the information in this
notification is accurate and that I am authorized to act on behalf
of the copyright owner.

This letter is official notification under the DMCA. I seek the
removal of the aforementioned infringing material from your service.

Please contact me at [EMAIL] or [PHONE] to confirm removal.

Signature: _______________________
Date: ____________________________
Name: ____________________________
Address: _________________________
```

---

## Terms of Service

### Draft Terms of Service

```markdown
# ChillyMovies - Terms of Service

**Last Updated**: [DATE]

## 1. Acceptance of Terms

By using ChillyMovies ("the App"), you agree to these Terms of Service
("Terms"). If you do not agree, do not use the App.

## 2. Description of Service

ChillyMovies is a personal media management application that allows
users to organize and access media content. The App includes an optional
torrent search feature that indexes publicly available torrent metadata.

## 3. User Responsibilities

### 3.1 Legal Compliance
You agree to:
- Use the App only for lawful purposes
- Comply with all applicable copyright laws
- Obtain proper licenses/permissions before downloading content
- Not use the App to infringe intellectual property rights

### 3.2 Prohibited Uses
You may NOT:
- Download copyrighted content without authorization
- Use the App for commercial content distribution without permission
- Circumvent technological protection measures (DRM)
- Share account credentials with others
- Reverse engineer or modify the App

## 4. Torrent Search Feature

### 4.1 Opt-In Requirement
The torrent search feature is disabled by default. You must explicitly
opt-in and accept additional terms to enable it.

### 4.2 No Content Hosting
We do not host, store, transmit, or distribute any media files. We only
index publicly available torrent metadata from third-party sources.

### 4.3 User Responsibility
You are solely responsible for content you download. We do not verify
the legal status of indexed torrents.

## 5. Intellectual Property

### 5.1 Copyright Policy
We respect copyright. If you believe content infringes your rights,
submit a DMCA notice to dmca@chillymovies.example.com.

### 5.2 Repeat Infringer Policy
We will terminate accounts of repeat infringers per our policy.

## 6. Disclaimers

### 6.1 No Warranties
THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

### 6.2 No Legal Advice
Nothing in the App constitutes legal advice. Consult a lawyer regarding
your specific situation.

## 7. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY
INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY,
OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.

## 8. Indemnification

You agree to indemnify and hold us harmless from any claims, damages,
losses, liabilities, and expenses arising from your use of the App or
violation of these Terms.

## 9. Termination

We may suspend or terminate your access at any time for any reason,
including violation of these Terms.

## 10. Changes to Terms

We reserve the right to modify these Terms at any time. Continued use
after changes constitutes acceptance.

## 11. Governing Law

These Terms are governed by the laws of [JURISDICTION], without regard
to conflict of law principles.

## 12. Contact

For questions about these Terms, contact: legal@chillymovies.example.com
```

### Implementation in App

Add to `src/renderer/views/SettingsView.tsx`:

```tsx
// Legal & Privacy section
<div className="settings-section">
  <h3>Legal & Privacy</h3>
  
  <button onClick={() => showModal('terms')}>
    View Terms of Service
  </button>
  
  <button onClick={() => showModal('privacy')}>
    View Privacy Policy
  </button>
  
  <button onClick={() => showModal('dmca')}>
    DMCA Information
  </button>
  
  <p className="version-info">
    Terms Version: 1.0 | Last Updated: 2024-01-15
  </p>
</div>
```

---

## Privacy Policy

### Draft Privacy Policy

```markdown
# ChillyMovies - Privacy Policy

**Last Updated**: [DATE]

## 1. Introduction

This Privacy Policy explains how ChillyMovies ("we", "us", "App")
collects, uses, and protects your information.

## 2. Information We Collect

### 2.1 Information You Provide
- API keys (TMDB) stored locally on your device
- Settings and preferences
- Library metadata (titles, file paths)

### 2.2 Automatically Collected
- Application logs (errors, performance)
- Usage statistics (if telemetry enabled)
- Device information (OS, version)

### 2.3 Not Collected
- Personal identifying information (name, email, address)
- Payment information (app is free)
- Location data beyond IP-based region detection
- Browsing history outside the app
- Content of downloaded files

## 3. How We Use Information

We use collected information to:
- Provide and improve the App
- Troubleshoot technical issues
- Understand usage patterns (if telemetry enabled)
- Comply with legal obligations

## 4. Data Storage

### 4.1 Local Storage
All data is stored locally on your device:
- SQLite database: Library metadata
- JSON files: Settings, cache
- Log files: Application logs
- Secure storage: API keys (encrypted)

### 4.2 No Cloud Storage
We do not transmit your data to our servers. The App operates
entirely offline after initial setup.

## 5. Third-Party Services

### 5.1 TMDB API
If you provide a TMDB API key:
- Your queries are sent directly to TMDB
- TMDB's privacy policy applies
- See: https://www.themoviedb.org/privacy-policy

### 5.2 Torrent Networks
When using torrent search:
- Your IP address is visible to torrent providers
- Peers can see your IP when downloading
- Consider using a VPN for privacy

## 6. Data Sharing

We do NOT:
- Sell your data to third parties
- Share data for advertising
- Transmit usage data (unless telemetry explicitly enabled)

We MAY share data:
- If required by law (court order, subpoena)
- To protect our legal rights
- With your explicit consent

## 7. Your Rights

You have the right to:
- Access your data (it's on your device)
- Delete your data (uninstall the app)
- Export your data (library export feature)
- Opt-out of telemetry (disabled by default)

## 8. Children's Privacy

The App is not intended for children under 13. We do not knowingly
collect information from children.

## 9. International Users

The App is designed for use worldwide. Data is processed on your
local device. If you use torrent search, be aware of laws in your
jurisdiction.

## 10. Security

We implement security measures:
- API keys stored in encrypted secure storage
- Local database access restrictions
- No transmission of sensitive data
- Regular security updates

However, no system is 100% secure. Use at your own risk.

## 11. Data Retention

Data is retained until you:
- Manually delete items from your library
- Clear cache
- Uninstall the application

Logs are automatically rotated (default: 7 days).

## 12. Changes to Privacy Policy

We may update this policy. Continued use after changes constitutes
acceptance. We will notify users of material changes.

## 13. Contact

For privacy questions: privacy@chillymovies.example.com

## 14. GDPR Compliance (EU Users)

If you are in the EU:
- Legal basis for processing: Legitimate interest, consent (torrent search)
- Data controller: [YOUR LEGAL ENTITY]
- Right to lodge complaint with supervisory authority
- Data portability: Use export feature

## 15. CCPA Compliance (California Users)

California residents have additional rights under CCPA:
- Right to know what personal information is collected
- Right to delete personal information
- Right to opt-out of sale (we don't sell data)
- Right to non-discrimination

To exercise rights: privacy@chillymovies.example.com
```

---

## User Responsibility

### In-App Disclaimers

#### 1. Splash Screen Disclaimer (First Launch)

```
┌─────────────────────────────────────────────────────┐
│  Welcome to ChillyMovies                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ⚠️  IMPORTANT LEGAL INFORMATION                   │
│                                                     │
│  ChillyMovies is a personal media management tool. │
│                                                     │
│  YOU ARE RESPONSIBLE FOR:                           │
│  • Ensuring you have legal rights to all content   │
│  • Complying with copyright laws in your country   │
│  • Understanding the legal risks of P2P downloads  │
│                                                     │
│  WE ARE NOT RESPONSIBLE FOR:                        │
│  • Your downloading activities                      │
│  • Copyright infringement by users                  │
│  • Legal consequences of your actions               │
│                                                     │
│  By using this application, you acknowledge that   │
│  you have read and understood this notice.          │
│                                                     │
│  [ ] I understand and accept responsibility         │
│                                                     │
│  [View Terms]  [View Privacy]       [Get Started]   │
└─────────────────────────────────────────────────────┘
```

#### 2. Download Confirmation Dialog

```
┌─────────────────────────────────────────────────────┐
│  Confirm Download                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Title: Example Movie (2024)                        │
│  Size: 1.4 GB                                       │
│  Type: Torrent                                      │
│                                                     │
│  ⚠️  LEGAL REMINDER:                               │
│                                                     │
│  Before downloading, confirm:                       │
│  • You have legal rights to this content           │
│  • The content is public domain, licensed, or      │
│    you own the copyright                            │
│  • Downloading does not violate laws in your       │
│    jurisdiction                                     │
│                                                     │
│  [ ] I confirm this is a legal download             │
│                                                     │
│  [Cancel]                           [Start Download]│
└─────────────────────────────────────────────────────┘
```

#### 3. Footer Disclaimer (Always Visible)

```
┌──────────────────────────────────────────────────────┐
│ Content Area                                         │
│                                                      │
└──────────────────────────────────────────────────────┘
│ ChillyMovies v1.0 | Terms | Privacy | DMCA          │
│ ⚠️  Users are responsible for ensuring downloads    │
│ comply with applicable copyright laws.               │
└──────────────────────────────────────────────────────┘
```

### README Disclaimer

Add to `README.md`:

```markdown
## ⚠️ Legal Disclaimer

**READ THIS CAREFULLY BEFORE USING THIS SOFTWARE**

ChillyMovies is a personal media management tool. The optional torrent
search feature is provided for accessing legally available content only.

### Your Responsibility

By using ChillyMovies, you acknowledge and agree that:

1. **You are solely responsible** for ensuring that your use complies
   with all applicable laws, including copyright laws.

2. **Downloading copyrighted material without permission is illegal**
   in most jurisdictions and can result in:
   - Civil lawsuits with damages up to $150,000 per work (US)
   - Criminal charges in some cases
   - ISP warnings or service termination
   - Heavy fines (especially in Germany, Japan, UK)

3. **We do not verify content legality**. The App indexes public
   torrent metadata but does not verify whether content is legal to
   download in your jurisdiction.

4. **We are not liable** for your use of the App, any content you
   download, or any legal consequences you face.

### Intended Use

This software is intended for:
- Managing your personal, legally-obtained media library
- Downloading public domain content
- Accessing content you have licenses for
- Downloading content with explicit permission from copyright holders

### Prohibited Use

Do NOT use this software to:
- Download copyrighted content without authorization
- Violate intellectual property rights
- Circumvent DRM or technological protection measures
- Engage in piracy or illegal file sharing

### No Warranty

This software is provided "AS IS" without warranty of any kind. Use
at your own risk.

### Jurisdictional Compliance

Users are responsible for understanding and complying with laws in
their jurisdiction. If torrent downloads are restricted or illegal
where you live, do not enable the torrent search feature.

**If you do not agree with these terms, do not use this software.**
```

---

## Implementation Checklist

### Code Changes Required

- [ ] Add opt-in dialog for torrent search (SettingsView.tsx)
- [ ] Implement legal notice acceptance tracking (storage.ts)
- [ ] Add geo-detection for regional warnings (new: geo-compliance.ts)
- [ ] Create terms/privacy modal components (new: LegalModal.tsx)
- [ ] Add download confirmation dialog (DiscoveryView.tsx)
- [ ] Implement blacklist system (torrent-search.ts)
- [ ] Add admin endpoint for blacklisting (api-server.ts)
- [ ] Create DMCA notice handler (new: dmca-handler.ts)
- [ ] Add footer disclaimers (App.tsx)
- [ ] Update first-launch flow with legal notice (main.tsx)

### Documentation Updates

- [x] Create LEGAL_COMPLIANCE.md (this file)
- [ ] Update README.md with legal disclaimer
- [ ] Create DMCA.md with takedown process
- [ ] Add Terms of Service to docs/TERMS.md
- [ ] Add Privacy Policy to docs/PRIVACY.md
- [ ] Update user guide with legal information

### Administrative Setup

- [ ] Register DMCA agent (if operating in US)
- [ ] Set up dmca@chillymovies.example.com email
- [ ] Create legal@chillymovies.example.com email
- [ ] Consult with lawyer for jurisdiction-specific review
- [ ] Set up takedown request tracking system
- [ ] Create procedure documentation for staff
- [ ] Establish response time SLAs (48 hours for DMCA)

---

## Disclaimer

**This document is provided for informational purposes only and does
not constitute legal advice. Consult with a qualified attorney familiar
with copyright law, internet law, and the laws of your jurisdiction
before deploying any application that indexes or facilitates access
to copyrighted content.**

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-15 | Initial legal compliance guide |

---

## Contact

For legal inquiries regarding this document:
- Email: legal@chillymovies.example.com
- DMCA: dmca@chillymovies.example.com

**End of Legal Compliance Guide**
