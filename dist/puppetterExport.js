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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.getPost = exports.facebookLogin = exports.postMessage = exports.handlePostError = exports.handlePost = void 0;
const admin = require("firebase-admin");
const serviceAccount = __importStar(require("./puppeteer-mark-firebase-adminsdk.json"));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gs://puppeteer-mark.appspot.com',
});
const db = admin.firestore();
function handlePost(postRow) {
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
            const safeNumberStartI = postRow.text.indexOf('安心駕駛：');
            const safeNumberEndI = postRow.text.indexOf('#提供座位');
            safeNumber = postRow.text.substring(safeNumberStartI + 5, safeNumberEndI).trim();
        }
        let type = ''; // '徵求座位' | '提供座位' | '';
        if (postRow.text.indexOf('徵求座位') !== -1) {
            type = '徵求座位';
        }
        if (postRow.text.indexOf('提供座位') !== -1) {
            type = '提供座位';
        }
        const activeAmountSp = postRow.text.split('位');
        const activeAmountSpGet = activeAmountSp.find(a => a.indexOf('人數') !== -1);
        let activeAmount = 0;
        if (activeAmountSpGet) {
            const activeAmountSpGetI = activeAmountSpGet.indexOf('人數');
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
        console.log('routeAll :>> ', routeAll, 'id:' + postRow.id);
        const routeSp = routeAll.split('#');
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
        const post = {
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
    }
    catch (error) {
        // console.log('postRow GG:>> ', postRow.id);
        console.log('error :>> ', error);
        postRow.error = error.name + ':' + error.message;
        db.collection('postsError').doc(postRow.id).set(postRow).catch();
        return null;
    }
}
exports.handlePost = handlePost;
function handlePostError(postRow) {
    const errorMsg = [];
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
    let routeSp = [];
    postRow.text = postRow.text.split(' : ').join('：');
    postRow.text = postRow.text.split(':').join('：');
    let safeNumber = '';
    if (postRow.text.indexOf('安心駕駛') !== -1) {
        console.log('安心駕駛 :>> ', postRow);
        const safeNumberStartI = postRow.text.indexOf('安心駕駛：');
        const safeNumberEndI = postRow.text.indexOf('#提供座位');
        safeNumber = postRow.text.substring(safeNumberStartI + 5, safeNumberEndI).trim();
    }
    let type = ''; // '徵求座位' | '提供座位' | '';
    if (postRow.text.indexOf('徵求座位') !== -1) {
        type = '徵求座位';
    }
    if (postRow.text.indexOf('提供座位') !== -1) {
        type = '提供座位';
    }
    if (type === '') {
        errorMsg.push('#共乘需求 格式是否為 #提供座位 或 #徵求座位；');
    }
    const activeAmountSp = postRow.text.split('位');
    const activeAmountSpGet = activeAmountSp.find(a => a.indexOf('人數') !== -1);
    let activeAmount = 0;
    if (activeAmountSpGet) {
        const activeAmountSpGetI = activeAmountSpGet.indexOf('人數');
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
    }
    catch (error) {
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
    }
    catch (error) {
        errorMsg.push('#行程路線 格式是否符合 #出發直轄縣市 => #到達直轄縣市 (例如 #台北市 => #高雄市)；');
    }
    const post = {
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
exports.handlePostError = handlePostError;
function postMessage(page, url, text) {
    return new Promise(async (resolve) => {
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
exports.postMessage = postMessage;
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
function facebookLogin(page, i = 0) {
    return new Promise(async (resolve) => {
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
        await page.waitForSelector('#email');
        await page.focus('#email');
        await page.click('#email');
        await sleep(200);
        await page.keyboard.type(users[i].email);
        // await page.screenshot({ path: 'example-click-log2.png' });
        await sleep(200);
        await page.focus('#pass');
        await page.click('#pass');
        await sleep(200);
        await page.keyboard.type(users[i].password);
        await sleep(200);
        await page.click('#loginbutton');
        // await page.screenshot({ path: 'example-click-log3.png' });
        await page.waitForNavigation();
        await sleep(1000);
        resolve(true);
    });
}
exports.facebookLogin = facebookLogin;
async function getPost(page) {
    await page.evaluate(() => { window.scrollBy(0, 0); });
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
        let isOk = false;
        const [button0] = await page.$x("//b[contains(text(), '剛剛')]");
        const [button2] = await page.$x("//b[contains(text(), '分鐘')]");
        const [button1] = await page.$x("//b[contains(text(), '小時')]");
        const [button3] = await page.$x("//b[contains(text(), '昨天')]");
        try {
            if (button0) {
                console.log('剛剛');
                await button0.hover();
                await sleep(500);
                isOk = true;
            }
            if (button2) {
                console.log('分鐘');
                await button2.hover();
                await sleep(500);
                isOk = true;
                console.log('object :>> 分鐘');
            }
            if (button1) {
                console.log('小時');
                await button1.hover();
                await sleep(500);
                isOk = true;
                console.log('object :>> 小時');
            }
            if (button3) {
                console.log('昨天');
                await button3.hover();
                await sleep(500);
                isOk = true;
                console.log('object :>> 昨天');
            }
        }
        catch (error) {
            // console.log('object GG:>> ', error);
        }
        const [buttonOpen] = await page.$x("//*[contains(text(), '公開社團')]");
        await buttonOpen.click();
        await sleep(200);
        const i = new Date().getTime();
        // await page.screenshot({ path: 'example-click-' + i + '.png' });
        const post = await page.evaluate(async () => {
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
            const text = ele === null || ele === void 0 ? void 0 : ele.textContent;
            ele === null || ele === void 0 ? void 0 : ele.remove();
            return { text, id: postId, message, isCommanent: false };
        });
        await sleep(1000);
        resolve(post);
    });
}
exports.getPost = getPost;
function sleep(timeout) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, timeout);
    });
}
exports.sleep = sleep;
