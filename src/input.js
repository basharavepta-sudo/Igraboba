export class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false, rightDown: false };

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.down = true;
            if (e.button === 2) this.mouse.rightDown = true;
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.down = false;
            if (e.button === 2) this.mouse.rightDown = false;
        });

        // Prevent context menu
        window.addEventListener('contextmenu', e => e.preventDefault());
    }

    isKeyDown(key) {
        return !!this.keys[key];
    }
}
