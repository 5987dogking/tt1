import puppeteer from 'puppeteer';
import admin = require('firebase-admin');
import moment from 'moment';
import { closeAll, facebookLogin, notifySend, Post, postMessage, sleep } from "./puppetterExport";
interface PostMatch {
    postA: Post;
    postB: Post;
}

async function matchPost(): Promise<PostMatch[]> {
    const activeTime = moment().format('YYYY/MM/DD');
    const postCol = await db.collection('posts').where('activeTime', '>=', activeTime).get();
    const postWorld: { [key: string]: Post[] } = {}; // 所有貼文
    for (const doc of postCol.docs) {
        const post = doc.data() as Post;
        if (!postWorld[post.activeTime]) { postWorld[post.activeTime] = []; }
        postWorld[post.activeTime].push(post);
    }
    const postGets: PostMatch[] = []; // 配對成功
    for (const [, posts] of Object.entries(postWorld)) {
        const postAs: Post[] = []; // 司機
        const postBs: Post[] = []; // 乘客
        for (const post of posts) {
            if (post.type === '提供座位') { postAs.push(post); }
            if (post.type === '徵求座位') { postBs.push(post); }
        }
        for (const postA of postAs) {
            for (const postB of postBs) {
                // 16 -> 1
                if (postA.routeStartCode > postA.routeEndCode && postB.routeStartCode > postB.routeEndCode) {
                    if (postB.routeStartCode <= postA.routeStartCode && postB.routeEndCode >= postA.routeEndCode) {
                        if (postB.linkIds && postB.linkIds.indexOf(postA.id) !== -1) { continue; }
                        postGets.push({ postA, postB });
                    }
                }
                // 1 -> 16
                if (postA.routeStartCode < postA.routeEndCode && postB.routeStartCode < postB.routeEndCode) {
                    if (postB.routeStartCode >= postA.routeStartCode && postB.routeEndCode <= postA.routeEndCode) {
                        if (postB.linkIds && postB.linkIds.indexOf(postA.id) !== -1) { continue; }
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

const db: FirebaseFirestore.Firestore = admin.firestore();
workMatchPost();
console.log(moment().format('YYYY-MM-DD HH:mm'), 'workMatchPost working...');
async function workMatchPost() {
    const data = await matchPost();
    // console.log('data :>> ', data);
    if (data.length === 0) {
        console.log(moment().format('YYYY-MM-DD HH:mm'), 'workMatchPost No match posts.');
        process.exit(1);
        return;
    }
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1200 });
    console.log('pageok :>> ');
    await facebookLogin(page, 1);
    await page.screenshot({ path: 'example-click-workMatchPost.png' });
    for (const postMatch of data.slice(0, 1)) {
        if (postMatch.postA.routeStartCode >= 14 || postMatch.postA.routeEndCode >= 14) { continue; }
        if (postMatch.postB.routeStartCode >= 14 || postMatch.postB.routeEndCode >= 14) { continue; }
        console.log(moment().format('YYYY-MM-DD HH:mm'), 'postMatch :>> ', postMatch.postA.id, postMatch.postB.id);
        const postAUrl = 'https://www.facebook.com/groups/284674743644775/posts/' + postMatch.postA.id;
        const postBUrl = 'https://www.facebook.com/groups/284674743644775/posts/' + postMatch.postB.id;
        let messageA = '恭喜！#社團自動媒合服務 似乎找到符合您的行程需求！歡迎透過以下連結聯繫您的共乘夥伴唷！';
        messageA += `於 #${postMatch.postA.activeTime} 從 #${postMatch.postA.routeStart} => #${postMatch.postA.routeEnd}；`;
        messageA += `細節看這裡 ` + postAUrl;
        let messageB = '恭喜！#社團自動媒合服務 似乎找到符合您的行程需求！歡迎透過以下連結聯繫您的共乘夥伴唷！';
        messageB += `於 #${postMatch.postB.activeTime} 從 #${postMatch.postB.routeStart} => #${postMatch.postB.routeEnd}；`;
        messageB += `細節看這裡 ` + postBUrl;
        db.collection('posts').doc(postMatch.postA.id).update({ linkIds: admin.firestore.FieldValue.arrayUnion(postMatch.postB.id) });
        db.collection('posts').doc(postMatch.postB.id).update({ linkIds: admin.firestore.FieldValue.arrayUnion(postMatch.postA.id) });
        await postMessage(page, postAUrl, messageB).catch(() => {
            notifySend('AAl1kG01KxATFfow2CeqJWAGSPcSM359ByEv4hDsxbc', 'workMatchPost Error 發生錯誤:' + postAUrl);
        });
        await sleep(60000 * 2);
        await postMessage(page, postBUrl, messageA).catch(() => {
            notifySend('AAl1kG01KxATFfow2CeqJWAGSPcSM359ByEv4hDsxbc', 'workMatchPost Error 發生錯誤:' + postBUrl);
        });
        closeAll(browser);
    }
}