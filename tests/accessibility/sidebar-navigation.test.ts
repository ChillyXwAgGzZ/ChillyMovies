/**
 * Accessibility test for Sidebar keyboard navigation
 * Tests keyboard navigation with Tab, Enter, and Space keys
 */

import { test, expect } from "@playwright/test";

test.describe("Sidebar Keyboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
  });

  test("should navigate through sidebar items with Tab key", async ({ page }) => {
    // Start from the sidebar toggle button
    await page.keyboard.press("Tab");
    
    // Navigate to first nav item (Home)
    await page.keyboard.press("Tab");
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeFocused();
    
    // Navigate to Downloads
    await page.keyboard.press("Tab");
    const downloadsLink = page.locator('a[href="/downloads"]').first();
    await expect(downloadsLink).toBeFocused();
    
    // Navigate to Library
    await page.keyboard.press("Tab");
    const libraryLink = page.locator('a[href="/library"]').first();
    await expect(libraryLink).toBeFocused();
    
    // Navigate to Settings
    await page.keyboard.press("Tab");
    const settingsLink = page.locator('a[href="/settings"]').first();
    await expect(settingsLink).toBeFocused();
  });

  test("should activate nav links with Enter key", async ({ page }) => {
    // Tab to Downloads link
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    
    // Activate with Enter
    await page.keyboard.press("Enter");
    
    // Verify navigation to downloads page
    await expect(page).toHaveURL(/.*downloads/);
  });

  test("should toggle sidebar with Enter key", async ({ page }) => {
    // Focus on toggle button
    await page.keyboard.press("Tab");
    
    // Get sidebar width before toggle
    const sidebar = page.locator("aside").first();
    const initialWidth = await sidebar.evaluate((el) => el.offsetWidth);
    
    // Toggle with Enter
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500); // Wait for transition
    
    // Verify sidebar width changed
    const newWidth = await sidebar.evaluate((el) => el.offsetWidth);
    expect(newWidth).not.toBe(initialWidth);
  });

  test("should toggle sidebar with Space key", async ({ page }) => {
    // Focus on toggle button
    await page.keyboard.press("Tab");
    
    // Get sidebar width before toggle
    const sidebar = page.locator("aside").first();
    const initialWidth = await sidebar.evaluate((el) => el.offsetWidth);
    
    // Toggle with Space
    await page.keyboard.press("Space");
    await page.waitForTimeout(500); // Wait for transition
    
    // Verify sidebar width changed
    const newWidth = await sidebar.evaluate((el) => el.offsetWidth);
    expect(newWidth).not.toBe(initialWidth);
  });

  test("should have visible focus indicators", async ({ page }) => {
    // Tab to first nav link
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    
    const homeLink = page.locator('a[href="/"]').first();
    
    // Check for focus ring (Tailwind's focus:ring classes)
    const outlineStyle = await homeLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline || styles.boxShadow;
    });
    
    // Should have some visible focus indicator
    expect(outlineStyle).not.toBe("none");
    expect(outlineStyle).not.toBe("");
  });

  test("should have proper ARIA labels", async ({ page }) => {
    // Check sidebar has navigation role
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toHaveAttribute("role", "navigation");
    await expect(sidebar).toHaveAttribute("aria-label");
    
    // Check nav has role and label
    const nav = page.locator("nav").first();
    await expect(nav).toHaveAttribute("role", "navigation");
    await expect(nav).toHaveAttribute("aria-label");
    
    // Check toggle button has label
    const toggleButton = page.locator('button[aria-label*="sidebar"]').first();
    await expect(toggleButton).toHaveAttribute("aria-label");
    await expect(toggleButton).toHaveAttribute("aria-expanded");
  });

  test("should change language with keyboard in collapsed mode", async ({ page }) => {
    // Collapse sidebar first
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    
    // Tab to language toggle button (should be last focusable element)
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
    }
    
    // Get current language attribute from html tag
    const initialLang = await page.locator("html").getAttribute("lang");
    
    // Press Enter to toggle language
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    
    // Verify language changed
    const newLang = await page.locator("html").getAttribute("lang");
    expect(newLang).not.toBe(initialLang);
  });

  test("should navigate all elements in correct tab order", async ({ page }) => {
    const expectedOrder = [
      'button[aria-label*="sidebar"]', // Toggle button
      'a[href="/"]', // Home
      'a[href="/downloads"]', // Downloads
      'a[href="/library"]', // Library
      'a[href="/settings"]', // Settings
      'select[id="language-select"]', // Language selector (expanded mode)
    ];
    
    for (const selector of expectedOrder) {
      await page.keyboard.press("Tab");
      const element = page.locator(selector).first();
      
      // Some elements might not be visible (e.g., in collapsed mode)
      const isVisible = await element.isVisible();
      if (isVisible) {
        await expect(element).toBeFocused();
      }
    }
  });
});
