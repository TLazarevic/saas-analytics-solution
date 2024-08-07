const prisma = require('../prisma/client');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('structlog');
var analytics = require('../util/analytics')
var express = require('express');
var router = express.Router();

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
                        where: { archived_at: null },
                        orderBy: { position: 'asc' },
                        include: {
                            cards: {
                                where: { archived_at: null },
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
    var workspaceId = req.params["workspaceId"]
    var id = uuidv4()

    const isMember = await prisma.workspace_members.findFirst({
        where: {
            workspace_id: workspaceId,
            user_id: userId,
        },
        select: { user_id: true }
    });

    if (isMember) {
        const workspaceSubscription = await prisma.subscriptions.findFirst({ where: { workspace_id: workspaceId, cancelled_at: null }, include: { subscription_plan: true } })

        if (workspaceSubscription.subscription_plan.name == 'free') {

            const workspaces = await prisma.workspaces.findMany({
                where: {
                    deleted_at: null,
                    workspace_members: {
                        some: {
                            user_id: userId
                        }
                    }
                }, include: { boards: true }
            })

            const board_count = workspaces.reduce((total, workspace) => {
                const activeBoards = workspace.boards.filter(board => board.deleted_at == null);
                return total + activeBoards.length;
            }, 0);

            if (board_count >= 5) {
                console.warn('Board limit reached.');
                res.locals.errors = ['Board limit reached.']
                res.status(400).json({ error: 'Board limit reached. Upgrade to create more boards.' });
                return
            }

        }

        try {
            await prisma.boards.create({
                data: {
                    id: id,
                    name: name,
                    description: decription,
                    is_public: !privacy,
                    workspace_id: workspaceId
                }
            })
            res.redirect('/workspaces/' + workspaceId)
        } catch (error) {
            console.error('Error creating the workspace:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        logger.info("User is not authorised to perform this action.", { userId: userId })
        res.render('404')
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


router.patch('/:id/rename', async (req, res, next) => {

    try {

        const boardId = req.params.id;

        const userId = req.user.id;

        const newName = req.body.name;

        logger.info("Renaming board.", { boardId: boardId })

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
                let board = await prisma.boards.findUnique({
                    where: { id: boardId }
                });

                if (!board) {
                    throw new Error('Board not found.', { boardId: boardId });
                }

                await prisma.boards.update({
                    where: {
                        id: boardId
                    }, data: {
                        name: newName
                    }
                })

            })

            logger.info("Board renamed.", { boardId: boardId })

            analytics.track("Board Renamed", { workspace_id: workspaceId.workspace_id, board_id: boardId });

            res.redirect(303, `/boards/${boardId}`);
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId, cardId: cardId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error renaming board.', error);
        next(error)
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

            res.redirect(`/boards/${boardId}`);
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

    const userId = req.user.id

    workspace = await prisma.workspaces.findFirst({
        where: {
            boards: { some: { id: boardId } }
        },
        include: {
            workspace_members: true
        }
    });

    let isMember = await prisma.workspace_members.findFirst({
        where: {
            workspace_id: workspace.id,
            user_id: userId,
        },
        select: { user_id: true }
    });

    if (isMember) {
        try {
            const maxPosition = await prisma.cards.aggregate({
                where: {
                    column_id: columnId,
                },
                _max: {
                    position: true,
                }
            })

            let card = null;

            await prisma.$transaction(async (prisma) => {
                card = await prisma.cards.create({
                    data: {
                        id: uuidv4(),
                        name: name,
                        description: description,
                        column_id: columnId,
                        position: maxPosition._max.position !== null ? maxPosition._max.position + 1 : 0,
                        priority: priority
                    }
                });

                if (Array.isArray(uniqueSelectedLabels) && uniqueSelectedLabels.every(label => label !== undefined)) {
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

            analytics.track("Task Created", { workspace_id: workspace.id, board_id: boardId, card_id: card.id, name: card.name });

            const labeledCardsPromises = uniqueSelectedLabels.map(async labelId => {
                let label = await prisma.labels.findFirst({ where: { id: labelId } });
                analytics.track("Label Added", { workspace_id: workspace.id, board_id: boardId, card_id: card.id, label_id: labelId, type: label.is_preset ? "preset" : "custom" })
            }
            );
            await Promise.all(labeledCardsPromises);

            res.redirect(`/boards/${boardId}`);

        } catch (error) {
            console.error('Error creating card:', error);
            res.status(500).render(`board`, { error: 'Internal Server Error' })
        }
    }
    else {
        logger.info("User is not authorised to perform this action.", { userId: userId, cardId: cardId })
        res.render('404')
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

router.patch('/:id/card/:cardId', async (req, res) => {

    try {
        const boardId = req.params.id;
        const cardId = req.params.cardId;
        let rawSelectedLabels = req.body["selectedLabels[]"];
        let parsedSelectedLabels = rawSelectedLabels ? rawSelectedLabels : []
        const selectedLabels = Array.isArray(parsedSelectedLabels) ? parsedSelectedLabels : [parsedSelectedLabels];
        let uniqueSelectedLabels = selectedLabels ? Array.from(new Set(selectedLabels.map(item => item))) : []

        const userId = req.user.id

        const newPriority = req.body.priority;
        const newDescription = req.body.description;

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
            let card
            let updatedCard = null
            let newLabels = null
            let deletedLabels = null

            await prisma.$transaction(async (prisma) => {
                card = await prisma.cards.findUnique({
                    where: { id: cardId }, include: { labeled_cards: true }
                });

                if (!card) {
                    throw new Error('Card not found');
                }

                newLabels = uniqueSelectedLabels ? uniqueSelectedLabels.filter(item => !card.labeled_cards.map(labeled_card => labeled_card.label_id).includes(item)) : []
                deletedLabels = card.labeled_cards ? card.labeled_cards.map(labeled_card => labeled_card.label_id).filter(item => !uniqueSelectedLabels.includes(item)) : []

                updatedCard = await prisma.cards.update({
                    where: {
                        id: cardId
                    }, data: {
                        priority: newPriority,
                        description: newDescription
                    }
                })

                if (uniqueSelectedLabels) {
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

            logger.info("Card updated.", { cardId: cardId });

            let modified_fields = []
            if (card.description != updatedCard.description)
                modified_fields.push("description")
            if (card.priority != updatedCard.priority)
                modified_fields.push("priority")

            if (Array.isArray(modified_fields) && modified_fields.length)
                analytics.track("Task Modified", { workspace_id: workspaceId.workspace_id, board_id: boardId, card_id: card.id, modified_fields: modified_fields });

            const labeledCardsPromises = newLabels.map(async labelId => {
                let label = await prisma.labels.findFirst({ where: { id: labelId } });
                analytics.track("Label Added", { workspace_id: workspaceId.workspace_id, board_id: boardId, card_id: card.id, label_id: labelId, type: label.is_preset ? "preset" : "custom" })
            }
            );
            await Promise.all(labeledCardsPromises);

            res.redirect(303, `/boards/${boardId}`);
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

router.delete('/:id/card/:cardId', async (req, res) => {

    try {
        const boardId = req.params.id;
        const cardId = req.params.cardId;

        const userId = req.user.id

        logger.info("Archiving card.", { cardId: cardId, boardId: boardId })

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
                    throw new Error('Card not found.', { cardId: cardId });
                }

                await prisma.cards.update({
                    where: {
                        id: cardId
                    }, data: {
                        archived_at: new Date()
                    }
                })

            })

            logger.info("Card archived.", { cardId: cardId });

            analytics.track("Task Archived", { workspace_id: workspaceId.workspace_id, board_id: boardId, card_id: cardId });

            res.redirect(303, `/boards/${boardId}`);
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId, cardId: cardId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error archiving card.', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

router.delete('/:id/column/:columnId', async (req, res) => {

    try {
        const boardId = req.params.id;
        const columnId = req.params.columnId;

        const userId = req.user.id

        logger.info("Archiving column.", { columnId: columnId, boardId: boardId })

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
                let column = await prisma.columns.findUnique({
                    where: { id: columnId }, include: { cards: true }
                });

                if (!column) {
                    throw new Error('Column not found.', { columnId: columnId });
                }

                await prisma.columns.update({
                    where: {
                        id: columnId
                    }, data: {
                        archived_at: new Date()
                    }
                })

                await Promise.all(column.cards.map(card => { return prisma.cards.update({ where: { id: card.id }, data: { archived_at: new Date() } }) }))

            })

            logger.info("Column archived.", { columnId: columnId })

            res.json({ success: true });
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId, cardId: cardId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error archiving column.', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

router.patch('/:id/card/:cardId/rename', async (req, res) => {

    try {

        const boardId = req.params.id;
        const cardId = req.params.cardId;

        const userId = req.user.id;

        const newName = req.body.name;

        logger.info("Renaming card.", { cardId: cardId, boardId: boardId })

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
            let updatedCard = null

            await prisma.$transaction(async (prisma) => {
                let card = await prisma.cards.findUnique({
                    where: { id: cardId }, include: { labeled_cards: true }
                });

                if (!card) {
                    throw new Error('Card not found.', { cardId: cardId });
                }

                updatedCard = await prisma.cards.update({
                    where: {
                        id: cardId
                    }, data: {
                        name: newName
                    }
                })
            })

            logger.info("Card renamed.", { cardId: cardId })

            analytics.track("Task Modified", { workspace_id: workspaceId.workspace_id, board_id: boardId, card_id: updatedCard.id, modified_fields: ['name'] });

            res.status(200).json(updatedCard);
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId, cardId: cardId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error renaming card.', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

router.patch('/:id/column/:columnId/rename', async (req, res) => {

    try {

        const boardId = req.params.id;
        const columnId = req.params.columnId;

        const userId = req.user.id;

        const newName = req.body.name;

        logger.info("Renaming column.", { columnId: columnId, boardId: boardId })

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
                let column = await prisma.columns.findUnique({
                    where: { id: columnId }
                });

                if (!column) {
                    throw new Error('Column not found.', { cardId: cardId });
                }

                await prisma.columns.update({
                    where: {
                        id: columnId
                    }, data: {
                        name: newName
                    }
                })

            })

            logger.info("Column renamed.", { columnId: columnId });

            analytics.track("Column Renamed", { workspace_id: workspaceId.workspace_id, board_id: boardId, column_id: columnId });

            res.redirect(303, `/boards/${boardId}`);
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId, cardId: cardId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error renaming column.', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

router.get('/:id/labels', async (req, res) => {

    try {
        const boardId = req.params.id;
        const userId = req.user.id

        const labelType = req.query.type

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

            let board_labels = []
            if (labelType && labelType == 'custom') {
                board_labels = await prisma.labels.findMany({
                    where: { AND: [{ board_id: boardId }, { is_preset: false }] }, orderBy: [{ board_id: 'asc' }, { created_at: 'asc' }]
                })
            } else {
                board_labels = await prisma.labels.findMany({
                    where: { OR: [{ board_id: boardId }, { board_id: null }] }, orderBy: [{ board_id: 'asc' }, { name: 'asc' }]
                })
            }

            res.json({ labels: board_labels });
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId, cardId: cardId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error retrieving labels.', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


router.post('/:id/labels', async (req, res, next) => {

    const boardId = req.params.id;

    try {
        console.log('Creating label.');

        const name = req.body.name;
        const color = req.body.color;
        const userId = req.user.id;

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

        var newLabel = null

        if (isMember) {

            newLabel = await prisma.labels.create({
                data: {
                    id: uuidv4(),
                    name: name,
                    color: color,
                    board_id: boardId
                }
            });

            logger.info("Label created", { id: newLabel.id });

            analytics.track("Label Created", { workspace_id: workspaceId.workspace_id, board_id: boardId, label_id: newLabel.id });

            res.redirect(`/boards/${boardId}`);
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error adding label to a card.', error);
        next(error);
    }
});

router.post('/:id/labels/:labelId/edit', async (req, res, next) => {

    // TODO: add a check that the label is not preset

    const boardId = req.params.id;
    const labelId = req.params.labelId;

    try {
        console.log('Editing label.');

        const name = req.body.name;
        const color = req.body.color;
        const userId = req.user.id;

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

        var newLabel = null

        if (isMember) {

            oldLabel = await prisma.labels.findFirst({
                where: { id: labelId }
            });

            newLabel = await prisma.labels.update({
                where: { id: labelId },
                data: {
                    name: name,
                    color: color
                }
            });

            const modifiedFields = [];

            if (oldLabel.name !== newLabel.name) {
                modifiedFields.push('name');
            }

            if (oldLabel.color !== newLabel.color) {
                modifiedFields.push('color');
            }

            logger.info("Label edited", { id: newLabel.id });

            analytics.track("Label Modified", { workspace_id: workspaceId.workspace_id, board_id: boardId, label_id: newLabel.id, modified_fields: modifiedFields });

            res.redirect(303, `/boards/${boardId}`);
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error editing label.', error);
        next(error);
    }
});

router.delete('/:id/labels/:labelId', async (req, res, next) => {

    const boardId = req.params.id;
    const labelId = req.params.labelId;

    try {
        console.log('Deleting label.', { label_id: labelId });

        const name = req.body.name;
        const color = req.body.color;
        const userId = req.user.id;

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

        var newLabel = null

        if (isMember) {

            newLabel = await prisma.labels.delete({
                where: { id: labelId }
            });

            logger.info("Label deleted", { id: labelId });

            res.redirect(303, `/boards/${boardId}`);
        }
        else {
            logger.info("User is not authorised to perform this action.", { userId: userId })
            res.render('404')
        }
    }
    catch (error) {
        console.error('Error deleting label.', error);
        next(error);
    }
});

module.exports = router;
