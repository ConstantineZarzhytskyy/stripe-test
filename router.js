var express = require('express');
var router = express.Router();
var async = require('async');
var stripe = require('stripe')('sk_test_eBBR4DkvJFUA4sqw8Vfaja0N');

router.get('/', function (req, res) {
  res.json('ok');
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

router.get('/stripe/charges', function (req, res) {
  stripe.charges.create({
    amount: 2000,
    currency: "usd",
    source: {
      number: '4242424242424242',
      exp_month: 12,
      exp_year: 2017,
      cvc: '123'
    },
    description: "Charge for addison.white@example.com"
  }, function(err, charge) {
    if (err) { res.send(err); }

    res.json(charge);
  });
})

router.post('/stripe/webhooks', function (req, res) {
  res.json({ "webhooks": "ok" });
})

module.exports = router;
