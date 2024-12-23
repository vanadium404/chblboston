const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables from .env file
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use the STRIPE_SECRET_KEY from the .env file

const app = express();

// Enable CORS for all origins (you can also configure it to restrict to specific domains)
app.use(cors());
app.use(express.json());

// POST /create-payment-intent
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body; // Amount to charge, sent from the frontend

  try {
    if (!amount) {
      return res.status(400).send({ error: 'Amount is required' });
    }

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects the amount in cents
      currency: 'usd', // Set the currency (change if needed)
    });

    // Send the client secret to the frontend
    res.send({
      clientSecret: paymentIntent.client_secret, // Send the client secret back to the frontend
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);

    // Handle different types of errors:
    if (error.type === 'StripeCardError') {
      // This type of error happens when the card is declined or has insufficient funds
      res.status(400).send({
        error: 'Card declined or insufficient funds. Please check your card details and try again.',
      });
    } else if (error.type === 'StripeInvalidRequestError') {
      // Invalid request parameters
      res.status(400).send({
        error: 'Invalid request. Please check the payment details.',
      });
    } else if (error.type === 'StripeAPIError') {
      // Generic API error
      res.status(500).send({
        error: 'Stripe API error. Please try again later.',
      });
    } else {
      // Generic server error
      res.status(500).send({
        error: 'Internal Server Error. Please try again later.',
      });
    }
  }
});

// Start the Express server
const port = process.env.PORT || 5000; // Use the PORT from the .env file or default to 5000
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
