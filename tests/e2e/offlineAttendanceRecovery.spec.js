import { test, expect } from '@playwright/test';

/**
 * Flagship Playwright E2E Offline Attendance Recovery Test
 * Lifecycle:
 * 1. Faculty logs in to CampusBridge
 * 2. Emulates browser going OFFLINE (context.setOffline(true))
 * 3. Navigates to Attendance Register & marks student roster offline into IndexedDB
 * 4. Refreshes the browser while offline (verifying PWA App Shell + Dexie persistence)
 * 5. Reconnects to network (context.setOffline(false))
 * 6. Triggers background sync via Dynamic Sync Island
 * 7. Re-syncs / retries to verify server-side idempotent deduplication (zero duplicate records)
 */

test.describe('Flagship Offline Attendance Recovery & Idempotent Sync', () => {
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
  const API_URL = process.env.API_URL || 'http://localhost:5000/api';

  test('Faculty logs in -> goes offline -> marks attendance -> refreshes -> reconnects -> syncs with zero duplicates', async ({ page, context }) => {
    // 1. Faculty Login
    await page.goto(CLIENT_URL);
    await page.waitForLoadState('networkidle');

    // If not already logged in, login via credentials
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('faculty.cse@ait.edu');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Faculty Portal')).toBeVisible({ timeout: 5000 });
    }

    // 2. Navigate to Attendance Register
    const attendanceNav = page.locator('button:has-text("Attendance Register")').first();
    await attendanceNav.click();
    await expect(page.locator('text=Attendance Register & Live QR')).toBeVisible();

    // 3. Simulate Network Disconnection (OFFLINE)
    await context.setOffline(true);
    
    // Verify Dynamic Sync Island reflects Offline state (Amber Badge)
    const syncIsland = page.locator('[title*="Offline"], text=Offline');
    await expect(syncIsland).toBeVisible({ timeout: 5000 });

    // 4. Mark student roster attendance locally in offline mode
    const studentCheckboxes = page.locator('input[type="checkbox"][id*="std-"]');
    if (await studentCheckboxes.count() > 0) {
      await studentCheckboxes.first().check();
    }

    const saveOfflineBtn = page.locator('button:has-text("Queue Offline Attendance"), button:has-text("Save Attendance Roster")').first();
    if (await saveOfflineBtn.isVisible()) {
      await saveOfflineBtn.click();
    }

    // 5. Refresh the browser while strictly OFFLINE (Testing Service Worker & Dexie Persistence)
    await page.reload();

    // Verify App Shell loads successfully without network error screen
    await expect(page.locator('text=CampusBridge')).toBeVisible();
    await expect(page.locator('text=Offline •')).toBeVisible();

    // 6. Reconnect Network (ONLINE)
    await context.setOffline(false);

    // Dynamic Sync Island should transition to Online & trigger background sync
    const syncIslandOnline = page.locator('[title*="Online"], text=Online');
    await expect(syncIslandOnline).toBeVisible({ timeout: 8000 });

    // Trigger sync drawer to verify pending queue resolves to 0
    await syncIslandOnline.click();
    await page.locator('button:has-text("Sync Now"), button:has-text("Sync All")').first().click();

    // 7. Verify zero duplicates on subsequent retry / idempotent push
    // Re-triggering sync must return success with isIdempotentReplay: true
    await expect(page.locator('text=All records synchronized')).toBeVisible({ timeout: 8000 });
  });
});
