/* eslint-disable no-async-promise-executor */
import puppeteer from 'puppeteer';
import admin = require('firebase-admin');
import { closeAll, getPost, handlePost, PostRow, sleep } from './puppetterExport';
import moment = require('moment');
const db: FirebaseFirestore.Firestore = admin.firestore();
getPosts();
console.log(moment().format('YYYY-MM-DD HH:mm'), 'getPosts working...');
async function getPosts() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    await page.emulateTimezone('Asia/Taipei');
    page.on('request', async (r) => {
        if (['image'].indexOf(r.resourceType()) !== -1) {
            await r.abort();
        } else {
            await r.continue();
        }
    });
    // const pageForMessage = await browser.newPage();
    await page.setViewport({ width: 800, height: 1200 });
    // 登入流程
    // await facebookLogin(page);
    // await page.screenshot({ path: 'example-click-login.png' });
    const url = process.env.FB_URL; // 測試用
    // const urlBase = 'https://www.facebook.com/groups/284674743644775'; // 測試用
    // const urlBase = 'https://www.facebook.com/groups/317555698448325'; // 正式
    // const url = 'https://www.facebook.com/groups/317555698448325?sorting_setting=CHRONOLOGICAL'; // 正式
    // const url = 'https://www.facebook.com/groups/317555698448325/posts/1751894941681053/'; // error test
    await page.goto(url, { waitUntil: 'networkidle2' });
    // await page.screenshot({ path: 'example-click-login.png' });
    await page.waitForSelector('div[role="feed"]');
    const data = [];
    // console.time("answer time");
    for (let i = 0; i < 100; i++) {
        await page.waitForSelector('div[role="feed"]>div');
        const [button] = await page.$x("//*[contains(text(), '顯示更多')]");
        if (button) {
            try {
                await button.click();
            } catch (error) {
                console.log('button :>> err');
            }
            await sleep(100);
        }
        // 每筆截圖
        // await page.screenshot({ path: 'example-click-' + i + '.png' });
        const postRow: PostRow = await getPost(page);
        if (postRow.id) {
            // const postUrl = urlBase + '/posts/' + postRow.id;
            const post = handlePost(postRow);
            if (!post) {
                // await postMessage(pageForMessage, postUrl, '「貼文格式異常無法抓取。」');
                // postRow.error = '貼文格式異常無法抓取';
                // db.collection('postsError').doc(postRow.id).set(postRow).catch();
                continue;
            }
            data.push(post);
            if ((await db.collection('posts').doc(post.id).get()).exists) {
                // console.log('已經收錄到歷史貼文', postUrl);
                console.log(moment().format('YYYY-MM-DD HH:mm'), '已經收錄到歷史貼文');
                closeAll(browser);
                break;
            }
            // await postMessage(pageForMessage, postUrl, '「YES！您的共乘需求已經收錄成功！小幫手將於此篇文章下留言給您適合的行程；請您隨時留意喔！」');
            await db.collection('posts').doc(post.id).set(post);
        } else {
            console.log('postRow No id:>> ', postRow);
        }
        // console.timeLog("answer time", postRow.id);
        await sleep(200);
    }
    await browser.close();
}

