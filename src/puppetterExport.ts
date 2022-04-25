/* eslint-disable no-async-promise-executor */
import { DBbase } from "./interface/common";
import puppeteer from 'puppeteer';
import admin = require('firebase-admin');
import * as serviceAccount from './puppeteer-mark-firebase-adminsdk.json';
admin.initializeApp({
    credential: admin.credential.cert(<admin.ServiceAccount>serviceAccount),
    storageBucket: 'gs://puppeteer-mark.appspot.com',
});
const db: FirebaseFirestore.Firestore = admin.firestore();
export interface PostRow {
    text: string;
    id: string;
    message: string[];
    error?: string;
    isCommanent: boolean;
}

export interface Post extends DBbase {
    row: PostRow;
    id: string;
    type: '' | '徵求座位' | '提供座位'; //＃提供座位 (人數2位）
    activeAmount: number; // 人數2位
    activeTimeAll: string; // 2022／03／08（二）下午14:00後
    activeTime: string; // 2022／03／08
    routeAll: string; // #台南市=> #台北市
    routeStart: string; // #台南市
    routeEnd: string; // #台北市
    routeStartCode: number; // #台南市 12
    routeEndCode: number; // #台北市 2
    placeGetOn?: string; // 上車地點：#市區可討論
    placeGetOff?: string; // 下車地點：#市區可討論
    direction?: '北上' | '南下' | string; // 共乘方向：＃北上
    travelType?: string; // 共乘類型：＃長途
    isStopOnWay?: string; // 是否接受中途上下車：否
    costSharing?: string; // 共乘能源&國道收費分攤費：一人300元
    userName: string;
    note?: string;
    safeNumber: string;
    isCommanent: boolean;
    linkIds: string[];
}

export function handlePost(postRow: PostRow): Post | null {
    const twCityCode = [
        { value: 1, key: '基隆市' },
        { value: 2, key: '台北市' },
        { value: 2, key: '臺北市' },
        { value: 2, key: '新北市' },
        { value: 2, key: '雙北市' },
        { value: 2, key: '双北市' },
        { value: 3, key: '桃園市' },
        { value: 4, key: '新竹市' },
        { value: 4, key: '新竹縣' },
        { value: 5, key: '苗栗縣' },
        { value: 6, key: '台中市' },
        { value: 6, key: '臺中市' },
        { value: 7, key: '南投縣' },
        { value: 8, key: '彰化縣' },
        { value: 9, key: '雲林縣' },
        { value: 10, key: '嘉義市' },
        { value: 10, key: '嘉義縣' },
        { value: 11, key: '台南市' },
        { value: 11, key: '臺南市' },
        { value: 12, key: '高雄市' },
        { value: 12, key: '高市' },
        { value: 13, key: '屏東縣' },
        { value: 14, key: '宜蘭縣' },
        { value: 15, key: '花蓮縣' },
        { value: 16, key: '台東縣' },
        { value: 16, key: '臺東縣' },
    ];
    try {
        postRow.text = postRow.text.split(' : ').join('：');
        postRow.text = postRow.text.split(':').join('：');
        let safeNumber = '';
        if (postRow.text.indexOf('安心駕駛') !== -1) {
            console.log('安心駕駛 :>> ', postRow);
            const safeNumberStartI = postRow.text.indexOf('安心駕駛：');
            const safeNumberEndI = postRow.text.indexOf('#提供座位');
            safeNumber = postRow.text.substring(safeNumberStartI + 5, safeNumberEndI).trim();
        }
        let type: '' | '徵求座位' | '提供座位' = ''; // '徵求座位' | '提供座位' | '';
        if (postRow.text.indexOf('徵求座位') !== -1) { type = '徵求座位'; }
        if (postRow.text.indexOf('提供座位') !== -1) { type = '提供座位'; }
        const activeAmountSp: string[] = postRow.text.split('位');
        const activeAmountSpGet = activeAmountSp.find(a => a.indexOf('人數') !== -1);
        let activeAmount = 0;
        if (activeAmountSpGet) {
            const activeAmountSpGetI = activeAmountSpGet.indexOf('人數')
            activeAmount = Number(activeAmountSpGet.substring(activeAmountSpGetI + 2));
        }

        const userNamei = postRow.text.indexOf(' · ');
        const userName = postRow.text.substring(0, userNamei).trim();

        const activeTimeStartI = postRow.text.indexOf('共乘時間：');
        const activeTimeEndI = postRow.text.indexOf('行程路線：');
        let activeTimeAll = postRow.text.substring(activeTimeStartI + 5, activeTimeEndI).trim();
        activeTimeAll = activeTimeAll.split(' ').join(''); // 清除空白
        activeTimeAll = activeTimeAll.split('／').join('/'); // 取代斜線
        const activeTime = activeTimeAll.substring(0, 10);

        // #嘉義縣=》#雙北市 => #台北
        const routeTimeStartI = postRow.text.indexOf('行程路線：');
        const routeTimeEndI = postRow.text.indexOf('上車地點：');
        const routeAll = postRow.text.substring(routeTimeStartI + 5, routeTimeEndI).trim();
        console.log('routeAll :>> ', routeAll, postRow.id);
        const routeSp: string[] = routeAll.split('#');
        const routeStart = routeSp[1].substring(0, 2);
        const routeEnd = routeSp.pop().substring(0, 2);

        const routeStartCode = twCityCode.find(t => t.key.indexOf(routeStart) !== -1).value;
        const routeEndCode = twCityCode.find(t => t.key.indexOf(routeEnd) !== -1).value;

        // const placeGetOnTimeStartI = postRow.text.indexOf('上車地點：');
        // const placeGetOnTimeEndI = postRow.text.indexOf('下車地點：');
        // const placeGetOn = postRow.text.substring(placeGetOnTimeStartI + 5, placeGetOnTimeEndI).trim();

        // const placeGetOffTimeStartI = postRow.text.indexOf('下車地點：');
        // const placeGetOffTimeEndI = postRow.text.indexOf('共乘方向：');
        // const placeGetOff = postRow.text.substring(placeGetOffTimeStartI + 5, placeGetOffTimeEndI).trim();

        // const travelTypeTimeStartI = postRow.text.indexOf('共乘類型：');
        // const travelTypeTimeEndI = postRow.text.indexOf('共乘方向：');
        // const travelType = postRow.text.substring(travelTypeTimeStartI + 5, travelTypeTimeEndI).trim();

        // let direction: '' | '北上' | '南下' = ''; // '徵求座位' | '提供座位' | '';
        // if (postRow.text.indexOf('北上') !== -1) { direction = '北上'; }
        // if (postRow.text.indexOf('南下') !== -1) { direction = '南下'; }

        // const isStopOnWayTimeStartI = postRow.text.indexOf('途上下車：');
        // const isStopOnWayTimeEndI = postRow.text.indexOf('共乘能源');
        // const isStopOnWay = postRow.text.substring(isStopOnWayTimeStartI + 5, isStopOnWayTimeEndI).trim();

        // const costSharingTimeStartI = postRow.text.indexOf('分攤費：');
        // const costSharingTimeEndI = postRow.text.indexOf('備註');
        // const costSharing = postRow.text.substring(costSharingTimeStartI + 4, costSharingTimeEndI).trim();

        // const noteTimeStartI = postRow.text.indexOf('備註：');
        // const noteTimeEndI = postRow.text.indexOf('則留言');
        // let note = postRow.text.substring(noteTimeStartI + 3, noteTimeEndI).trim();
        // if (noteTimeStartI === -1) { note = ''; }
        const post: Post = {
            id: postRow.id,
            row: postRow,
            userName,
            type,
            activeAmount,
            activeTimeAll,
            activeTime,
            routeAll,
            routeStart,
            routeEnd,
            linkIds: [],
            // placeGetOn,
            // placeGetOff,
            // travelType,
            // direction,
            // isStopOnWay,
            // costSharing,
            // note,
            routeStartCode,
            routeEndCode,
            safeNumber,
            isCommanent: false,
            created_at: new Date().getTime(),
        };
        return post;
    } catch (error) {
        // console.log('postRow GG:>> ', postRow.id);
        console.log('error :>> ', error);
        postRow.error = error.name + ':' + error.message;
        db.collection('postsError').doc(postRow.id).set(postRow).catch();
        return null;
    }
}

export function handlePostError(postRow: PostRow): string[] {
    const errorMsg: string[] = [];
    const twCityCode = [
        { value: 1, key: '基隆市' },
        { value: 2, key: '台北市' },
        { value: 2, key: '臺北市' },
        { value: 2, key: '新北市' },
        { value: 2, key: '雙北市' },
        { value: 2, key: '双北市' },
        { value: 3, key: '桃園市' },
        { value: 4, key: '新竹市' },
        { value: 4, key: '新竹縣' },
        { value: 5, key: '苗栗縣' },
        { value: 6, key: '台中市' },
        { value: 6, key: '臺中市' },
        { value: 7, key: '南投縣' },
        { value: 8, key: '彰化縣' },
        { value: 9, key: '雲林縣' },
        { value: 10, key: '嘉義市' },
        { value: 10, key: '嘉義縣' },
        { value: 11, key: '台南市' },
        { value: 11, key: '臺南市' },
        { value: 12, key: '高雄市' },
        { value: 12, key: '高市' },
        { value: 13, key: '屏東縣' },
        { value: 14, key: '宜蘭縣' },
        { value: 15, key: '花蓮縣' },
        { value: 16, key: '台東縣' },
        { value: 16, key: '臺東縣' },
    ];

    let activeTimeAll = '';
    let activeTime = '';
    let routeAll = '';
    let routeStart = '';
    let routeEnd = '';
    let routeStartCode = 0;
    let routeEndCode = 0;
    let routeSp: string[] = [];

    postRow.text = postRow.text.split(' : ').join('：');
    postRow.text = postRow.text.split(':').join('：');
    let safeNumber = '';
    if (postRow.text.indexOf('安心駕駛') !== -1) {
        console.log('安心駕駛 :>> ', postRow);
        const safeNumberStartI = postRow.text.indexOf('安心駕駛：');
        const safeNumberEndI = postRow.text.indexOf('#提供座位');
        safeNumber = postRow.text.substring(safeNumberStartI + 5, safeNumberEndI).trim();
    }
    let type: '' | '徵求座位' | '提供座位' = ''; // '徵求座位' | '提供座位' | '';
    if (postRow.text.indexOf('徵求座位') !== -1) { type = '徵求座位'; }
    if (postRow.text.indexOf('提供座位') !== -1) { type = '提供座位'; }

    if (type === '') {
        errorMsg.push('#共乘需求 格式是否為 #提供座位 或 #徵求座位；');
    }

    const activeAmountSp: string[] = postRow.text.split('位');
    const activeAmountSpGet = activeAmountSp.find(a => a.indexOf('人數') !== -1);
    let activeAmount = 0;
    if (activeAmountSpGet) {
        const activeAmountSpGetI = activeAmountSpGet.indexOf('人數')
        activeAmount = Number(activeAmountSpGet.substring(activeAmountSpGetI + 2));
    }

    const userNamei = postRow.text.indexOf(' · ');
    const userName = postRow.text.substring(0, userNamei).trim();


    try {
        const activeTimeStartI = postRow.text.indexOf('共乘時間：');
        const activeTimeEndI = postRow.text.indexOf('行程路線：');
        activeTimeAll = postRow.text.substring(activeTimeStartI + 5, activeTimeEndI).trim();
        activeTimeAll = activeTimeAll.split(' ').join(''); // 清除空白
        activeTimeAll = activeTimeAll.split('／').join('/'); // 取代斜線
        activeTime = activeTimeAll.substring(0, 10);
    } catch (error) {
        errorMsg.push('#出發日期 格式是否符合 YYYY/MM/DD (例如 <TODAY>)；');
    }

    try {
        // #嘉義縣=》#雙北市 => #台北
        const routeTimeStartI = postRow.text.indexOf('行程路線：');
        const routeTimeEndI = postRow.text.indexOf('上車地點：');
        routeAll = postRow.text.substring(routeTimeStartI + 5, routeTimeEndI).trim();
        console.log('routeAll :>> ', routeAll, postRow.id);
        routeSp = routeAll.split('#');
        routeStart = routeSp[1].substring(0, 2);
        routeEnd = routeSp.pop().substring(0, 2);
        routeStartCode = twCityCode.find(t => t.key.indexOf(routeStart) !== -1).value;
        routeEndCode = twCityCode.find(t => t.key.indexOf(routeEnd) !== -1).value;
    } catch (error) {
        errorMsg.push('#行程路線 格式是否符合 #出發直轄縣市 => #到達直轄縣市 (例如 #台北市 => #高雄市)；');
    }

    const post: Post = {
        id: postRow.id,
        row: postRow,
        userName,
        type,
        activeAmount,
        activeTimeAll,
        activeTime,
        routeAll,
        routeStart,
        routeEnd,
        linkIds: [],
        routeStartCode,
        routeEndCode,
        safeNumber,
        isCommanent: false,
        created_at: new Date().getTime(),
    };
    console.log('post :>> ', post);
    return errorMsg;
}

export function postMessage(page: puppeteer.Page, url: string, text: string) {
    return new Promise(async (resolve,) => {
        await page.goto(url, { waitUntil: 'networkidle2' });
        const [button] = await page.$x("//*[contains(text(), '公開留言')]");
        if (button) {
            await button.click();
            await sleep(100);
        }
        await page.keyboard.type(text);
        await sleep(100);
        await page.keyboard.press('Enter');
        await sleep(2000);
        resolve(true);
    });
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()
export function facebookLogin(page: puppeteer.Page, i = 0) {
    return new Promise(async (resolve,) => {
        const users = [
            // 留言用
            {
                email: process.env.FB_EMAIL1,
                password: process.env.FB_PASSWORD1,
            },
            // 媒合用
            {
                email: process.env.FB_EMAIL2,
                password: process.env.FB_PASSWORD2,
            }
        ];
        await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });
        // await page.screenshot({ path: 'example-click-log1.png' });
        await page.waitForSelector('#email')
        await page.focus('#email')
        await page.click('#email')
        await sleep(200);
        await page.keyboard.type(users[i].email)
        // await page.screenshot({ path: 'example-click-log2.png' });
        await sleep(200);
        await page.focus('#pass')
        await page.click('#pass')
        await sleep(200);
        await page.keyboard.type(users[i].password)
        await sleep(200);
        await page.click('#loginbutton');
        // await page.screenshot({ path: 'example-click-log3.png' });
        await page.waitForNavigation();
        await sleep(1000);
        resolve(true);
    });
}

export async function getPost(page: puppeteer.Page): Promise<PostRow> {
    await page.evaluate(() => { window.scrollBy(0, 0); });
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve,) => {
        let isOk = false;
        const [button0] = await page.$x("//*[contains(text(), '剛剛')]");
        const [button2] = await page.$x("//*[contains(text(), '分鐘')]");
        const [button1] = await page.$x("//*[contains(text(), '小時')]");
        const [button3] = await page.$x("//*[contains(text(), '昨天')]");
        try {
            if (button0) { await button0.hover(); await sleep(500); isOk = true; }
            if (button2) { await button2.hover(); await sleep(500); isOk = true; console.log('object :>> 分鐘'); }
            if (button1) { await button1.hover(); await sleep(500); isOk = true; console.log('object :>> 小時'); }
            if (button3) { await button3.hover(); await sleep(500); isOk = true; console.log('object :>> 昨天'); }
        } catch (error) {
            // console.log('object GG:>> ', error);
        }
        const [buttonOpen] = await page.$x("//*[contains(text(), '公開社團')]");
        await buttonOpen.click();
        await sleep(200);
        const i = new Date().getTime();
        // await page.screenshot({ path: 'example-click-' + i + '.png' });
        console.log('isOk :>> ', isOk, i);
        const post: PostRow = await page.evaluate(async () => {
            const ele = document.querySelector('div[role="feed"]>div');
            let postId = '';
            const message = [''];
            if (ele) {
                for (const e of ele.querySelectorAll('a')) {
                    // message.push(e.href);
                    if (e.href.indexOf('posts') !== -1) {
                        postId = e.href.split('/')[6];
                        break;
                    }
                }
            }
            const text = ele?.textContent;
            ele?.remove();
            return { text, id: postId, message, isCommanent: false };
        });
        await sleep(1000);
        resolve(post);
    });
}

export function sleep(timeout: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, timeout);
    });
}