import axios from 'axios';
const DL_BASE = 'https://directline.botframework.com/v3/directline';

export async function startConversation(token: string) {
  const r = await axios.post(`${DL_BASE}/conversations`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return r.data; // { conversationId, streamUrl, ... }
}

export async function sendMessage(token: string, conversationId: string, text: string, fromId: string) {
  const r = await axios.post(
    `${DL_BASE}/conversations/${conversationId}/activities`,
    { type: 'message', from: { id: fromId }, text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return r.data;
}

export async function receiveActivities(token: string, conversationId: string, watermark?: string) {
  const url = `${DL_BASE}/conversations/${conversationId}/activities${watermark ? `?watermark=${watermark}` : ''}`;
  const r = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return r.data; // { activities, watermark }
}
