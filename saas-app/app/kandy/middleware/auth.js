const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET

const auth = function (req, res, next) {
    const token = req.header("token");
    if (!token) return res.status(401).json({ message: "Authentication error." });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Invalid token." });
    }
};

module.exports = auth;