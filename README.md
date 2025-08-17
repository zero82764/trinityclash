# Trinity Clash

## Overview

Trinity Clash is a single-player, browser-based strategy card game. Players assemble a team of heroes to battle against an AI opponent. The game is built entirely with HTML, CSS, and vanilla JavaScript, offering a complete and engaging experience directly in your web browser.

The core mechanic of the game is the **Trinity Advantage** system, a rock-paper-scissors relationship between hero types:
*   **Might** heroes are strong against **Finesse** heroes.
*   **Finesse** heroes are strong against **Magic** heroes.
*   **Magic** heroes are strong against **Might** heroes.

Exploiting these advantages is key to victory, as it doubles your damage while halving the opponent's.

## Features

*   **Rich Hero Roster**: A diverse cast of over 20 heroes, each with unique stats and special abilities.
*   **Multiple Game Modes**:
    *   **3v3 & 5v5 Clash**: Standard game modes with different team sizes.
    *   **Boss Battle**: A challenging mode where a team of 5 heroes faces a single, powerful boss.
    *   **Practice Mode**: A sandbox mode to test team compositions and strategies.
*   **Adjustable AI Difficulty**: Face off against Easy, Normal, or Expert level AI opponents.
*   **In-Game Guides**: A "How to Play" section and a "Hero Viewer" are available in the main menu to help new players get started.
*   **Zero Dependencies**: The game itself runs without any external libraries or frameworks.

## How to Play

Since the game is a single HTML file, you only need a simple local web server to run it.

1.  **Start a local server**:
    If you have Python installed, you can run one of the following commands in the project's root directory:
    ```bash
    # For Python 3
    python -m http.server
    # For Python 2
    python -m SimpleHTTPServer
    ```
    Alternatively, you can use any other local server tool, like `npx serve`.

2.  **Open the game**:
    Open your web browser and navigate to `http://localhost:8000` (or the port your server is running on).

3.  **Enjoy!**

## Running Tests

The project uses [Playwright](https://playwright.dev/) for end-to-end testing.

1.  **Install dependencies**:
    You'll need Node.js and npm installed.
    ```bash
    npm install
    ```

2.  **Run the tests**:
    Make sure the game is running on `http://localhost:8000` first. Then, run the following command:
    ```bash
    npx playwright test
    ```
    This will execute the test scripts located in the `tests/` directory. You can view the results and detailed reports in the `playwright-report/` directory.
