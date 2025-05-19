// Matter.js initialization
const { Engine, Render, Runner, World, Bodies, Events, Body } = Matter;

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
const rows = 16; 
const pinSpacingY = (height - 200) / (rows - 1); 
const pinSpacingX = width / rows; 

for (let row = 0; row < rows; row++) {
    const pinsInRow = row + 1;
    const offsetX = (width - pinsInRow * pinSpacingX) / 2 + pinSpacingX / 2;
    const y = 50 + row * pinSpacingY; 
    for (let col = 0; col < pinsInRow; col++) {
        const x = offsetX + col * pinSpacingX;
        World.add(world, Bodies.circle(x, y, pinRadius, { isStatic: true, render: { fillStyle: "white" } }));
    }
}


// slots
const slotWidth = width / (rows + 1);
const slotHeight = 60; // Zvýšení výšky slotů
const slots = [];
const slotColors = ["red", "blue", "green", "yellow", "purple"]; // Barvy pro sloty

for (let i = 0; i <= rows; i++) {
    const x = i * slotWidth + slotWidth / 2; // Střed každého slotu
    const color = slotColors[i % slotColors.length]; // Cyklické přiřazení barev
    const slot = Bodies.rectangle(x, height - slotHeight / 2, slotWidth, slotHeight, {
        isStatic: true,
        render: { fillStyle: color } // Nastavení barvy slotu
    });
    slot.color = color; // Uložíme barvu slotu
    slots.push(slot);
    World.add(world, slot);
}


// ball drop
const balls = [];
const bottomWall = walls[0];

document.getElementById("drop").addEventListener("click", () => {
    const minX = width / 3;
    const maxX = (2 * width) / 3; 
    const randomX = minX + Math.random() * (maxX - minX); 
    const ball = Bodies.circle(randomX, 50, 10, { restitution: 0.6, render: { fillStyle: "red" } });
    balls.push(ball);
    World.add(world, ball);
});

// Efekt rozsvícení slotu
function highlightSlot(slot) {
    const originalColor = slot.color; // Uložíme původní barvu
    slot.render.fillStyle = lightenColor(originalColor, 0.5); // Nastavíme světlejší barvu
    setTimeout(() => {
        slot.render.fillStyle = originalColor; // Vrátíme původní barvu po jedné sekundě
    }, 1000); // Doba svícení: 1 sekunda
}

// Funkce pro zesvětlení barvy
function lightenColor(color, amount) {
    const colorParts = color.match(/\d+/g).map(Number); // Extrahujeme RGB hodnoty
    const [r, g, b] = colorParts.map((c) => Math.min(255, c + amount * 255)); // Zesvětlíme barvu
    return `rgb(${r}, ${g}, ${b})`; // Vrátíme novou barvu jako RGB
}

// Detekce kolize
Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach(({ bodyA, bodyB }) => {
        // Projdeme všechny míčky
        balls.forEach((ball, idx) => {
            // Projdeme všechny sloty
            slots.forEach((slot) => {
                if ((bodyA === ball && bodyB === slot) || (bodyB === ball && bodyA === slot)) {
                    // Míček zasáhl slot
                    highlightSlot(slot); // Rozsvítíme slot
                    World.remove(world, ball); // Odstraníme míček ze světa
                    balls.splice(idx, 1); // Odebereme míček z pole
                }
            });
        });
    });
});
