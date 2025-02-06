const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

//const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Add your Razorpay Key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Add your Razorpay Key Secret
});

// Stripe route
// router.post(
//   "/process-stripe",
//   catchAsyncErrors(async (req, res, next) => {
//     const myPayment = await stripe.paymentIntents.create({
//       amount: req.body.amount,
//       currency: "INR",
//       metadata: {
//         company: "Daffodeal",
//       },
//     });
//     res.status(200).json({
//       success: true,
//       client_secret: myPayment.client_secret,
//     });
//   })
// );

// Razorpay route
router.post(
  "/process-razorpay",
  catchAsyncErrors(async (req, res, next) => {
    const order = await razorpay.orders.create({
      amount: req.body.amount, // Amount in paise (1 INR = 100 paise)
      currency: "INR",
      payment_capture: 1,
    });

    res.status(200).json({
      success: true,
      order_id: order.id,
    });
  })
);

// Fetch Stripe API Key
// router.get(
//   "/stripeapikey",
//   catchAsyncErrors(async (req, res, next) => {
//     res.status(200).json({ stripeApikey: process.env.STRIPE_API_KEY });
//   })
// );

// Fetch Razorpay API Key
router.get(
  "/razorpayapikey",
  catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({ razorpayApikey: process.env.RAZORPAY_KEY_ID });
  })
);

module.exports = router;
