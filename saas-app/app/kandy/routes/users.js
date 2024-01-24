var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/:userId/workspaces', async (req, res) => {
  const userId = req.params.userId;

  try {
    const workspaces = await prisma.workspaces.findMany({
      where: {
        deleted_at: null, workspace_members: { some: { user_id: userId } }
      }, include: {
        boards: true
      }
    })

    res.json(workspaces);
  } catch (error) {
    console.error('Error retrieving workspaces:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.put('/:userId/workspaces/:workspaceId', async (req, res) => {
  const userId = req.params.userId;
  const workspaceID = req.params.workspaceId;

  try {
    const workspaces = await prisma.workspaces.create({
      data: req.body
    })

    res.json(workspaces);
  } catch (error) {
    console.error('Error retrieving workspaces:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

module.exports = router;
