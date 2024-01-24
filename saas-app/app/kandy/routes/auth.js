const express = require("express");
const { check, validationResult } = require("express-validator");
const { PrismaClient } = require('@prisma/client');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const prisma = new PrismaClient()

router.post(
    "/signup",
    [
        check("username", "Please Enter a Valid Username")
            .not()
            .isEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({
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
            user = prisma.users.create({
                data: {
                    username: username,
                    email: email,
                    password: password
                }
            });
            const payload = {
                user: {
                    id: user.id
                }
            };
            jwt.sign(
                payload,
                "randomString", {
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

module.exports = router; 