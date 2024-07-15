const prisma = require('../prisma/client');
const { v4: uuidv4 } = require('uuid');

var express = require('express');
var router = express.Router();


router.get('/workspace/:workspace_id', async function (req, res, next) {
    var userId = req.user.id
    var workspaceId = req.params.workspace_id

    console.log('requesting')
    console.log(workspaceId)

    var subscription = await prisma.subscriptions.findFirstOrThrow({
        where: { workspace_id: workspaceId, cancelled_at: null }

    })

    console.log(subscription)
    res.render('subscriptions', { subscriptionPlanId: subscription.plan_id, workspaceId: workspaceId });
});

router.get('/update/:selected_plan/workspace/:workspace_id', async function (req, res, next) {
    var userId = req.user.id
    var selectedPlan = req.params.selected_plan
    var workspaceId = req.params.workspace_id

    try {

        var currentSubscription = await prisma.subscriptions.findFirstOrThrow({
            where: { workspace_id: workspaceId, cancelled_at: null }

        })

        if (selectedPlan == currentSubscription.plan_id) {
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
                prisma.subscriptions.create({ data: { id: uuidv4(), workspace_id: workspaceId, plan_id: selectedPlan } })
            ])

            res.redirect('/subscriptions/workspace/' + workspaceId);
        }

    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Internal Server Error' });

    }
});

module.exports = router;
