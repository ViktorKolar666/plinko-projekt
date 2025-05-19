// Matter.js initialization
const { Engine, Render, Runner, World, Bodies, Events } = Matter;

const width = 600, height = 700;
const engine = Engine.create();
const { world } = engine;

const render = Render.create({
    element: document.getElementById("plinko-canvas"), // změna zde
    engine: engine,
    options: {
        width,
        height,
        wireframes: false,
        background: "#1D1F1F"
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);


// walls
const walls = [
    Bodies.rectangle(width / 2, height, width, 20, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 20, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 20, height, { isStatic: true })
];
World.add(world, walls);


// pins
const pinRadius = 5;
const rows = 16; // více řad pro větší trojúhelník
const pinSpacingY = (height - 200) / (rows - 1); // posuneme piny výše, aby nekolidovaly se sloty
const pinSpacingX = width / rows; // šířka trojúhelníku

for (let row = 0; row < rows; row++) {
    const pinsInRow = row + 1;
    const offsetX = (width - pinsInRow * pinSpacingX) / 2 + pinSpacingX / 2;
    const y = 50 + row * pinSpacingY; // posuneme piny výše
    for (let col = 0; col < pinsInRow; col++) {
        const x = offsetX + col * pinSpacingX;
        World.add(world, Bodies.circle(x, y, pinRadius, { isStatic: true, render: { fillStyle: "white" } }));
    }
}


// slots
const slotWidth = width / (rows + 1);
const slotHeight = 50; // zkrátíme výšku slotů
const slots = [];
for (let i = 0; i <= rows; i++) {
    const x = i * slotWidth;
    const peg = Bodies.rectangle(x, height - slotHeight / 2, 10, slotHeight, { isStatic: true, render: { fillStyle: "white" } });
    slots.push(peg);
    World.add(world, peg);
}


// ball drop
const balls = [];
const bottomWall = walls[0]; // spodní stěna

document.getElementById("drop").addEventListener("click", () => {
    const randomX = width / 4 + Math.random() * (width / 2);
    const ball = Bodies.circle(randomX, 50, 10, { restitution: 0.6, render: { fillStyle: "red" } });
    balls.push(ball);
    World.add(world, ball);
});

// Událost nastav pouze jednou!
Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach(({ bodyA, bodyB }) => {
        balls.forEach((ball, idx) => {
            if ((bodyA === ball && bodyB === bottomWall) || (bodyB === ball && bodyA === bottomWall)) {
                World.remove(world, ball);
                balls.splice(idx, 1); // odeber z pole, aby se nemazal znovu
            }
        });
    });
});
