const express = require("express");
const { check, validationResult } = require("express-validator");
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require('../middleware/auth');

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
                    res.status(200).json({
                        token
                    });
                }
            );
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Unexpected error occurred.");
        }
    }
);

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
                errors: errors.array()
            });
        }
        const { email, password } = req.body;
        try {
            let user = await prisma.users.findUnique({
                where: { email: email }
            });
            if (!user)
                return res.status(400).json({
                    message: "This email is not tied to any accounts."
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
                "secret",
                {
                    expiresIn: 3600
                },
                (err, token) => {
                    if (err) throw err;
                    res.status(200).json({
                        token
                    });
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

module.exports = router; 