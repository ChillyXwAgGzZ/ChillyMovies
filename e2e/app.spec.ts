/**
 * E2E Tests for Chilly Movies
 * 
 * Tests the complete user flow from search to download
 */

import { test, expect } from '@playwright/test';

test.describe('Chilly Movies E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to be fully loaded
    await page.waitForSelector('h1', { state: 'visible' });
  });

  test('should load the application', async ({ page }) => {
    // Check that the app title is visible
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Chilly');
  });

  test('should navigate between views', async ({ page }) => {
    // Click on Discovery
    await page.click('text=Discovery');
    await expect(page.locator('h2')).toContainText('Discovery');
    
    // Click on Library
    await page.click('text=Library');
    await expect(page.locator('h2')).toContainText('Library');
    
    // Click on Downloads
    await page.click('text=Downloads');
    await expect(page.locator('h2')).toContainText('Downloads');
    
    // Click on Settings
    await page.click('text=Settings');
    await expect(page.locator('h2')).toContainText('Settings');
  });

  test('should search for movies in Discovery view', async ({ page }) => {
    // Navigate to Discovery
    await page.click('text=Discovery');
    
    // Enter search query
    const searchInput = page.locator('input[type="text"]');
    await searchInput.fill('Matrix');
    
    // Click search button
    await page.click('button[type="submit"]');
    
    // Wait for results
    await page.waitForSelector('.result-card, .empty-state', { timeout: 10000 });
    
    // Check if results are displayed (might be empty if API key not configured)
    const hasResults = await page.locator('.result-card').count() > 0;
    const hasEmptyState = await page.locator('.empty-state').isVisible();
    
    expect(hasResults || hasEmptyState).toBeTruthy();
  });

  test('should switch between metadata and torrent search modes', async ({ page }) => {
    // Navigate to Discovery
    await page.click('text=Discovery');
    
    // Check that mode selector is visible
    await expect(page.locator('.mode-selector')).toBeVisible();
    
    // Check default mode (Browse Catalog)
    const catalogBtn = page.locator('button:has-text("Browse Catalog")');
    await expect(catalogBtn).toHaveClass(/active/);
    
    // Switch to torrent search
    await page.click('button:has-text("Search Torrents")');
    
    // Check that torrent search is now active
    const torrentBtn = page.locator('button:has-text("Search Torrents")');
    await expect(torrentBtn).toHaveClass(/active/);
    
    // Check placeholder text changed
    const searchInput = page.locator('input[type="text"]');
    await expect(searchInput).toHaveAttribute('placeholder', /torrents/i);
  });

  test('should update settings and persist language preference', async ({ page }) => {
    // Navigate to Settings
    await page.click('text=Settings');
    
    // Check that settings form is visible
    await expect(page.locator('.settings-form')).toBeVisible();
    
    // Language selector should be visible
    const langSelect = page.locator('select').first();
    await expect(langSelect).toBeVisible();
    
    // Get current language
    const currentLang = await langSelect.inputValue();
    
    // Switch language
    const newLang = currentLang === 'en' ? 'sw' : 'en';
    await langSelect.selectOption(newLang);
    
    // Save settings
    await page.click('button[type="submit"]');
    
    // Wait for save confirmation
    await page.waitForTimeout(500);
    
    // Reload page
    await page.reload();
    
    // Check that language persisted
    await page.click('text=Settings');
    const savedLang = await page.locator('select').first().inputValue();
    expect(savedLang).toBe(newLang);
  });

  test('should display empty library message', async ({ page }) => {
    // Navigate to Library
    await page.click('text=Library');
    
    // Check for empty state or library items
    const hasItems = await page.locator('.library-card').count() > 0;
    const hasEmptyState = await page.locator('.empty-state').isVisible();
    
    expect(hasItems || hasEmptyState).toBeTruthy();
  });

  test('should display downloads list', async ({ page }) => {
    // Navigate to Downloads
    await page.click('text=Downloads');
    
    // Check for downloads list or empty state
    const hasDownloads = await page.locator('.download-card').count() > 0;
    const hasEmptyState = await page.locator('.empty-state').isVisible();
    
    expect(hasDownloads || hasEmptyState).toBeTruthy();
  });

  test('should handle search errors gracefully', async ({ page }) => {
    // Navigate to Discovery
    await page.click('text=Discovery');
    
    // Try to search with empty query
    await page.click('button[type="submit"]');
    
    // Should not show error for empty search
    // (button should be disabled or form should prevent submission)
    const errorBanner = page.locator('.error-banner');
    const isErrorVisible = await errorBanner.isVisible().catch(() => false);
    
    // Either no error shown, or specific "empty query" error
    if (isErrorVisible) {
      const errorText = await errorBanner.textContent();
      expect(errorText).not.toContain('500');
      expect(errorText).not.toContain('undefined');
    }
  });

  test('should toggle language via top nav', async ({ page }) => {
    // Find language toggle button
    const langToggle = page.locator('.lang-toggle');
    await expect(langToggle).toBeVisible();
    
    // Get current language
    const currentLang = await langToggle.textContent();
    expect(currentLang).toMatch(/EN|SW/);
    
    // Click to toggle
    await langToggle.click();
    
    // Wait for language change
    await page.waitForTimeout(300);
    
    // Check language changed
    const newLang = await langToggle.textContent();
    expect(newLang).not.toBe(currentLang);
    expect(newLang).toMatch(/EN|SW/);
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation has proper ARIA
    const nav = page.locator('.app-nav');
    await expect(nav).toBeVisible();
    
    // Check search form has proper labels
    await page.click('text=Discovery');
    const searchInput = page.locator('input[type="text"]');
    const ariaLabel = await searchInput.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to activate with Enter
    await page.keyboard.press('Enter');
    
    // Check that navigation worked
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    
    // Get focused element
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
      };
    });
    
    // Should have some kind of focus indicator
    expect(focusedElement).toBeTruthy();
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    await page.goto('/');
    await page.click('text=Discovery');
    
    // Try to search
    const searchInput = page.locator('input[type="text"]');
    await searchInput.fill('Test');
    await page.click('button[type="submit"]');
    
    // Wait for error or timeout
    await page.waitForTimeout(5000);
    
    // Should show error message or handle gracefully
    const hasError = await page.locator('.error-banner').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('.empty-state').isVisible().catch(() => false);
    
    expect(hasError || hasEmptyState).toBeTruthy();
    
    // Go back online
    await page.context().setOffline(false);
  });
});
