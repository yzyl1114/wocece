// js/result-manager.js
class ResultManager {
    constructor() {
        this.testId = null;
        this.resultData = null;
        this.testConfig = null;
        this.templateEngine = new TemplateEngine();
        this.chartRenderer = new ChartRenderer();
    }

    async init() {
        this.testId = new URLSearchParams(window.location.search).get('id');
        await this.loadTestConfig();
        this.loadResultData();
        this.renderResult();
        this.bindEvents();
        this.loadRecommendations();
    }

    async loadTestConfig() {
        try {
            const response = await fetch('data/tests.json');
            const data = await response.json();
            this.testConfig = data.tests[this.testId];
        } catch (error) {
            console.error('加载测试配置失败:', error);
        }
    }

    loadResultData() {
        const resultParam = new URLSearchParams(window.location.search).get('result');
        if (resultParam) {
            this.resultData = JSON.parse(decodeURIComponent(resultParam));
        } else {
            // 默认测试数据
            this.resultData = {
                score: 85,
                analysis: '基于你的答题情况分析...',
                dimensions: [
                    { name: '个性分析', score: 85, analysis: '分析内容...' }
                ]
            };
        }
    }

    renderResult() {
        if (this.isFunTest()) {
            this.renderFunResult();
        } else {
            this.renderStandardResult();
        }
    }

    isFunTest() {
        return this.testConfig?.templateType === 'fun';
    }

    renderFunResult() {
        document.getElementById('funAnalysis').style.display = 'block';
        document.getElementById('standardAnalysis').style.display = 'none';
        
        // 使用模板引擎渲染
        const template = this.templateEngine.getTemplate(this.testConfig);
        this.renderByTemplate(template, 'fun');
    }

    renderStandardResult() {
        document.getElementById('funAnalysis').style.display = 'none';
        document.getElementById('standardAnalysis').style.display = 'block';

        if (this.testId === '6') {
            this.renderSCL90Report();
        } else {
            this.renderBasicStandardReport();
        }
    }

    renderSCL90Report() {
        const template = this.templateEngine.getTemplate('scl90-professional');
        this.renderByTemplate(template, 'standard');
        
        // 渲染专业图表
        if (this.resultData.dimensions && this.resultData.dimensions.length > 0) {
            this.chartRenderer.renderSCL90RadarChart(this.resultData.dimensions, 'radarChart');
        }
    }

    renderBasicStandardReport() {
        const template = this.templateEngine.getTemplate('standard-basic');
        this.renderByTemplate(template, 'standard');
    }

    renderByTemplate(template, type) {
        // 清空容器
        const container = type === 'fun' ? 
            document.getElementById('funAnalysis') : 
            document.getElementById('standardAnalysis');
        
        container.innerHTML = '';

        // 按顺序渲染组件
        template.components.forEach(componentName => {
            const componentHtml = this.templateEngine.renderComponent(
                componentName, 
                this.resultData,
                this.testConfig
            );
            if (componentHtml) {
                container.innerHTML += componentHtml;
            }
        });
    }

    bindEvents() {
        // 保存结果按钮
        const saveBtn = document.getElementById('saveResultBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveResultAsImage());
        }
    }

    async saveResultAsImage() {
        // 图片保存逻辑（可以保持现有实现）
        try {
            // 现有保存逻辑...
        } catch (error) {
            console.error('保存失败:', error);
            this.showToast('保存失败，请重试');
        }
    }

    showToast(message) {
        // Toast显示逻辑
        const toast = document.querySelector('.toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        }
    }

    loadRecommendations() {
        // 推荐测试加载逻辑（保持现有实现）
    }
}