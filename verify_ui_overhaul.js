const { chromium, devices } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('Navigating to http://localhost:8000');
        await page.goto('http://localhost:8000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Click "Quick Match"
        const coords = await page.evaluate(() => {
            const btn = window.game.buttonHitboxes['quickmatch'];
            return btn ? { x: btn.x + btn.width / 2, y: btn.y + btn.height / 2 } : null;
        });

        if (coords) {
            console.log('Clicking Quick Match...');
            await page.mouse.click(coords.x, coords.y);
            await page.waitForTimeout(1000);
        }

        // Click "3v3 Clash"
        const coords3v3 = await page.evaluate(() => {
            const btn = window.game.buttonHitboxes['3v3clash'];
            return btn ? { x: btn.x + btn.width / 2, y: btn.y + btn.height / 2 } : null;
        });

         if (coords3v3) {
            console.log('Clicking 3v3 Clash...');
            await page.mouse.click(coords3v3.x, coords3v3.y);
            await page.waitForTimeout(1000);
        }

        // Click "Normal" Difficulty
        const coordsNormal = await page.evaluate(() => {
            const btn = window.game.buttonHitboxes['normal'];
            return btn ? { x: btn.x + btn.width / 2, y: btn.y + btn.height / 2 } : null;
        });

        if (coordsNormal) {
            console.log('Clicking Normal Difficulty...');
            await page.mouse.click(coordsNormal.x, coordsNormal.y);
            await page.waitForTimeout(1000);
        }

        // --- HERO SELECTION SCREEN ---
        // 1. Initial State Screenshot (Should show "Ability Name" only)
        console.log('Taking screenshot of Hero Selection (Initial)...');
        await page.screenshot({ path: 'verification/hero_selection_initial.png' });

        // 2. Hover over first hero
        const firstHeroPos = await page.evaluate(() => {
            if (window.game.cardHitboxes.selection.length > 0) {
                 const card = window.game.cardHitboxes.selection[0];
                 return { x: card.x + card.width / 2, y: card.y + card.height / 2 };
            }
            return null;
        });

        if (firstHeroPos) {
            console.log('Hovering over first hero...');
            await page.mouse.move(firstHeroPos.x, firstHeroPos.y);
            await page.waitForTimeout(500); // Wait for hover

            // 3. Hover State Screenshot (Should show "Pop out" and "Description")
            console.log('Taking screenshot of Hero Selection (Hover)...');
            await page.screenshot({ path: 'verification/hero_selection_hover.png' });
        }

    } catch (error) {
        console.error("Error running test:", error);
    } finally {
        await browser.close();
    }
})();
