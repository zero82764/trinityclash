const { test, expect } = require('@playwright/test');

test.describe('Ability Verification', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8000');
        await page.waitForFunction(() => window.game && window.game.imagesLoaded);
    });

    // --- Helper to setup a clash ---
    async function setupClash(page, hero1Id, hero2Id, playerTeam = [], opponentTeam = []) {
        return await page.evaluate(({ h1, h2, pTeam, oTeam }) => {
            const game = window.game;
            game.state.gamePhase = 'playing';

            // Helper to find hero by ID from the global HEROES constant
            const findHero = (id) => JSON.parse(JSON.stringify(HEROES.find(h => h.id === id)));

            // Setup Player Team
            game.state.player1Team = pTeam.length > 0 ? pTeam.map(id => findHero(id)) : [findHero(h1)];
            // Setup Opponent Team
            game.state.player2Team = oTeam.length > 0 ? oTeam.map(id => findHero(id)) : [findHero(h2)];

            // Initialize teams (HP, UUIDs) using game logic
            game.state.nextUUID = 1;
            // Assign UUIDs first as initializeTeam might need them (though logic uses uuid comparison)
            [...game.state.player1Team, ...game.state.player2Team].forEach(h => {
                h.uuid = game.state.nextUUID++;
            });

            game.initializeTeam(game.state.player1Team, 'player1');
            game.initializeTeam(game.state.player2Team, 'player2');

            // Set selection
            game.state.player1Selection = game.state.player1Team.find(h => h.id === h1);
            game.state.player2Selection = game.state.player2Team.find(h => h.id === h2);

            return {
                p1UUID: game.state.player1Selection.uuid,
                p2UUID: game.state.player2Selection.uuid
            };
        }, { h1: hero1Id, h2: hero2Id, pTeam: playerTeam, oTeam: opponentTeam });
    }

    async function executeClash(page) {
        await page.evaluate(() => {
            const game = window.game;
            game.calculateClashResult(game.state.player1Selection, game.state.player2Selection);
        });
    }

    async function getHeroState(page, uuid) {
        return await page.evaluate((uuid) => {
            const game = window.game;
            const allHeroes = [...game.state.player1Team, ...game.state.player2Team];
            return allHeroes.find(h => h.uuid === uuid);
        }, uuid);
    }

    // --- MIGHT HEROES ---

    test('Sir Reginald (Last Stand)', async ({ page }) => {
        const ids = await setupClash(page, 0, 11);
        await executeClash(page);
        const hero = await getHeroState(page, ids.p1UUID);
        expect(hero.hp).toBe(1);
        expect(hero.lastStandUsed).toBe(true);

        await executeClash(page);
        const deadHero = await getHeroState(page, ids.p1UUID);
        expect(deadHero.hp).toBe(0);
    });

    test('Grak the Crusher (Crush)', async ({ page }) => {
        // Grak (Might) vs Vex (Finesse).
        // Grak AP 6. Vex HP 7.
        // Grak deals 6 damage (ignoring reduction).
        // Vex should have 1 HP.
        // If Vex has 0 HP, it means damage was >= 7.
        // We verify that Crush logic worked (Damage > 3, i.e., not halved).
        const ids = await setupClash(page, 1, 2);

        await page.evaluate((uuid) => {
            const game = window.game;
            const hero = game.state.player1Team.find(h => h.uuid === uuid);
            hero.hp = 20; // Boost HP so he survives Vex's Strike
        }, ids.p1UUID);

        await executeClash(page);
        const target = await getHeroState(page, ids.p2UUID);

        // Vex started with 7 HP.
        // If halved (without Crush), damage would be 3. HP would be 4.
        // With Crush, damage is at least 6. HP should be <= 1.
        expect(target.hp).toBeLessThan(4);
    });

    test('Boro the Bulwark (Tank)', async ({ page }) => {
        await setupClash(page, 0, 10, [0, 6], [10]);
        const p1Id = (await page.evaluate(() => window.game.state.player1Team[0].uuid));
        const boroId = (await page.evaluate(() => window.game.state.player1Team[1].uuid));
        await executeClash(page);
        const reginald = await getHeroState(page, p1Id);
        const boro = await getHeroState(page, boroId);
        expect(reginald.hp).toBe(10);
        expect(boro.hp).toBeLessThan(10);
    });

    test('Goblin Brawler (Mob Rule)', async ({ page }) => {
        await setupClash(page, 12, 10, [12, 23], [10]);
        await executeClash(page);
        const target = await getHeroState(page, (await page.evaluate(() => window.game.state.player2Selection.uuid)));
        expect(target.hp).toBe(0);

        await setupClash(page, 12, 9, [12, 23], [9]);
        await executeClash(page);
        const warrior = await getHeroState(page, (await page.evaluate(() => window.game.state.player2Selection.uuid)));
        expect(warrior.hp).toBe(4);
    });

    test('Karn the Barbed (Bleed)', async ({ page }) => {
        const ids = await setupClash(page, 15, 9);
        await executeClash(page);
        const target = await getHeroState(page, ids.p2UUID);
        expect(target.statusEffects).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'bleed', damage: 1 })]));
    });

    test('Goblin Brute (Toughness)', async ({ page }) => {
        await page.evaluate(() => {
             const game = window.game;
             const findHero = (id) => JSON.parse(JSON.stringify(HEROES.find(h => h.id === id)));
             // 23: Brute, 12: Brawler (Goblin)
             game.state.player1Team = [findHero(23), findHero(12)];
             // Need to assign UUIDs first
             game.state.nextUUID = 1;
             game.state.player1Team.forEach(h => h.uuid = game.state.nextUUID++);

             game.initializeTeam(game.state.player1Team, 'player1');
        });
        const brute = await page.evaluate(() => window.game.state.player1Team[0]);
        expect(brute.maxHp).toBe(9);
        expect(brute.hp).toBe(9);
    });

    // --- FINESSE HEROES ---

    test('Vex (First Strike)', async ({ page }) => {
        const ids = await setupClash(page, 2, 10);
        await executeClash(page);
        const vex = await getHeroState(page, ids.p1UUID);
        const archer = await getHeroState(page, ids.p2UUID);

        expect(archer.hp).toBe(0);
        expect(vex.hp).toBe(7);
    });

    test('Lyra Nightwind (Smoke Bomb)', async ({ page }) => {
        const ids = await setupClash(page, 7, 0);
        await executeClash(page);
        const lyra = await getHeroState(page, ids.p1UUID);
        expect(lyra.hp).toBe(8);
        expect(lyra.smokeBombUsed).toBe(true);

        await executeClash(page);
        const lyraHurt = await getHeroState(page, ids.p1UUID);
        expect(lyraHurt.hp).toBeLessThan(8);
    });

    test('Goblin Cutpurse (Ambush)', async ({ page }) => {
        await setupClash(page, 0, 9, [0, 13], [9]);
        const warriorId = (await page.evaluate(() => window.game.state.player2Selection.uuid));
        await page.evaluate(() => {
            window.game.state.isClashing = false;
            window.game.resolveClash();
        });
        const warrior = await getHeroState(page, warriorId);
        expect(warrior.hp).toBe(8);
    });

    test('Seraphina (Riposte)', async ({ page }) => {
        await setupClash(page, 16, 8);
        const p1Id = await page.evaluate(() => window.game.state.player1Selection.uuid);
        const p2Id = await page.evaluate(() => window.game.state.player2Selection.uuid);

        await page.evaluate((p2UUID) => {
            const game = window.game;
            const caster = game.state.player2Team.find(h => h.uuid === p2UUID);
            game.handleFireball(caster, game.state.player1Team, 'player1');
        }, p2Id);

        const theron = await getHeroState(page, p2Id);
        expect(theron.hp).toBe(5);
    });

    test('Goblin Scout (Evasion)', async ({ page }) => {
        const ids = await setupClash(page, 21, 0);
        await executeClash(page);
        const scout = await getHeroState(page, ids.p1UUID);
        expect(scout.hp).toBe(7);
        expect(scout.evasionUsed).toBe(true);
    });

    test('Goblin Assassin (Opportunist)', async ({ page }) => {
        const ids = await setupClash(page, 22, 9);
        await page.evaluate((uuid) => {
            const game = window.game;
            const target = game.state.player2Team.find(h => h.uuid === uuid);
            target.hp = 5;
        }, ids.p2UUID);

        await executeClash(page);
        const warrior = await getHeroState(page, ids.p2UUID);
        expect(warrior.hp).toBe(0);
    });

    test('Zephyr (Gale Force)', async ({ page }) => {
        await setupClash(page, 20, 9, [20], [9, 10]);
        await page.evaluate(() => {
            window.game.state.isClashing = false;
            window.game.resolveClash();
        });
        const p2SelectionId = await page.evaluate(() => window.game.state.player2Selection.id);
        expect(p2SelectionId).toBe(10);
    });

    // --- MAGIC HEROES ---

    test('Elara (Soul Siphon)', async ({ page }) => {
        const ids = await setupClash(page, 4, 11);

         await page.evaluate((uuid) => {
            const game = window.game;
            const hero = game.state.player1Team.find(h => h.uuid === uuid);
            hero.hp = 20;
            hero.maxHp = 20;
        }, ids.p1UUID);

        await executeClash(page);
        const elaraAfter = await getHeroState(page, ids.p1UUID);
        expect(elaraAfter.maxHp).toBe(24); // 20 + 4
    });

    test('Zoltan (Overload)', async ({ page }) => {
        await setupClash(page, 5, 9, [5, 0], [9]);
        await page.evaluate(() => {
            const _originalRandom = Math.random;
            Math.random = () => 0.1;
            const game = window.game;
            game.handleOverload(game.state.player1Selection, game.state.player2Selection);
            Math.random = _originalRandom;
        });
        const reginald = await getHeroState(page, (await page.evaluate(() => window.game.state.player1Team[1].uuid)));
        expect(reginald.hp).toBe(6);
    });

    test('Master Theron (Fireball)', async ({ page }) => {
        await setupClash(page, 8, 9, [8], [9, 10]);
        await page.evaluate(() => {
             const game = window.game;
             game.handleFireball(game.state.player1Selection, game.state.player2Team, 'player2');
        });

        const warrior = await getHeroState(page, (await page.evaluate(() => window.game.state.player2Team[0].uuid)));
        const archer = await getHeroState(page, (await page.evaluate(() => window.game.state.player2Team[1].uuid)));

        expect(warrior.hp).toBe(0);
        expect(archer.hp).toBe(2);
    });

    test('Goblin Bomber (Unstable Concoction)', async ({ page }) => {
        await setupClash(page, 14, 0, [14], [0, 9]);
        await executeClash(page);

        const warrior = await getHeroState(page, (await page.evaluate(() => window.game.state.player2Team[1].uuid)));
        expect(warrior.hp).toBe(7);
    });

    test('Malachi (Chaos Bolt)', async ({ page }) => {
        const ids = await setupClash(page, 17, 9);
        await executeClash(page);
        const warrior = await getHeroState(page, ids.p2UUID);
        expect(warrior.hp).toBeLessThan(10);
    });

    test('Gyrion (Mad Scramble)', async ({ page }) => {
        await setupClash(page, 18, 9, [18, 0], [9, 10]);
         await page.evaluate(() => {
            window.game.state.isClashing = false;
            window.game.resolveClash();
        });
    });

    test('Jester (Boon of Bedlam)', async ({ page }) => {
         await setupClash(page, 19, 9, [19], [9, 10]);
         await executeClash(page);
    });

});
