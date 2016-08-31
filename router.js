var express = require('express');
var router = express.Router();
var path = require('path');
var async = require('async');
var stripe = require('stripe')('sk_test_eBBR4DkvJFUA4sqw8Vfaja0N');

router.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/index.html'));
});

router.get('/list', function (req, res) {
  res.json([
    {
      name: 'item 1',
      amount: 1000
    },
    {
      name: 'item 2',
      amount: 2000
    },
    {
      name: 'item 3',
      amount: 3000
    },
    {
      name: 'item 4',
      amount: 4000
    }
  ]);
});

router.get('/stripe/:email/:cardNumber/:mounth/:year/:cvc/:amount', function (req, res) {
  var params = {
    email: req.params.email,
    cardNumber: req.params.cardNumber,
    mounth: req.params.mounth,
    year: req.params.year,
    amount: req.params.amount,
    cvc: req.params.cvc
  };
  console.log('params = ', params);

  async.waterfall([
    createCustomer,
    createPlan,
    createSubscribtion
  ], function (err, done) {
    if (err) {
      return res.send(err);
    }

    res.json(done);
  });

  function createCustomer(callback) {
    stripe.customers.create({
      source: {
        object: "card",
        exp_month: params.mounth,
        exp_year: params.year,
        number: params.cardNumber
      },
      email: params.email,
      account_balance: params.amount,
      description: 'Customer ' + params.email + ' is devTest account'
    }, function (err, customer) {
      console.log('customer = ', customer);
      if (err) { return callback(err); }

      callback(null, customer);
    });
  }

  function createPlan(customer, callback) {
    stripe.plans.create({
      amount: 100,
      interval: 'day',
      name: '1$',
      currency: 'usd',
      id: '1$'
    }, function (err, plan) {
      console.log('plan = ', plan);
      if (err) { return callback(err); }

      callback(null, customer, plan)
    });
  }

  function createSubscribtion(customer, plan, callback) {
    stripe.subscriptions.create({
      customer: customer.id,
      plan: plan.id
    }, function (err, ok) {
      console.log('ok = ',ok);
      if (err) { return callback(err); }

      callback(null, ok);
    });
  }
});

router.post('/stripe/webhooks', function (req, res) {
  res.json({ "webhooks": "ok" });
});

router.post('/stripe/charge', function(req, res) {
  stripe.charges.create({
    amount: req.body.paymentDetails.amount,
    currency: 'usd',
    source: req.body.token.id,
    description: req.body.paymentDetails.description
  }, function(err, charge) {
    if (err) { res.send(err); }

    res.json(charge);
  });
});


module.exports = router;
