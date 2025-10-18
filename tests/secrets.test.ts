/**
 * Tests for secure credential storage (TASK-R7)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SecretsManager, getTMDBApiKey, setTMDBApiKey, resetSecretsManager } from '../src/secrets';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SecretsManager', () => {
  let manager: SecretsManager;
  
  beforeEach(async () => {
    manager = new SecretsManager();
    await manager.initialize();
  });
  
  afterEach(async () => {
    // Clean up test secrets
    const keys = await manager.listKeys();
    for (const key of keys) {
      if (key.startsWith('test_')) {
        await manager.deleteSecret(key);
      }
    }
  });
  
  it('should initialize successfully', async () => {
    const info = manager.getStorageInfo();
    expect(info).toBeDefined();
    expect(['keytar', 'fallback']).toContain(info.backend);
  });
  
  it('should store and retrieve a secret', async () => {
    await manager.setSecret('test_key', 'test_value');
    const retrieved = await manager.getSecret('test_key');
    expect(retrieved).toBe('test_value');
  });
  
  it('should return null for non-existent secret', async () => {
    const retrieved = await manager.getSecret('non_existent_key');
    expect(retrieved).toBeNull();
  });
  
  it('should delete a secret', async () => {
    await manager.setSecret('delete_me', 'value');
    expect(await manager.getSecret('delete_me')).toBe('value');
    
    const deleted = await manager.deleteSecret('delete_me');
    expect(deleted).toBe(true);
    
    expect(await manager.getSecret('delete_me')).toBeNull();
  });
  
  it('should return false when deleting non-existent secret', async () => {
    const deleted = await manager.deleteSecret('never_existed');
    expect(deleted).toBe(false);
  });
  
  it('should list all secret keys', async () => {
    await manager.setSecret('key1', 'value1');
    await manager.setSecret('key2', 'value2');
    await manager.setSecret('key3', 'value3');
    
    const keys = await manager.listKeys();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
    expect(keys).toContain('key3');
    expect(keys.length).toBeGreaterThanOrEqual(3);
  });
  
  it('should throw error when storing empty secret', async () => {
    await expect(manager.setSecret('empty', '')).rejects.toThrow('Secret value cannot be empty');
  });
  
  it('should handle multiple secrets independently', async () => {
    await manager.setSecret('api_key', 'abc123');
    await manager.setSecret('token', 'xyz789');
    await manager.setSecret('password', 'secret');
    
    expect(await manager.getSecret('api_key')).toBe('abc123');
    expect(await manager.getSecret('token')).toBe('xyz789');
    expect(await manager.getSecret('password')).toBe('secret');
    
    await manager.deleteSecret('token');
    
    expect(await manager.getSecret('api_key')).toBe('abc123');
    expect(await manager.getSecret('token')).toBeNull();
    expect(await manager.getSecret('password')).toBe('secret');
  });
  
  it('should update existing secret', async () => {
    await manager.setSecret('updateable', 'old_value');
    expect(await manager.getSecret('updateable')).toBe('old_value');
    
    await manager.setSecret('updateable', 'new_value');
    expect(await manager.getSecret('updateable')).toBe('new_value');
  });
});

describe('TMDB API key helpers', () => {
  let originalEnv: string | undefined;
  
  beforeEach(async () => {
    // Reset singleton between tests
    resetSecretsManager();
    
    // Save original env var
    originalEnv = process.env.TMDB_API_KEY;
    delete process.env.TMDB_API_KEY;
  });
  
  afterEach(async () => {
    // Restore original env var
    if (originalEnv !== undefined) {
      process.env.TMDB_API_KEY = originalEnv;
    } else {
      delete process.env.TMDB_API_KEY;
    }
    
    // Clean up test key
    resetSecretsManager();
    const manager = new SecretsManager();
    await manager.initialize();
    await manager.deleteSecret('tmdb_api_key');
  });
  
  it('should set and get TMDB API key', async () => {
    await setTMDBApiKey('tmdb_test_key_123');
    const retrieved = await getTMDBApiKey();
    expect(retrieved).toBe('tmdb_test_key_123');
  });
  
  it('should prefer environment variable over stored key', async () => {
    await setTMDBApiKey('stored_key');
    process.env.TMDB_API_KEY = 'env_key';
    
    const retrieved = await getTMDBApiKey();
    expect(retrieved).toBe('env_key');
  });
  
  it('should fall back to stored key when env var not set', async () => {
    delete process.env.TMDB_API_KEY;
    await setTMDBApiKey('stored_key');
    
    const retrieved = await getTMDBApiKey();
    expect(retrieved).toBe('stored_key');
  });
  
  it('should return null when no key is available', async () => {
    delete process.env.TMDB_API_KEY;
    
    // Make sure no stored key exists
    const manager = new SecretsManager();
    await manager.initialize();
    await manager.deleteSecret('tmdb_api_key');
    
    const retrieved = await getTMDBApiKey();
    expect(retrieved).toBeNull();
  });
});

describe('Encryption (fallback storage)', () => {
  it('should encrypt and decrypt values correctly', async () => {
    // This test verifies the encryption/decryption works by storing and retrieving
    const manager = new SecretsManager();
    await manager.initialize();
    
    const testValue = 'super_secret_api_key_12345';
    await manager.setSecret('encryption_test', testValue);
    
    const retrieved = await manager.getSecret('encryption_test');
    expect(retrieved).toBe(testValue);
  });
  
  it('should not store secrets in plain text', async () => {
    const manager = new SecretsManager();
    await manager.initialize();
    
    const info = manager.getStorageInfo();
    
    // If using fallback storage, verify file is encrypted
    if (info.backend === 'fallback') {
      const secretValue = 'plain_text_test_value';
      await manager.setSecret('plain_test', secretValue);
      
      const fallbackFile = path.join(os.homedir(), '.chillymovies', 'secrets.enc');
      
      if (fs.existsSync(fallbackFile)) {
        const fileContent = fs.readFileSync(fallbackFile, 'utf8');
        // Verify the plain text value is NOT in the file
        expect(fileContent).not.toContain(secretValue);
        expect(fileContent).not.toContain('plain_test');
      }
    }
  });
  
  it('should handle special characters in secrets', async () => {
    const manager = new SecretsManager();
    await manager.initialize();
    
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\' \n\t\r';
    await manager.setSecret('special_chars', specialChars);
    
    const retrieved = await manager.getSecret('special_chars');
    expect(retrieved).toBe(specialChars);
  });
  
  it('should handle unicode in secrets', async () => {
    const manager = new SecretsManager();
    await manager.initialize();
    
    const unicode = '你好世界 🎬 🍿 مرحبا';
    await manager.setSecret('unicode_test', unicode);
    
    const retrieved = await manager.getSecret('unicode_test');
    expect(retrieved).toBe(unicode);
  });
});
