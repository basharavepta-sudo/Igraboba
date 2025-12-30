import { Game } from './game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const game = new Game(canvas);
    game.start();

    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        game.resize(canvas.width, canvas.height);
    });
});
