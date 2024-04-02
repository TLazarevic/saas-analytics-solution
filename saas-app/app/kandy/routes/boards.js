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
                        orderBy: {
                            position: 'asc'
                        },
                        include: {
                            cards: {
                                orderBy: {
                                    position: 'asc'
                                }
                            }
                        },
                    },
                },
            });

            if (board) {
                res.render('board', { board: board });
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

            res.render('board', { board: board });
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

    try {
        const maxPosition = await prisma.cards.aggregate({
            where: {
                column_id: columnId,
            },
            _max: {
                position: true,
            }
        })

        await prisma.cards.create({
            data: {
                id: uuidv4(),
                name: name,
                description: description,
                column_id: columnId,
                position: maxPosition._max.position !== null ? maxPosition._max.position + 1 : 0,
                priority: priority
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

            res.render('board', { board: board });
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

            let card = await prisma.cards.findUnique({
                where: { id: cardId }
            });

            let prevPriority = card.priority;

            if (newPriority == prevPriority) {
                logger.info("New priority same as previous, nothing to do.")
            }
            else {
                await prisma.cards.update({
                    where: {
                        id: cardId
                    }, data: {
                        priority: newPriority
                    }
                })
                logger.info("New priority set.", { cardId: cardId, priority: newPriority })
            }
            res.json({ success: true });
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

            let preset_labels = await prisma.preset_labels.findMany({
                where: { deleted_at: null }
            });

            res.json({ labels: preset_labels });
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

module.exports = router;
