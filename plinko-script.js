// Matter.js initialization
const { Engine, Render, Runner, World, Bodies, Events } = Matter;

const width = 600, height = 700;
const engine = Engine.create();
const { world } = engine;

const render = Render.create({
    element: document.body,
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
const rows = 8;
for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= row; col++) {
        const x = width / 2 - (row * 30) / 2 + col * 30;
        const y = 100 + row * 50;
        World.add(world, Bodies.circle(x, y, pinRadius, { isStatic: true, render: { fillStyle: "white" } }));
    }
}


// slots
const slotWidth = width / (rows + 1);
const slots = [];
for (let i = 0; i <= rows; i++) {
    const x = i * slotWidth;
    const peg = Bodies.rectangle(x, height - 50, 10, 100, { isStatic: true, render: { fillStyle: "white" } });
    slots.push(peg);
    World.add(world, peg);
}


// ball drop
document.getElementById("drop").addEventListener("click", () => {
    const randomX = width / 4 + Math.random() * (width / 2);
    const ball = Bodies.circle(randomX, 50, 10, { restitution: 0.6, render: { fillStyle: "red" } });
    World.add(world, ball);

    // colisiont detection
    Events.on(engine, "collisionStart", (event) => {
        event.pairs.forEach(({ bodyA, bodyB }) => {
            if (slots.includes(bodyA) || slots.includes(bodyB)) {
                World.remove(world, ball);
            }
        });
    });
});
