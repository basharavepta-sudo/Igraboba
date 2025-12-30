export class InputHandler {
    constructor() {
        this.keys = new Set();
        this.mouse = { x: 0, y: 0, down: false, rightDown: false };

        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);

            // Prevent default for game keys
            if (['Tab', 'KeyE', 'KeyR', 'KeyF', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
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

        // Handle focus loss
        window.addEventListener('blur', () => {
            this.keys.clear();
            this.mouse.down = false;
            this.mouse.rightDown = false;
        });
    }

    isKeyDown(key) {
        return this.keys.has(key);
    }

    isKeyPressed(key) {
        if (this.keys.has(key)) {
            this.keys.delete(key);
            return true;
        }
        return false;
    }
}
