const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Load local file
  const filePath = 'file://' + path.resolve('index.html');
  await page.goto(filePath);

  // Wait for game to initialize and load assets
  await page.waitForFunction(() => window.game && window.game.imagesLoaded);

  // Helper to click a button by key
  const clickButton = async (key) => {
    const hitbox = await page.evaluate((k) => window.game.buttonHitboxes[k], key);
    if (!hitbox) throw new Error(`Button ${key} not found`);
    await page.mouse.click(hitbox.x + hitbox.width / 2, hitbox.y + hitbox.height / 2);
    // Wait a bit for state transition/animation
    await page.waitForTimeout(500);
  };

  // Navigate to Hero Selection
  console.log('Clicking Quick Match...');
  await clickButton('quickmatch');

  console.log('Clicking 3v3 Clash...');
  await clickButton('3v3clash');

  console.log('Clicking Normal Difficulty...');
  await clickButton('normal');

  // We are now in Hero Selection
  console.log('Hovering over first hero...');
  const firstCard = await page.evaluate(() => window.game.cardHitboxes.selection[0]);
  if (!firstCard) throw new Error('No hero cards found');

  // Move mouse to center of card to trigger hover
  const hoverX = firstCard.x + firstCard.width / 2;
  const hoverY = firstCard.y + firstCard.height / 2;
  await page.mouse.move(hoverX, hoverY);

  // Wait for lerp animation (currentScale -> 1.1)
  // Lerp is 0.15 per frame. 60fps. Should be fast. 500ms is plenty.
  await page.waitForTimeout(1000);

  // Take screenshot
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'verification_ui.png' });

  await browser.close();
  console.log('Done.');
})();
