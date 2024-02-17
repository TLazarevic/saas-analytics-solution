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

router.put('/:workspaceId', async (req, res) => {
  const userId = req.user.id;

  data = req.body
  data["id"] = uuidv4()

  try {
    const workspaces = await prisma.workspaces.create({
      data: data
    })

    res.render(workspaces);
  } catch (error) {
    console.error('Error creating the workspace:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

module.exports = router;
