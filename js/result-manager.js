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

        if (this.testId === '8') {
            console.log('强制使用精神需求测试模板');
            const template = this.templateEngine.getTemplate(this.testConfig);
            this.renderByTemplate(template, 'standard');
        } else if (this.testId === '6') {
            this.renderSCL90Report();
        } else {
            this.renderBasicStandardReport();
        }
    }

    renderSCL90Report() {
        console.log('🎯 执行 renderSCL90Report - SCL-90专业报告');
        
        // 使用正确的模板获取方式
        const template = this.templateEngine.getTemplate(this.testConfig);
        console.log('📋 SCL-90模板组件:', template.components);
        
        // 渲染模板
        this.renderByTemplate(template, 'standard');
        console.log('✅ 模板渲染完成');
        
        // 延迟渲染雷达图，确保DOM已更新
        setTimeout(() => {
            this.renderRadarChart();
        }, 100);
    }

    renderRadarChart() {
        if (this.resultData.dimensions && this.resultData.dimensions.length > 0) {
            console.log('📊 准备渲染雷达图');
            
            const canvas = document.getElementById('radarChart');
            if (canvas) {
                this.chartRenderer.renderSCL90RadarChart(this.resultData.dimensions, 'radarChart');
                console.log('✅ 雷达图渲染完成');
            } else {
                console.warn('⚠️ 雷达图canvas不存在');
                // 如果canvas不存在，可能是组件渲染失败
                this.fallbackRender();
            }
        }
    }

    // 备用渲染方案
    fallbackRender() {
        const container = document.getElementById('standardAnalysis');
        if (container && this.resultData) {
            // 简单的备用显示
            let fallbackHTML = `
                <section class="analysis-section">
                    <h3>测试结果</h3>
                    <div class="analysis-content">
                        <p>综合评分: ${this.resultData.score || 0}</p>
                        ${this.resultData.totalScore ? `<p>总分: ${this.resultData.totalScore}</p>` : ''}
                        ${this.resultData.analysis ? `<p>${this.resultData.analysis}</p>` : ''}
                    </div>
                </section>
            `;
            
            if (this.resultData.dimensions && this.resultData.dimensions.length > 0) {
                fallbackHTML += `
                    <section class="analysis-section">
                        <h3>各维度得分</h3>
                        <div class="dimensions-list">
                            ${this.resultData.dimensions.map(dim => `
                                <div class="dimension-item">
                                    <span class="dimension-name">${dim.name}</span>
                                    <span class="dimension-score">${dim.score || 0}</span>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                `;
            }
            
            container.innerHTML += fallbackHTML;
        }
    }

    renderBasicStandardReport() {
        const template = this.templateEngine.getTemplate('standard-basic');
        this.renderByTemplate(template, 'standard');
    }

    renderByTemplate(template, type) {
        console.log('🔧 renderByTemplate 开始:', type);
        
        const container = type === 'fun' ? 
            document.getElementById('funAnalysis') : 
            document.getElementById('standardAnalysis');
        
        if (!container) {
            console.error('❌ 渲染容器不存在:', type);
            return;
        }
        
        // 确保容器可见
        container.style.display = 'block';
        container.innerHTML = '';
        
        console.log('📋 开始渲染组件...');
        
        // 渲染每个组件
        template.components.forEach(componentName => {
            console.log(`   🎨 渲染: ${componentName}`);
            const componentHtml = this.templateEngine.renderComponent(
                componentName, 
                this.resultData,
                this.testConfig
            );
            
            if (componentHtml) {
                container.innerHTML += componentHtml;
                console.log(`   ✅ ${componentName} 成功`);
            } else {
                console.error(`   ❌ ${componentName} 渲染为空`);
            }
        });
        
        console.log('🎉 renderByTemplate 完成');
    }

    bindEvents() {
        // 保存结果按钮
        const saveBtn = document.getElementById('saveResultBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveResultAsImage());
        }
    }

    /**
     * 保存结果为图片
     */
    async saveResultAsImage() {
        const saveBtn = document.getElementById('saveResultBtn');
        if (!saveBtn) return;

        const originalText = saveBtn.textContent;
        
        try {
            saveBtn.disabled = true;
            saveBtn.textContent = '生成中...';
            
            this.showToast('正在生成图片...');
            
            // 创建临时容器 - 关键修改：使用绝对定位避免样式污染
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                width: 375px;
                min-height: 100vh;
                background: #f5f6fa !important;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                z-index: 10000;
                opacity: 1 !important;
                visibility: visible !important;
            `;
            
            // 克隆报告内容
            const originalContainer = document.querySelector('.container');
            const contentToSave = originalContainer.cloneNode(true);
            
            // 关键修改：彻底清理可能影响渲染的样式
            contentToSave.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                background: #f5f6fa !important;
                color: #333 !important;
                position: static !important;
                transform: none !important;
            `;
            
            // 移除不需要的元素
            const elementsToRemove = contentToSave.querySelectorAll(
                '.result-actions, .recommendations, footer, .toast'
            );
            elementsToRemove.forEach(el => el.remove());
            
            // 关键修改：清理所有可能影响渲染的样式属性
            contentToSave.querySelectorAll('*').forEach(el => {
                el.style.opacity = '1';
                el.style.visibility = 'visible';
                el.style.transform = 'none';
                el.style.transition = 'none';
                el.style.animation = 'none';
                el.style.filter = 'none';
                el.style.backdropFilter = 'none';
                el.style.background = el.classList.contains('result-header') ? 
                    'linear-gradient(135deg, #667eea, #764ba2) !important' : 
                    (el.classList.contains('analysis-section') || el.classList.contains('dimensions-section')) ?
                    'white !important' : '';
            });
            
            // 重新渲染雷达图
            const tempRadarCanvas = contentToSave.querySelector('#radarChart');
            if (tempRadarCanvas && this.resultData.dimensions) {
                // 先移除旧的canvas
                const radarContainer = tempRadarCanvas.parentElement;
                const newCanvas = document.createElement('canvas');
                newCanvas.id = 'radarChart';
                newCanvas.width = 250;
                newCanvas.height = 250;
                radarContainer.replaceChild(newCanvas, tempRadarCanvas);
                
                // 重新渲染
                this.renderRadarChartToCanvas(newCanvas, this.resultData.dimensions);
            }
            
            // 添加水印信息
            const watermarkSection = document.createElement('section');
            watermarkSection.className = 'watermark-section';
            watermarkSection.style.cssText = `
                background: white !important;
                padding: 20px;
                margin: 20px 0;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                opacity: 1 !important;
            `;
            watermarkSection.innerHTML = `
                <div class="watermark-content" style="text-align: center; color: #666 !important;">
                    <div style="margin-bottom: 8px; color: #666 !important;">--- 测试结果来自 我测测 ---</div>
                    <div style="color: #666 !important;">扫描二维码发现更多有趣测评</div>
                    <div style="width: 80px; height: 80px; background: #f0f0f0; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; margin: 10px 0; border: 1px solid #eee;">
                        <span style="color: #999 !important; font-size: 10px;">二维码</span>
                    </div>
                    <div style="color: #999 !important;">${new Date().toLocaleDateString()} 生成</div>
                </div>
            `;
            
            contentToSave.appendChild(watermarkSection);
            
            // 关键修改：使用内联样式替代style标签
            const criticalStyles = `
                <style>
                    * {
                        opacity: 1 !important;
                        visibility: visible !important;
                        color: #333 !important;
                        background: transparent !important;
                    }
                    .container {
                        background: #f5f6fa !important;
                        opacity: 1 !important;
                    }
                    .result-header {
                        background: linear-gradient(135deg, #667eea, #764ba2) !important;
                        color: white !important;
                        padding: 30px 20px !important;
                        text-align: center !important;
                        border-radius: 0 0 20px 20px !important;
                        margin: -15px -15px 20px -15px !important;
                        opacity: 1 !important;
                    }
                    .analysis-section, .dimensions-section {
                        background: white !important;
                        padding: 20px !important;
                        margin: 15px 0 !important;
                        border-radius: 10px !important;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
                        opacity: 1 !important;
                        color: #333 !important;
                    }
                    .radar-chart-container {
                        text-align: center !important;
                        margin: 20px 0 !important;
                        padding: 15px !important;
                        background: white !important;
                        border-radius: 8px !important;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                        opacity: 1 !important;
                    }
                    .score-details, .clinical-table, .factor-interpretation-list {
                        opacity: 1 !important;
                        color: #333 !important;
                    }
                    .score-item, .clinical-table td, .clinical-table th {
                        color: #333 !important;
                        opacity: 1 !important;
                    }
                    .professional-advice {
                        background: linear-gradient(135deg, #667eea, #764ba2) !important;
                        color: white !important;
                        padding: 20px !important;
                        border-radius: 10px !important;
                        margin: 20px 0 !important;
                        opacity: 1 !important;
                    }
                    .watermark-section {
                        background: white !important;
                        opacity: 1 !important;
                        color: #666 !important;
                    }
                    body {
                        background: #f5f6fa !important;
                        opacity: 1 !important;
                    }
                </style>
            `;
            
            tempContainer.innerHTML = criticalStyles;
            tempContainer.appendChild(contentToSave);
            document.body.appendChild(tempContainer);
            
            // 等待渲染完成
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 关键修改：使用更严格的html2canvas配置
            const canvas = await html2canvas(tempContainer, {
                backgroundColor: '#f5f6fa',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: true,
                removeContainer: true,
                onclone: (clonedDoc) => {
                    // 在克隆的文档中再次确保样式正确
                    clonedDoc.querySelectorAll('*').forEach(el => {
                        el.style.opacity = '1';
                        el.style.visibility = 'visible';
                    });
                }
            });
            
            // 清理临时元素
            document.body.removeChild(tempContainer);
            
            // 下载图片
            const link = document.createElement('a');
            const testTitle = this.testConfig?.title || '心理测试';
            const fileName = `我测测-${testTitle}-${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('结果已保存到相册');
            
        } catch (error) {
            console.error('保存失败:', error);
            let errorMessage = '保存失败，请重试';
            if (error.message.includes('html2canvas')) {
                errorMessage = '图片生成失败，请检查浏览器兼容性';
            }
            this.showToast(errorMessage);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }

    /**
     * 渲染雷达图到指定Canvas（用于截图）
     */
    renderRadarChartToCanvas(canvas, dimensionsData) {
        if (!canvas || !dimensionsData) return;
        
        // 设置Canvas尺寸
        canvas.width = 250;
        canvas.height = 250;
        const ctx = canvas.getContext('2d');
        
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        const angleStep = (2 * Math.PI) / dimensionsData.length;

        // 绘制网格和轴线
        this.drawRadarGrid(ctx, centerX, centerY, radius, dimensionsData, angleStep);
        
        // 绘制数据多边形
        this.drawDataPolygon(ctx, centerX, centerY, radius, dimensionsData, angleStep);
        
        // 绘制维度标签
        this.drawDimensionLabels(ctx, centerX, centerY, radius, dimensionsData, angleStep);
    }

    /**
     * 雷达图网格绘制（复用chart-renderer的逻辑）
     */
    drawRadarGrid(ctx, centerX, centerY, radius, dimensions, angleStep) {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '10px Arial';
        
        // 绘制同心圆网格
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * i / 5, 0, 2 * Math.PI);
            ctx.stroke();
            
            if (i === 5) {
                ctx.fillStyle = '#999';
                ctx.fillText(i.toString(), centerX, centerY - radius * i / 5 - 8);
            }
        }

        // 绘制维度轴线
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        for (let i = 0; i < dimensions.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    /**
     * 数据多边形绘制
     */
    drawDataPolygon(ctx, centerX, centerY, radius, dimensions, angleStep) {
        ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < dimensions.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const valueRadius = radius * (dimensions[i].score / 100);
            const x = centerX + valueRadius * Math.cos(angle);
            const y = centerY + valueRadius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 绘制数据点
        ctx.fillStyle = '#667eea';
        for (let i = 0; i < dimensions.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const valueRadius = radius * (dimensions[i].score / 100);
            const x = centerX + valueRadius * Math.cos(angle);
            const y = centerY + valueRadius * Math.sin(angle);
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    /**
     * 维度标签绘制
     */
    drawDimensionLabels(ctx, centerX, centerY, radius, dimensions, angleStep) {
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < dimensions.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = radius + 25;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            
            const dim = dimensions[i];
            const dimensionTotal = dim.totalScore || dim.rawScore || 0;
            const labelText = `${dim.name}\n${dimensionTotal}`;
            
            const lines = labelText.split('\n');
            lines.forEach((line, index) => {
                ctx.fillStyle = 'white';
                ctx.fillText(line, x + 1, y + (index * 14) + 1);
                ctx.fillStyle = '#333';
                ctx.fillText(line, x, y + (index * 14));
            });
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

    /**
     * 加载推荐测试
     */
    async loadRecommendations() {
        try {
            const recommendations = await this.getRandomRecommendations(3);
            this.renderRecommendations(recommendations);
        } catch (error) {
            console.error('加载推荐失败:', error);
        }
    }

    /**
     * 获取随机推荐测试
     */
    async getRandomRecommendations(count = 3) {
        try {
            const response = await fetch('data/tests.json');
            const data = await response.json();
            const allTests = Object.values(data.tests);
            
            // 过滤掉当前测试
            const availableTests = allTests.filter(test => test.id !== this.testId);
            
            // 随机选择
            const shuffled = availableTests.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        } catch (error) {
            console.error('获取推荐测试失败:', error);
            return [];
        }
    }

    /**
     * 渲染推荐测试
     */
    renderRecommendations(recommendations) {
        const container = document.getElementById('recommendationList');
        if (!container || !recommendations.length) return;

        container.innerHTML = recommendations.map(test => `
            <div class="test-list-item" data-test-id="${test.id}">
                <div class="test-thumb" style="background: linear-gradient(135deg, #667eea, #764ba2);"></div>
                <div class="test-info">
                    <div class="test-title">${test.title}</div>
                    <div class="test-desc">${test.description}</div>
                </div>
                <button class="small-btn" onclick="window.location.href='detail.html?id=${test.id}'">前往</button>
            </div>
        `).join('');

        // 绑定点击事件
        container.querySelectorAll('.test-list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('small-btn')) {
                    const testId = item.dataset.testId;
                    window.location.href = `detail.html?id=${testId}`;
                }
            });
        });
    }
}