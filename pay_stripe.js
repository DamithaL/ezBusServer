const express = require("express");
const router = express.Router();

const bodyParser = require('body-parser');
router.use(bodyParser.json());

// This is your test secret API key.
const stripe = require("stripe")('sk_test_51OQMzRK8hceL936mSUQdQHBBP0iLnmlj5JoDML4PsQBGSN17Nx79Y1ZyJBtfgj9WG6Jhfw25QWOzTkV0vx6IzZDq00ikPd6LdT');

const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 500 * 100;
};

router.use(express.static("public"));
router.use(express.json());

router.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "lkr",

    description: "Virtual bus ticket",
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: false,
    },
    // Add the payment_method_types property to specify payment methods for the country
    payment_method_types: ['card'], // You can add other payment methods if needed
    // Add the country property to specify the country
    //country: 'Sri Lanka', // Set country to Sri Lanka (LKR)
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });





});



module.exports = router;