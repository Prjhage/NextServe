module.exports.validateCustomer = (req, res, next) => {
    const { name, phone } = req.body;

    if (!name || name.trim().length < 3) {
        return res.status(400).json({
            error: "Name must be at least 3 characters",
        });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
        return res.status(400).json({
            error: "Enter a valid mobile number",
        });
    }

    next();
};