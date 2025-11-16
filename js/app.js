class PsychTestApp {
    constructor() {
        this.currentTest = null;
        this.currentAnswers = [];
        this.tests = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTestData();
        this.renderTestLists();
        this.initNavigation();
    }

    bindEvents() {
        // 搜索功能
        document.getElementById('searchBtn')?.addEventListener('click', () => this.handleSearch());
        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // 分类标签
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabClick(e));
        });

        // +++ 新增：分享功能 +++
        document.getElementById('shareIcon')?.addEventListener('click', () => {
            this.handleShare();
        });      
    }

    handleShare() {
        // 获取当前首页的URL
        const shareUrl = window.location.href;
        
        // 方案一：使用现代的 Clipboard API (推荐)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    this.showToast('分享链接已复制，快去分享给好友吧！');
                })
                .catch(err => {
                    console.error('复制失败:', err);
                    this.showToast('复制失败，请手动复制链接');
                });
        } 
        // 方案二：兼容旧浏览器的备用方案
        else {
            // 创建临时文本域
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            textArea.style.position = 'fixed'; // 避免滚动到页面底部
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    this.showToast('分享链接已复制，快去分享给好友吧！');
                } else {
                    this.showToast('复制失败，请手动复制链接');
                }
            } catch (err) {
                console.error('复制失败:', err);
                this.showToast('复制失败，请手动复制链接');
            }
            
            document.body.removeChild(textArea);
        }
    }

    loadTestData() {
        // 测试数据
        this.tests = [
            {
                id: '1',
                title: '性格色彩测试',
                description: '了解你的性格色彩，发现真实的自己',
                category: 'fun',
                price: 1,
                questions: 10,
                image: 'images/test1.jpg'
            },
            {
                id: '2',
                title: '心理年龄测试', 
                description: '测测你的心理年龄是多少',
                category: 'fun',
                price: 1,
                questions: 8,
                image: 'images/test2.jpg'
            },
            {
                id: '3',
                title: '焦虑水平测试',
                description: '评估你的焦虑程度和应对方式',
                category: 'fun',
                price: 1,
                questions: 12,
                image: 'images/test3.jpg'
            },
            {
                id: '4',
                title: '职业倾向测试',
                description: '发现最适合你的职业方向',
                category: 'fun',
                price: 1,
                questions: 15,
                image: 'images/test4.jpg'
            },
            {
                id: '5',
                title: '情绪管理测试',
                description: '了解你的情绪管理能力',
                category: 'fun',
                price: 1,
                questions: 10,
                image: 'images/test5.jpg'
            },
            {
                id: '6',  // SCL-90测试
                title: 'SCL-90心理健康测试',
                description: '专业心理健康筛查，评估9大心理症状维度',
                category: 'standard',
                templateType: 'standard', // 新增字段
                price: 0.01,
                questions: 90,
                image: 'images/scl90.jpg'
            },
            {
                id: '7',  // 动物塑测试
                title: '动物人格测试',
                description: '揭秘你的灵魂动物原型，发现隐藏人格特质',
                category: 'fun',
                templateType: 'fun', // 新增字段
                price: 0.01,
                questions: 60,
                image: 'images/test7.jpg'
            },
            {
            id: '8',
            title: '精神需求测试',
            description: '探索10大精神维度，发现内心最深处的驱动力',
            category: 'standard',
            templateType: 'standard',
            price: 0.01,
            questions: 60,
            image: 'images/spiritual-needs.jpg'
            }            
        ];
    }

    renderTestLists() {
        this.renderFeaturedTests();
        this.renderTestList();
    }

    renderFeaturedTests() {
        const featuredContainer = document.getElementById('featuredTests');
        if (featuredContainer) {
            // 指定4个测试作为特色测试：1,2,3,4
            const featuredIds = ['1', '2', '3', '4'];
            const featuredTests = this.tests.filter(test => featuredIds.includes(test.id));
            
            featuredContainer.innerHTML = featuredTests.map(test => `
                <div class="test-card" data-test-id="${test.id}">
                    <div class="test-image" style="background: linear-gradient(135deg, #667eea, #764ba2);"></div>
                    <div class="test-content">
                        <div class="test-title">${test.title}</div>
                        <button class="test-btn" onclick="app.navigateToTest('${test.id}')">前往 →</button>
                    </div>
                </div>
            `).join('');

            // 绑定卡片点击事件
            featuredContainer.querySelectorAll('.test-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('test-btn')) {
                        const testId = card.dataset.testId;
                        this.navigateToTest(testId);
                    }
                });
            });
        }
    }

    renderTestList() {
        const testListContainer = document.getElementById('testList');
        if (testListContainer) {
            testListContainer.innerHTML = this.tests.map(test => `
                <div class="test-list-item" data-test-id="${test.id}" data-category="${test.category}">
                    <div class="test-thumb" style="background: linear-gradient(135deg, #667eea, #764ba2);"></div>
                    <div class="test-info">
                        <div class="test-title">${test.title}</div>
                        <div class="test-desc">${test.description}</div>
                    </div>
                    <button class="small-btn" onclick="app.navigateToTest('${test.id}')">前往</button>
                </div>
            `).join('');

            // 绑定列表项点击事件
            testListContainer.querySelectorAll('.test-list-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('small-btn')) {
                        const testId = item.dataset.testId;
                        this.navigateToTest(testId);
                    }
                });
            });
        }
    }

    /**
     * 检查是否已完成测试
     */
    hasCompletedTest(testId) {
        // 检查是否有测试结果
        const results = this.getAllTestResults();
        return results.some(result => result.testId === testId);
    }

    /**
     * 获取所有测试结果
     */
    getAllTestResults() {
        const results = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('test_result_')) {
                try {
                    const result = JSON.parse(localStorage.getItem(key));
                    if (result && result.data) {
                        results.push({
                            testId: result.data.testId || 'unknown',
                            timestamp: result.timestamp,
                            resultId: key.replace('test_result_', '')
                        });
                    }
                } catch (e) {
                    console.error('解析测试结果失败:', e);
                }
            }
        }
        return results;
    }

    // 跳转到测试详情
    navigateToTest(testId) {
        window.location.href = `detail.html?id=${testId}`;
    }

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const keyword = searchInput.value.trim();
        
        if (keyword) {
            this.filterTests(keyword);
            this.showToast(`搜索: ${keyword}`);
        }
    }

    handleTabClick(event) {
        const tab = event.currentTarget;
        const category = tab.dataset.category;
        
        // 更新激活状态
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // 过滤测试列表
        this.filterTestsByCategory(category);
    }

    filterTestsByCategory(category) {
        const testItems = document.querySelectorAll('.test-list-item');
        
        testItems.forEach(item => {
            const testCategory = item.dataset.category;
            if (category === 'all' || testCategory === category) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    filterTests(keyword) {
        const testItems = document.querySelectorAll('.test-list-item');
        const lowerKeyword = keyword.toLowerCase();
        
        testItems.forEach(item => {
            const title = item.querySelector('.test-title').textContent.toLowerCase();
            const desc = item.querySelector('.test-desc').textContent.toLowerCase();
            
            if (title.includes(lowerKeyword) || desc.includes(lowerKeyword)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    navigateTo(url) {
        window.location.href = url;
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }

    initNavigation() {
        // 底部导航事件已在HTML中直接绑定
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PsychTestApp();
});