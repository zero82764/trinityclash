const { test, expect } = require('@playwright/test');

test('prevent multiple game over screens', async ({ page }) => {
  // 1. Load the game with domcontentloaded wait
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // 2. Wait for the game to initialize
  await page.waitForFunction(() => window.game && window.game.state.gamePhase === 'mainMenu');

  // 3. Force state to 'playing'
  await page.evaluate(() => {
    window.game.state.gamePhase = 'playing';
    window.game.state.player1Team = [{ id: 0, name: 'Hero1', hp: 10, maxHp: 10, type: 'Might' }];
    window.game.state.player2Team = [{ id: 1, name: 'Hero2', hp: 10, maxHp: 10, type: 'Magic' }];
    window.game.state.winner = null;
    // Initialize battleLog correctly as an array containing one empty array for the current round
    window.game.state.battleLog = [[]];
  });

  // 4. Trigger Game Over
  await page.evaluate(() => {
    window.game.state.player2Team[0].hp = 0;
  });

  // 5. Call checkGameOver() first time
  const isGameOver1 = await page.evaluate(() => window.game.checkGameOver());
  expect(isGameOver1).toBe(true);

  // 6. Verify Winner immediately
  const winner1 = await page.evaluate(() => window.game.state.winner);
  expect(winner1).toBe('p1');

  // 7. Wait for the log to appear (game has 1000ms delay)
  await page.waitForFunction(() => {
      // battleLog structure is [[{text:'...', color:'...'}, ...], ...]
      // flat() makes it [{text: ...}, ...]
      // Each message is an array of parts: [{text: 'VICTORY!', ...}]
      // Wait, log() pushes `messageParts` which is an array of objects.
      // So battleLog is `[[ [ {text...}, {text...} ], [ {text...} ] ]]`
      // So flat() gives `[ [{text...}], [{text...}] ]`
      // So we need to flatten twice or check differently.

      // Let's debug the structure if needed, but based on code:
      // this.state.battleLog[...].push(messageParts);
      // messageParts is [{text: ...}, {text: ...}]

      const allMessages = window.game.state.battleLog.flat(); // [ [{text...}], [{text...}] ]
      return allMessages.some(msgArr => msgArr.some(part => part.text === 'VICTORY!' || part.text === 'DEFEAT!'));
  }, { timeout: 5000 });

  const logCount1 = await page.evaluate(() => {
      const allMessages = window.game.state.battleLog.flat();
      return allMessages.filter(msgArr => msgArr.some(part => part.text === 'VICTORY!' || part.text === 'DEFEAT!')).length;
  });
  expect(logCount1).toBe(1);

  // 8. Call checkGameOver() second time
  const isGameOver2 = await page.evaluate(() => window.game.checkGameOver());
  expect(isGameOver2).toBe(true);

  // 9. Wait a bit to ensure no extra log appears
  await page.waitForTimeout(1500);

  // 10. Verify Logs again - count should NOT increase
  const logCount2 = await page.evaluate(() => {
      const allMessages = window.game.state.battleLog.flat();
      return allMessages.filter(msgArr => msgArr.some(part => part.text === 'VICTORY!' || part.text === 'DEFEAT!')).length;
  });
  expect(logCount2).toBe(1);
});
