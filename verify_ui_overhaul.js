const { chromium, devices } = require('playwright');

(async () => {
    // Relaunch with mobile emulation
    const mobileBrowser = await chromium.launch({ headless: true });
    // Use 'Pixel 5' from devices dictionary
    const pixel5 = devices['Pixel 5'];
    const context = await mobileBrowser.newContext({
        ...pixel5,
        hasTouch: true
    });
    const mobilePage = await context.newPage();

    try {
        console.log('Navigating (Mobile Emulation) to http://localhost:8000');
        await mobilePage.goto('http://localhost:8000', { waitUntil: 'domcontentloaded' });
        await mobilePage.waitForTimeout(2000);

        // Click "Quick Match" via Tap
        const coords = await mobilePage.evaluate(() => {
            const btn = window.game.buttonHitboxes['quickmatch'];
            return btn ? { x: btn.x + btn.width / 2, y: btn.y + btn.height / 2 } : null;
        });

        if (coords) {
            console.log(`Tapping Quick Match at ${coords.x}, ${coords.y}...`);
            await mobilePage.touchscreen.tap(coords.x, coords.y);
            await mobilePage.waitForTimeout(1000); // Wait for transition

            // Check if phase changed
            const phase = await mobilePage.evaluate(() => window.game.state.gamePhase);
            console.log(`Game Phase after tap: ${phase}`);

            if (phase === 'quickMatchSelection') {
                console.log('SUCCESS: Mobile tap registered correctly!');
                await mobilePage.screenshot({ path: 'verification/mobile_success.png' });
            } else {
                console.error('FAILURE: Mobile tap did NOT change game phase. Touch logic might be broken.');
                await mobilePage.screenshot({ path: 'verification/mobile_tap_failed.png' });
            }
        } else {
            console.error("Quick Match button not found");
        }

    } catch (error) {
        console.error("Error running test:", error);
    } finally {
        await mobileBrowser.close();
    }

    // Desktop Verification (Regression Check)
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        console.log('--- Desktop Verification ---');
        await page.goto('http://localhost:8000', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Click "Quick Match" with Mouse
        const coords = await page.evaluate(() => {
            const btn = window.game.buttonHitboxes['quickmatch'];
            return btn ? { x: btn.x + btn.width / 2, y: btn.y + btn.height / 2 } : null;
        });

        if (coords) {
             console.log(`Clicking Quick Match (Mouse) at ${coords.x}, ${coords.y}...`);
             await page.mouse.click(coords.x, coords.y);
             await page.waitForTimeout(1000);
             const phase = await page.evaluate(() => window.game.state.gamePhase);
             if (phase === 'quickMatchSelection') {
                console.log('SUCCESS: Desktop click registered correctly!');
            } else {
                console.error('FAILURE: Desktop click did NOT change game phase.');
            }
        }

    } catch(e) {
        console.error("Desktop test failed", e);
    } finally {
        await browser.close();
    }

})();
