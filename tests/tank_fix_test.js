const { test, expect } = require('@playwright/test');

test('Tank absorbs Ambush and standard attack damage', async ({ page }) => {
  // Increase the timeout for this complex test
  test.setTimeout(120000);

  await page.goto('http://localhost:8000');

  // Navigate to Practice Mode
  await page.click('text=Quick Match');
  await page.click('text=Practice');

  // --- Player Team Selection (with Tank) ---
  // Select Boro the Bulwark (Tank)
  await page.click('text=Boro the Bulwark');
  // Select Sir Reginald
  await page.click('text=Sir Reginald');
  // Select Vex
  await page.click('text=Vex');
  await page.click('text=Confirm Your Team');

  // --- Opponent Team Selection (with Ambush) ---
  // Select Goblin Cutpurse (Ambush)
  await page.click('text=Goblin Cutpurse');
  // Select Skeleton Warrior
  await page.click('text=Skeleton Warrior');
   // Select Skeleton Archer
  await page.click('text=Skeleton Archer');
  await page.click('text=Start Practice');

  // Wait for the game to start and animations to settle
  await page.waitForTimeout(2000);

  // --- SCENARIO 1: Test Ambush redirection ---
  // Vex (Player) attacks the Skeleton Warrior (Opponent)
  // This should trigger the opponent's Goblin Cutpurse Ambush ability.
  console.log("Scenario 1: Player's Vex attacking. Expecting opponent's Ambush to be redirected to Boro.");
  await page.click('text=Vex');
  await page.click('text=CLASH!');

  // Wait for clash animation and subsequent actions to complete
  await page.waitForTimeout(8000);

  // Take a screenshot after the first clash to verify Ambush damage
  await page.screenshot({ path: 'screenshot_tank_test_1_after_ambush.png' });
  console.log("Screenshot taken after Ambush scenario.");

  // --- SCENARIO 2: Test standard attack redirection ---
  // It's now the opponent's "turn" (implicitly). The AI will choose its attacker.
  // We'll manually trigger a clash where the AI is forced to act.
  // Sir Reginald (Player) attacks the Skeleton Archer (Opponent).
  // The AI will likely choose its Skeleton Warrior to clash.
  // The Skeleton Warrior will attack Sir Reginald. This damage should be redirected to Boro.
  console.log("Scenario 2: Player's Sir Reginald attacking. Expecting opponent's counter-attack to be redirected to Boro.");
  await page.click('text=Sir Reginald');
  await page.click('text=CLASH!');

  // Wait for the second clash to fully resolve
  await page.waitForTimeout(8000);

  // Final screenshot to verify the standard attack was also tanked.
  await page.screenshot({ path: 'screenshot_tank_test_2_final_state.png' });
  console.log("Screenshot taken after standard attack scenario.");
  console.log("Test complete. Please inspect the screenshots and console log.");
});
