const { test, expect } = require('@playwright/test');

test.describe('Vengeance Mode Impossible Check', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8000');
        await page.evaluate(() => localStorage.clear());
    });

    test('AI enters Vengeance Mode and hard-counters player', async ({ page }) => {
        // 1. Seed LocalStorage with a past defeat
        // Player Team: IDs 0, 1, 6 (All Might Heroes: Sir Reginald, Grak, Boro)
        const playerTeamIds = [0, 1, 6];
        const lossRecord = {
            defeatedBy: playerTeamIds,
            survivors: playerTeamIds,
            timestamp: new Date().toISOString()
        };

        await page.evaluate((record) => {
            localStorage.setItem('trinityClashLosses', JSON.stringify([record]));
        }, lossRecord);

        // 2. Start Game via State Manipulation (Bypass UI selectors)
        await page.reload();
        await page.waitForFunction(() => window.game && window.game.imagesLoaded);

        await page.evaluate(async () => {
            const game = window.game;
            game.state.difficulty = 'impossible';
            game.state.teamSize = 3;
            game.state.gamePhase = 'heroSelection';

            // Wait for hitboxes to be populated by the draw loop
            await new Promise(r => setTimeout(r, 200));

            // Find target heroes (Might type) in the selection list
            // We use the hitboxes because we can't access HEROES global easily
            const targetIds = [0, 1, 6];
            const selectionBoxes = game.cardHitboxes.selection;

            if (selectionBoxes.length === 0) throw new Error("No selection hitboxes found");

            targetIds.forEach(id => {
                const box = selectionBoxes.find(b => b.hero.id === id);
                if (box) {
                     // Simulate selection logic exactly as the game does
                     const newHero = JSON.parse(JSON.stringify(box.hero));
                     newHero.uuid = game.state.nextUUID++;
                     game.state.player1Team.push(newHero);
                } else {
                    console.error("Could not find hero with ID " + id);
                }
            });

            // Start the game logic
            game.startGame();
        });

        // 3. Verify Vengeance Mode Activation
        await page.waitForFunction(() => window.game && window.game.state.gamePhase === 'playing');

        const gameState = await page.evaluate(() => {
            return {
                vengeanceMode: window.game.state.vengeanceMode,
                player2Team: window.game.state.player2Team,
                player1Team: window.game.state.player1Team
            };
        });

        expect(gameState.vengeanceMode).toBe(true);
        console.log('Vengeance Mode Activated:', gameState.vengeanceMode);

        // 4. Verify Counter-Picking (Magic counters Might)
        const aiTeam = gameState.player2Team;
        console.log('Player Team:', gameState.player1Team.map(h => `${h.name} (${h.type})`));
        console.log('AI Team Selection:', aiTeam.map(h => `${h.name} (${h.type})`));

        const magicHeroes = aiTeam.filter(h => h.type === 'Magic');

        // Assertion: The AI should overwhelmingly pick Magic heroes to counter Might.
        expect(magicHeroes.length).toBeGreaterThanOrEqual(2);
        console.log(`Verified: AI picked ${magicHeroes.length}/3 Magic heroes.`);

        // 5. Verify "Impossible" Stats via Simulation
        const simulationResult = await page.evaluate(() => {
            const p1 = window.game.state.player1Team[0]; // Might
            // Find a Magic hero on AI team to simulate against
            const p2 = window.game.state.player2Team.find(h => h.type === 'Magic') || window.game.state.player2Team[0];

            // Use internal simulation
            // Note: simulateClash returns [p1Dealt, p2Dealt]
            return window.game.simulateClash(p1, p2);
        });

        const [p1Damage, p2Damage] = simulationResult;
        console.log(`Clash Simulation (Player vs AI Counter): Player deals ${p1Damage}, AI deals ${p2Damage}`);

        // Assertion: AI deals significantly more damage
        expect(p2Damage).toBeGreaterThan(p1Damage);

        // Strict Assertion: AI deals at least double the player's damage (Type Advantage + potential boosts)
        // Might (4) vs Magic: Player deals ~2.
        // Magic (8) vs Might: AI deals ~16.
        expect(p2Damage).toBeGreaterThanOrEqual(p1Damage * 2);
        console.log('Verified: AI deals massive counter damage.');
    });
});
