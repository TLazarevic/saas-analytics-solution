var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    res.render('subscriptions', { subscriptionPlans: [{ "name": 'free' }, { "name": 'silver' }, { "name": 'gold' }] });
});

module.exports = router;
