"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const admin = require("firebase-admin");
const puppetterExport_1 = require("./puppetterExport");
const db = admin.firestore();
workPostsCommanent();
async function workPostsCommanent() {
    const browser = await puppeteer_1.default.launch();
    const page = await browser.newPage();
    const urlBase = 'https://www.facebook.com/groups/284674743644775';
    await page.setViewport({ width: 800, height: 1200 });
    const postErrorCol = await db.collection('postsError').where('isCommanent', '==', false).limit(1).get();
    if (postErrorCol.size > 0) {
        await (0, puppetterExport_1.facebookLogin)(page);
        const post = postErrorCol.docs[0].data();
        const postUrl = urlBase + '/posts/' + post.id;
        const errorMsg = (0, puppetterExport_1.handlePostError)(post);
        console.log('postUrl :>> ', postUrl);
        await (0, puppetterExport_1.postMessage)(page, postUrl, '「Oops！您的共乘需求並沒有被 #社團自動媒合服務 收錄成功。請確認您的' + errorMsg.join('以及') + '若您需要 #社團自動媒合服務，麻煩您重新發文；最後請注意：若您的共乘需求不符合貼文格式，社團管理員將會刪除您的共乘文章');
        await db.collection('postsError').doc(post.id).update({ isCommanent: true });
        return;
    }
    const activeTime = (0, moment_1.default)().format('YYYY/MM/DD');
    const postCol = await db.collection('posts').
        where('activeTime', '>=', activeTime).
        where('isCommanent', '==', false).get();
    const datas = [];
    for (const doc of postCol.docs) {
        const post = doc.data();
        datas.push(post);
    }
    datas.sort(function (a, b) {
        return Number(a.id) - Number(b.id);
    });
    console.log('datas :>> ', datas);
    if (postCol.size === 0) {
        return;
    }
    await (0, puppetterExport_1.facebookLogin)(page);
    for (const post of datas.slice(0, 1)) {
        const postUrl = urlBase + '/posts/' + post.id;
        console.log('postUrl :>> ', postUrl);
        await (0, puppetterExport_1.postMessage)(page, postUrl, '「YES！您的共乘需求已經收錄成功！小幫手將於此篇文章下留言給您適合的行程；請您隨時留意喔！」');
        await db.collection('posts').doc(post.id).update({ isCommanent: true });
    }
    console.log('done');
    process.exit(1);
    return;
}
console.log('done ok');
