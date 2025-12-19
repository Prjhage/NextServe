const socket = io();

function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

async function autoResetQueueIfNeeded() {
    const today = getTodayDate();
    const lastResetDate = localStorage.getItem("lastQueueResetDate");

    if (lastResetDate === today) return;

    try {
        await fetch("/admin/reset", { method: "POST" });

        localStorage.setItem("lastQueueResetDate", today);

        console.log(" Queue auto-reset for new day:", today);
    } catch (err) {
        console.error(" Auto reset failed", err);
    }
}

function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

function getDailyStats() {
    return JSON.parse(localStorage.getItem("dailyQueueStats")) || {};
}

function saveDailyStats(stats) {
    localStorage.setItem("dailyQueueStats", JSON.stringify(stats));
}

function renderDailyStats() {
    const stats = getDailyStats();
    const list = document.getElementById("dailyStatsList");

    if (!list) return;

    list.innerHTML = "";

    const dates = Object.keys(stats).sort().reverse();

    if (dates.length === 0) {
        list.innerHTML =
            "<li class='list-group-item text-muted text-center'>No data</li>";
        return;
    }

    dates.forEach((date) => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between";
        li.innerHTML = `<span>${date}</span><strong>${stats[date]}</strong>`;
        list.appendChild(li);
    });
}

renderDailyStats();

function incrementDailyCountOnce(tokenNo) {
    const servedKey = "served_token_" + tokenNo;

    //  already counted
    if (localStorage.getItem(servedKey)) return;

    const today = getTodayDate();
    const stats = getDailyStats();

    if (!stats[today]) {
        stats[today] = 0;
    }

    stats[today] += 1;

    saveDailyStats(stats);
    localStorage.setItem(servedKey, "true");

    renderDailyStats(); // refresh UI
}

//  AUTO DISMISS FLASH MESSAGES
setTimeout(() => {
    document.querySelectorAll(".alert").forEach((alertEl) => {
        const alert = bootstrap.Alert.getOrCreateInstance(alertEl);
        alert.close();
    });
}, 3000);

document.addEventListener("DOMContentLoaded", () => {
    const callNextBtn = document.getElementById("callNextBtn");
    const resetQueueBtn = document.getElementById("resetQueueBtn");

    if (callNextBtn) {
        callNextBtn.addEventListener("click", async() => {
            await fetch("/admin/next", { method: "POST" });
        });
    }

    if (resetQueueBtn) {
        resetQueueBtn.addEventListener("click", async() => {
            if (!confirm("Reset entire queue?")) return;
            await fetch("/admin/reset", { method: "POST" });
        });
    }
});

//  SOCKET QUEUE UPDATE
socket.on("queue-update", function(data) {
    const currentServing = data.currentServing;
    const tokens = data.tokens;
    tokens.forEach((t) => {
        //  ONLY when token becomes COMPLETED
        if (t.status === "completed") {
            incrementDailyCountOnce(t.tokenNo);
        }
    });

    // UPDATE NOW SERVING
    const nowServingEl = document.getElementById("nowServing");
    nowServingEl.innerText =
        currentServing !== null && currentServing !== undefined ?
        currentServing :
        "-";

    // UPDATE QUEUE LIST
    const queueList = document.getElementById("queueList");
    queueList.innerHTML = "";

    if (!tokens || tokens.length === 0) {
        const li = document.createElement("li");
        li.className = "list-group-item text-center text-muted";
        li.innerText = "No customers in queue";
        queueList.appendChild(li);
        return;
    }

    tokens.forEach((t) => {
        const li = document.createElement("li");
        li.className =
            "list-group-item d-flex justify-content-between align-items-center";

        // LEFT SIDE
        // LEFT SIDE
        const leftDiv = document.createElement("div");
        leftDiv.className = "queue-left";

        leftDiv.innerHTML = `
  <div class="queue-token">Token #${t.tokenNo}</div>
  <div class="queue-inline">
    <span class="queue-name">${t.name}</span>
    <span class="queue-arrow">⇒</span>
    <span class="queue-phone">${t.phone}</span>
  </div>
`;

        // RIGHT SIDE
        const rightDiv = document.createElement("div");
        rightDiv.className = "d-flex align-items-center gap-2";

        //  CALL BUTTON
        const callBtn = document.createElement("a");
        callBtn.href = "tel:" + t.phone;
        callBtn.className =
            "btn btn-success btn-sm rounded-circle d-flex align-items-center justify-content-center action-btn";
        callBtn.innerHTML = '<i class="bi bi-telephone-fill"></i>';
        callBtn.title = "Call customer";

        //  DELETE BUTTON
        const deleteBtn = document.createElement("button");
        deleteBtn.className =
            "btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center action-btn delete-btn";
        deleteBtn.innerHTML = '<i class="bi bi-trash-fill"></i>';
        deleteBtn.dataset.token = t.tokenNo;
        deleteBtn.title = "Delete user";

        // STATUS BADGE
        const badge = document.createElement("span");
        if (t.status === "called") {
            badge.className = "badge rounded-pill bg-success";
            badge.innerText = "CALLED";
        } else if (t.status === "completed") {
            badge.className = "badge rounded-pill bg-secondary";
            badge.innerText = "COMPLETED";
        } else {
            badge.className = "badge rounded-pill bg-warning text-dark";
            badge.innerText = "WAITING";
        }

        rightDiv.appendChild(callBtn);
        rightDiv.appendChild(deleteBtn);
        rightDiv.appendChild(badge);

        li.appendChild(leftDiv);
        li.appendChild(rightDiv);
        queueList.appendChild(li);
    });
});

//  DELETE USER HANDLER
document.addEventListener("click", async function(e) {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;

    const tokenNo = btn.dataset.token;

    if (!confirm("Delete this user from queue?")) return;

    await fetch("/admin/delete/" + tokenNo, {
        method: "POST",
    });
});

function getDailyStats() {
    if (typeof localStorage === "undefined") return {};
    return JSON.parse(localStorage.getItem("dailyQueueStats")) || {};
}
document.addEventListener("DOMContentLoaded", () => {
    autoResetQueueIfNeeded();
    renderDailyStats();
});