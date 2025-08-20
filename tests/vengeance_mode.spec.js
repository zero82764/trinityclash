const { test, expect } = require('@playwright/test');

test.describe('Vengeance Mode', () => {
  // Clear local storage before each test to ensure a clean slate.
  // This is crucial for vengeance mode tests.
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Impossible AI should enter Vengeance Mode and prioritize survivors on the next game', async ({ page }) => {
    test.setTimeout(120000); // Long timeout for two game plays

    // --- GAME 1: Force a player win to record a loss for the AI ---
    console.log('--- Game 1: Player wins ---');
    await page.goto('http://localhost:8000');
    await page.click('text=Quick Match');
    await page.click('text=3v3 Clash');
    await page.click('text=Impossible');

    const playerTeam = ['Sir Reginald', 'Grak the Crusher', 'Vex'];
    for (const hero of playerTeam) {
      await page.click(`text=${hero}`);
    }
    await page.click('text=Start Game');

    // Wait for the game to be in the playing phase
    await page.waitForFunction(() => window.game && window.game.state.gamePhase === 'playing');

    console.log('Game 1 started. Forcing AI defeat...');
    // Force win by setting all AI heroes to 1 HP
    await page.evaluate(() => {
      window.game.state.player2Team.forEach(hero => hero.hp = 1);
    });

    // Clash to defeat one of them and trigger game over check
    await page.click('text=Vex');
    await page.click('text=CLASH!');

    // Wait for the game over screen, confirming player victory
    await page.waitForFunction(() => window.game && window.game.state.gamePhase === 'gameOver' && window.game.state.winner === 'p1');
    console.log('Game 1 finished. Player won.');

    // Check that the loss was recorded correctly in localStorage
    const lossHistory = await page.evaluate(() => JSON.parse(localStorage.getItem('trinityClashLosses')));
    expect(lossHistory).toHaveLength(1);
    expect(lossHistory[0].defeatedBy).toEqual([0, 1, 2]); // Sorted IDs for Sir Reginald, Grak, Vex
    expect(lossHistory[0].survivors).toEqual([0, 1, 2]); // All player heroes should have survived
    console.log('Loss history verified in localStorage.');

    // --- GAME 2: Verify Vengeance Mode activation and strategy ---
    console.log('--- Game 2: Verifying Vengeance Mode ---');

    // Go back to main menu to start a new game
    await page.click('text=Main Menu');

    // Navigate to Impossible Difficulty again
    await page.click('text=Quick Match');
    await page.click('text=3v3 Clash');
    await page.click('text=Impossible');

    // Player selects the *exact same team*
    for (const hero of playerTeam) {
      await page.click(`text=${hero}`);
    }

    // Set up a listener for console messages
    const consoleLogs = [];
    page.on('console', msg => {
        console.log(`Browser Console: ${msg.text()}`);
        consoleLogs.push(msg.text());
    });

    // Start the game, which should trigger Vengeance Mode
    await page.click('text=Start Game');
    await page.waitForFunction(() => window.game && window.game.state.gamePhase === 'playing');

    console.log('Game 2 started.');

    // Verify that Vengeance Mode is active in the game state
    const isVengeanceMode = await page.evaluate(() => window.game.state.vengeanceMode);
    expect(isVengeanceMode).toBe(true);
    console.log('Vengeance mode is active in game state.');

    const vengeanceSurvivors = await page.evaluate(() => window.game.state.vengeanceSurvivors);
    expect(vengeanceSurvivors).toEqual([0, 1, 2]);
    console.log('Vengeance survivors are correctly set in game state.');

    // Check the console for the vengeance activation message
    const vengeanceActivatedLog = consoleLogs.find(log => log.includes('Vengeance mode activated against this team!'));
    expect(vengeanceActivatedLog).toBeDefined();
    console.log('Vengeance activation message found in console.');

    // Now, trigger a clash and check if the AI prioritizes a survivor
    await page.click('text=Vex'); // Player selects Vex (a survivor)
    await page.click('text=CLASH!');

    // Wait for the clash to resolve to ensure all logs are captured
    await page.waitForTimeout(8000);

    // Check that the AI's threat score calculation logged the priority target message
    const priorityTargetLog = consoleLogs.find(log => log.includes('is a priority target (survivor)'));
    expect(priorityTargetLog).toBeDefined();
    console.log('AI correctly identified a priority target.');
  });
});
