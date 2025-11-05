class PaymentManager {
    constructor() {
        this.paymentInProgress = false;
    }

    // 初始化支付
    async initializePayment(testId, amount) {
        if (this.paymentInProgress) {
            this.showToast('支付处理中，请稍候...');
            return;
        }

        this.paymentInProgress = true;
        
        try {
            // 调用后端创建支付订单
            const orderInfo = await this.createOrder(testId, amount);
            
            // 调用支付宝支付
            await this.callAlipay(orderInfo);
            
        } catch (error) {
            console.error('支付失败:', error);
            this.showToast('支付失败，请重试');
            this.paymentInProgress = false;
        }
    }

    // 创建支付订单
    async createOrder(testId, amount) {
        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                testId: testId,
                amount: amount,
                userId: this.getUserId(),
                timestamp: Date.now()
            })
        });

        if (!response.ok) {
            throw new Error('创建订单失败');
        }

        return await response.json();
    }

    // 调用支付宝支付
    async callAlipay(orderInfo) {
        return new Promise((resolve, reject) => {
            // 支付宝H5支付调用
            if (window.AlipayJSBridge) {
                window.AlipayJSBridge.call("tradePay", {
                    tradeNO: orderInfo.tradeNo
                }, (result) => {
                    this.handlePaymentResult(result);
                    resolve(result);
                });
            } else {
                // 备用方案：跳转到支付宝支付页面
                window.location.href = orderInfo.paymentUrl;
            }
        });
    }

    // 处理支付结果
    handlePaymentResult(result) {
        this.paymentInProgress = false;
        
        const resultCode = result.resultCode || result.code;
        
        switch (resultCode) {
            case '9000':
            case 'success':
                this.showToast('支付成功');
                // 跳转到答题页面
                setTimeout(() => {
                    const testId = new URLSearchParams(window.location.search).get('id');
                    window.location.href = `testing.html?id=${testId}`;
                }, 1500);
                break;
                
            case '6001':
                this.showToast('支付已取消');
                break;
                
            case '4000':
            case 'fail':
                this.showToast('支付失败');
                break;
                
            default:
                this.showToast('支付结果未知');
        }
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
        if (window.app && window.app.showToast) {
            window.app.showToast(message);
        } else {
            // 备用Toast显示
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