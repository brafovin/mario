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
        bullyLevel: 0,      // 0 = kein Mobbing, steigt wenn nichts passiert
        teacherInformed: false, // Lehrerin weiß Bescheid (reduziert Mobbing)
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

// Abby-SVG aus der Hauptszene in die Vorschau klonen
// (cloneNode erhält den SVG-Namespace korrekt)
(function cloneAbbyToPreview() {
    const src = document.querySelector("#child svg");
    const dst = document.getElementById("abby-preview");
    if (src && dst && !dst.querySelector("svg")) {
        dst.appendChild(src.cloneNode(true));
    }
})();

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

// ---------- Mobbing-Ereignis ----------
async function handleBullying() {
    state.flags.bullyLevel = Math.min(3, state.flags.bullyLevel + 1);
    setMood("sad");
    state.stats.happy = clamp(state.stats.happy - 25);
    state.stats.school = clamp(state.stats.school - 5);

    const reason = state.stats.hygiene < 40
        ? "Sie sagen, sie stinkt und ihre Kleidung sei schmutzig."
        : "Sie lachen über ihr Aussehen und nennen sie „komisch“.";

    say("Mama/Papa, ich will nicht mehr hin... 😢", 4000);
    log("💔 Abby wurde in der Schule gemobbt.");

    const choice = await showModal(
        "Abby kommt weinend heim",
        `Abby ist traurig. Kinder in ihrer Klasse haben sie geärgert.<br>
         <em>${reason}</em><br><br>
         Wie reagierst du als Elternteil?`,
        [
            { label: "🤗 In den Arm nehmen und trösten", value: "comfort" },
            { label: "👂 Zuhören, was genau passiert ist", value: "listen" },
            { label: "🏫 Morgen mit der Lehrerin sprechen", value: "teacher" },
            { label: "💪 Ihr sagen, sie soll sich wehren", value: "tough" },
            { label: "🤷 „Das geht vorbei“ – nichts tun", value: "ignore" },
        ]);

    if (choice === "comfort") {
        advanceTime(30);
        state.stats.happy = clamp(state.stats.happy + 22);
        state.flags.bullyLevel = Math.max(0, state.flags.bullyLevel - 1);
        say("Danke Mama/Papa... ich fühl mich besser. 💕", 3500);
        log("🤗 Du hast Abby in den Arm genommen. +Glück");
    } else if (choice === "listen") {
        advanceTime(25);
        state.stats.happy = clamp(state.stats.happy + 14);
        state.stats.school = clamp(state.stats.school + 3);
        say("Es tut gut, dass du zuhörst.", 3000);
        log("👂 Du hast Abby zugehört. +Glück");
        await showModal("Abby erzählt",
            "Ein paar Kinder ärgern sie immer wieder auf dem Schulhof. " +
            "Sie fühlt sich einsam. Vielleicht hilft es, mit der Lehrerin zu reden.");
    } else if (choice === "teacher") {
        state.flags.teacherInformed = true;
        state.flags.bullyLevel = Math.max(0, state.flags.bullyLevel - 2);
        state.stats.happy = clamp(state.stats.happy + 10);
        say("Gut, dass du das machst, Mama/Papa.", 3000);
        log("🏫 Du hast dich entschieden, mit der Lehrerin zu sprechen.");
        await showModal("Gute Entscheidung",
            "Du wirst morgen früh mit der Lehrerin sprechen. " +
            "Mobbing hört selten von allein auf &ndash; Abby braucht Erwachsene, die sie schützen.");
    } else if (choice === "tough") {
        advanceTime(10);
        state.stats.happy = clamp(state.stats.happy - 8);
        state.flags.bullyLevel = Math.min(3, state.flags.bullyLevel + 1);
        say("Aber... ich bin doch viel kleiner als die.", 3500);
        log("😟 Abby fühlt sich noch mehr allein gelassen.");
    } else {
        // ignore
        state.stats.happy = clamp(state.stats.happy - 15);
        state.flags.bullyLevel = Math.min(3, state.flags.bullyLevel + 1);
        say("Niemand versteht mich... 😭", 3500);
        log("💔 Abby wurde allein gelassen. Das Mobbing wird schlimmer.");
    }
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

        // Falls letztes Mal beschlossen wurde, mit der Lehrerin zu sprechen
        if (state.flags.teacherInformed && state.flags.bullyLevel >= 0) {
            await showModal("Gespräch mit der Lehrerin",
                "Du hast die Lehrerin vor dem Unterricht angesprochen. " +
                "Sie hört dir ernst zu und verspricht, die Klasse für das " +
                "Thema Mobbing zu sensibilisieren.");
            log("🧑‍🏫 Du hast mit der Lehrerin gesprochen.");
            state.flags.bullyLevel = Math.max(0, state.flags.bullyLevel - 1);
        }
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
        log("🏠 Abby ist aus der Schule zurück (14 Uhr).");

        // --- Mobbing-Check ---
        // Höhere Wahrscheinlichkeit wenn: schmutzig, schon gemobbt (nicht gelöst),
        // Lehrerin nicht informiert
        let bullyChance = 0.22;
        if (state.stats.hygiene < 40) bullyChance += 0.25;
        if (state.flags.bullyLevel > 0) bullyChance += 0.20 * state.flags.bullyLevel;
        if (state.flags.teacherInformed) bullyChance *= 0.35;

        if (Math.random() < bullyChance) {
            await handleBullying();
            updateHUD();
            return;
        }

        // Zufälliges gutes Schulereignis
        say("Ich bin wieder da!");
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
