class PaymentManager {
    constructor() {
        this.paymentInProgress = false;
        // 根据环境配置API地址
        this.apiBase = this.isProduction() 
            ? 'https://wocece.com/api' 
            : 'https://yzyl1114.github.io/wocece/api'; // GitHub Pages 测试环境
        
        this.isProd = this.isProduction();
    }

    // 环境检测
    isProduction() {
        return window.location.hostname === 'wocece.com';
    }

    // 初始化支付
    async initializePayment(testId, amount) {
        if (this.paymentInProgress) {
            this.showToast('支付处理中，请稍候...');
            return;
        }

        // 测试环境直接模拟支付成功
        if (!this.isProd && storageManager.TEST_MODE) {
            this.showToast('测试模式：已免费解锁测试');
            storageManager.savePaymentRecord(testId);
            setTimeout(() => {
                window.location.href = `testing.html?id=${testId}`;
            }, 1000);
            return;
        }

        this.paymentInProgress = true;
        
        try {
            // 显示跳转提示
            this.showToast('即将跳转支付宝...');
            
            const orderInfo = await this.createOrder(testId, amount);
            
            // 保存支付状态
            const paymentSession = {
                testId: testId,
                timestamp: Date.now(),
                status: 'pending',
                tradeNo: orderInfo.tradeNo
            };
            sessionStorage.setItem('current_payment', JSON.stringify(paymentSession));
            
            // 直接在当前页面跳转，而不是新窗口
            setTimeout(() => {
                this.submitToAlipay(orderInfo.paymentUrl);
            }, 1500); // 给用户1.5秒看到提示
            
        } catch (error) {
            console.error('支付失败:', error);
            this.showToast('支付失败: ' + (error.message || '请重试'));
            this.paymentInProgress = false;
        }
    }

    // 新增方法：使用表单提交避免Safari弹窗
    submitToAlipay(paymentUrl) {
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = paymentUrl;
        form.style.display = 'none';
        document.body.appendChild(form);
        form.submit();
    }

    // ✅ 正式环境：真实的支付验证
    async verifyPayment(testId) {
        try {
            const response = await fetch(`${this.apiBase}/verify-payment.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    testId: testId,
                    userId: this.getUserId()
                })
            });

            const result = await response.json();
            
            if (result.success && result.paid) {
                // 支付成功，保存记录
                storageManager.savePaymentRecord(testId);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('支付验证失败:', error);
            return false;
        }
    }

    // 测试环境模拟支付
    mockPaymentFlow(testId, tradeNo) {
        this.showToast('测试环境：模拟支付流程');
        
        // 模拟支付成功
        setTimeout(() => {
            storageManager.savePaymentRecord(testId);
            this.showToast('模拟支付成功！');
            setTimeout(() => {
                window.location.href = `testing.html?id=${testId}`;
            }, 1500);
            this.paymentInProgress = false;
        }, 2000);
    }

    // 创建支付订单（区分环境）
    async createOrder(testId, amount) {
        // 测试环境返回模拟数据
        if (!this.isProd) {
            return {
                tradeNo: 'TEST_' + Date.now(),
                paymentUrl: 'payment-success.html?testId=' + testId + '&success=true' // 测试环境跳转到成功页
            };
        }

        // 正式环境调用后端API
        const response = await fetch(`${this.apiBase}/pay.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                testId: testId,
                amount: amount,
                userId: this.getUserId()
            })
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || '创建订单失败');
        }

        return result;
    }

    // 获取用户ID
    getUserId() {
        let userId = storageManager.getUserInfo().userId;
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            storageManager.saveUserInfo({ userId });
        }
        return userId;
    }

    showToast(message) {
        // ... 保持原有的Toast显示逻辑
        if (window.app && window.app.showToast) {
            window.app.showToast(message);
        } else {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 2000;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 2000);
        }
    }
}

// 全局支付实例
window.paymentManager = new PaymentManager();