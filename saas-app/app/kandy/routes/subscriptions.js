const { PrismaClient } = require('@prisma/client');

var express = require('express');
var router = express.Router();

const prisma = new PrismaClient()

router.get('/', async function (req, res, next) {
    var userId = req.user.id

    var subsciption = await prisma.subscriptions.findFirstOrThrow({
        where: { user_id: userId, cancelled_at: null }

    })
    res.render('subscriptions', { subsciptionPlanId: subsciption.plan_id });
});

module.exports = router;
