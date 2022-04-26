import moment from 'moment';
import puppeteer from 'puppeteer';
import admin = require('firebase-admin');
import { facebookLogin, handlePostError, Post, postMessage, PostRow } from './puppetterExport';


const db: FirebaseFirestore.Firestore = admin.firestore();
workPostsCommanent();
async function workPostsCommanent() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const urlBase = 'https://www.facebook.com/groups/284674743644775';
    await page.setViewport({ width: 800, height: 1200 });
    const postErrorCol = await db.collection('postsError').where('isCommanent', '==', false).limit(1).get();
    if (postErrorCol.size > 0) {
        await facebookLogin(page);
        const post = postErrorCol.docs[0].data() as PostRow;
        const postUrl = urlBase + '/posts/' + post.id;
        const errorMsg = handlePostError(post);
        console.log('postUrl :>> ', postUrl);
        await postMessage(page, postUrl, '「Oops！您的共乘需求並沒有被 #社團自動媒合服務 收錄成功。請確認您的' + errorMsg.join('以及') + '若您需要 #社團自動媒合服務，麻煩您重新發文；最後請注意：若您的共乘需求不符合貼文格式，社團管理員將會刪除您的共乘文章');
        await db.collection('postsError').doc(post.id).update({ isCommanent: true });
        return;
    }

    const activeTime = moment().format('YYYY/MM/DD');
    const postCol = await db.collection('posts').
        where('activeTime', '>=', activeTime).
        where('isCommanent', '==', false).get();
    const datas: Post[] = [];
    for (const doc of postCol.docs) {
        const post = doc.data() as Post;
        datas.push(post);
    }
    datas.sort(function (a, b) {
        return Number(a.id) - Number(b.id);
    });
    console.log('datas :>> ', datas);
    if (postCol.size === 0) { return; }
    await facebookLogin(page);
    for (const post of datas.slice(0, 1)) {
        const postUrl = urlBase + '/posts/' + post.id;
        console.log('postUrl :>> ', postUrl);
        await postMessage(page, postUrl, '「YES！您的共乘需求已經收錄成功！小幫手將於此篇文章下留言給您適合的行程；請您隨時留意喔！」');
        await db.collection('posts').doc(post.id).update({ isCommanent: true });
    }
    console.log('done');
    process.exit(1)
    return;
}
console.log('done ok');