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
        
        // 如果是SCL-90测试，加载专用数据
        if (testId === 'scl90') {
            await this.loadSCL90Data();
        } else {
            // 原有的模拟数据加载逻辑
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
    }

    async loadSCL90Data() {
        try {
            // 从JSON文件加载SCL-90数据
            const response = await fetch('data/tests.json');
            const data = await response.json();
            this.currentTest = data.tests.scl90;
        } catch (error) {
            console.error('加载SCL-90数据失败:', error);
            // 备用方案：使用基础数据
            this.currentTest = {
                id: 'scl90',
                title: 'SCL-90症状自查量表',
                questions: [] // 基础问题结构
            };
        }
    }

    // ... 其他方法保持不变 ...

    completeTest() {
        // 计算结果并跳转到结果页
        let result;
        if (this.currentTest.id === 'scl90') {
            result = this.calculateSCL90Result(this.answers);
        } else {
            result = this.calculateResult();
        }
        
        storageManager.clearTestProgress(this.currentTest.id);
        window.location.href = `result.html?id=${this.currentTest.id}&result=${encodeURIComponent(JSON.stringify(result))}`;
    }

    // SCL-90专用结果计算函数 - 添加在这里
    calculateSCL90Result(answers) {
        const dimensions = this.currentTest.dimensions;
        const result = {
            totalScore: 0,
            dimensions: {},
            factorScores: {},
            testType: 'scl90'
        };
        
        // 计算总分
        answers.forEach((answer, index) => {
            const score = parseInt(answer) || 1; // 默认1分
            result.totalScore += score;
        });
        
        // 计算各维度分数
        Object.keys(dimensions).forEach(dimKey => {
            const dimension = dimensions[dimKey];
            let dimensionScore = 0;
            
            dimension.items.forEach(questionNum => {
                const answerIndex = questionNum - 1; // 题目编号从1开始，数组索引从0开始
                if (answers[answerIndex]) {
                    dimensionScore += parseInt(answers[answerIndex]) || 1;
                }
            });
            
            const averageScore = dimensionScore / dimension.items.length;
            
            result.dimensions[dimKey] = {
                name: dimension.name,
                score: dimensionScore,
                averageScore: averageScore,
                description: dimension.description,
                isHigh: averageScore > 2, // 因子分超过2分需要关注
                threshold: dimension.threshold,
                lowDescription: dimension.lowDescription,
                highDescription: dimension.highDescription,
                scoreRange: dimension.scoreRange
            };
            
            result.factorScores[dimKey] = averageScore;
        });
        
        // 添加总体评估
        result.overallAssessment = this.getSCL90Assessment(result.totalScore, result.factorScores);
        
        return result;
    }

    // SCL-90总体评估函数
    getSCL90Assessment(totalScore, factorScores) {
        let assessment = {
            level: '正常',
            description: '您的心理状态在正常范围内',
            suggestion: '请继续保持良好的心理状态'
        };
        
        if (totalScore > 250) {
            assessment.level = '严重';
            assessment.description = '您的症状比较严重';
            assessment.suggestion = '需要作医学上的详细检查，很可能要做针对性的心理治疗或在医生的指导下服药';
        } else if (totalScore > 200) {
            assessment.level = '明显';
            assessment.description = '您有明显心理问题的可能性';
            assessment.suggestion = '可求助于心理咨询，进行专业的心理评估';
        } else if (totalScore > 160) {
            assessment.level = '关注';
            assessment.description = '您的总分超过临界值，建议关注';
            assessment.suggestion = '应作进一步检查，关注自身心理健康状态';
        }
        
        // 检查是否有因子分超过2分
        const highFactors = Object.keys(factorScores).filter(key => factorScores[key] > 2);
        if (highFactors.length > 0) {
            assessment.hasHighFactors = true;
            assessment.highFactors = highFactors.map(key => this.currentTest.dimensions[key].name);
            assessment.factorSuggestion = '部分因子分超过2分，建议重点关注这些方面的症状';
        }
        
        return assessment;
    }

    // 原有的calculateResult方法保持不变
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