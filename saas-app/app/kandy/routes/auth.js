const express = require("express");
const { check, validationResult } = require("express-validator");
const prisma = require('../prisma/client');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require('../middleware/auth');
const dayjs = require("dayjs");
var analytics = require('../util/analytics')

const JWT_SECRET = process.env.JWT_SECRET

router.get("/me", auth, async (req, res) => {
    try {
        const user = await prisma.users.findUnique({ where: { id: req.user.id } });
        res.json(user);
    } catch (e) {
        console.log(e)
        res.send({ message: "Error fetching user." });
    }
});

router.get('/login', async (req, res) => {
    res.render('login');
})

router.post(
    "/login",
    [
        check("email", "Please enter a valid email.").isEmail(),
        check("password", "Password must be at least 6 characters long.").isLength({
            min: 6
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.locals.errors = errors.errors.map(error => error.msg);
            return res.status(400).render('login');
        }
        const { email, password } = req.body;
        try {
            let user = await prisma.users.findUnique({
                where: { email: email }
            });
            if (!user) {
                res.locals.errors = ["This email is not connected to an account."]
                return res.status(400).render('login')
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.locals.errors = ["The password is incorrect."]
                return res.status(400).render('login')
            }
            const payload = {
                user: {
                    id: user.id
                }
            };
            let delete_period = new Date(new Date().setDate(new Date().getDate() - 30))
            if (user.deleted_at & user.deleted_at < delete_period) {
                res.locals.errors = ["This email is not connected to an account."]
                return res.status(400).render('login')
            }
            else if (user.deleted_at & user.deleted_at > delete_period) {
                await prisma.users.update({
                    where: { id: user.id },
                    data: { deleted_at: null }
                });
            }
            jwt.sign(
                payload,
                JWT_SECRET,
                {
                    expiresIn: 3600
                },
                (err, token) => {
                    if (err) throw err;

                    analytics.identify(user.id)

                    res.cookie("kandyCookie", token, {
                        secure: process.env.NODE_ENV !== "development",
                        httpOnly: true,
                        expires: dayjs().add(30, "days").toDate(),
                    }).redirect('/workspaces');
                }
            );
        }

        catch (e) {
            console.error(e);
            res.status(500).json({
                message: "Server Error"
            });
        }
    }
);

router.get('/logout', async (req, res) => {
    res.clearCookie('kandyCookie', {
        path: '/'
    });
    res.redirect('/');
})

router.get('/signup', async (req, res) => {
    res.render('signup');
})

router.post(
    "/signup",
    [
        check("username", "Please enter a valid username.")
            .not()
            .isEmpty(),
        check("email", "Please enter a valid email.").isEmail(),
        check("password", "Password must be at least 6 characters long.").isLength({
            min: 6
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.locals.errors = errors.errors.map(error => error.msg);
            return res.status(400).render('signup')
        }
        var {
            name,
            last_name,
            username,
            email,
            password
        } = req.body;
        try {
            let user = await prisma.users.findUnique({
                where: { email: email }
            });
            if (user) {
                res.locals.errors = ["Email already taken. Try logging in instead."]
                return res.status(400).render('signup')
            }

            const salt = await bcrypt.genSalt(10);
            password = await bcrypt.hash(password, salt);
            newUser = await prisma.users.create({
                data: {
                    id: uuidv4(),
                    name: name,
                    last_name: last_name,
                    username: username,
                    email: email,
                    password: password
                }
            });

            const payload = {
                user: {
                    id: newUser.id
                }
            };
            jwt.sign(
                payload,
                JWT_SECRET, {
                expiresIn: 10000
            },
                (err, token) => {
                    if (err) throw err;
                    res.cookie("kandyCookie", token, {
                        secure: process.env.NODE_ENV !== "development",
                        httpOnly: true,
                        expires: dayjs().add(30, "days").toDate(),
                    }).redirect('/workspaces');
                }
            );
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Unexpected error occurred.");
        }
    }
);

module.exports = router; 