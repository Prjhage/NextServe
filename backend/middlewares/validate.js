exports.validateCustomer = (req, res, next) => {
    const { name, phone } = req.body;

    if (!name || name.trim().length < 3)
        return res.status(400).json({ error: "Invalid name" });

    if (!/^[6-9]\d{9}$/.test(phone))
        return res.status(400).json({ error: "Invalid phone number" });

    next();
};