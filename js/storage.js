class StorageManager {
    constructor() {
        this.storage = window.localStorage;
    }

    // 保存测试进度
    saveTestProgress(testId, answers) {
        const progress = {
            testId,
            answers,
            timestamp: Date.now()
        };
        
        this.storage.setItem(`test_progress_${testId}`, JSON.stringify(progress));
    }

    // 获取测试进度
    getTestProgress(testId) {
        const data = this.storage.getItem(`test_progress_${testId}`);
        return data ? JSON.parse(data) : null;
    }

    // 清除测试进度
    clearTestProgress(testId) {
        this.storage.removeItem(`test_progress_${testId}`);
    }

    // 保存用户信息
    saveUserInfo(userInfo) {
        this.storage.setItem('user_info', JSON.stringify(userInfo));
    }

    // 获取用户信息
    getUserInfo() {
        const data = this.storage.getItem('user_info');
        return data ? JSON.parse(data) : {};
    }

    // 保存兑换记录
    saveRedeemRecord(code, testId) {
        const records = this.getRedeemRecords();
        records.push({ code, testId, timestamp: Date.now() });
        this.storage.setItem('redeem_records', JSON.stringify(records));
    }

    // 获取兑换记录
    getRedeemRecords() {
        const data = this.storage.getItem('redeem_records');
        return data ? JSON.parse(data) : [];
    }

    // 检查是否已兑换
    isRedeemed(code, testId) {
        const records = this.getRedeemRecords();
        return records.some(record => record.code === code && record.testId === testId);
    }
}

// 全局存储实例
window.storageManager = new StorageManager();