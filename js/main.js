document.addEventListener("DOMContentLoaded", () => {
    initGame();

    document.getElementById("clearScores").addEventListener("click", showClearConfirm);
    document.getElementById("exportScores").addEventListener("click", exportData);

    document.addEventListener("keydown", (e) => {
        if (state === "playing") return;

        if ((e.ctrlKey || e.metaKey) && e.code === "Digit1") {
            e.preventDefault();
            setMode("az");
        } else if ((e.ctrlKey || e.metaKey) && e.code === "Digit2") {
            e.preventDefault();
            setMode("za");
        } else if ((e.ctrlKey || e.metaKey) && e.code === "Digit3") {
            e.preventDefault();
            setMode("random");
        } else if ((e.ctrlKey || e.metaKey) && e.code === "KeyR") {
            e.preventDefault();
            resetGame();
        }
    });
});

function showClearConfirm() {
    const actions = document.querySelector(".leaderboard-actions");
    actions.innerHTML = `
        <span class="confirm-text">clear ${mode} scores?</span>
        <button class="confirm-yes">yes</button>
        <button class="confirm-no">no</button>
        `;
    actions.querySelector(".confirm-yes").addEventListener("click", () => {
        clearScores();
        restoreActions();
    });
    actions.querySelector(".confirm-no").addEventListener("click", restoreActions);
}

function restoreActions() {
    const actions = document.querySelector(".leaderboard-actions");
    actions.innerHTML = `
        <button id="exportScores" class="export-btn">Export</button>
        <button id="clearScores" class="clear-btn">Clear</button>
    `;
    actions.querySelector("#exportScores").addEventListener("click", exportData);
    actions.querySelector("#clearScores").addEventListener("click", showClearConfirm);
}

function exportData() {
    let data = { exported: new Date().toISOString(), leaderboards: {}, stats: {} };

    data.leaderboards.az = getBoard("az");
    data.leaderboards.za = getBoard("za");
    data.leaderboards.random = getBoard("random");
    data.stats.az = getStats("az");
    data.stats.za = getStats("za");
    data.stats.random = getStats("random");

    let blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "alpharace-" + new Date().toISOString().split("T")[0] + ".json";
    a.click();
    URL.revokeObjectURL(url);
}
