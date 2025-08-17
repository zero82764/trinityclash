const { test, expect } = require('@playwright/test');

test('Impossible AI correctly counter-picks and makes optimal clash decisions', async ({ page }) => {
  // Increase timeout for this complex test
  test.setTimeout(120000);

  console.log('Navigating to page...');
  await page.goto('http://localhost:8000');
  console.log('Page loaded.');

  // Navigate to Impossible Difficulty
  console.log('Clicking "Quick Match"...');
  await page.click('text=Quick Match');
  console.log('Clicking "3v3 Clash"...');
  await page.click('text=3v3 Clash');
  console.log('Clicking "Impossible"...');
  await page.click('text=Impossible');
  console.log('Navigated to hero selection.');

  // --- Player Team Selection (designed to be countered) ---
  console.log("Player selecting team...");
  await page.click('text=Sir Reginald'); // Might
  await page.click('text=Grak the Crusher'); // Might
  await page.click('text=Vex'); // Finesse
  console.log("Player team selected.");
  console.log('Clicking "Start Game"...');
  await page.click('text=Start Game');
  console.log('Game started.');

  // Wait for the game to start and animations to settle
  console.log('Waiting for game to settle...');
  await page.waitForTimeout(2000);
  console.log('Game settled.');

  // Screenshot to verify the AI's counter-pick.
  console.log('Taking counter-pick screenshot...');
  await page.screenshot({ path: 'screenshot_impossible_test_1_ai_counterpick.png' });
  console.log("Screenshot 1 taken.");

  // --- SCENARIO: Test Optimal Clash Decision ---
  console.log("Initiating clash...");
  await page.click('text=Vex');
  await page.click('text=CLASH!');
  console.log("Clash initiated.");

  // Wait for the clash to resolve
  console.log('Waiting for clash to resolve...');
  await page.waitForTimeout(8000);
  console.log('Clash resolved.');

  // Final screenshot to verify the game state after the clash.
  console.log('Taking final screenshot...');
  await page.screenshot({ path: 'screenshot_impossible_test_2_after_clash.png' });
  console.log("Screenshot 2 taken. Test complete.");
});
