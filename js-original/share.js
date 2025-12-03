class ShareManager {
    constructor() {
        this.isWechat = this.detectWechat();
        this.init();
    }

    // 检测微信环境
    detectWechat() {
        const ua = navigator.userAgent.toLowerCase();
        return ua.indexOf('micromessenger') !== -1;
    }

    async init() {
        if (this.isWechat) {
            await this.initWechatSDK();
        }
    }

    // 初始化微信SDK
    async initWechatSDK() {
        // 获取微信配置
        const config = await this.getWechatConfig();
        
        return new Promise((resolve) => {
            wx.config({
                debug: false, // 生产环境关闭调试
                appId: config.appId,
                timestamp: config.timestamp,
                nonceStr: config.nonceStr,
                signature: config.signature,
                jsApiList: [
                    'updateAppMessageShareData',
                    'updateTimelineShareData',
                    'onMenuShareAppMessage',
                    'onMenuShareTimeline'
                ]
            });

            wx.ready(() => {
                this.setupWechatShare();
                resolve();
            });

            wx.error((res) => {
                console.error('微信SDK初始化失败:', res);
            });
        });
    }

    // 获取微信配置
    async getWechatConfig() {
        const response = await fetch('/api/wechat-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: window.location.href.split('#')[0]
            })
        });

        if (!response.ok) {
            throw new Error('获取微信配置失败');
        }

        return await response.json();
    }

    // 设置微信分享
    setupWechatShare() {
        const shareData = {
            title: '这个测试太有意思了，你也来试试吧',
            desc: '我发现了一个超准的心理测试，快来测测你的性格！',
            link: window.location.href,
            imgUrl: 'https://your-domain.com/images/share-logo.png'
        };

        // 朋友分享
        wx.updateAppMessageShareData(shareData);
        wx.onMenuShareAppMessage(shareData);

        // 朋友圈分享
        wx.updateTimelineShareData({
            title: shareData.title,
            link: shareData.link,
            imgUrl: shareData.imgUrl
        });
        wx.onMenuShareTimeline({
            title: shareData.title,
            link: shareData.link,
            imgUrl: shareData.imgUrl
        });
    }

    // 显示分享提示
    showShareTip() {
        const shareTip = document.createElement('div');
        shareTip.className = 'share-tip';
        shareTip.innerHTML = `
            <div class="share-bubble">
                <div class="share-arrow"></div>
                <div class="share-content">
                    分享给好友立减1元
                    <button class="share-confirm-btn">立即分享</button>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .share-tip {
                position: fixed;
                top: 60px;
                right: 15px;
                z-index: 1000;
            }
            .share-bubble {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                position: relative;
                max-width: 200px;
            }
            .share-arrow {
                position: absolute;
                top: -8px;
                right: 20px;
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-bottom: 8px solid #667eea;
            }
            .share-confirm-btn {
                background: white;
                color: #667eea;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                margin-top: 8px;
                font-size: 12px;
                cursor: pointer;
                width: 100%;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(shareTip);

        // 绑定分享按钮事件
        shareTip.querySelector('.share-confirm-btn').addEventListener('click', () => {
            this.triggerShare();
            shareTip.remove();
        });

        // 3秒后自动隐藏
        setTimeout(() => {
            if (shareTip.parentNode) {
                shareTip.remove();
            }
        }, 3000);
    }

    // 触发分享
    triggerShare() {
        if (this.isWechat) {
            // 微信环境下直接使用SDK
            // 微信分享按钮会自动触发
            this.trackShareEvent('wechat_share_click');
        } else {
            // 其他环境显示分享提示
            this.showNativeShareTip();
        }
    }

    // 显示原生分享提示
    showNativeShareTip() {
        const tipText = '请点击浏览器菜单中的分享按钮，分享给好友';
        if (window.app && window.app.showToast) {
            window.app.showToast(tipText);
        } else {
            alert(tipText);
        }
    }

    // 跟踪分享事件
    trackShareEvent(eventType) {
        // 发送分享事件到后端
        fetch('/api/track-share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventType: eventType,
                testId: new URLSearchParams(window.location.search).get('id'),
                userId: storageManager.getUserInfo().userId,
                timestamp: Date.now()
            })
        }).catch(console.error);
    }

    // 验证分享是否成功
    async verifyShare() {
        try {
            const response = await fetch('/api/verify-share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    testId: new URLSearchParams(window.location.search).get('id'),
                    userId: storageManager.getUserInfo().userId
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.shared) {
                    this.showToast('分享成功！');
                    return true;
                }
            }
        } catch (error) {
            console.error('验证分享失败:', error);
        }
        return false;
    }

    showToast(message) {
        if (window.app && window.app.showToast) {
            window.app.showToast(message);
        }
    }
}

// 全局分享实例
window.shareManager = new ShareManager();