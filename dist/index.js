"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifySend = exports.notifyToken = exports.axios = void 0;
const express_1 = __importDefault(require("express"));
const admin = require("firebase-admin");
const line = require("@line/bot-sdk");
const serviceAccount = __importStar(require("./booking.json"));
const axiosModule = require("axios");
exports.axios = axiosModule.default;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    serviceAccountId: 'firebase-adminsdk-vh3yi@booking-8d1fc.iam.gserviceaccount.com',
});
const db = admin.firestore();
const port = parseInt(process.env.PORT) || 8088;
const app = (0, express_1.default)();
const linebots = [];
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.sendFile('views/index.html', { root: __dirname });
});
app.post('/tradingview/:user', express_1.default.text(), async (req, res) => {
    console.log('req.params.user :>> ', req.params.user);
    const user = req.params.user;
    const notify = await (await db.collection('notifys').doc(user).get()).data();
    const message = req.body;
    notifySend(notify.access_token, message);
    res.send({});
});
// const redirect_uri = 'http://localhost:8088/notifyCallback';
const redirect_uri = 'https://tradingview-f2g7dy4jtq-de.a.run.app/notifyCallback';
const client_id = '2EFec3OuoZ8qggk0LmKcvE';
const client_secret = 'FTXl5CuDcwyCzVmfiubZ71ihDDqsUYmIVjbcDasuMhh';
// http://localhost:8088/notify/mark
app.get('/notify/:user', express_1.default.text(), (req, res) => {
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
app.get('/notifyCallback', express_1.default.text(), async (req, res) => {
    const code = req.query.code;
    const user = req.query.state;
    const data = await notifyToken(code, redirect_uri);
    const created_at = new Date().getTime();
    if (data) {
        const notifyDoc = await db.collection('notifys').doc(user).get();
        if (notifyDoc.exists) {
            const orderNitify = notifyDoc.data();
            await lineNotifyRevoke(orderNitify.access_token).catch((e) => {
                console.log('e.response.data :>> ', e.response.data);
            });
        }
        const status = await lineNotifyStatusGet(data.access_token);
        status.access_token = data.access_token;
        db.collection('notifys').doc(user).set(Object.assign(Object.assign({}, status), { created_at }));
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
    const data = req.body;
    const created_at = new Date().getTime();
    const linebot = await linebotGetById(channelId);
    db.collection(`linebots/${channelId}/pnpEvents`).add(Object.assign(Object.assign({}, data), { created_at }));
    data.events.forEach((event) => {
        if (linebot === undefined) {
            return;
        }
        handleEvent(event, linebot.token).then((result) => res.json(result)).catch((e) => {
            console.log('webhook e.statusMessage :>> ', e.statusMessage);
            console.log('webhook e.message :>> ', e.message);
        });
    });
});
function linebotGetById(linebotId) {
    return new Promise((resolve) => {
        let linebot = linebots.find(l => l.id === linebotId);
        if (linebot === undefined) {
            db.collection('linebots').doc(linebotId).get().then((v) => {
                linebot = v.data();
                linebots.push(linebot);
                resolve(linebot);
            });
        }
        else {
            resolve(linebot);
        }
    });
}
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
function handleEvent(event, channelAccessToken) {
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
function notifyToken(code, redirect_uri) {
    return new Promise((resolve) => {
        exports.axios.post(`https://notify-bot.line.me/oauth/token`, {}, {
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
exports.notifyToken = notifyToken;
function notifySend(access_token, message) {
    let parameters = '';
    parameters += 'message=' + encodeURI(message);
    const url = 'https://notify-api.line.me/api/notify?' + parameters;
    return exports.axios.post(url, {}, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + access_token,
        },
    });
}
exports.notifySend = notifySend;
async function lineNotifyStatusGet(access_token) {
    const url = 'https://notify-api.line.me/api/status';
    const res = await (await exports.axios.get(url, { headers: { 'Authorization': 'Bearer ' + access_token } })).data;
    return res;
}
async function lineNotifyRevoke(access_token) {
    const url = 'https://notify-api.line.me/api/revoke';
    return exports.axios.post(url, {}, { headers: { 'Authorization': 'Bearer ' + access_token } });
}
