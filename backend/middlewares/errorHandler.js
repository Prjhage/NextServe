module.exports = (err, req, res, next) => {
    console.error("Error:", err.message);

    // API error (React)
    if (req.originalUrl.startsWith("/api")) {
        return res.status(500).json({
            error: err.message || "Internal Server Error",
        });
    }

    // EJS error (Admin)
    res.status(500).send("<h2>Something went wrong</h2>");
};