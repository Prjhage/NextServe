const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "..", "queueData.json");

function loadData() {
    try {
        if (fs.existsSync(dataFile)) {
            const data = fs.readFileSync(dataFile, "utf8");
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("Error loading queue data:", err);
    }
    return {
        currentServing: null,
        tokens: [],
        dailyStats: {},
        isFinished: false,
    };
}

function saveData(data) {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error saving queue data:", err);
    }
}

const queue = loadData();

module.exports = new Proxy(queue, {
    set(target, prop, value) {
        target[prop] = value;
        saveData(target);
        return true;
    },
    get(target, prop) {
        return target[prop];
    },
});