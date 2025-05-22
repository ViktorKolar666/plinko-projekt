// Matter.js initialization
const { Engine, Render, Runner, World, Bodies, Events, Body } = Matter;

const width = 600, height = 700;
const engine = Engine.create();
const { world } = engine;

const render = Render.create({
    element: document.getElementById("plinko-canvas"),
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
const slotHeight = 60;
const slots = [];
const slotColors = [];
const slotMultipliers = [];

// --- GENEROVÁNÍ NÁSOBIČŮ A BAREV ---
const multipliers = [
    100, 75, 60, 30, 15, 10, 5, 1, 0.5, 1, 5, 10, 15, 30, 60, 75, 100
];
// multipliers.length musí být rows+1 (tedy 17 při rows=16)

for (let i = 0; i <= rows; i++) {
    // Barva: čím blíž ke středu, tím tmavší červená
    const centerDist = Math.abs(i - Math.floor((rows + 1) / 2));
    const maxDist = Math.floor((rows + 1) / 2);
    // Sytost červené: 120 až 255
    const red = Math.round(120 + (255 - 120) * (centerDist / maxDist));
    const color = `rgb(${red},0,0)`;
    slotColors.push(color);
    slotMultipliers.push(`x ${multipliers[i]}`);
}

// --- VYTVOŘENÍ SLOTŮ JAKO ČTVEREC ---
for (let i = 0; i <= rows; i++) {
    const x = i * slotWidth + slotWidth / 2;
    const color = slotColors[i];
    const multiplier = slotMultipliers[i];

    // Čtvercový slot - zvětšeno na šířku slotWidth (byly 0.8)
    const slot = Bodies.rectangle(x, height - slotHeight / 2, slotWidth, slotWidth, {
        isStatic: true,
        render: { fillStyle: color }
    });
    slot.color = color;
    slot.multiplier = multiplier;
    slots.push(slot);
    World.add(world, slot);
}

// --- VYKRESLENÍ TEXTU DO SLOTŮ ---
const canvas = render.canvas;
const ctx = canvas.getContext("2d");

Events.on(render, "afterRender", () => {
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    slots.forEach((slot) => {
        const { x, y } = slot.position;
        ctx.fillStyle = "white";
        ctx.fillText(slot.multiplier, x, y);
    });
});

// ball drop
const balls = [];
const bottomWall = walls[0];

// --- EFEKT PROBLIKÁNÍ SLOTU ---
function highlightSlot(slot) {
    const originalColor = slot.color;
    slot.render.fillStyle = lightenColor(originalColor, 0.5);
    setTimeout(() => {
        slot.render.fillStyle = originalColor;
    }, 300);
}

// Funkce pro zesvětlení barvy
function lightenColor(color, amount) {
    const colorParts = color.match(/\d+/g).map(Number);
    const [r, g, b] = colorParts.map((c) => Math.min(255, c + amount * 255));
    return `rgb(${r}, ${g}, ${b})`;
}

// Detekce kolize
Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach(({ bodyA, bodyB }) => {
        balls.forEach((ball, idx) => {
            slots.forEach((slot) => {
                if ((bodyA === ball && bodyB === slot) || (bodyB === ball && bodyA === slot)) {
                    highlightSlot(slot);

                    // Získání číselné hodnoty násobiče (např. z "x 10" => 10)
                    const multiplier = parseFloat(slot.multiplier.replace("x ", ""));
                    const win = Math.round(ball.bet * multiplier);

                    // Přičtení výhry k tokenům
                    setTokens(getTokens() + win);
                    updateTokenDisplay();

                    World.remove(world, ball);
                    balls.splice(idx, 1);
                }
            });
        });
    });
});

// --- SÁZKA A VHOZENÍ MÍČKU ---
const betAmountInput = document.getElementById("bet-amount");
const startGameBtn = document.getElementById("start-game");

// Funkce pro kontrolu platnosti sázky a povolení tlačítka
function validateBetInput() {
    const value = parseFloat(betAmountInput.value);
    if (!betAmountInput.value || value <= 0) {
        startGameBtn.disabled = true;
    } else {
        startGameBtn.disabled = false;
    }
}

// Kontrola při změně hodnoty v inputu
betAmountInput.addEventListener("input", validateBetInput);
// Inicializace stavu tlačítka při načtení
validateBetInput();

startGameBtn.addEventListener("click", () => {
    const betError = document.getElementById("bet-error");
    const betAmount = parseFloat(betAmountInput.value);

    // Reset chybového stavu
    betError.style.display = "none";
    betAmountInput.classList.remove("error");

    // Validace sázky
    if (!betAmountInput.value) {
        betError.textContent = "Field cannot be empty!";
        betError.style.display = "block";
        betAmountInput.classList.add("error");
        return;
    }

    if (betAmount <= 0) {
        betError.textContent = "Bet amount must be positive!";
        betError.style.display = "block";
        betAmountInput.classList.add("error");
        return;
    }

    // Kontrola dostatku žetonů
    if (betAmount > getTokens()) {
        betError.textContent = "Not enough tokens!";
        betError.style.display = "block";
        betAmountInput.classList.add("error");
        return;
    }

    // Odečtení žetonů a aktualizace zobrazení
    setTokens(getTokens() - betAmount);
    updateTokenDisplay();

    // Spuštění balónku - užší rádius kolem středu (např. ±10% šířky)
    const center = width / 2;
    const dropRadius = width * 0.10; // 10% šířky vlevo/vpravo od středu
    const randomX = center + (Math.random() - 0.5) * 2 * dropRadius;
    const dropY = 30; // Výš než původních 50, míček bude padat nad trojúhelníkem pinů
    const ball = Bodies.circle(randomX, dropY, 10, {
        restitution: 0.6,
        render: { fillStyle: "red" }
    });
    ball.bet = betAmount; // Uložení hodnoty sázky do míčku
    balls.push(ball);
    World.add(world, ball);
});
