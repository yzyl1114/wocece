class PsychTestApp {
    constructor() {
        this.currentTest = null;
        this.currentAnswers = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTestData();
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

        // 测试卡片点击
        document.querySelectorAll('.test-card, .test-list-item').forEach(card => {
            card.addEventListener('click', (e) => this.handleTestClick(e));
        });
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

    handleTestClick(event) {
        const testCard = event.currentTarget.closest('[data-test-id]');
        if (!testCard) return;
        
        const testId = testCard.dataset.testId;
        const test = this.getTestById(testId);
        
        if (test) {
            this.navigateTo(`detail.html?id=${testId}`);
        }
    }

    filterTestsByCategory(category) {
        const testItems = document.querySelectorAll('.test-list-item');
        
        testItems.forEach(item => {
            const testCategory = item.dataset.category;
            if (category === 'all' || testCategory === category) {
                item.style.display = 'block';
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
                item.style.display = 'block';
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

    loadTestData() {
        // 模拟测试数据
        const testData = [
            {
                id: '1',
                title: '性格色彩测试',
                description: '了解你的性格色彩，发现真实的自己',
                category: 'standard',
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
            }
        ];
        
        this.tests = testData;
        this.renderTestList();
    }

    renderTestList() {
        // 渲染特色测试
        const featuredContainer = document.querySelector('.featured-tests');
        if (featuredContainer) {
            featuredContainer.innerHTML = this.tests.slice(0, 3).map(test => `
                <div class="test-card" data-test-id="${test.id}">
                    <img src="${test.image}" alt="${test.title}" class="test-image">
                    <div class="test-content">
                        <div class="test-title">${test.title}</div>
                        <button class="test-btn">前往 →</button>
                    </div>
                </div>
            `).join('');
        }

        // 渲染测试列表
        const testListContainer = document.querySelector('.test-list');
        if (testListContainer) {
            testListContainer.innerHTML = this.tests.map(test => `
                <div class="test-list-item" data-test-id="${test.id}" data-category="${test.category}">
                    <div class="test-info">
                        <div class="test-title">${test.title}</div>
                        <div class="test-desc">${test.description}</div>
                    </div>
                    <button class="test-btn">前往 →</button>
                </div>
            `).join('');
        }
    }

    getTestById(id) {
        return this.tests.find(test => test.id === id);
    }

    initNavigation() {
        // 底部导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                if (target) {
                    this.navigateTo(target);
                }
            });
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PsychTestApp();
});