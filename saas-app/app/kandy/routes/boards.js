const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
var express = require('express');
var router = express.Router();

const prisma = new PrismaClient()

router.get('/:id', async (req, res) => {
    const boardId = req.params.id;

    try {
        const board = await prisma.boards.findUnique({
            where: { id: boardId },
            include: {
                columns: {
                    include: {
                        cards: true,
                    },
                },
            },
        });

        res.render('board', { name: board.name, columns: board.columns });
    } catch (error) {
        console.error('Error retrieving board:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.post('/:id/column', async (req, res) => {
    const boardId = req.params.id;
    const name = req.body.name;

    try {
        const column = await prisma.columns.create({
            data: {
                id: uuidv4(),
                name: name,
                board_id: boardId
            }
        });

        res.json(column)
    } catch (error) {
        console.error('Error retrieving board:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.post('/:id/column/:columnId/card', async (req, res) => {
    const columnId = req.params.columnId;
    const name = req.body.name;

    try {
        const maxPosition = await prisma.cards.aggregate({
            where: {
                column_id: columnId,
            },
            _max: {
                position: true,
            }
        })

        const card = await prisma.cards.create({
            data: {
                id: uuidv4(),
                name: name,
                column_id: columnId,
                position: maxPosition._max.position + 1
            }
        });

        res.json(card)
    } catch (error) {
        console.error('Error retrieving board:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

module.exports = router;
