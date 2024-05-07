const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET

const auth = function (req, res, next) {
    const token = req.cookies["kandyCookie"];
    if (!token) return res.status(403).redirect('/auth/login');
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        res.locals.user = decoded.user;
        next();
    } catch (e) {
        console.error(e);
        res.status(403).redirect('/auth/login');
    }
};

module.exports = auth;