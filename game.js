/* The Little Child - Spiel-Logik
 * Abby: 8 Jahre, 3. Klasse
 * Du bist Mamas / Papas Elternteil und kümmerst dich um sie.
 */

// ---------- Spielzustand ----------
const state = {
    day: 1,
    time: 7 * 60, // Minuten seit Mitternacht
    money: 50,
    stats: { happy: 70, hunger: 60, energy: 80, hygiene: 80, school: 50 },
    flags: {
        atSchool: false,
        atWork: false,
        schoolDoneToday: false,
        workDoneToday: false,
        wardrobe: ["Kleid"],
        groceries: 2,
    },
    scene: "home",
    outfit: "dress", // dress | school | pajama | towel
    mood: "happy",   // happy | sad | neutral | sleeping
};

// ---------- DOM-Referenzen ----------
const $ = (sel) => document.querySelector(sel);
const scene = $("#scene");
const child = $("#child");
const bubble = $("#speech-bubble");
const sceneLabel = $("#scene-label");
const outfitLabel = $("#outfit-label");
const logList = $("#log-list");
const modal = $("#modal");

// ---------- Abby als SVG-Illustration (Wasserfarbe + Tinte) ----------
const ABBY_SVG = `
<svg viewBox="0 0 220 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
  <defs>
    <filter id="r" x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/>
    </filter>
    <filter id="w" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="2" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="5"/>
    </filter>
    <radialGradient id="sk" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#fbe3ca"/><stop offset="60%" stop-color="#f1ccae"/><stop offset="100%" stop-color="#cfa17e"/>
    </radialGradient>
    <radialGradient id="hr" cx="45%" cy="25%" r="85%">
      <stop offset="0%" stop-color="#2a1d14"/><stop offset="60%" stop-color="#140a06"/><stop offset="100%" stop-color="#050302"/>
    </radialGradient>
    <radialGradient id="dr" cx="50%" cy="25%" r="85%">
      <stop offset="0%" stop-color="#ffbed2"/><stop offset="55%" stop-color="#e88aab"/><stop offset="100%" stop-color="#a14968"/>
    </radialGradient>
    <radialGradient id="ir" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#7cb4dc"/><stop offset="60%" stop-color="#2e6ba0"/><stop offset="100%" stop-color="#153a62"/>
    </radialGradient>
    <radialGradient id="pj" cx="50%" cy="20%" r="90%">
      <stop offset="0%" stop-color="#c9b6e6"/><stop offset="100%" stop-color="#6e5a98"/>
    </radialGradient>
    <radialGradient id="sh" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#6a4326"/><stop offset="100%" stop-color="#2e1a0c"/>
    </radialGradient>
  </defs>
  <ellipse cx="110" cy="478" rx="58" ry="6" fill="#000" opacity="0.18" filter="url(#r)"/>
  <path filter="url(#r)" fill="url(#hr)"
    d="M 72 72 Q 38 96 30 190 Q 25 300 42 360 Q 52 374 68 358 L 74 260 Q 76 150 88 92 Z
       M 148 72 Q 182 96 190 190 Q 195 300 178 360 Q 168 374 152 358 L 146 260 Q 144 150 132 92 Z"/>
  <path filter="url(#r)" fill="url(#sk)" d="M 86 330 Q 82 400 89 455 Q 96 463 103 455 Q 101 400 97 330 Z"/>
  <path filter="url(#r)" fill="url(#sk)" d="M 134 330 Q 138 400 131 455 Q 124 463 117 455 Q 119 400 123 330 Z"/>
  <path filter="url(#r)" fill="url(#sh)" d="M 82 455 Q 78 478 92 478 Q 106 478 106 465 L 102 452 Z"/>
  <path filter="url(#r)" fill="url(#sh)" d="M 138 455 Q 142 478 128 478 Q 114 478 114 465 L 118 452 Z"/>
  <path filter="url(#r)" fill="url(#sk)" d="M 68 175 Q 52 250 60 318 Q 66 326 74 320 Q 82 250 86 188 Z"/>
  <path filter="url(#r)" fill="url(#sk)" d="M 152 175 Q 168 250 160 318 Q 154 326 146 320 Q 138 250 134 188 Z"/>
  <path filter="url(#r)" fill="url(#sk)" d="M 82 150 Q 100 170 138 150 L 144 230 Q 100 244 76 230 Z"/>

  <g class="o-dress">
    <path filter="url(#w)" fill="url(#dr)" d="M 72 168 Q 100 186 148 168 L 178 345 Q 100 362 42 345 Z"/>
    <path fill="#8c3d5d" opacity="0.35" d="M 78 168 Q 100 180 142 168 L 142 188 Q 100 198 78 188 Z"/>
    <path stroke="#8c3d5d" stroke-width="1.4" fill="none" opacity="0.4" d="M 82 240 Q 88 290 76 340"/>
    <path stroke="#8c3d5d" stroke-width="1.4" fill="none" opacity="0.4" d="M 138 240 Q 132 290 144 340"/>
    <path stroke="#8c3d5d" stroke-width="1" fill="none" opacity="0.3" d="M 110 200 Q 108 275 114 340"/>
  </g>
  <g class="o-school">
    <path filter="url(#w)" fill="#6b4a2a" d="M 76 230 Q 100 242 144 230 L 160 335 Q 100 352 60 335 Z"/>
    <path filter="url(#w)" fill="#f5eedc" d="M 78 168 Q 100 186 142 168 L 148 232 Q 100 244 72 232 Z"/>
    <path fill="#ffffff" stroke="#b8a080" stroke-width="0.8" d="M 88 170 L 100 188 L 112 170 Z"/>
    <path fill="#b83838" d="M 94 188 L 106 188 L 104 196 L 96 196 Z"/>
    <path filter="url(#r)" fill="#7a3c28" d="M 64 175 L 72 175 L 72 285 L 64 290 Z"/>
    <path filter="url(#r)" fill="#7a3c28" d="M 148 175 L 156 175 L 156 290 L 148 285 Z"/>
  </g>
  <g class="o-pajama">
    <path filter="url(#w)" fill="url(#pj)" d="M 72 168 Q 100 186 148 168 L 160 340 Q 100 356 60 340 Z"/>
    <g fill="#fff8e8" opacity="0.65">
      <circle cx="88" cy="200" r="2.8"/><circle cx="122" cy="208" r="2.8"/>
      <circle cx="100" cy="230" r="2.8"/><circle cx="82" cy="252" r="2.8"/>
      <circle cx="130" cy="260" r="2.8"/><circle cx="110" cy="280" r="2.8"/>
      <circle cx="92" cy="305" r="2.8"/><circle cx="128" cy="315" r="2.8"/>
    </g>
  </g>
  <g class="o-towel">
    <path filter="url(#w)" fill="#f7efe0" stroke="#c7b890" stroke-width="1"
      d="M 70 168 Q 100 185 150 168 L 155 298 Q 100 312 65 298 Z"/>
    <line x1="75" y1="200" x2="145" y2="200" stroke="#cabe96" stroke-width="1" opacity="0.6"/>
    <line x1="75" y1="235" x2="145" y2="235" stroke="#cabe96" stroke-width="1" opacity="0.6"/>
    <line x1="75" y1="270" x2="145" y2="270" stroke="#cabe96" stroke-width="1" opacity="0.6"/>
  </g>

  <path fill="url(#sk)" d="M 92 138 L 93 160 Q 100 165 107 160 L 108 138 Z"/>
  <path fill="#c48f74" opacity="0.35" d="M 92 150 Q 100 156 108 150 L 108 160 Q 100 164 92 160 Z"/>
  <ellipse cx="61" cy="98" rx="5" ry="9" fill="url(#sk)" filter="url(#r)"/>
  <ellipse cx="139" cy="98" rx="5" ry="9" fill="url(#sk)" filter="url(#r)"/>
  <ellipse cx="100" cy="92" rx="38" ry="46" fill="url(#sk)" filter="url(#r)"/>
  <path filter="url(#r)" fill="url(#hr)"
    d="M 62 72 Q 70 38 100 46 Q 132 38 138 72 Q 142 90 130 92 Q 120 80 108 86 Q 100 82 92 86 Q 80 80 70 92 Q 58 90 62 72 Z"/>
  <path filter="url(#r)" fill="url(#hr)" opacity="0.95"
    d="M 60 78 Q 48 160 52 270 Q 58 276 65 270 Q 70 180 74 90 Z"/>
  <path filter="url(#r)" fill="url(#hr)" opacity="0.95"
    d="M 160 78 Q 172 160 168 270 Q 162 276 155 270 Q 150 180 146 90 Z"/>
  <path d="M 77 92 Q 85 88 92 92" stroke="#150a06" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M 108 92 Q 115 88 123 92" stroke="#150a06" stroke-width="2.2" fill="none" stroke-linecap="round"/>

  <g class="eyes-open">
    <ellipse cx="85" cy="104" rx="5" ry="6" fill="#fdfaf0"/>
    <ellipse cx="115" cy="104" rx="5" ry="6" fill="#fdfaf0"/>
    <circle cx="85" cy="105" r="3.8" fill="url(#ir)"/>
    <circle cx="115" cy="105" r="3.8" fill="url(#ir)"/>
    <circle cx="85" cy="105" r="1.8" fill="#060a14"/>
    <circle cx="115" cy="105" r="1.8" fill="#060a14"/>
    <circle cx="86.5" cy="103" r="1" fill="#ffffff"/>
    <circle cx="116.5" cy="103" r="1" fill="#ffffff"/>
    <path d="M 80 100 Q 85 98 90 100" stroke="#0a0604" stroke-width="1.2" fill="none"/>
    <path d="M 110 100 Q 115 98 120 100" stroke="#0a0604" stroke-width="1.2" fill="none"/>
  </g>
  <g class="eyes-closed">
    <path d="M 80 105 Q 85 110 90 105" stroke="#150a06" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M 110 105 Q 115 110 120 105" stroke="#150a06" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </g>

  <path d="M 98 112 Q 96 120 94 124 Q 100 128 106 124 Q 104 120 102 112"
        stroke="#b57f64" stroke-width="0.9" fill="none" stroke-linecap="round"/>
  <ellipse cx="74" cy="121" rx="8" ry="5" fill="#eb97a7" opacity="0.55"/>
  <ellipse cx="126" cy="121" rx="8" ry="5" fill="#eb97a7" opacity="0.55"/>

  <path class="mouth-happy" d="M 90 130 Q 100 138 110 130 Q 100 134 90 130 Z" fill="#b84a64" stroke="#7a2c42" stroke-width="1"/>
  <path class="mouth-sad" d="M 90 134 Q 100 127 110 134" stroke="#7a2c42" stroke-width="1.5" fill="none"/>
  <ellipse class="mouth-sleep" cx="100" cy="132" rx="3" ry="1.4" fill="#7a2c42"/>

  <rect width="220" height="500" fill="#6a4a22" opacity="0.05"/>
</svg>`;

document.querySelectorAll(".abby-container").forEach((c) => { c.innerHTML = ABBY_SVG; });

// ---------- Hilfsfunktionen ----------
function clamp(n, min = 0, max = 100) {
    return Math.max(min, Math.min(max, n));
}

function formatTime(min) {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function log(msg) {
    const li = document.createElement("li");
    li.textContent = `[${formatTime(state.time)}] ${msg}`;
    logList.prepend(li);
    while (logList.children.length > 20) logList.lastChild.remove();
}

function say(text, duration = 2200) {
    bubble.textContent = text;
    bubble.classList.remove("hidden");
    clearTimeout(say._t);
    say._t = setTimeout(() => bubble.classList.add("hidden"), duration);
}

function setScene(name, label) {
    state.scene = name;
    // nur Szenen-Klassen entfernen, nicht alle
    for (const cls of Array.from(scene.classList)) {
        if (cls.startsWith("scene-")) scene.classList.remove(cls);
    }
    scene.classList.add(`scene-${name}`);
    sceneLabel.textContent = label;
}

function setOutfit(name, label) {
    state.outfit = name;
    child.classList.remove("outfit-dress", "outfit-school", "outfit-pajama", "outfit-towel");
    child.classList.add(`outfit-${name}`);
    outfitLabel.textContent = label ? `👗 ${label}` : "";
}

function setMood(m) {
    state.mood = m;
    child.classList.remove("mood-happy", "mood-sad", "mood-sleeping");
    child.classList.add(`mood-${m === "sad" ? "sad" : m === "sleeping" ? "sleeping" : "happy"}`);
}

function updateHUD() {
    for (const key of ["happy", "hunger", "energy", "hygiene", "school"]) {
        const bar = document.getElementById("bar-" + key);
        const val = state.stats[key];
        bar.style.width = val + "%";
        bar.classList.toggle("low", val < 25);
    }
    $("#money").textContent = state.money;
    $("#day").textContent = state.day;
    $("#time").textContent = formatTime(state.time);

    // Laune an Stats koppeln
    const avg = (state.stats.happy + state.stats.hunger + state.stats.energy + state.stats.hygiene) / 4;
    if (state.mood !== "sleeping") {
        setMood(avg < 35 ? "sad" : "happy");
    }
}

function advanceTime(minutes) {
    state.time += minutes;
    // Natürlicher Verfall pro Stunde
    const hours = minutes / 60;
    state.stats.hunger  = clamp(state.stats.hunger  - 6 * hours);
    state.stats.energy  = clamp(state.stats.energy  - 4 * hours);
    state.stats.hygiene = clamp(state.stats.hygiene - 3 * hours);
    state.stats.happy   = clamp(state.stats.happy   - 2 * hours);

    // Tagwechsel
    if (state.time >= 24 * 60) {
        state.time -= 24 * 60;
        nextDay(false);
    }
    updateHUD();
    checkGameOver();
}

function nextDay(slept) {
    state.day++;
    state.flags.schoolDoneToday = false;
    state.flags.workDoneToday = false;
    state.flags.atSchool = false;
    state.flags.atWork = false;
    if (!slept) {
        state.stats.energy = clamp(state.stats.energy - 30);
        log("😴 Abby hat nicht richtig geschlafen...");
    }
    log(`🌅 Tag ${state.day} beginnt.`);
    if (state.day > 7) endGame();
}

// ---------- Modal ----------
function showModal(title, text, options = []) {
    return new Promise((resolve) => {
        $("#modal-title").textContent = title;
        $("#modal-text").innerHTML = text;
        const optsEl = $("#modal-options");
        const closeBtn = $("#modal-close");
        optsEl.innerHTML = "";
        closeBtn.classList.add("hidden");

        if (options.length === 0) {
            closeBtn.classList.remove("hidden");
            closeBtn.onclick = () => { modal.classList.add("hidden"); resolve(null); };
        } else {
            for (const opt of options) {
                const b = document.createElement("button");
                b.textContent = opt.label;
                b.onclick = () => { modal.classList.add("hidden"); resolve(opt.value); };
                optsEl.appendChild(b);
            }
        }
        modal.classList.remove("hidden");
    });
}

// ---------- Aktionen ----------
const actions = {
    async school() {
        if (state.flags.schoolDoneToday) return say("Abby war heute schon in der Schule.");
        if (state.time < 6 * 60 || state.time > 8 * 60 + 30) {
            return say("Bringzeit ist 6:00–8:30 (Schule geht von 7 bis 14 Uhr).");
        }
        if (state.stats.hygiene < 30) {
            const ok = await showModal("So in die Schule?",
                "Abby ist nicht sauber. Willst du sie trotzdem in die Schule bringen?",
                [{ label: "Ja, trotzdem", value: true }, { label: "Lieber baden", value: false }]);
            if (!ok) return;
        }
        if (state.stats.hunger < 30) {
            log("🥲 Abby hat Hunger und kann sich nicht konzentrieren.");
            state.stats.school = clamp(state.stats.school - 8);
        }
        setScene("school", "Grundschule");
        setOutfit("school", "Schuluniform");
        state.flags.atSchool = true;
        say("Tschüss! Bis später! 🎒");
        log("🚸 Abby in der Schule (7–14 Uhr).");
        advanceTime(20); // Bringweg
        // Schule dauert bis 14:00
        const schoolEnd = 14 * 60;
        const schoolHours = Math.max(0, schoolEnd - state.time);
        advanceTime(schoolHours);
        state.stats.school = clamp(state.stats.school + 20);
        state.stats.energy = clamp(state.stats.energy - 15);
        state.stats.hunger = clamp(state.stats.hunger - 30);
        state.flags.schoolDoneToday = true;
        state.flags.atSchool = false;
        setScene("home", "Zuhause");
        setOutfit("dress", "Kleid");
        say("Ich bin wieder da!");
        log("🏠 Abby ist aus der Schule zurück (14 Uhr).");

        // Zufälliges Schulereignis
        const roll = Math.random();
        if (roll < 0.3) {
            const choice = await showModal(
                "Brief aus der Schule",
                "Die Lehrerin schreibt: Abby hat morgen einen Mathe-Test. Willst du mit ihr lernen?",
                [
                    { label: "Ja, wir lernen zusammen (45 Min)", value: "learn" },
                    { label: "Sie schafft das alleine", value: "skip" },
                ]);
            if (choice === "learn") {
                advanceTime(45);
                state.stats.school = clamp(state.stats.school + 15);
                state.stats.happy = clamp(state.stats.happy + 5);
                log("📖 Ihr habt gemeinsam gelernt. +Schule, +Glück");
            } else {
                state.stats.school = clamp(state.stats.school - 5);
                log("📉 Abby lernt nicht allein...");
            }
        } else if (roll < 0.45) {
            state.stats.happy = clamp(state.stats.happy + 8);
            log("🌟 Abby hat einen neuen Freund gefunden! +Glück");
        }
        updateHUD();
    },

    async work() {
        if (state.flags.workDoneToday) return say("Du warst heute schon arbeiten.");
        if (state.time < 7 * 60 || state.time > 9 * 60) {
            return say("Arbeit geht von 8 bis 20 Uhr. Geh morgens (7–9) los.");
        }
        if (!state.flags.schoolDoneToday) {
            const ok = await showModal("Arbeiten?",
                "Abby ist noch nicht in der Schule. Wenn du jetzt arbeitest, ist sie allein.",
                [{ label: "Trotzdem gehen", value: true }, { label: "Erst Abby bringen", value: false }]);
            if (!ok) return;
            state.stats.happy = clamp(state.stats.happy - 20);
            log("😢 Abby war den ganzen Tag allein.");
        }
        setScene("work", "Büro");
        log("💼 Du gehst zur Arbeit (8–20 Uhr).");
        // Arbeit bis 20:00 Uhr
        const workEnd = 20 * 60;
        const duration = Math.max(8 * 60, workEnd - state.time);
        advanceTime(duration);
        const pay = 90 + Math.floor(Math.random() * 40);
        state.money += pay;
        state.flags.workDoneToday = true;
        setScene("home", "Zuhause");
        log(`💶 Feierabend – ${pay} € verdient.`);
        // Abby war nachmittags allein (14–20 Uhr)
        if (state.flags.schoolDoneToday) {
            state.stats.happy = clamp(state.stats.happy - 12);
            state.stats.hunger = clamp(state.stats.hunger - 15);
            log("🥺 Abby war nachmittags allein zu Hause.");
        }
        await showModal("Feierabend",
            `Ein langer Arbeitstag von 8 bis 20 Uhr.<br>Du hast <strong>${pay} €</strong> verdient.`);
        updateHUD();
    },

    async cook() {
        if (state.flags.groceries <= 0) return say("Kühlschrank leer! Einkaufen gehen.");
        const choice = await showModal("Was kochst du?", "Was möchtest du für Abby zubereiten?", [
            { label: "🥪 Schnelles Butterbrot (15 Min)", value: "sandwich" },
            { label: "🍝 Nudeln mit Soße (40 Min)", value: "pasta" },
            { label: "🥗 Gesundes Essen (55 Min)", value: "healthy" },
        ]);
        if (!choice) return;
        const map = {
            sandwich: { time: 15, hunger: 25, happy: 2, use: 1 },
            pasta:    { time: 40, hunger: 50, happy: 8, use: 1 },
            healthy:  { time: 55, hunger: 55, happy: 6, use: 2 },
        };
        const r = map[choice];
        if (state.flags.groceries < r.use) return say("Nicht genug Zutaten im Haus!");
        advanceTime(r.time);
        state.flags.groceries -= r.use;
        state.stats.hunger = clamp(state.stats.hunger + r.hunger);
        state.stats.happy  = clamp(state.stats.happy + r.happy);
        say("Mmh, lecker! 😋");
        log(`🍽️ Abby hat gegessen. +${r.hunger} Hunger`);
        updateHUD();
    },

    async shop() {
        if (state.money < 15) return say("Nicht genug Geld fürs Einkaufen.");
        const choice = await showModal("Einkaufen", `Geld: <strong>${state.money} €</strong>. Was kaufst du?`, [
            { label: "🧺 Kleiner Einkauf – 15 € (2 Mahlzeiten)", value: "small" },
            { label: "🛒 Wocheneinkauf – 35 € (6 Mahlzeiten)", value: "big" },
            { label: "Abbrechen", value: null },
        ]);
        if (!choice) return;
        const map = { small: { cost: 15, food: 2 }, big: { cost: 35, food: 6 } };
        const r = map[choice];
        if (state.money < r.cost) return say("Das Geld reicht nicht.");
        setScene("shop", "Supermarkt");
        advanceTime(45);
        state.money -= r.cost;
        state.flags.groceries += r.food;
        setScene("home", "Zuhause");
        log(`🛒 Eingekauft: +${r.food} Mahlzeiten, -${r.cost} €`);
        updateHUD();
    },

    async clothes() {
        if (state.money < 20) return say("Kleidung ist teuer, dafür fehlt Geld.");
        const choice = await showModal("Kleidung kaufen",
            `Du bist im Kinderbekleidungsgeschäft. Geld: <strong>${state.money} €</strong>`, [
            { label: "🎀 Hübsches Kleid – 25 €", value: "Kleid" },
            { label: "🧥 Warme Jacke – 40 €", value: "Jacke" },
            { label: "👟 Neue Schuhe – 30 €", value: "Schuhe" },
            { label: "Abbrechen", value: null },
        ]);
        if (!choice) return;
        const priceMap = { Kleid: 25, Jacke: 40, Schuhe: 30 };
        const p = priceMap[choice];
        if (state.money < p) return say("Nicht genug Geld!");
        setScene("clothes", "Boutique");
        advanceTime(60);
        state.money -= p;
        state.flags.wardrobe.push(choice);
        state.stats.happy = clamp(state.stats.happy + 10);
        setScene("home", "Zuhause");
        say(`Danke! ${choice} ist toll! 💕`);
        log(`🛍️ Du hast ${choice} gekauft (-${p} €). Abby freut sich!`);
        updateHUD();
    },

    async play() {
        const choice = await showModal("Spielen", "Was wollt ihr zusammen machen?", [
            { label: "🧸 Zu Hause basteln (30 Min)", value: "craft" },
            { label: "🛝 In den Park gehen (90 Min)", value: "park" },
            { label: "📚 Vorlesen (20 Min)", value: "read" },
        ]);
        if (!choice) return;
        if (choice === "park") {
            setScene("park", "Park");
            advanceTime(90);
            state.stats.happy = clamp(state.stats.happy + 25);
            state.stats.energy = clamp(state.stats.energy - 10);
            state.stats.hygiene = clamp(state.stats.hygiene - 10);
            setScene("home", "Zuhause");
            say("Das war der beste Tag! 🌈");
            log("🛝 Im Park gespielt! +25 Glück");
        } else if (choice === "craft") {
            advanceTime(30);
            state.stats.happy = clamp(state.stats.happy + 12);
            say("Schau mal, was ich gebastelt habe! ✂️");
            log("🧸 Gebastelt. +Glück");
        } else {
            advanceTime(20);
            state.stats.happy = clamp(state.stats.happy + 8);
            state.stats.school = clamp(state.stats.school + 4);
            say("Die Geschichte ist so spannend!");
            log("📚 Gemeinsam gelesen. +Glück +Schule");
        }
        updateHUD();
    },

    async bath() {
        setScene("bath", "Badezimmer");
        setOutfit("towel", "Handtuch");
        advanceTime(30);
        state.stats.hygiene = 100;
        state.stats.happy = clamp(state.stats.happy + 5);
        say("Blubb blubb! 🛁");
        log("🧼 Abby hat gebadet. Sauberkeit max!");
        setScene("home", "Zuhause");
        setOutfit("dress", "Kleid");
        updateHUD();
    },

    async sleep() {
        if (state.time < 18 * 60 && state.time > 6 * 60) {
            const ok = await showModal("Jetzt schon?",
                "Es ist noch nicht Abend. Willst du Abby wirklich ins Bett schicken?",
                [{ label: "Ja", value: true }, { label: "Nein", value: false }]);
            if (!ok) return;
        }
        setScene("night", "Schlafzimmer");
        setOutfit("pajama", "Pyjama");
        setMood("sleeping");
        say("Gute Nacht! 💤", 1500);
        log("🌙 Abby schläft. Bis morgen!");
        // Schlaf-Dauer bis 7:00
        let sleepMinutes;
        if (state.time < 7 * 60) sleepMinutes = 7 * 60 - state.time;
        else sleepMinutes = (24 * 60 - state.time) + 7 * 60;
        // Zeitsprung ohne Standard-Verfall (Schlaf regeneriert)
        state.time += sleepMinutes;
        if (state.time >= 24 * 60) {
            state.time -= 24 * 60;
            nextDay(true);
        }
        state.stats.energy = 100;
        state.stats.hunger = clamp(state.stats.hunger - 25);
        state.stats.hygiene = clamp(state.stats.hygiene - 10);
        setScene("home", "Zuhause");
        setOutfit("dress", "Kleid");
        setMood("happy");
        log("🌅 Guten Morgen!");
        updateHUD();
        checkGameOver();
    },
};

// ---------- Aktion-Binding ----------
document.querySelectorAll(".action-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
        const a = btn.dataset.action;
        btn.disabled = true;
        try {
            await actions[a]();
        } catch (e) {
            console.error(e);
        }
        btn.disabled = false;
    });
});

// ---------- Game Over ----------
function checkGameOver() {
    if (state.stats.happy <= 0) return endGame("Abby ist zu traurig geworden 💔");
    if (state.stats.hunger <= 0) return endGame("Abby hat zu viel Hunger gelitten 🥺");
    if (state.stats.energy <= 0) return endGame("Abby ist völlig erschöpft 😵");
    if (state.stats.hygiene <= 0) return endGame("Abby ist krank geworden 🤒");
}

function endGame(reason) {
    const win = !reason;
    const avg = Math.round((state.stats.happy + state.stats.hunger + state.stats.energy + state.stats.hygiene + state.stats.school) / 5);
    let grade = "Elternteil";
    if (avg >= 85) grade = "Super-Mama/Papa 🏆";
    else if (avg >= 70) grade = "Tolles Elternteil 🌟";
    else if (avg >= 50) grade = "Okay Elternteil 🙂";
    else grade = "Muss noch üben 💭";

    $("#main-screen").classList.remove("active");
    $("#end-screen").classList.add("active");
    $("#end-title").textContent = win ? `🎉 Woche geschafft!` : "Spiel beendet";
    $("#end-text").innerHTML = win
        ? `Du hast Abby eine ganze Woche lang begleitet!<br><br>
           Dein Ergebnis: <strong>${avg}/100</strong><br>
           Bewertung: <strong>${grade}</strong><br>
           Geld übrig: <strong>${state.money} €</strong>`
        : `${reason}<br><br>Versuch es nochmal – Abby braucht dich!`;
}

// ---------- Start ----------
$("#start-btn").addEventListener("click", () => {
    $("#start-screen").classList.remove("active");
    $("#main-screen").classList.add("active");
    setScene("home", "Zuhause");
    setOutfit("dress", "Kleid");
    log("🌞 Guten Morgen! Tag 1 beginnt.");
    say("Guten Morgen, Mama/Papa! 💕", 3000);
    updateHUD();
});

$("#restart-btn").addEventListener("click", () => {
    location.reload();
});
