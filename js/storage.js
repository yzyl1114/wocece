class StorageManager {
    constructor() {
        this.storage = window.localStorage;
        // 根据域名自动判断环境
        this.TEST_MODE = window.location.hostname !== 'wocece.com';
        
        console.log(`运行模式: ${this.TEST_MODE ? '测试环境' : '正式环境'}`);
        this.cleanupExpiredResults();
    }

    // 检查是否已支付
    hasPaidForTest(testId) {
        // 测试模式直接返回true
        if (this.TEST_MODE) {
            console.log('测试模式：已免费解锁测试', testId);
            return true;
        }
        
        // 正式模式检查真实的支付记录
        const paidTests = this.getPaidTests();
        return paidTests.includes(testId);
    }

    // 获取已支付的测试列表
    getPaidTests() {
        const data = this.storage.getItem('paid_tests');
        return data ? JSON.parse(data) : [];
    }

    // 保存支付记录
    savePaymentRecord(testId) {
        const paidTests = this.getPaidTests();
        if (!paidTests.includes(testId)) {
            paidTests.push(testId);
            this.storage.setItem('paid_tests', JSON.stringify(paidTests));
        }
    }

    // ========== 测试进度管理 ==========
    
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

    // ========== 测试结果管理 ==========
    
    // 保存测试结果
    saveTestResult(resultId, resultData) {
        const result = {
            data: resultData,
            timestamp: Date.now(),
            testId: resultData.testId || 'unknown'
        };
        this.storage.setItem(`test_result_${resultId}`, JSON.stringify(result));
        console.log('测试结果已保存:', resultId);
    }

    // 获取测试结果
    getTestResult(resultId) {
        const data = this.storage.getItem(`test_result_${resultId}`);
        if (data) {
            try {
                const result = JSON.parse(data);
                console.log('测试结果已加载:', resultId);
                return result;
            } catch (error) {
                console.error('解析测试结果失败:', error);
                return null;
            }
        }
        return null;
    }

    // 移除测试结果
    removeTestResult(resultId) {
        this.storage.removeItem(`test_result_${resultId}`);
        console.log('测试结果已移除:', resultId);
    }

    // 清理过期的测试结果（24小时）
    cleanupExpiredResults(maxAge = 24 * 60 * 60 * 1000) {
        const now = Date.now();
        const keysToRemove = [];
        
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith('test_result_')) {
                const data = this.storage.getItem(key);
                if (data) {
                    try {
                        const result = JSON.parse(data);
                        if (now - result.timestamp > maxAge) {
                            keysToRemove.push(key);
                        }
                    } catch (e) {
                        keysToRemove.push(key);
                    }
                }
            }
        }
        
        if (keysToRemove.length > 0) {
            console.log(`清理 ${keysToRemove.length} 个过期测试结果`);
            keysToRemove.forEach(key => this.storage.removeItem(key));
        }
    }

    // ========== 用户信息管理 ==========
    
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