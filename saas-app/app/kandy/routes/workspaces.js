const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

var express = require('express');
var router = express.Router();

const prisma = new PrismaClient()

router.get('/', async (req, res, next) => {
  var userId = req.user.id;

  try {
    var workspaces = await prisma.workspaces.findMany({
      where: {
        deleted_at: null, workspace_members: { some: { user_id: userId } }
      }, include: {
        boards: true
      }
    })
    res.render('workspaces', { workspaces: workspaces });
  } catch (error) {
    console.log('Error retrieving workspaces:', error)
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res, next) => {
  var userId = req.user.id;
  var workspaceId = req.params.id

  try {
    var workspace = await prisma.workspaces.findUnique({
      where: {
        id: workspaceId, deleted_at: null, workspace_members: { some: { user_id: userId } }
      }, include: {
        boards: {
          where: { deleted_at: null }
        },
        workspace_members: {
          include: true
        }
      }
    })
    res.render('workspace', { workspace: workspace });
  } catch (error) {
    console.log('Error retrieving workspaces:', error)
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:id', async (req, res, next) => {
  var userId = req.user.id;
  var workspaceId = req.params.id

  try {
    var workspace = await prisma.workspaces.update({
      where: {
        id: workspaceId, workspace_members: { some: { user_id: userId } }
      }, data: {
        deleted_at: new Date()
      }
    })
    res.status(200).send('Workspace deleted successfully');
  } catch (error) {
    console.log('Error deleting workspace:', error)
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/', async (req, res) => {
  const userId = req.user.id;

  var name = req.body["name"]
  var decription = req.body["description"]
  var privacy = req.body["privacy"] ? true : false
  var id = uuidv4()

  try {
    await prisma.workspaces.create({
      data: {
        id: id,
        name: name,
        description: decription,
        is_private: privacy,
        workspace_members: {
          create: {
            users: {
              connect: {
                id: userId
              }
            }
          }
        }

      }
    })
    res.redirect('/workspaces');

  } catch (error) {
    console.error('Error creating the workspace:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id/members', async (req, res, next) => {

  var userId = req.user.id;
  var workspaceId = req.params.id
  var members = req.body.users

  console.log(members)


  try {
    var workspace = await prisma.workspaces.findFirstOrThrow({
      where: {
        id: workspaceId
      }
    })

    if (workspace.is_private)
      res.status(404).send('Cannot add members to private workspaces.');

    await prisma.workspace_members.createMany({
      data: members.map(userId => ({
        user_id: userId,
        workspace_id: workspaceId,
      })),
      skipDuplicates: true,
    });
    res.status(200).send('Members added successfully.');
  } catch (error) {
    console.log('Error adding workspace members.', error)
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id/search_users/:query', async (req, res) => {

  try {
    const query = req.params.query;
    var userId = req.user.id;
    var workspaceId = req.params.id;

    const workspace_members = await prisma.workspace_members.findMany({
      where: {
        workspace_id: workspaceId
      },
    });

    if (!workspace_members.some(member => member.user_id === userId)) {
      res.status(403).json({ error: 'User is not authorized to add members to this workspace.' });
    }

    const foundUsers = await prisma.users.findMany({
      take: 5,
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { last_name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ],
        AND: {
          id: {
            notIn: workspace_members.map(member => member.user_id)
          }
        },

      },
    });
    res.status(200).json({ 'users': foundUsers });
  } catch (error) {
    console.error('Error retrieving user recommendations.', error);
    res.status(500).render('error', { error: 'Internal Server Error' });
  }
}
)

module.exports = router;
