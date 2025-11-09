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
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('resultId');
        const resultParam = urlParams.get('result');
        
        console.log('加载结果数据:', { resultId, hasResultParam: !!resultParam });
        
        // ✅ 优先使用resultId从localStorage加载
        if (resultId) {
            const storedResult = storageManager.getTestResult(resultId);
            if (storedResult && storedResult.data) {
                this.resultData = storedResult.data;
                console.log('从localStorage加载结果成功');
                
                // 🆕 在这里添加数据验证
                try {
                    this.validateResultData();
                } catch (error) {
                    console.error('❌ 结果数据验证失败:', error);
                    this.showDataError('测试结果数据不完整，请重新测试');
                    return; // ❗重要：验证失败时停止执行
                }
                
                return;
            } else {
                console.error('❌ localStorage中未找到结果:', resultId);
                this.showDataError('结果数据丢失，请重新测试');
                return; // ❗重要：数据不存在时停止执行
            }
        }
        
        // ✅ 备用方案：如果还有result参数（兼容旧链接）
        if (resultParam) {
            try {
                this.resultData = JSON.parse(decodeURIComponent(resultParam));
                console.log('从URL参数加载结果成功');
                
                // 🆕 在这里也添加数据验证
                try {
                    this.validateResultData();
                } catch (error) {
                    console.error('❌ 结果数据验证失败:', error);
                    this.showDataError('测试结果数据不完整，请重新测试');
                    return;
                }
                
            } catch (error) {
                console.error('❌ 解析结果参数失败:', error);
                this.showDataError('结果数据格式错误，请重新测试');
            }
        } else {
            console.error('❌ 未找到任何结果数据');
            this.showDataError('未找到测试结果，请重新进行测试');
        }
    }

    // 🆕 新增：数据完整性验证方法
    validateResultData() {
        if (!this.resultData) {
            throw new Error('结果数据为空');
        }
        
        // 基础字段检查
        if (typeof this.resultData.score !== 'number') {
            throw new Error('评分数据缺失或格式错误');
        }
        
        // 对于SCL-90测试，检查必要字段
        if (this.testId === '6') {
            if (!this.resultData.dimensions || !Array.isArray(this.resultData.dimensions)) {
                throw new Error('SCL-90维度数据缺失');
            }
            
            if (this.resultData.dimensions.length === 0) {
                throw new Error('SCL-90维度数据为空');
            }
            
            // 检查每个维度是否有必要字段
            this.resultData.dimensions.forEach((dim, index) => {
                if (!dim.name || typeof dim.name !== 'string') {
                    throw new Error(`维度 ${index} 名称缺失`);
                }
                if (typeof dim.score !== 'number') {
                    throw new Error(`维度 ${dim.name} 分数缺失`);
                }
            });
            
            // 检查SCL-90特有字段
            if (typeof this.resultData.totalScore !== 'number') {
                console.warn('SCL-90总分缺失，但不影响基础展示');
            }
        }
        
        console.log('✅ 结果数据验证通过');
    }

    // 🆕 新增：显示数据错误的方法
    showDataError(message) {
        // 清空容器，显示错误信息
        const container = document.querySelector('.container');
        container.innerHTML = `
            <div class="error-section" style="text-align: center; padding: 50px 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">😕</div>
                <h3 style="color: #333; margin-bottom: 15px;">数据加载失败</h3>
                <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="window.location.href = 'index.html'" 
                            style="background: linear-gradient(135deg, #667eea, #764ba2); 
                                   color: white; border: none; padding: 12px 30px; 
                                   border-radius: 8px; font-size: 16px; cursor: pointer;">
                        返回首页
                    </button>
                    <button onclick="window.location.reload()" 
                            style="background: #f8f9fa; color: #333; border: 1px solid #ddd; 
                                   padding: 12px 30px; border-radius: 8px; font-size: 16px; cursor: pointer;">
                        刷新重试
                    </button>
                </div>
            </div>
        `;
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