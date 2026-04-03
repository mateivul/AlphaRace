const bigLetter = document.getElementById("bigLetter");
const progress = document.getElementById("progress");
const timer = document.getElementById("timer");
const status = document.getElementById("status");
const done = document.getElementById("done");
const finalTime = document.getElementById("finalTime");
const missEl = document.getElementById("mistakesDisplay");
const badge = document.getElementById("recordBadge");
const lbContainer = document.getElementById("lbList");
const lbTitle = document.getElementById("leaderboardTitle");
const gamesEl = document.getElementById("gamesPlayed");
const bestEl = document.getElementById("personalBest");
const avgEl = document.getElementById("averageTime");

let mode = "az";
let seq = [];
let idx = 0;
let t0 = null;
let t1 = null;
let state = "idle";
let mistakes = 0;
let raf = null;

function fmtTime(ms) {
    let s = Math.floor(ms / 1000);
    let frac = Math.floor(ms % 1000);
    return s + "." + String(frac).padStart(3, "0") + "s";
}

function genSeq(m) {
    //game mode
    let alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    if (m === "za") return alpha.reverse();
    if (m === "random") {
        for (let i = alpha.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let tmp = alpha[i];
            alpha[i] = alpha[j];
            alpha[j] = tmp;
        }
        return alpha;
    }
    return alpha;
}

function tick() {
    if (state === "playing" && t0) {
        timer.textContent = fmtTime(performance.now() - t0);
        raf = requestAnimationFrame(tick);
    }
}

function drawProgress() {
    progress.innerHTML = "";
    for (let i = 0; i < seq.length; i++) {
        let sp = document.createElement("span");
        sp.textContent = seq[i];
        if (i < idx) sp.className = "letter done";
        else if (i === idx) sp.className = "letter current";
        else sp.className = "letter upcoming";
        progress.appendChild(sp);
    }
}

function renderCurrent() {
    bigLetter.textContent = idx < 26 ? seq[idx] : "\u2713";
    bigLetter.className = state === "finished" ? "big-letter finished" : "big-letter";
}

function getBoard(m) {
    let raw = localStorage.getItem("alpharace-" + m);
    return raw ? JSON.parse(raw) : [];
}

function saveScore(m, timeMs, miss) {
    let board = getBoard(m);
    let entry = { time: timeMs, mistakes: miss, date: new Date().toISOString() };

    board.push(entry);
    board.sort((a, b) => (a.time !== b.time ? a.time - b.time : a.mistakes - b.mistakes));
    if (board.length > 10) board.length = 10;

    localStorage.setItem("alpharace-" + m, JSON.stringify(board));

    let rank = board.findIndex((e) => e.time === entry.time && e.date === entry.date);
    return rank !== -1 ? rank + 1 : null;
}

function showBoard(m) {
    let board = getBoard(m);
    let names = { az: "A-Z", za: "Z-A", random: "random" };
    lbTitle.textContent = "leaderboard - " + names[m];

    lbContainer.innerHTML = "";

    if (board.length === 0) {
        lbContainer.innerHTML = '<div class="no-scores">No scores yet</div>';
        return;
    }

    board.forEach((entry, i) => {
        let row = document.createElement("div");
        row.className = "lb-row";
        if (i === 0) row.classList.add("gold");

        let rankEl = document.createElement("span");
        rankEl.className = "lb-rank";
        rankEl.textContent = i + 1 + ".";

        let timeEl = document.createElement("span");
        timeEl.className = "lb-time";
        timeEl.textContent = fmtTime(entry.time);

        let missCol = document.createElement("span");
        missCol.className = "lb-mistakes";
        if (entry.mistakes === 0) {
            missCol.textContent = "perfect";
            missCol.style.color = "#1aab7a";
        } else {
            missCol.textContent = entry.mistakes + " miss";
        }

        row.appendChild(rankEl);
        row.appendChild(timeEl);
        row.appendChild(missCol);
        lbContainer.appendChild(row);
    });
}

function clearScores() {
    if (confirm("clear " + mode + " scores?")) {
        localStorage.removeItem("alpharace-" + mode);
        localStorage.removeItem("alpharace-stats-" + mode);
        showBoard(mode);
        updateStats();
    }
}

function getStats(m) {
    let raw = localStorage.getItem("alpharace-stats-" + m);
    return raw ? JSON.parse(raw) : { gamesPlayed: 0, totalTime: 0, bestTime: null };
}

function recordGame(m, timeMs) {
    let s = getStats(m);
    s.gamesPlayed++;
    s.totalTime += timeMs;
    if (s.bestTime === null || timeMs < s.bestTime) s.bestTime = timeMs;
    localStorage.setItem("alpharace-stats-" + m, JSON.stringify(s));
    updateStats();
}

function updateStats() {
    let s = getStats(mode);
    gamesEl.textContent = s.gamesPlayed;
    bestEl.textContent = s.bestTime !== null ? fmtTime(s.bestTime) : "-";
    avgEl.textContent = s.gamesPlayed > 0 ? fmtTime(s.totalTime / s.gamesPlayed) : "-";
}

function startGame() {
    state = "playing";
    t0 = performance.now();
    idx = 0;
    status.textContent = "";
    tick();
}

function complete() {
    t1 = performance.now();
    state = "finished";
    let total = t1 - t0;

    if (raf) cancelAnimationFrame(raf);

    renderCurrent();
    finalTime.textContent = fmtTime(total);

    if (mistakes === 0) {
        missEl.innerHTML = '<div class="perfect">PERFECT</div>';
    } else {
        missEl.innerHTML = `<div class="mistakes-text">${mistakes} mistake${mistakes > 1 ? "s" : ""}</div>`;
    }

    let rank = saveScore(mode, total, mistakes);
    if (rank !== null && rank <= 10) {
        badge.innerHTML = `<div class="record-badge">#${rank}</div>`;
    } else {
        badge.innerHTML = "";
    }

    done.classList.add("show");
    showBoard(mode);
    recordGame(mode, total);
    status.textContent = "";
}

function onKey(e) {
    let key = e.key.toUpperCase();

    if (state === "finished" && e.key === "Enter") {
        resetGame();
        return;
    }

    if (key.length !== 1 || key < "A" || key > "Z") return;

    if (state === "idle" && key === seq[0]) startGame();
    if (state !== "playing") return;

    if (key == seq[idx]) {
        idx++;
        drawProgress();
        renderCurrent();
        if (idx >= 26) complete();
    } else {
        mistakes++;
        bigLetter.classList.add("wrong");
        setTimeout(() => bigLetter.classList.remove("wrong"), 400);
    }
}

function shortcuts(e) {
    if (state === "playing" && e.code !== "Escape") return;

    if (e.code === "Escape" && state !== "playing") {
        resetGame();
        return;
    }

    if (state !== "playing") {
        if (e.code === "ArrowLeft") {
            e.preventDefault();
            cycleModes(-1);
        } else if (e.code === "ArrowRight") {
            e.preventDefault();
            cycleModes(1);
        }
    }
}

function cycleModes(dir) {
    let modes = ["az", "za", "random"];
    let i = modes.indexOf(mode);
    setMode(modes[(i + dir + 3) % 3]);
}

function setMode(m) {
    if (state === "playing") return;
    mode = m;
    document.querySelectorAll(".mode-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.mode === m);
    });
    resetGame();
}

function resetGame() {
    if (raf) cancelAnimationFrame(raf);

    seq = genSeq(mode);
    idx = 0;
    t0 = null;
    t1 = null;
    mistakes = 0;
    state = "idle";

    drawProgress();
    renderCurrent();
    timer.textContent = "0.000s";
    done.classList.remove("show");
    status.textContent = "Press " + seq[0] + " to start";

    showBoard(mode);
    updateStats();
}

function initGame() {
    document.addEventListener("keydown", (e) => {
        onKey(e);
        shortcuts(e);
    });

    document.querySelectorAll(".mode-btn").forEach((btn) => {
        btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });

    resetGame();
}
