const express = require("express");
const { check, validationResult } = require("express-validator");
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require('../middleware/auth');
const dayjs = require("dayjs");

const prisma = new PrismaClient()

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
        check("password", "Please enter a valid password.").isLength({
            min: 6
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array()
            }).render('login');
        }
        const { email, password } = req.body;
        try {
            let user = await prisma.users.findUnique({
                where: { email: email }
            });
            if (!user)
                return res.status(400).json({
                    message: "This email is not tied to an account."
                });
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return res.status(400).json({
                    message: "The password is incorrect."
                });
            const payload = {
                user: {
                    id: user.id
                }
            };
            jwt.sign(
                payload,
                JWT_SECRET,
                {
                    expiresIn: 3600
                },
                (err, token) => {
                    if (err) throw err;
                    res.cookie("kandyCookie", token, {
                        secure: process.env.NODE_ENV !== "development",
                        httpOnly: true,
                        expires: dayjs().add(30, "days").toDate(),
                    }).render('workspaces');
                }
            );

        } catch (e) {
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
        check("password", "Please enter a valid password.").isLength({
            min: 6
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
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
                return res.status(400).json({
                    msg: "Email already taken."
                });
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
                    }).render('workspaces');
                }
            );
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Unexpected error occurred.");
        }
    }
);

module.exports = router; 