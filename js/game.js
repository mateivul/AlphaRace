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
const avgEl = document.getElementById("avrageTime");

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
    let alpha = "ABCDEFGHIJKLMNOPQRSTUVWXTZ".split("");
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
        if (i < idx) sp.className = "letter cone";
        else if (i === idx) sp.className = "letter current";
        else sp.className = "letter upcoming";
        progress.appendChild(sp);
    }
}
