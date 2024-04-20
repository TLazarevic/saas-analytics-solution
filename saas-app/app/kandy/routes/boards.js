const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('structlog');
var express = require('express');
var router = express.Router();


const prisma = new PrismaClient()

router.get('/:id', async (req, res) => {
    const userId = req.user.id
    const boardId = req.params.id;

    const workspaceId = await prisma.boards.findUnique({
        where: { id: boardId },
        select: { workspace_id: true }
    });

    const isMember = await prisma.workspace_members.findFirst({
        where: {
            workspace_id: workspaceId.workspace_id,
            user_id: userId,
        },
        select: { user_id: true }
    });

    if (isMember) {
        try {
            const board = await prisma.boards.findUnique({
                where: { id: boardId },
                include: {
                    columns: {
                        orderBy: { position: 'asc' },
                        include: {
                            cards: {
                                orderBy: { position: 'asc' },
                                include: {
                                    labeled_cards: {
                                        include: {
                                            labels: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const paleColors = {
                "red": "#ffcccc",
                "green": "#ccffcc",
                "blue": "#ccccff",
                "yellow": "#ffffcc",
                "purple": "#e6ccff",
                "orange": "#ffdfcc"
            };

            if (board) {
                res.render('board', { board: board, currentPage: 'boards', paleColors: paleColors });
            }
            else {
                console.error('Board not found.', boardId);
                res.status(404).render('404');
            }

        } catch (error) {
            console.error('Error retrieving board:', error);
            res.status(500).render('error', { error: 'Internal Server Error' });
        }
    } else res.render('404')
})

router.post('/:workspaceId', async (req, res) => {
    const userId = req.user.id;

    var name = req.body["name"]
    var decription = req.body["description"]
    var privacy = req.body["privacy"] ? true : false
    var workspace_id = req.params["workspaceId"]
    var id = uuidv4()

    try {
        await prisma.boards.create({
            data: {
                id: id,
                name: name,
                description: decription,
                is_public: !privacy,
                workspace_id: workspace_id
            }
        })
        res.redirect('/workspaces/' + workspace_id)
    } catch (error) {
        console.error('Error creating the workspace:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.delete('/:id', async (req, res, next) => {
    var userId = req.user.id;
    var boardId = req.params.id

    workspace = await prisma.workspaces.findFirst({
        where: {
            boards: { some: { id: boardId } }
        },
        include: {
            workspace_members: true
        }
    });

    const isMember = workspace.workspace_members.some(member => member.user_id === userId);

    if (isMember) {
        try {
            var board = await prisma.boards.update({
                where: {
                    id: boardId
                }, data: {
                    deleted_at: new Date()
                }
            })
            res.status(200).send('Workspace deleted successfully');
        } catch (error) {
            console.log('Error deleting workspace:', error)
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    else {
        res.status(403).json({ error: 'User is not authorized to delete this board' });
    }
});

router.post('/:id/column', async (req, res) => {
    const boardId = req.params.id;
    const name = req.body.name;

    const maxPosition = await prisma.columns.aggregate({
        where: {
            board_id: boardId,
        },
        _max: {
            position: true,
        }
    })

    try {
        await prisma.columns.create({
            data: {
                id: uuidv4(),
                name: name,
                position: maxPosition._max.position !== null ? maxPosition._max.position + 1 : 0,
                board_id: boardId
            }
        });

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

            res.render('board', { board: board, currentPage: 'boards' });
        } catch (error) {
            console.error('Error retrieving board:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch (error) {
        console.error('Error creating column:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.post('/:id/column/:columnId/card', async (req, res) => {
    const boardId = req.params.id;
    const columnId = req.params.columnId;
    const name = req.body.name;
    const description = req.body.description;
    const priority = req.body.priority;
    let rawSelectedLabels = req.body["selectedLabels[]"];
    const selectedLabels = Array.isArray(rawSelectedLabels) ? rawSelectedLabels : [rawSelectedLabels];
    let uniqueSelectedLabels = Array.from(new Set(selectedLabels.map(item => item)));

    try {
        const maxPosition = await prisma.cards.aggregate({
            where: {
                column_id: columnId,
            },
            _max: {
                position: true,
            }
        })

        await prisma.$transaction(async (prisma) => {
            const card = await prisma.cards.create({
                data: {
                    id: uuidv4(),
                    name: name,
                    description: description,
                    column_id: columnId,
                    position: maxPosition._max.position !== null ? maxPosition._max.position + 1 : 0,
                    priority: priority
                }
            });

            if (uniqueSelectedLabels) {
                const labeledCardsPromises = uniqueSelectedLabels.map(labelId =>
                    prisma.labeled_cards.create({
                        data: {
                            card_id: card.id,
                            label_id: labelId
                        }
                    })
                );
                await Promise.all(labeledCardsPromises);
            }

        });

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

            res.redirect(`/boards/${boardId}`);
        } catch (error) {
            console.error('Error retrieving board:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch (error) {
        console.error('Error creating card:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.patch('/:id/column/:columnId/card/:cardId/move', async (req, res) => {

    const boardId = req.params.id;
    const columnId = req.params.columnId;
    const cardId = req.params.cardId;

    const newColumnId = req.body.columnId;
    const newPosition = req.body.position;

    console.log("Moving card", cardId)

    const card = await prisma.cards.findUnique({
        where: { id: cardId }
    })
    const prevPosition = card.position;

    let result = null

    try {
        if (!newColumnId) {
            if (newPosition > prevPosition) {

                result = await prisma.$transaction([

                    prisma.cards.updateMany({
                        where: {
                            column_id: columnId,
                            position: {
                                gt: prevPosition,
                                lte: newPosition
                            }
                        },
                        data: {
                            position: { decrement: 1 }
                        }
                    }),

                    prisma.cards.update({
                        where: {
                            id: cardId
                        },
                        data: {
                            position: newPosition
                        }
                    }),

                    prisma.boards.findUnique({
                        where: { id: boardId },
                        include: {
                            columns: {
                                include: {
                                    cards: true,
                                },
                            },
                        },
                    })

                ]);
            }
            else {
                result = await prisma.$transaction([

                    prisma.cards.updateMany({
                        where: {
                            column_id: columnId,
                            position: {
                                gte: newPosition,
                                lt: prevPosition
                            }
                        },
                        data: {
                            position: { increment: 1 }
                        }
                    }),

                    prisma.cards.update({
                        where: {
                            id: cardId
                        },
                        data: {
                            position: newPosition
                        }
                    }),

                    prisma.boards.findUnique({
                        where: { id: boardId },
                        include: {
                            columns: {
                                include: {
                                    cards: true,
                                },
                            },
                        },
                    })

                ]);
            }
        }
        else {

            result = await prisma.$transaction([
                prisma.cards.update({
                    where: {
                        id: cardId
                    },
                    data: {
                        column_id: newColumnId
                    }
                }),

                prisma.cards.updateMany({
                    where: {
                        column_id: newColumnId,
                        position: {
                            gte: newPosition
                        }
                    },
                    data: {
                        position: { increment: 1 }
                    }
                }),

                prisma.cards.updateMany({
                    where: {
                        column_id: columnId,
                        position: {
                            gt: prevPosition
                        }
                    },
                    data: {
                        position: { decrement: 1 }
                    }
                }),

                prisma.cards.update({
                    where: {
                        id: cardId
                    },
                    data: {
                        position: newPosition
                    }
                }),

                prisma.boards.findUnique({
                    where: { id: boardId },
                    include: {
                        columns: {
                            include: {
                                cards: true,
                            },
                        },
                    },
                })

            ]);
        }

        res.json({ success: true, result });
    } catch (error) {
        console.error('Error updating card or retrieving board:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

router.patch('/:id/column/:columnId/move', async (req, res) => {

    const boardId = req.params.id;
    const columnId = req.params.columnId;

    const newPosition = req.body.position;

    console.log("Moving column", columnId)

    const column = await prisma.columns.findUnique({
        where: { id: columnId }
    })
    const prevPosition = column.position;

    let result = null

    try {

        if (newPosition > prevPosition) {

            result = await prisma.$transaction([

                prisma.columns.updateMany({
                    where: {
                        board_id: boardId,
                        position: {
                            gt: prevPosition,
                            lte: newPosition
                        }
                    },
                    data: {
                        position: { decrement: 1 }
                    }
                }),

                prisma.columns.update({
                    where: {
                        id: columnId
                    },
                    data: {
                        position: newPosition
                    }
                }),

                prisma.boards.findUnique({
                    where: { id: boardId },
                    include: {
                        columns: {
                            include: {
                                cards: true,
                            },
                        },
                    },
                })

            ]);
        }
        else {
            result = await prisma.$transaction([

                prisma.columns.updateMany({
                    where: {
                        board_id: boardId,
                        position: {
                            gte: newPosition,
                            lt: prevPosition
                        }
                    },
                    data: {
                        position: { increment: 1 }
                    }
                }),

                prisma.columns.update({
                    where: {
                        id: columnId
                    },
                    data: {
                        position: newPosition
                    }
                }),

                prisma.boards.findUnique({
                    where: { id: boardId },
                    include: {
                        columns: {
                            include: {
                                cards: true,
                            },
                        },
                    },
                })

            ]);
        }

        res.json({ success: true, result });
    } catch (error) {
        console.error('Error updating card or retrieving board:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

router.patch('/:id/:cardId', async (req, res) => {

    try {

        const boardId = req.params.id;
        const cardId = req.params.cardId;
        let rawSelectedLabels = req.body["selectedLabels[]"];
        let parsedSelectedLabels = rawSelectedLabels ? rawSelectedLabels : []
        const selectedLabels = Array.isArray(parsedSelectedLabels) ? parsedSelectedLabels : [parsedSelectedLabels];
        let uniqueSelectedLabels = selectedLabels ? Array.from(new Set(selectedLabels.map(item => item))) : []

        const userId = req.user.id

        const newPriority = req.body.priority;

        logger.info("Modifying card.", { cardId: cardId, boardId: boardId })

        let workspaceId = await prisma.boards.findUnique({
            where: { id: boardId },
            select: { workspace_id: true }
        });

        let isMember = await prisma.workspace_members.findFirst({
            where: {
                workspace_id: workspaceId.workspace_id,
                user_id: userId,
            },
            select: { user_id: true }
        });

        if (isMember) {
            await prisma.$transaction(async (prisma) => {
                let card = await prisma.cards.findUnique({
                    where: { id: cardId }, include: { labeled_cards: true }
                });

                if (!card) {
                    throw new Error('Card not found');
                }

                let prevPriority = card.priority;

                if (newPriority !== prevPriority) {
                    await prisma.cards.update({
                        where: {
                            id: cardId
                        }, data: {
                            priority: newPriority
                        }
                    })
                }

                if (uniqueSelectedLabels) {
                    const newLabels = uniqueSelectedLabels ? uniqueSelectedLabels.filter(item => !card.labeled_cards.map(labeled_card => labeled_card.label_id).includes(item)) : []
                    const deletedLabels = card.labeled_cards ? card.labeled_cards.map(labeled_card => labeled_card.label_id).filter(item => !uniqueSelectedLabels.includes(item)) : []

                    const newLabeledCardsPromises = newLabels.map(labelId => {
                        return prisma.labeled_cards.create({
                            data: {
                                card_id: card.id,
                                label_id: labelId
                            }
                        })
                    })

                    const deletedLabeledCardsPromises = deletedLabels.map(labelId => {
                        return prisma.labeled_cards.delete({
                            where: {
                                card_id_label_id: {
                                    card_id: card.id,
                                    label_id: labelId
                                }
                            }
                        })
                    })

                    await Promise.all(newLabeledCardsPromises);
                    await Promise.all(deletedLabeledCardsPromises);
                }
            })

            logger.info("Card updated.", { cardId: cardId })

            res.redirect(`/boards/${boardId}`);
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId, cardId: cardId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error updating card.', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

router.get('/:id/labels', async (req, res) => {

    try {

        const boardId = req.params.id;
        const userId = req.user.id


        let workspaceId = await prisma.boards.findUnique({
            where: { id: boardId },
            select: { workspace_id: true }
        });

        let isMember = await prisma.workspace_members.findFirst({
            where: {
                workspace_id: workspaceId.workspace_id,
                user_id: userId,
            },
            select: { user_id: true }
        });

        if (isMember) {

            let board_labels = await prisma.labels.findMany({
                where: { OR: [{ board_id: boardId }, { board_id: null }] }, orderBy: [{ board_id: 'asc' }, { name: 'asc' }]
            })

            res.json({ labels: board_labels });
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId, cardId: cardId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error updating card.', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


router.post('/:id/labels', async (req, res) => {

    try {

        const boardId = req.params.id;
        const cardId = req.params.cardId;
        const name = req.body.name;
        const color = req.body.color;
        const userId = req.user.id


        let workspaceId = await prisma.boards.findUnique({
            where: { id: boardId },
            select: { workspace_id: true }
        });

        let isMember = await prisma.workspace_members.findFirst({
            where: {
                workspace_id: workspaceId.workspace_id,
                user_id: userId,
            },
            select: { user_id: true }
        });

        if (isMember) {

            await prisma.labels.create({
                data: {
                    id: uuidv4(),
                    name: name,
                    color: color,
                    board_id: boardId
                }
            });

            res.redirect(`/boards/${boardId}`);
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId, cardId: cardId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error adding label to a card.', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;
