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
})

module.exports = router;
