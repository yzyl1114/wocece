/**
 * 域名安全验证器 - 简化版
 */
(function() {
    'use strict';
    
    // ==================== 配置区域 ====================
    const DOMAIN_WHITELIST = [
        // 正式生产域名
        'wocece.com',
        'www.wocece.com',
        'm.wocece.com',
        
        // GitHub Pages 测试环境
        'yzyl1114.github.io',
        
        // 开发环境（本地调试）
        'localhost',
        '127.0.0.1',
        '[::1]'
    ];
    
    // ==================== 核心验证逻辑 ====================
    class DomainGuard {
        constructor() {
            this.currentHost = window.location.hostname;
            this.isValid = false;
            this.init();
        }
        
        /**
         * 初始化验证
         */
        init() {
            // 1. 验证当前域名
            this.isValid = this.validateCurrentDomain();
            
            // 2. 防止iframe嵌套
            this.preventFrameHijacking();
            
            // 3. 监听页面变化
            this.setupEventListeners();
            
            console.log(`[域名保护] ${this.currentHost} - ${this.isValid ? '✅ 验证通过' : '❌ 验证失败'}`);
        }
        
        /**
         * 验证当前域名是否在白名单
         */
        validateCurrentDomain() {
            const host = this.currentHost;
            
            // 遍历白名单检查
            for (const allowedDomain of DOMAIN_WHITELIST) {
                // 完全匹配
                if (host === allowedDomain) {
                    return true;
                }
                
                // 子域名匹配（如 test.wocece.com 匹配 wocece.com）
                if (host.endsWith('.' + allowedDomain)) {
                    return true;
                }
            }
            
            // 域名不在白名单中
            console.warn(`[安全警告] 非法域名访问: ${host}`);
            this.handleIllegalDomain();
            return false;
        }
        
        /**
         * 处理非法域名访问
         */
        handleIllegalDomain() {
            // 记录安全事件（仅日志，不上报）
            this.logSecurityEvent();
            
            // 显示用户友好的提示
            this.showRedirectNotice();
            
            // 3秒后跳转到安全域名
            setTimeout(() => {
                this.redirectToSafeDomain();
            }, 3000);
        }
        
        /**
         * 跳转到安全域名
         */
        redirectToSafeDomain() {
            const currentUrl = new URL(window.location.href);
            
            // 跳转到正式域名，保留重要参数
            currentUrl.hostname = 'wocece.com';
            
            // 只保留关键参数
            const importantParams = ['id', 'testId', 'resultId'];
            const params = new URLSearchParams(currentUrl.search);
            const newParams = new URLSearchParams();
            
            importantParams.forEach(param => {
                if (params.has(param)) {
                    newParams.set(param, params.get(param));
                }
            });
            
            currentUrl.search = newParams.toString();
            
            // 执行跳转
            window.location.href = currentUrl.toString();
        }
        
        /**
         * 显示跳转提示
         */
        showRedirectNotice() {
            // 移除可能存在的旧提示
            const oldNotice = document.getElementById('domain-redirect-notice');
            if (oldNotice) oldNotice.remove();
            
            // 创建新提示
            const notice = document.createElement('div');
            notice.id = 'domain-redirect-notice';
            notice.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.9);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    backdrop-filter: blur(5px);
                ">
                    <div style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 30px;
                        border-radius: 20px;
                        max-width: 300px;
                        text-align: center;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        color: white;
                        animation: fadeIn 0.3s ease;
                    ">
                        <div style="
                            font-size: 48px;
                            margin-bottom: 20px;
                        ">🔒</div>
                        <h3 style="
                            margin: 0 0 15px 0;
                            font-size: 20px;
                            font-weight: 600;
                        ">安全验证</h3>
                        <p style="
                            margin: 0 0 25px 0;
                            line-height: 1.5;
                            font-size: 15px;
                            opacity: 0.9;
                        ">
                            检测到非官方访问<br>
                            正在跳转到安全页面
                        </p>
                        <div style="
                            padding: 12px;
                            background: rgba(255,255,255,0.15);
                            border-radius: 10px;
                            font-size: 13px;
                            margin-bottom: 20px;
                        ">
                            <div style="opacity: 0.8;">正在跳转到</div>
                            <div style="font-weight: bold; margin-top: 5px;">wocece.com</div>
                        </div>
                        <div style="
                            font-size: 13px;
                            opacity: 0.7;
                        ">
                            3秒后自动跳转...
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes fadeIn {
                        from { opacity: 0; transform: scale(0.9); }
                        to { opacity: 1; transform: scale(1); }
                    }
                </style>
            `;
            
            document.body.appendChild(notice);
        }
        
        /**
         * 防止iframe嵌套攻击
         */
        preventFrameHijacking() {
            // 如果被嵌套在iframe中
            if (window !== window.top) {
                try {
                    // 检查父窗口域名
                    const parentHost = window.top.location.hostname;
                    const isParentAllowed = this.isDomainAllowed(parentHost);
                    
                    // 父窗口域名不在白名单，尝试跳出iframe
                    if (!isParentAllowed) {
                        window.top.location.href = window.location.href;
                    }
                } catch (error) {
                    // 跨域错误，显示全屏警告
                    this.showFrameWarning();
                }
            }
        }
        
        /**
         * 显示iframe警告
         */
        showFrameWarning() {
            document.body.innerHTML = `
                <div style="
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    padding: 20px;
                ">
                    <div style="
                        background: white;
                        padding: 40px 30px;
                        border-radius: 20px;
                        text-align: center;
                        max-width: 320px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    ">
                        <div style="
                            font-size: 48px;
                            color: #ff6b6b;
                            margin-bottom: 20px;
                        ">⚠️</div>
                        <h2 style="
                            margin: 0 0 15px 0;
                            color: #333;
                            font-size: 22px;
                        ">访问受限</h2>
                        <p style="
                            margin: 0 0 25px 0;
                            color: #666;
                            line-height: 1.6;
                            font-size: 15px;
                        ">
                            请勿通过第三方网站访问<br>
                            请直接访问官方网站
                        </p>
                        <a href="${window.location.href}" 
                           style="
                                display: inline-block;
                                padding: 14px 28px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                text-decoration: none;
                                border-radius: 50px;
                                font-weight: 600;
                                font-size: 16px;
                                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                                transition: transform 0.2s;
                           "
                           onmouseover="this.style.transform='translateY(-2px)'"
                           onmouseout="this.style.transform='translateY(0)'">
                            🔗 直接访问网站
                        </a>
                        <div style="
                            margin-top: 25px;
                            font-size: 13px;
                            color: #999;
                        ">
                            或复制链接在浏览器中打开
                        </div>
                    </div>
                </div>
            `;
        }
        
        /**
         * 设置事件监听
         */
        setupEventListeners() {
            // 监听hash变化（单页面应用）
            window.addEventListener('hashchange', () => {
                this.validateCurrentDomain();
            });
            
            // 监听popstate（浏览器前进后退）
            window.addEventListener('popstate', () => {
                this.validateCurrentDomain();
            });
        }
        
        /**
         * 记录安全事件
         */
        logSecurityEvent() {
            const event = {
                type: 'domain_validation_failed',
                timestamp: new Date().toISOString(),
                currentHost: this.currentHost,
                currentUrl: window.location.href,
                referrer: document.referrer || 'direct',
                userAgent: navigator.userAgent.substring(0, 100),
                whitelist: DOMAIN_WHITELIST
            };
            
            // 仅在控制台输出，不上报服务器
            console.group('🚨 域名安全事件');
            console.table(event);
            console.groupEnd();
        }
        
        /**
         * 检查域名是否允许（工具方法）
         */
        isDomainAllowed(domain) {
            return DOMAIN_WHITELIST.some(allowed => 
                domain === allowed || domain.endsWith('.' + allowed)
            );
        }
        
        /**
         * 获取当前验证状态
         */
        get isValidDomain() {
            return this.isValid;
        }
    }
    
    // ==================== 立即执行 ====================
    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.DomainGuard = new DomainGuard();
        });
    } else {
        window.DomainGuard = new DomainGuard();
    }
    
})();