"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-async-promise-executor */
const puppeteer_1 = __importDefault(require("puppeteer"));
const admin = require("firebase-admin");
const puppetterExport_1 = require("./puppetterExport");
const db = admin.firestore();
console.log('(work) :>> ');
work();
async function work() {
    const browser = await puppeteer_1.default.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    await page.emulateTimezone('Asia/Taipei');
    page.on('request', async (r) => {
        if (['image'].indexOf(r.resourceType()) !== -1) {
            await r.abort();
        }
        else {
            await r.continue();
        }
    });
    // const pageForMessage = await browser.newPage();
    await page.setViewport({ width: 800, height: 1200 });
    // 登入流程
    await (0, puppetterExport_1.facebookLogin)(page);
    const url = 'https://www.facebook.com/groups/284674743644775?sorting_setting=CHRONOLOGICAL'; // 測試用
    // const urlBase = 'https://www.facebook.com/groups/284674743644775'; // 測試用
    // const urlBase = 'https://www.facebook.com/groups/317555698448325'; // 正式
    // const url = 'https://www.facebook.com/groups/317555698448325?sorting_setting=CHRONOLOGICAL'; // 正式
    // const url = 'https://www.facebook.com/groups/317555698448325/posts/1751894941681053/'; // error test
    await page.goto(url, { waitUntil: 'networkidle2' });
    // await page.evaluate(_ => { window.scrollBy(0, window.innerHeight); });
    // let time1 = new Date().getTime();
    // let buffer1 = await page.screenshot() as Buffer;
    // await admin.storage().bucket().file(`puppeteer/${time1}loginok.png`).save(buffer1);
    await page.waitForSelector('div[role="feed"]');
    // await page.evaluate(_ => { window.scrollBy(0, window.innerHeight); });
    const data = [];
    console.time("answer time");
    for (let i = 0; i < 100; i++) {
        await page.waitForSelector('div[role="feed"]>div');
        const [button] = await page.$x("//*[contains(text(), '顯示更多')]");
        if (button) {
            try {
                await button.click();
            }
            catch (error) {
                console.log('button :>> err');
            }
            await (0, puppetterExport_1.sleep)(100);
        }
        // 每筆截圖
        // await page.screenshot({ path: 'example-click-' + i + '.png' });
        const postRow = await (0, puppetterExport_1.getPost)(page);
        if (postRow.id) {
            // const postUrl = urlBase + '/posts/' + postRow.id;
            const post = (0, puppetterExport_1.handlePost)(postRow);
            if (!post) {
                // await postMessage(pageForMessage, postUrl, '「貼文格式異常無法抓取。」');
                // postRow.error = '貼文格式異常無法抓取';
                // db.collection('postsError').doc(postRow.id).set(postRow).catch();
                continue;
            }
            data.push(post);
            if ((await db.collection('posts').doc(post.id).get()).exists) {
                // console.log('已經收錄到歷史貼文', postUrl);
                console.log('已經收錄到歷史貼文');
                // process.exit(1)
                break;
            }
            // await postMessage(pageForMessage, postUrl, '「YES！您的共乘需求已經收錄成功！小幫手將於此篇文章下留言給您適合的行程；請您隨時留意喔！」');
            await db.collection('posts').doc(post.id).set(post);
        }
        else {
            console.log('postRow No id:>> ', postRow);
        }
        console.timeLog("answer time", postRow.id);
        await (0, puppetterExport_1.sleep)(200);
    }
    await browser.close();
}
