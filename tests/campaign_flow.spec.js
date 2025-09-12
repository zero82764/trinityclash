const { test, expect } = require('@playwright/test');

test('Campaign Mode End-to-End Flow', async ({ page }) => {
  // Increase the timeout for this complex test
  test.setTimeout(120000);

  await page.goto('http://localhost:8000');

  // 1. Start Campaign
  console.log("Starting campaign...");
  await page.click('text=Campaign');
  await page.waitForSelector('text=Your Citadel');
  await page.screenshot({ path: 'campaign_test_1_initial_map.png' });
  console.log("Campaign map loaded.");

  // 2. Click a Rival Territory
  console.log("Attacking Whispering Woods...");
  await page.click('text=Whispering Woods');

  // 3. Select a team
  console.log("Selecting team...");
  await page.waitForSelector('text=Choose Your Team');
  await page.click('text=Sir Reginald');
  await page.click('text=Grak the Crusher');
  await page.click('text=Boro the Bulwark');
  await page.click('text=Start Game');
  console.log("Team selected, starting battle.");

  // 4. Win the battle
  console.log("Starting battle sequence...");
  for (let i = 0; i < 3; i++) {
    const battleOver = await page.isVisible('text=Your Citadel');
    if (battleOver) {
      console.log("Battle is over, breaking loop.");
      break;
    }
    console.log(`Battle round ${i + 1}`);
    // Use a try-catch for hero clicks since they might be defeated
    try {
      await page.click('text=Sir Reginald', { timeout: 3000 });
      await page.click('text=CLASH!', { timeout: 3000 });
    } catch (e) {
      console.log("Sir Reginald is likely defeated, trying Grak.");
      try {
        await page.click('text=Grak the Crusher', { timeout: 3000 });
        await page.click('text=CLASH!', { timeout: 3000 });
      } catch (e2) {
        console.log("Grak is likely defeated, trying Boro.");
        await page.click('text=Boro the Bulwark', { timeout: 3000 });
        await page.click('text=CLASH!', { timeout: 3000 });
      }
    }
    await page.waitForTimeout(3000); // Wait for animations
  }

  // 5. Verify return to campaign map
  console.log("Verifying return to campaign map...");
  await expect(page.locator('text=Your Citadel')).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'campaign_test_2_after_battle.png' });
  console.log("Returned to map successfully.");

  // 6. Go to Citadel Screen
  console.log("Navigating to Citadel screen...");
  await page.click('text=Your Citadel');
  await page.waitForSelector('text=/Gold: (\\d+)/');

  // 7. Verify resources increased
  console.log("Verifying resource increase...");
  const resourceText = await page.textContent('body');
  expect(resourceText).toMatch(/Gold: 150/);
  await page.screenshot({ path: 'campaign_test_3_citadel_screen.png' });
  console.log("Resources verified.");

  // 8. Go back to map
  console.log("Returning to map from Citadel...");
  await page.click('text=Back to Map');
  await page.waitForSelector('text=Your Citadel');
  console.log("Campaign flow test completed successfully.");
});
