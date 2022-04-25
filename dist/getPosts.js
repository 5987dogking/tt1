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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.facebookLogin = exports.handlePost = exports.helloWorld = void 0;
const functions = __importStar(require("firebase-functions"));
const serviceAccount = __importStar(require("./puppeteer-mark-firebase-adminsdk.json"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const admin = require("firebase-admin");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gs://puppeteer-mark.appspot.com',
});
const db = admin.firestore();
exports.helloWorld = functions.runWith({ memory: '8GB', timeoutSeconds: 540 }).https.onRequest((request, response) => __awaiter(void 0, void 0, void 0, function* () {
    functions.logger.info("Hello logs!", { structuredData: true });
    const browser = yield puppeteer_1.default.launch();
    const page = yield browser.newPage();
    yield page.setRequestInterception(true);
    yield page.emulateTimezone('Asia/Taipei');
    page.on('request', (r) => __awaiter(void 0, void 0, void 0, function* () {
        if (['image'].indexOf(r.resourceType()) !== -1) {
            yield r.abort();
        }
        else {
            yield r.continue();
        }
    }));
    // const pageForMessage = await browser.newPage();
    yield page.setViewport({ width: 800, height: 1200 });
    // 登入流程
    yield facebookLogin(page);
    const url = 'https://www.facebook.com/groups/284674743644775?sorting_setting=CHRONOLOGICAL'; // 測試用
    // const urlBase = 'https://www.facebook.com/groups/284674743644775'; // 測試用
    // const urlBase = 'https://www.facebook.com/groups/317555698448325'; // 正式
    // const url = 'https://www.facebook.com/groups/317555698448325?sorting_setting=CHRONOLOGICAL'; // 正式
    // const url = 'https://www.facebook.com/groups/317555698448325/posts/1751894941681053/'; // error test
    yield page.goto(url, { waitUntil: 'networkidle2' });
    yield page.waitForSelector('div[role="feed"]');
    const data = [];
    console.time("answer time");
    for (let i = 0; i < 100; i++) {
        yield page.waitForSelector('div[role="feed"]>div');
        const [button] = yield page.$x("//*[contains(text(), '顯示更多')]");
        if (button) {
            try {
                yield button.click();
            }
            catch (error) {
                console.log('button :>> err');
            }
            yield sleep(100);
        }
        const postRow = yield getPost(page);
        if (postRow.id) {
            const post = handlePost(postRow);
            if (!post) {
                continue;
            }
            data.push(post);
            yield db.collection('posts').doc(post.id).set(post);
        }
        else {
            console.log('postRow No id:>> ', postRow);
        }
        console.timeLog("answer time", postRow.id);
        yield sleep(200);
    }
    yield browser.close();
    response.send({ result: true, data });
}));
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
        console.log('routeAll :>> ', routeAll, postRow.id);
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
            isCommanent: false
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
function facebookLogin(page) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        yield page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });
        yield page.screenshot({ path: 'example-click-log1.png' });
        yield page.waitForSelector('#email');
        yield page.focus('#email');
        yield page.click('#email');
        yield sleep(200);
        yield page.keyboard.type('cargrouptest1@outlook.com');
        yield page.screenshot({ path: 'example-click-log2.png' });
        yield sleep(200);
        yield page.focus('#pass');
        yield page.click('#pass');
        yield sleep(200);
        yield page.keyboard.type('123456Qazwsx');
        yield sleep(200);
        yield page.click('#loginbutton');
        yield page.screenshot({ path: 'example-click-log3.png' });
        yield page.waitForNavigation();
        yield sleep(1000);
        resolve(true);
    }));
}
exports.facebookLogin = facebookLogin;
function getPost(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.evaluate(_ => { window.scrollBy(0, 0); });
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let isOk = false;
            const [button0] = yield page.$x("//*[contains(text(), '剛剛')]");
            const [button2] = yield page.$x("//*[contains(text(), '分鐘')]");
            const [button1] = yield page.$x("//*[contains(text(), '小時')]");
            const [button3] = yield page.$x("//*[contains(text(), '昨天')]");
            try {
                if (button0) {
                    yield button0.hover();
                    yield sleep(500);
                    isOk = true;
                }
                if (button2) {
                    yield button2.hover();
                    yield sleep(500);
                    isOk = true;
                    console.log('object :>> 分鐘');
                }
                if (button1) {
                    yield button1.hover();
                    yield sleep(500);
                    isOk = true;
                    console.log('object :>> 小時');
                }
                if (button3) {
                    yield button3.hover();
                    yield sleep(500);
                    isOk = true;
                    console.log('object :>> 昨天');
                }
            }
            catch (error) {
                console.log('object GG:>> ', error);
            }
            const [buttonOpen] = yield page.$x("//*[contains(text(), '公開社團')]");
            yield buttonOpen.click();
            yield sleep(200);
            const i = new Date().getTime();
            yield page.screenshot({ path: 'example-click-' + i + '.png' });
            console.log('isOk :>> ', isOk, i);
            const post = yield page.evaluate((p) => __awaiter(this, void 0, void 0, function* () {
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
                return { text, id: postId, message };
            }));
            yield sleep(1000);
            resolve(post);
        }));
    });
}
function sleep(timeout) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, timeout);
    });
}
exports.sleep = sleep;
