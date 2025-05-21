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
const slotHeight = 60;
const slots = [];
const slotColors = []; // Pole pro barvy slotů
const slotMultipliers = []; // Pole pro násobky

// Vytvoření barev a násobků od středu ke krajům
const maxMultiplier = 100; // Maximální násobič na krajích
const minMultiplier = 0.5; // Minimální násobič uprostřed
const halfRows = Math.floor(rows / 2);

for (let i = 0; i <= rows; i++) {
    const intensity = Math.abs(i - halfRows) / halfRows; // Intenzita barvy (0 uprostřed, 1 na krajích)
    const red = Math.round(155 + intensity * 100); // Stupňování červené barvy (tmavší uprostřed, sytější na krajích)
    const color = `rgb(${red}, 0, 0)`;
    slotColors.push(color);

    // Vytvoření násobků (snížení hodnoty střednějších násobičů)
    let multiplier;
    if (intensity < 0.5) {
        // Pro střední násobiče (blízko středu) snižujeme hodnoty
        multiplier = minMultiplier + intensity * (maxMultiplier / 4 - minMultiplier);
    } else {
        // Pro krajní násobiče (dále od středu) ponecháváme vyšší hodnoty
        multiplier = minMultiplier + intensity * (maxMultiplier - minMultiplier);
    }
    multiplier = Math.round(multiplier * 2) / 2; // Zaokrouhlení na nejbližší "číslo.5" nebo celé číslo
    slotMultipliers.push(`x ${multiplier}`);
}

for (let i = 0; i <= rows; i++) {
    const x = i * slotWidth + slotWidth / 2; // Střed každého slotu
    const color = slotColors[i]; // Barva slotu
    const multiplier = slotMultipliers[i]; // Násobek slotu

    const slot = Bodies.rectangle(x, height - slotHeight / 2, slotWidth, slotHeight, {
        isStatic: true,
        render: { fillStyle: color } // Nastavení barvy slotu
    });
    slot.color = color; // Uložíme barvu slotu
    slot.multiplier = multiplier; // Uložíme násobek slotu
    slots.push(slot);
    World.add(world, slot);
}

// Přidání textu do slotů
const canvas = render.canvas;
const ctx = canvas.getContext("2d");

Events.on(render, "afterRender", () => {
    ctx.font = "12px Arial"; // Zmenšení textu
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    slots.forEach((slot) => {
        const { x, y } = slot.position;
        ctx.fillStyle = "white"; // Barva textu
        ctx.fillText(slot.multiplier, x, y); // Vykreslení násobku na slot
    });
});

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

// Nastavení měny
const currency = "USD";
document.getElementById("currency").textContent = currency;

// Přidání funkce pro tlačítko "Start Game"
document.getElementById("start-game").addEventListener("click", () => {
    const betAmountInput = document.getElementById("bet-amount");
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

    // Spuštění balónku
    const randomX = Math.random() * (width - 40) + 20; // Náhodná pozice X pro balónek
    const ball = Bodies.circle(randomX, 50, 10, {
        restitution: 0.6,
        render: { fillStyle: "red" }
    });
    balls.push(ball); // Přidáme míček do pole míčků
    World.add(world, ball); // Přidáme míček do světa Matter.js
});
