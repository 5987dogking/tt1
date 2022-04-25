"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const admin = require("firebase-admin");
const moment_1 = __importDefault(require("moment"));
const puppetterExport_1 = require("./puppetterExport");
async function matchPost() {
    const activeTime = (0, moment_1.default)().format('YYYY/MM/DD');
    const postCol = await db.collection('posts').where('activeTime', '>=', activeTime).get();
    const postWorld = {}; // 所有貼文
    for (const doc of postCol.docs) {
        const post = doc.data();
        if (!postWorld[post.activeTime]) {
            postWorld[post.activeTime] = [];
        }
        postWorld[post.activeTime].push(post);
    }
    const postGets = []; // 配對成功
    for (const [, posts] of Object.entries(postWorld)) {
        const postAs = []; // 司機
        const postBs = []; // 乘客
        for (const post of posts) {
            if (post.type === '提供座位') {
                postAs.push(post);
            }
            if (post.type === '徵求座位') {
                postBs.push(post);
            }
        }
        for (const postA of postAs) {
            for (const postB of postBs) {
                // 16 -> 1
                if (postA.routeStartCode > postA.routeEndCode && postB.routeStartCode > postB.routeEndCode) {
                    if (postB.routeStartCode <= postA.routeStartCode && postB.routeEndCode >= postA.routeEndCode) {
                        if (postB.linkIds && postB.linkIds.indexOf(postA.id) !== -1) {
                            continue;
                        }
                        postGets.push({ postA, postB });
                    }
                }
                // 1 -> 16
                if (postA.routeStartCode < postA.routeEndCode && postB.routeStartCode < postB.routeEndCode) {
                    if (postB.routeStartCode >= postA.routeStartCode && postB.routeEndCode <= postA.routeEndCode) {
                        if (postB.linkIds && postB.linkIds.indexOf(postA.id) !== -1) {
                            continue;
                        }
                        postGets.push({ postA, postB });
                    }
                }
            }
        }
    }
    // for (const postGet of postGets) {
    //     console.log('postGet :>> ', postGet.postA.id, postGet.postA.activeTime, postGet.postA.userName);
    // }
    return postGets;
}
const db = admin.firestore();
workMatchPost();
async function workMatchPost() {
    const data = await matchPost();
    const browser = await puppeteer_1.default.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1200 });
    await (0, puppetterExport_1.facebookLogin)(page, 1);
    for (const postMatch of data.slice(0, 1)) {
        if (postMatch.postA.routeStartCode >= 14 || postMatch.postA.routeEndCode >= 14) {
            continue;
        }
        if (postMatch.postB.routeStartCode >= 14 || postMatch.postB.routeEndCode >= 14) {
            continue;
        }
        console.log('postGet :>> ', postMatch.postA.id, postMatch.postA.activeTime, postMatch.postA.userName);
        const postAUrl = 'https://www.facebook.com/groups/284674743644775/posts/' + postMatch.postA.id;
        const postBUrl = 'https://www.facebook.com/groups/284674743644775/posts/' + postMatch.postB.id;
        let messageA = '恭喜！#社團自動媒合服務 似乎找到符合您的行程需求！歡迎透過以下連結聯繫您的共乘夥伴唷！';
        messageA += `於 #${postMatch.postA.activeTime} 從 #${postMatch.postA.routeStart} => #${postMatch.postA.routeEnd}；`;
        messageA += `細節看這裡 ` + postAUrl;
        let messageB = '恭喜！#社團自動媒合服務 似乎找到符合您的行程需求！歡迎透過以下連結聯繫您的共乘夥伴唷！';
        messageB += `於 #${postMatch.postB.activeTime} 從 #${postMatch.postB.routeStart} => #${postMatch.postB.routeEnd}；`;
        messageB += `細節看這裡 ` + postBUrl;
        console.log('messageB :>> ', postMatch.postA.id);
        db.collection('posts').doc(postMatch.postA.id).update({ linkIds: admin.firestore.FieldValue.arrayUnion(postMatch.postB.id) });
        db.collection('posts').doc(postMatch.postB.id).update({ linkIds: admin.firestore.FieldValue.arrayUnion(postMatch.postA.id) });
        await (0, puppetterExport_1.postMessage)(page, postAUrl, messageB);
        await (0, puppetterExport_1.sleep)(60000 * 2);
        await (0, puppetterExport_1.postMessage)(page, postBUrl, messageA);
    }
    process.exit(1);
}
