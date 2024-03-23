const { PrismaClient } = require('@prisma/client');
var express = require('express');
var router = express.Router();

const prisma = new PrismaClient()

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