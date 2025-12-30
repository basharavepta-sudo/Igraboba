import { Game } from './game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create game instance and expose it globally for UI buttons
    const game = new Game(canvas);
    window.game = game;
    game.start();

    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        game.resize(canvas.width, canvas.height);
    });

    console.log('Escape from Tarkov 2D loaded!');
    console.log('Controls:');
    console.log('  WASD - Move');
    console.log('  Mouse - Aim');
    console.log('  LMB - Shoot');
    console.log('  R - Reload');
    console.log('  Q - Switch weapon');
    console.log('  Tab - Inventory');
    console.log('  F - Interact');
    console.log('  E - Use medkit');
    console.log('  Shift - Sprint');
});
