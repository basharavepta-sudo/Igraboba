export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function checkCircleCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < obj1.radius + obj2.radius;
}
