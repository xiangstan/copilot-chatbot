import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();
const DIRECT_LINE_SECRET = process.env.DirectLineSecret;

// Generate a random user id if client didn't pass one
const genUserId = () => `u_${crypto.randomBytes(8).toString('hex')}`;

router.post('/directline/token', async (req, res) => {
  try {
    const userId = (req.body && req.body.userId) || genUserId();

    const r = await axios.post(
      'https://directline.botframework.com/v3/directline/tokens/generate',
      { User: { Id: userId } },
      { headers: { Authorization: `Bearer ${DIRECT_LINE_SECRET}` } }
    );

    // Return token + the userId we bound it to
    res.json({ ...r.data, userId });
  } catch (err: any) {
    const detail = err?.response?.data || err?.message;
    console.error('Token exchange failed:', detail);
    res.status(500).json({ error: 'token_exchange_failed', detail });
  }
});

export default router;
