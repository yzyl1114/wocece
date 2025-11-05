class TestingManager {
    constructor() {
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.init();
    }

    async init() {
        await this.loadTestData();
        this.renderQuestion();
        this.bindEvents();
        this.loadProgress();
    }

    async loadTestData() {
        const urlParams = new URLSearchParams(window.location.search);
        const testId = urlParams.get('id');
        
        // 模拟API调用
        this.currentTest = {
            id: testId,
            title: '性格色彩测试',
            questions: [
                {
                    id: 1,
                    text: '当你遇到困难时，你通常会？',
                    image: null,
                    options: [
                        { id: 'A', text: '独自思考解决方案' },
                        { id: 'B', text: '寻求朋友帮助' },
                        { id: 'C', text: '暂时逃避问题' },
                        { id: 'D', text: '立即采取行动' }
                    ]
                }
                // 更多问题...
            ]
        };
    }

    renderQuestion() {
        if (!this.currentTest) return;
        
        const question = this.currentTest.questions[this.currentQuestionIndex];
        const progress = ((this.currentQuestionIndex + 1) / this.currentTest.questions.length) * 100;
        
        document.querySelector('.progress').style.width = `${progress}%`;
        document.querySelector('.progress-text').textContent = 
            `第${this.currentQuestionIndex + 1}题/共${this.currentTest.questions.length}题`;
        
        document.querySelector('.question-text').textContent = question.text;
        
        const optionsContainer = document.querySelector('.options');
        optionsContainer.innerHTML = question.options.map(option => `
            <div class="option" data-option-id="${option.id}">
                ${option.id}. ${option.text}
            </div>
        `).join('');
        
        // 显示图片（如果有）
        const imageContainer = document.querySelector('.question-image');
        if (question.image) {
            imageContainer.innerHTML = `<img src="${question.image}" alt="题目图片">`;
            imageContainer.style.display = 'block';
        } else {
            imageContainer.style.display = 'none';
        }
    }

    bindEvents() {
        document.querySelector('.options').addEventListener('click', (e) => {
            const option = e.target.closest('.option');
            if (option) {
                this.handleAnswer(option.dataset.optionId);
            }
        });
    }

    handleAnswer(optionId) {
        this.answers[this.currentQuestionIndex] = optionId;
        
        // 保存进度
        storageManager.saveTestProgress(this.currentTest.id, {
            questionIndex: this.currentQuestionIndex,
            answers: this.answers
        });
        
        // 自动下一题
        if (this.currentQuestionIndex < this.currentTest.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        } else {
            this.completeTest();
        }
    }

    completeTest() {
        // 计算结果并跳转到结果页
        const result = this.calculateResult();
        storageManager.clearTestProgress(this.currentTest.id);
        window.location.href = `result.html?id=${this.currentTest.id}&result=${encodeURIComponent(JSON.stringify(result))}`;
    }

    calculateResult() {
        // 根据答案计算测试结果
        return {
            score: Math.floor(Math.random() * 40) + 60,
            analysis: '基于你的选择，这是一个个性化的分析结果...',
            dimensions: [
                { name: '个性分析', score: 85 },
                { name: '控制自我', score: 72 },
                { name: '调节自我', score: 68 },
                { name: '平衡冲突', score: 79 }
            ]
        };
    }

    loadProgress() {
        const progress = storageManager.getTestProgress(this.currentTest.id);
        if (progress) {
            this.currentQuestionIndex = progress.questionIndex;
            this.answers = progress.answers;
        }
    }
}

// 初始化答题页面
if (window.location.pathname.includes('testing.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.testingManager = new TestingManager();
    });
}