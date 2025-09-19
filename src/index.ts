import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tokenRoutes from './token';
import { startConversation, sendMessage, receiveActivities } from './chat';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api', tokenRoutes);

app.post('/api/chat', async (req, res) => {
  try {
    const { text, token, conversationId, watermark, userId } = req.body;
    if (!token) return res.status(400).json({ error: 'missing_token' });
    if (!userId) return res.status(400).json({ error: 'missing_userId' });

    let convId = conversationId;
    if (!convId) {
      const conv = await startConversation(token);
      convId = conv.conversationId;
    }

    // 1) Send the user message
    await sendMessage(token, convId, text, userId);

    // 2) Poll for replies with a small wait loop
    const maxWaitMs = 8000;    // total time to wait for a reply
    const stepMs    = 600;     // poll interval
    const start     = Date.now();
    let wm = watermark;
    let lastBatch: any = { activities: [], watermark: wm };

    while (Date.now() - start < maxWaitMs) {
      const batch = await receiveActivities(token, convId, wm);
      lastBatch = batch;
      wm = batch.watermark;

      // Did we get any bot messages (not from this user)?
      const botMsgs = (batch.activities || []).filter((a: any) => a.from?.id && a.from.id !== userId);
      if (botMsgs.length) {
        break; // we have something to return
      }

      await new Promise(r => setTimeout(r, stepMs));
    }

    res.json({
      conversationId: convId,
      watermark: lastBatch.watermark,
      activities: lastBatch.activities || []
    });
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const detail = err?.response?.data || err?.message;
    console.error('Chat proxy error:', status, detail);
    res.status(500).json({ error: 'chat_failed', detail });
  }
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`Backend running on :${port}`));
