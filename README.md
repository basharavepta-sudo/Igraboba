# Glor.io Clone

A single-player survival tower defense game inspired by Glor.io.

## Features
*   **Resources**: Gather Wood, Stone, and Food from the environment.
*   **Building**: Build Walls (Wood/Stone), Towers, and Gold Mines.
*   **Units**: Hire Peasants to gather resources and Guards to protect you.
*   **Combat**: Fight off Wolves and level up your character.
*   **Progression**: Earn Gold and XP to climb the leaderboard.

## Controls
*   **WASD**: Move
*   **Mouse**: Aim
*   **Left Click**: Attack / Build
*   **Right Click**: Cancel Build Mode
*   **1**: Build Wood Wall (10 Wood)
*   **2**: Build Stone Wall (10 Stone)
*   **3**: Build Tower (50 Wood, 20 Stone)
*   **4**: Build Gold Mine (50 Wood, 50 Stone)
*   **5**: Hire Peasant (50 Food) - Auto-gathers resources
*   **6**: Hire Guard (50 Food, 50 Gold) - Auto-attacks enemies

## How to Run
Simply open `index.html` in a web browser.
For best results, use a local server (e.g., `python3 -m http.server` or VS Code Live Server) to avoid CORS issues with modules, though it should work directly in modern browsers if no external assets are loaded.

## Development
*   `src/game.js`: Main game loop and logic.
*   `src/player.js`: Player entity and controls.
*   `src/objects.js`: World objects (Trees, Stones).
*   `src/buildings.js`: Building logic.
*   `src/units.js`: Unit AI and logic.
