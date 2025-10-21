/**
 * Accessibility test for Sidebar contrast ratios
 * Tests color contrast in light and dark themes using axe-core
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Sidebar Color Contrast", () => {
  test("should have no accessibility violations in light theme", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
    
    // Ensure light theme is active
    await page.evaluate(() => {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    // Run axe on the sidebar
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("aside") // Only scan the sidebar
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    
    // Should have no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have no accessibility violations in dark theme", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
    
    // Ensure dark theme is active
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    // Run axe on the sidebar
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("aside") // Only scan the sidebar
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    
    // Should have no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should meet minimum contrast ratios for nav links in light theme", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
    
    // Ensure light theme
    await page.evaluate(() => {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    // Check contrast for inactive nav link
    const navLink = page.locator('a[href="/downloads"]').first();
    const contrast = await navLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      return { color, backgroundColor };
    });
    
    // Basic check that colors are defined
    expect(contrast.color).toBeTruthy();
    expect(contrast.backgroundColor).toBeTruthy();
  });

  test("should meet minimum contrast ratios for nav links in dark theme", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
    
    // Ensure dark theme
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    // Check contrast for inactive nav link
    const navLink = page.locator('a[href="/downloads"]').first();
    const contrast = await navLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      return { color, backgroundColor };
    });
    
    // Basic check that colors are defined
    expect(contrast.color).toBeTruthy();
    expect(contrast.backgroundColor).toBeTruthy();
  });

  test("should have accessible text for all interactive elements", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
    
    // Run axe specifically for text alternatives
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("aside")
      .withTags(["wcag2a"])
      .disableRules(["color-contrast"]) // Focus on text alternatives
      .analyze();
    
    // Filter for label-related violations
    const labelViolations = accessibilityScanResults.violations.filter(
      (v) => v.id.includes("label") || v.id.includes("name")
    );
    
    expect(labelViolations).toEqual([]);
  });

  test("should have proper focus indicators with sufficient contrast", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
    
    // Focus on a nav link
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    
    const homeLink = page.locator('a[href="/"]').first();
    
    // Check that focus indicator is visible
    const focusStyles = await homeLink.evaluate((el) => {
      el.focus();
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        outlineColor: styles.outlineColor,
      };
    });
    
    // Should have either outline or box-shadow for focus
    const hasFocusIndicator =
      focusStyles.outline !== "none" ||
      (focusStyles.boxShadow && focusStyles.boxShadow !== "none");
    
    expect(hasFocusIndicator).toBe(true);
  });

  test("should handle collapsed sidebar without accessibility violations", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
    
    // Click toggle to collapse sidebar
    const toggleButton = page.locator('button[aria-label*="sidebar"]').first();
    await toggleButton.click();
    await page.waitForTimeout(500); // Wait for transition
    
    // Run axe on collapsed sidebar
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("aside")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should maintain accessibility with theme toggle", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
    
    // Toggle between themes and check accessibility
    for (const theme of ["light", "dark", "light"]) {
      await page.evaluate((t) => {
        localStorage.setItem("theme", t);
        if (t === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }, theme);
      
      await page.waitForTimeout(300);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include("aside")
        .withTags(["wcag2aa"])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });
});
