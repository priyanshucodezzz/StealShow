import Razorpay from 'razorpay';
import { Router } from "express";
import crypto from 'crypto';

const router = Router();

const keyId = process.env.KEY_ID;
const keySecret = process.env.KEY_SECRET;

if (!keyId || !keySecret) {
    throw new Error("Razorpay key_id and key_secret must be set in environment variables");
}

const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
});

router.post('/create-order', async (req, res) => {
    const { amount, currency } = req.body;

    if(!amount || !currency) {
        return res.status(400).json({ error: 'Amount and currency are required' });
    }

    const options = {
        amount: amount * 100, // amount in the smallest currency unit
        currency: currency,
        receipt: `receipt_${Math.floor(Math.random() * 10000)}`,
    };
    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating order');
    }
});

router.post('/verify', async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
      // Step 1: Generate the expected signature using the razorpay_order_id and razorpay_payment_id
      const generatedSignature = crypto
        .createHmac('sha256', keySecret) // Razorpay secret key stored in environment variables
        .update(`${razorpay_order_id}|${razorpay_payment_id}`) // Order ID and Payment ID concatenated with '|'
        .digest('hex'); // Convert the HMAC to a hex string
  
      // Step 2: Compare the generated signature with the received razorpay_signature
      if (generatedSignature === razorpay_signature) {
        // Signature is valid, payment is verified
        console.log('Payment verified successfully');
        // Here you can mark the order as 'paid' in your database, etc.
        return res.status(200).json({ status: 'success', message: 'Payment verified successfully' });
      } else {
        // Signature does not match, payment failed or was tampered with
        console.log('Payment verification failed');
        return res.status(400).json({ status: 'failure', message: 'Payment verification failed' });
      }
    } catch (error) {
      console.error('Error in payment verification', error);
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }
  });
  
export const paymentRouter = router;