require("dotenv").config();

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const flash = require("connect-flash");
const path = require("path");

const apiRoutes = require("./routes/api");
const adminRoutes = require("./routes/admin");
const errorHandler = require("./middlewares/errorHandler");
const queue = require("./store/queueStore");

const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(
    session({
        secret: "queue-secret",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 30 * 60 * 1000 },
    })
);

app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

app.use("/api", apiRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/admin")) {
        return res.status(404).send("Not Found");
    }

    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(errorHandler);

const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
    },
});

app.set("io", io);

io.on("connection", (socket) => {
    const upcoming = queue.tokens.find((t) => t.status === "waiting");

    socket.emit("queue-update", {
        currentServing: queue.currentServing,
        nextTokenNo: upcoming ? upcoming.tokenNo : null,
        tokens: queue.tokens,
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(` Server running on port ${PORT}`));