const prisma = require('../prisma/client');
const { v4: uuidv4 } = require('uuid');

var express = require('express');
var router = express.Router();


router.get('/', async function (req, res, next) {
    var userId = req.user.id

    var subsciption = await prisma.subscriptions.findFirstOrThrow({
        where: { user_id: userId, cancelled_at: null }

    })
    res.render('subscriptions', { subsciptionPlanId: subsciption.plan_id });
});

router.get('/update/:selected_plan', async function (req, res, next) {
    var userId = req.user.id
    var selectedPlan = req.params.selected_plan

    try {

        var currentSubscription = await prisma.subscriptions.findFirstOrThrow({
            where: { user_id: userId, cancelled_at: null }

        })

        if (selectedPlan == currentSubscription.plan_id) {
            console.log('plan already active')
            res.locals.errors = ["The selected plan is already active."]
            res.status(400).render('subscriptions', { subsciptionPlanId: currentSubscription.plan_id })
            return
        }

        else {

            await prisma.$transaction([
                prisma.subscriptions.update({
                    where: { id: currentSubscription.id },
                    data: { cancelled_at: new Date() }
                }),
                prisma.subscriptions.create({ data: { id: uuidv4(), user_id: userId, plan_id: selectedPlan } })

            ])

            res.redirect('/subscriptions');
        }

    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Internal Server Error' });

    }
});

module.exports = router;
