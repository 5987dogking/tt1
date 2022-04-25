"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineOrderPNPStatus = void 0;
var LineOrderPNPStatus;
(function (LineOrderPNPStatus) {
    // 完成
    LineOrderPNPStatus["Confirm"] = "\u5DF2\u5B8C\u6210";
    // 取消
    LineOrderPNPStatus["Cancel"] = "\u5DF2\u53D6\u6D88";
    // DeclinedByMerchant = '已被商家取消',
    // 提醒
    // ServiceReady = '已經準備好了',
    // Change = '已更改',
    LineOrderPNPStatus["BookingNotification"] = "\u6642\u9593\u5C07\u81F3";
})(LineOrderPNPStatus = exports.LineOrderPNPStatus || (exports.LineOrderPNPStatus = {}));
