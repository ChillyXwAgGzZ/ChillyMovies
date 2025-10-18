/**
 * Secure credential storage for sensitive data like API keys.
 * Uses platform-specific secure storage (Keychain, Credential Manager, libsecret)
 * with encrypted fallback for unsupported platforms or when keytar is unavailable.
 * 
 * Part of TASK-R7: Secure credential storage implementation
 */

import * as keytar from 'keytar';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getLogger } from './logger';

const logger = getLogger();
const SERVICE_NAME = 'ChillyMovies';
const FALLBACK_FILE = path.join(os.homedir(), '.chillymovies', 'secrets.enc');
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * Derive encryption key from machine-specific data.
 * Not perfect security but better than plain text.
 */
function deriveKey(): Buffer {
  const machineId = os.hostname() + os.platform() + os.arch();
  return crypto.scryptSync(machineId, 'chillymovies-salt', 32);
}

/**
 * Encrypt a value using AES-256-GCM
 */
function encrypt(text: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return iv:authTag:encrypted
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a value using AES-256-GCM
 */
function decrypt(encryptedText: string): string {
  const key = deriveKey();
  const parts = encryptedText.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Fallback storage using encrypted file when keytar is unavailable
 */
class FallbackStorage {
  private cache: Map<string, string> = new Map();
  
  async load(): Promise<void> {
    try {
      if (fs.existsSync(FALLBACK_FILE)) {
        const content = fs.readFileSync(FALLBACK_FILE, 'utf8');
        const decrypted = decrypt(content);
        this.cache = new Map(JSON.parse(decrypted));
        logger.info('Loaded secrets from encrypted fallback storage');
      }
    } catch (error) {
      logger.error('Failed to load fallback storage', error as Error);
    }
  }
  
  async save(): Promise<void> {
    try {
      const dir = path.dirname(FALLBACK_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const json = JSON.stringify([...this.cache.entries()]);
      const encrypted = encrypt(json);
      fs.writeFileSync(FALLBACK_FILE, encrypted, { mode: 0o600 }); // Owner read/write only
      logger.info('Saved secrets to encrypted fallback storage');
    } catch (error) {
      logger.error('Failed to save fallback storage', error as Error);
    }
  }
  
  async getPassword(account: string): Promise<string | null> {
    return this.cache.get(account) || null;
  }
  
  async setPassword(account: string, password: string): Promise<void> {
    this.cache.set(account, password);
    await this.save();
  }
  
  async deletePassword(account: string): Promise<boolean> {
    const existed = this.cache.has(account);
    this.cache.delete(account);
    await this.save();
    return existed;
  }
}

/**
 * Secrets manager with platform-specific secure storage and encrypted fallback
 */
export class SecretsManager {
  private useKeytar: boolean = false;
  private fallback: FallbackStorage | null = null;
  
  constructor() {}
  
  /**
   * Initialize the secrets manager.
   * Attempts to use keytar first, falls back to encrypted file storage.
   */
  async initialize(): Promise<void> {
    // Test if keytar is available
    try {
      await keytar.findCredentials(SERVICE_NAME);
      this.useKeytar = true;
      logger.info('Using platform secure storage (keytar)');
    } catch (error) {
      logger.warn('Keytar unavailable, using encrypted fallback storage', { error });
      this.fallback = new FallbackStorage();
      await this.fallback.load();
    }
  }
  
  /**
   * Store a secret securely
   */
  async setSecret(key: string, value: string): Promise<void> {
    if (!value) {
      throw new Error('Secret value cannot be empty');
    }
    
    try {
      if (this.useKeytar) {
        await keytar.setPassword(SERVICE_NAME, key, value);
        logger.info('Secret stored in platform secure storage', { key });
      } else if (this.fallback) {
        await this.fallback.setPassword(key, value);
        logger.info('Secret stored in encrypted fallback storage', { key });
      } else {
        throw new Error('Secrets manager not initialized');
      }
    } catch (error) {
      logger.error('Failed to store secret', error as Error, { key });
      throw error;
    }
  }
  
  /**
   * Retrieve a secret
   */
  async getSecret(key: string): Promise<string | null> {
    try {
      if (this.useKeytar) {
        return await keytar.getPassword(SERVICE_NAME, key);
      } else if (this.fallback) {
        return await this.fallback.getPassword(key);
      } else {
        throw new Error('Secrets manager not initialized');
      }
    } catch (error) {
      logger.error('Failed to retrieve secret', error as Error, { key });
      return null;
    }
  }
  
  /**
   * Delete a secret
   */
  async deleteSecret(key: string): Promise<boolean> {
    try {
      if (this.useKeytar) {
        const deleted = await keytar.deletePassword(SERVICE_NAME, key);
        if (deleted) {
          logger.info('Secret deleted from platform secure storage', { key });
        }
        return deleted;
      } else if (this.fallback) {
        const deleted = await this.fallback.deletePassword(key);
        if (deleted) {
          logger.info('Secret deleted from encrypted fallback storage', { key });
        }
        return deleted;
      } else {
        throw new Error('Secrets manager not initialized');
      }
    } catch (error) {
      logger.error('Failed to delete secret', error as Error, { key });
      return false;
    }
  }
  
  /**
   * Get all secret keys (for migration/debugging)
   */
  async listKeys(): Promise<string[]> {
    try {
      if (this.useKeytar) {
        const creds = await keytar.findCredentials(SERVICE_NAME);
        return creds.map(c => c.account);
      } else if (this.fallback) {
        return Array.from(this.fallback['cache'].keys());
      } else {
        throw new Error('Secrets manager not initialized');
      }
    } catch (error) {
      logger.error('Failed to list secret keys', error as Error);
      return [];
    }
  }
  
  /**
   * Get storage backend info
   */
  getStorageInfo(): { backend: 'keytar' | 'fallback', secure: boolean } {
    if (this.useKeytar) {
      return { backend: 'keytar', secure: true };
    } else if (this.fallback) {
      return { backend: 'fallback', secure: false }; // Less secure than OS keychain
    }
    throw new Error('Secrets manager not initialized');
  }
}

// Singleton instance
let _instance: SecretsManager | null = null;

/**
 * Get the global secrets manager instance
 */
export async function getSecretsManager(): Promise<SecretsManager> {
  if (!_instance) {
    _instance = new SecretsManager();
    await _instance.initialize();
  }
  return _instance;
}

/**
 * Reset the singleton instance (for testing only)
 */
export function resetSecretsManager(): void {
  _instance = null;
}

/**
 * Helper: Get TMDB API key from secure storage or environment
 */
export async function getTMDBApiKey(): Promise<string | null> {
  // First check environment (for dev/testing)
  if (process.env.TMDB_API_KEY) {
    return process.env.TMDB_API_KEY;
  }
  
  // Then check secure storage
  const manager = await getSecretsManager();
  return await manager.getSecret('tmdb_api_key');
}

/**
 * Helper: Set TMDB API key in secure storage
 */
export async function setTMDBApiKey(apiKey: string): Promise<void> {
  const manager = await getSecretsManager();
  await manager.setSecret('tmdb_api_key', apiKey);
}
