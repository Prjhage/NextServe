const express = require("express");
const router = express.Router();
const queue = require("../store/queueStore");

router.get("/", (req, res) => {
    res.render("admin", { queue, dailyStats: queue.dailyStats });
});

router.post("/next", async(req, res) => {
    try {
        const io = req.app.get("io");

        if (!Array.isArray(queue.tokens)) {
            queue.tokens = [];
        }

        if (queue.isFinished) {
            return res.redirect("/admin");
        }

        //  FIND CURRENT SERVING TOKEN
        const currentToken = queue.tokens.find(
            (t) => t.tokenNo === queue.currentServing
        );

        //  COMPLETE CURRENT TOKEN
        if (currentToken && currentToken.status === "called") {
            currentToken.status = "completed";

            const today = new Date().toISOString().slice(0, 10);
            if (!queue.dailyStats[today]) {
                queue.dailyStats[today] = 0;
            }
            queue.dailyStats[today] += 1;
        }

        //  FIND ALL WAITING TOKENS
        const waitingTokens = queue.tokens.filter((t) => t.status === "waiting");
        const next = waitingTokens[0];

        //  NO NEXT => FINISH QUEUE
        if (!next) {
            queue.isFinished = true;

            io.emit("queue-update", {
                nextTokenNo: null,
                tokens: queue.tokens,
            });

            return res.redirect("/admin");
        }

        //  CALL NEXT
        next.status = "called";
        queue.currentServing = next.tokenNo;

        const upcoming = waitingTokens[1];

        io.emit("queue-update", {
            currentServing: queue.currentServing,
            nextTokenNo: upcoming ? upcoming.tokenNo : null,
            tokens: queue.tokens,
            reason: "next",
        });

        res.redirect("/admin");
    } catch (err) {
        console.error(err);
        res.redirect("/admin");
    }
});

router.post("/reset", (req, res) => {
    const io = req.app.get("io");

    queue.tokens = []; //  ONLY CLEAR on reset
    queue.currentServing = null;
    queue.isFinished = false;

    io.emit("queue-update", {
        currentServing: null,
        nextTokenNo: null,
        tokens: [],
        reason: "reset",
    });

    req.flash("success", "Queue reset successfully");
    res.redirect("/admin");
});

router.post("/delete/:tokenNo", (req, res) => {
    const io = req.app.get("io");
    const tokenNo = Number(req.params.tokenNo);

    queue.tokens = queue.tokens.filter((t) => t.tokenNo !== tokenNo);

    if (queue.currentServing === tokenNo) {
        let nextTokenNo = null;

        for (let i = 0; i < queue.tokens.length; i++) {
            if (queue.tokens[i].status === "waiting") {
                queue.currentServing = queue.tokens[i].tokenNo;
                queue.tokens[i].status = "called";
                nextTokenNo = null;
                break;
            }
        }

        if (queue.currentServing !== tokenNo) {
            // serving updated
        } else {
            queue.currentServing = null;
        }
    }

    let nextTokenNo = null;
    for (let i = 0; i < queue.tokens.length; i++) {
        if (queue.tokens[i].status === "waiting") {
            nextTokenNo = queue.tokens[i].tokenNo;
            break;
        }
    }

    io.emit("queue-update", {
        currentServing: queue.currentServing,
        nextTokenNo: nextTokenNo,
        tokens: queue.tokens,
        reason: "delete",
    });

    res.json({ success: true });
});

router.get("/display", (req, res) => {
    res.render("display", { queue });
});

router.use((req, res, next) => {
    if (req.query.key !== "admin123") {
        return res.status(403).send("Access denied");
    }
    next();
});

module.exports = router;