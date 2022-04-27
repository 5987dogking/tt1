import express from 'express';
import admin = require('firebase-admin');
import line = require('@line/bot-sdk');
import { LINEBot } from './interface/LINEBot';
import axiosModule = require('axios');
import { notifySend } from './puppetterExport';
export const axios = axiosModule.default;
const db: FirebaseFirestore.Firestore = admin.firestore();
const port = parseInt(process.env.PORT as string) || 8088;
const app = express();
const linebots: LINEBot[] = [];
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile('views/index.html', { root: __dirname });
});

interface LineNotifyStatus {
  status: number;
  message: string; // Message visible to end-user
  targetType: 'USER' | 'GROUP';
  target: string; // 'USER' | 'GROUP' name
  access_token: string;
}

app.post('/tradingview/:user', express.text(), async (req, res) => {
  console.log('req.params.user :>> ', req.params.user);
  const user = req.params.user as string;
  const notify = await (await db.collection('notifys').doc(user).get()).data() as LineNotifyStatus;
  const message = req.body;
  notifySend(notify.access_token, message);
  res.send({});
});

// const redirect_uri = 'http://localhost:8088/notifyCallback';
const redirect_uri = 'https://tradingview-f2g7dy4jtq-de.a.run.app/notifyCallback';
const client_id = '2EFec3OuoZ8qggk0LmKcvE';
const client_secret = 'FTXl5CuDcwyCzVmfiubZ71ihDDqsUYmIVjbcDasuMhh';
// http://localhost:8088/notify/mark
app.get('/notify/:user', express.text(), (req, res) => {
  console.log('req.params.user :>> ', req.params.user);
  let url = 'https://notify-bot.line.me/oauth/authorize?';
  url += 'response_type=code&';
  url += `client_id=${client_id}&`;
  url += `redirect_uri=${redirect_uri}&`;
  url += 'scope=notify&';
  url += 'state=' + req.params.user;
  res.redirect(url);
  // res.send({});
});

app.get('/notifyCallback', express.text(), async (req, res) => {
  const code = req.query.code as string;
  const user = req.query.state as string;
  const data = await notifyToken(code, redirect_uri);
  const created_at = new Date().getTime();
  if (data) {
    const notifyDoc = await db.collection('notifys').doc(user).get();
    if (notifyDoc.exists) {
      const orderNitify = notifyDoc.data() as LineNotifyStatus;
      await lineNotifyRevoke(orderNitify.access_token).catch((e) => {
        console.log('e.response.data :>> ', e.response.data);
      });
    }
    const status = await lineNotifyStatusGet(data.access_token);
    status.access_token = data.access_token;
    db.collection('notifys').doc(user).set({ ...status, created_at });
  }
  res.redirect('/?name=' + user);
  // res.send({ code, user, data });
});


// https://cloudrun-4dtz5tfika-de.a.run.app
// https://asia-northeast1-booking-8d1fc.cloudfunctions.net/linebotService-http/webhook/1656778103
app.post('/webhook/:channelId', async (req, res) => {
  res.send({});
  const channelId = req.params.channelId;
  console.log('channelId v4:>> ', channelId);
  const data = req.body as line.WebhookRequestBody;
  const created_at = new Date().getTime();
  const linebot = await linebotGetById(channelId);
  db.collection(`linebots/${channelId}/pnpEvents`).add({ ...data, created_at });
  data.events.forEach((event) => {
    if (linebot === undefined) { return; }
    handleEvent(event, linebot.token).then((result) => res.json(result)).catch((e) => {
      console.log('webhook e.statusMessage :>> ', e.statusMessage);
      console.log('webhook e.message :>> ', e.message);
    });
  });
});

function linebotGetById(linebotId: string): Promise<LINEBot> {
  return new Promise((resolve) => {
    let linebot = linebots.find(l => l.id === linebotId);
    if (linebot === undefined) {
      db.collection('linebots').doc(linebotId).get().then((v) => {
        linebot = v.data() as LINEBot;
        linebots.push(linebot);
        resolve(linebot);
      })
    } else {
      resolve(linebot);
    }
  });
}

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});

function handleEvent(event: line.WebhookEvent, channelAccessToken: string) {
  const config = { channelAccessToken };
  const client = new line.Client(config);
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: event.message.text
  });
}

export function notifyToken(code: string, redirect_uri: string): Promise<{ access_token: string } | null> {
  return new Promise((resolve) => {
    axios.post<{ access_token: string }>(`https://notify-bot.line.me/oauth/token`, {}, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id,
        client_secret,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then((v) => {
      resolve(v.data);
    }).catch((e) => {
      console.log('e :>> ', e.response.data);
      resolve(null);
    });
  });
}

async function lineNotifyStatusGet(access_token: string): Promise<LineNotifyStatus> {
  const url = 'https://notify-api.line.me/api/status';
  const res = await (await axios.get<LineNotifyStatus>(url, { headers: { 'Authorization': 'Bearer ' + access_token } })).data;
  return res;
}

async function lineNotifyRevoke(access_token: string) {
  const url = 'https://notify-api.line.me/api/revoke';
  return axios.post(url, {}, { headers: { 'Authorization': 'Bearer ' + access_token } });
}