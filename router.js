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
    getToken,
    createCustomer,
    createPlan,
    createSubscribtion
  ], function (err, done) {
    if (err) {
      return res.send(err);
    }

    res.json(done);
  });

  function getToken(callback) {
    stripe.tokens.create({
      card: {
        number: params.cardNumber,
        exp_month: params.mounth,
        exp_year: params.year,
        cvc: params.cvc
      }
    }, function (err, token) {
      console.log('token = ', token);
      if (err) { return callback(err); }

      callback(null, token);
    });
  }

  function createCustomer(token, callback) {
    stripe.customers.create({
      source: token.id,
      email: params.email,
      description: 'Customer ' + params.email + ' is devTest account'
    }, function (err, customer) {
      console.log('customer = ', customer);
      if (err) { return callback(err); }

      callback(null, customer);
    });
  }

  function createPlan(customer, callback) {
    stripe.plans.create({
      amount: 200,
      interval: 'day',
      name: '7$ 2',
      currency: 'usd',
      id: '7$ 2'
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

module.exports = router;
