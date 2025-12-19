const express = require("express");
const router = express.Router();
const queue = require("../store/queueStore");
const { validateCustomer } = require("../middlewares/validate");

router.post("/token", validateCustomer, (req, res) => {
    const { name, phone } = req.body;

    const tokenNo = queue.tokens.length + 1;

    const token = {
        tokenNo,
        name,
        phone,
        status: "waiting",
        createdAt: Date.now(),
    };

    queue.tokens.push(token);


    req.session.tokenNo = tokenNo;

    res.json({
        tokenNo,
        currentServing: queue.currentServing,
    });
});
router.get("/status", (req, res) => {
    res.json({
        currentServing: queue.currentServing,
        tokens: queue.tokens,
    });
});

module.exports = router;