const { PrismaClient } = require('@prisma/client');
var express = require('express');
const { logger } = require('structlog');
var router = express.Router();

const prisma = new PrismaClient()

router.get('/', async (req, res) => {

    var userId = req.user.id;

    const user = await prisma.users.findFirst({
        where: {
            id: userId
        },
    });

    res.render('profile', { user: user })
})

router.put('/delete', async (req, res) => {

    var userId = req.user.id;
    logger.info("Deleting user.", { "userId": userId })

    try {
        const user = await prisma.users.update({
            where: {
                id: userId
            },
            data: { deleted_at: new Date() }
        });
        return res.status(200).send({ result: 'redirect', url: '/' })
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).send("An error occurred while deleting the user.");
    }
})

router.get('/search/:query', async (req, res) => {
    const query = req.params.query;
    var userId = req.user.id;

    const user = await prisma.users.findFirst({
        where: {
            id: userId
        },
    });

    const foundUsers = await prisma.users.findMany({
        take: 5,
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { last_name: { contains: query, mode: 'insensitive' } }
            ],
            NOT: { id: user.id }
        },
    });
    try {
        res.status(200).json({ 'users': foundUsers });
    } catch (error) {
        console.error('Error retrieving board:', error);
        res.status(500).render('error', { error: 'Internal Server Error' });
    }
}
)

module.exports = router;