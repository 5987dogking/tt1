import { DBbase } from './common';

export interface LINEBot extends DBbase {
    id?: string;
    botInfo: BotInfo;
    adminAccountId: string;
    contractId: string;
    token: string;
    audiences: {
        audience_id: string;
        description: string;
    }[];
}

export interface BotInfo {
    userId: string;
    basicId: string;
    displayName: string;
    chatMode: string;
    markAsReadMode: string;
}

export interface LineNotifyStatus {
    status: number;
    message: string; // Message visible to end-user
    targetType: 'USER' | 'GROUP';
    target: string; // 'USER' | 'GROUP' name
    access_token: string;
}

export interface LineNotifySendStatus {
    status: 200 | 400;
    message: string;
}

export enum LineOrderPNPStatus {
    // 完成
    Confirm = '已完成',
    // 取消
    Cancel = '已取消',
    // DeclinedByMerchant = '已被商家取消',
    // 提醒
    // ServiceReady = '已經準備好了',
    // Change = '已更改',
    BookingNotification = '時間將至',
}