/* The Little Child - Spiel-Logik
 * Mia: 8 Jahre, 3. Klasse
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
    scene.className = "";
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
    child.classList.remove("sad", "sleeping");
    if (m === "sad") child.classList.add("sad");
    if (m === "sleeping") child.classList.add("sleeping");
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
        log("😴 Mia hat nicht richtig geschlafen...");
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
        if (state.flags.schoolDoneToday) return say("Mia war heute schon in der Schule.");
        if (state.time < 7 * 60 || state.time > 9 * 60) return say("Dafür ist es zu spät oder zu früh.");
        if (state.stats.hygiene < 30) {
            const ok = await showModal("So in die Schule?",
                "Mia ist nicht sauber. Willst du sie trotzdem in die Schule bringen?",
                [{ label: "Ja, trotzdem", value: true }, { label: "Lieber baden", value: false }]);
            if (!ok) return;
        }
        if (state.stats.hunger < 30) {
            log("🥲 Mia hat Hunger und kann sich nicht konzentrieren.");
            state.stats.school = clamp(state.stats.school - 8);
        }
        setScene("school", "Grundschule");
        setOutfit("school", "Schuluniform");
        state.flags.atSchool = true;
        say("Tschüss! Bis später! 🎒");
        log("🚸 Mia wurde zur Schule gebracht.");
        advanceTime(60); // Bringweg + Start
        // Schule dauert bis 13:00
        const schoolHours = Math.max(0, 13 * 60 - state.time);
        advanceTime(schoolHours);
        state.stats.school = clamp(state.stats.school + 14);
        state.stats.energy = clamp(state.stats.energy - 10);
        state.stats.hunger = clamp(state.stats.hunger - 20);
        state.flags.schoolDoneToday = true;
        state.flags.atSchool = false;
        setScene("home", "Zuhause");
        setOutfit("dress", "Kleid");
        say("Ich bin wieder da!");
        log("🏠 Mia ist aus der Schule zurück.");

        // Zufälliges Schulereignis
        const roll = Math.random();
        if (roll < 0.3) {
            const choice = await showModal(
                "Brief aus der Schule",
                "Die Lehrerin schreibt: Mia hat morgen einen Mathe-Test. Willst du mit ihr lernen?",
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
                log("📉 Mia lernt nicht allein...");
            }
        } else if (roll < 0.45) {
            state.stats.happy = clamp(state.stats.happy + 8);
            log("🌟 Mia hat einen neuen Freund gefunden! +Glück");
        }
        updateHUD();
    },

    async work() {
        if (state.flags.workDoneToday) return say("Du warst heute schon arbeiten.");
        if (!state.flags.schoolDoneToday) {
            const ok = await showModal("Arbeiten?",
                "Mia ist noch nicht in der Schule. Wenn du jetzt arbeitest, ist sie allein.",
                [{ label: "Trotzdem gehen", value: true }, { label: "Erst Mia bringen", value: false }]);
            if (!ok) return;
            state.stats.happy = clamp(state.stats.happy - 15);
            log("😢 Mia war allein und ist traurig.");
        }
        setScene("work", "Büro");
        log("💼 Du gehst zur Arbeit.");
        advanceTime(5 * 60); // 5 Stunden Arbeit
        const pay = 40 + Math.floor(Math.random() * 20);
        state.money += pay;
        state.flags.workDoneToday = true;
        setScene("home", "Zuhause");
        log(`💶 Du hast ${pay} € verdient.`);
        await showModal("Feierabend", `Ein langer Arbeitstag. Du hast <strong>${pay} €</strong> verdient.`);
        updateHUD();
    },

    async cook() {
        if (state.flags.groceries <= 0) return say("Kühlschrank leer! Einkaufen gehen.");
        const choice = await showModal("Was kochst du?", "Was möchtest du für Mia zubereiten?", [
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
        log(`🍽️ Mia hat gegessen. +${r.hunger} Hunger`);
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
        log(`🛍️ Du hast ${choice} gekauft (-${p} €). Mia freut sich!`);
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
        log("🧼 Mia hat gebadet. Sauberkeit max!");
        setScene("home", "Zuhause");
        setOutfit("dress", "Kleid");
        updateHUD();
    },

    async sleep() {
        if (state.time < 18 * 60 && state.time > 6 * 60) {
            const ok = await showModal("Jetzt schon?",
                "Es ist noch nicht Abend. Willst du Mia wirklich ins Bett schicken?",
                [{ label: "Ja", value: true }, { label: "Nein", value: false }]);
            if (!ok) return;
        }
        setScene("night", "Schlafzimmer");
        setOutfit("pajama", "Pyjama");
        setMood("sleeping");
        say("Gute Nacht! 💤", 1500);
        log("🌙 Mia schläft. Bis morgen!");
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
    if (state.stats.happy <= 0) return endGame("Mia ist zu traurig geworden 💔");
    if (state.stats.hunger <= 0) return endGame("Mia hat zu viel Hunger gelitten 🥺");
    if (state.stats.energy <= 0) return endGame("Mia ist völlig erschöpft 😵");
    if (state.stats.hygiene <= 0) return endGame("Mia ist krank geworden 🤒");
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
        ? `Du hast Mia eine ganze Woche lang begleitet!<br><br>
           Dein Ergebnis: <strong>${avg}/100</strong><br>
           Bewertung: <strong>${grade}</strong><br>
           Geld übrig: <strong>${state.money} €</strong>`
        : `${reason}<br><br>Versuch es nochmal – Mia braucht dich!`;
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
