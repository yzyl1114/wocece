// js/chart-renderer.js
class ChartRenderer {
    /**
     * 渲染SCL-90雷达图
     */
    renderSCL90RadarChart(dimensionsData, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !dimensionsData || dimensionsData.length === 0) {
            console.warn('雷达图数据为空或canvas不存在');
            return;
        }

        // 设置canvas尺寸
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
     * 绘制雷达图网格
     */
    drawRadarGrid(ctx, centerX, centerY, radius, dimensions, angleStep) {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '9px Arial';
        
        // 绘制同心圆网格 - 改为5个等级，对应1-5分
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * i / 5, 0, 2 * Math.PI);
            ctx.stroke();
            
            // 绘制刻度值 (1-5分)
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
     * 绘制数据多边形
     */
    drawDataPolygon(ctx, centerX, centerY, radius, dimensions, angleStep) {
        ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < dimensions.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            // 将百分制分数转换为半径比例
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
     * 绘制维度标签
     */
    drawDimensionLabels(ctx, centerX, centerY, radius, dimensions, angleStep) {
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < dimensions.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = radius + 25; // 增加半径，避免文字被截断
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            
            // 显示维度名称和维度总分
            const dim = dimensions[i];
            const dimensionTotal = dim.totalScore || dim.rawScore || 0;
            const labelText = `${dim.name}\n${dimensionTotal}`;
            
            // 绘制多行文本
            const lines = labelText.split('\n');
            lines.forEach((line, index) => {
                ctx.fillStyle = 'white';
                ctx.fillText(line, x, y + (index * 14));
                ctx.fillStyle = '#333';
                ctx.fillText(line, x, y + (index * 14));
            });
        }
    }

    /**
     * 渲染维度柱状图
     */
    renderDimensionBars(dimensionsData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '<div class="dimension-bars">';
        
        dimensionsData.forEach(dim => {
            const isHigh = dim.isHigh || dim.averageScore > 2;
            const barColor = isHigh ? '#ff4757' : '#667eea';
            const scoreText = dim.averageScore ? dim.averageScore.toFixed(2) : (dim.score / 20).toFixed(1);
            
            html += `
                <div class="dimension-bar-item">
                    <div class="bar-label">${dim.name}</div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${dim.score}%; background: ${barColor};"></div>
                        <div class="bar-score">${scoreText}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * 渲染症状严重程度指示器
     */
    renderSymptomSeverity(totalScore, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let severityLevel, markerPosition, levelText;
        
        if (totalScore > 250) {
            severityLevel = 'high';
            markerPosition = 95;
            levelText = '严重';
        } else if (totalScore > 200) {
            severityLevel = 'medium';
            markerPosition = 75;
            levelText = '明显';
        } else if (totalScore > 160) {
            severityLevel = 'low';
            markerPosition = 50;
            levelText = '关注';
        } else {
            severityLevel = 'normal';
            markerPosition = 25;
            levelText = '正常';
        }
        
        container.innerHTML = `
            <div class="symptom-severity">
                <div class="severity-scale">
                    <span>正常</span>
                    <span>关注</span>
                    <span>明显</span>
                    <span>严重</span>
                </div>
                <div class="severity-bar">
                    <div class="severity-marker" style="left: ${markerPosition}%;"></div>
                </div>
                <div class="severity-level ${severityLevel}">
                    总体症状严重程度：<strong>${levelText}</strong>
                </div>
            </div>
        `;
    }

    /**
     * 渲染精神需求测试雷达图
     */
    renderSpiritualRadarChart(dimensionsData, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 50;
        const angleStep = (2 * Math.PI) / dimensionsData.length;
        
        // 绘制网格
        this.drawRadarGrid(ctx, centerX, centerY, radius, dimensionsData, angleStep);
        
        // 绘制数据多边形
        ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        dimensionsData.forEach((dim, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const valueRadius = radius * (dim.score / 100);
            const x = centerX + valueRadius * Math.cos(angle);
            const y = centerY + valueRadius * Math.sin(angle);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 绘制维度和标签
        this.drawSpiritualDimensionLabels(ctx, centerX, centerY, radius, dimensionsData, angleStep);
    }

    /**
     * 绘制精神需求测试的维度标签
     */
    drawSpiritualDimensionLabels(ctx, centerX, centerY, radius, dimensions, angleStep) {
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        dimensions.forEach((dim, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = radius + 30;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            
            // 绘制维度名称
            ctx.fillStyle = dim.color;
            ctx.fillText(dim.name, x, y);
            
            // 绘制分数
            ctx.fillStyle = '#666';
            ctx.fillText(`${dim.score}%`, x, y + 15);
        });
    }

    /**
     * 渲染霍兰德雷达图
     */
    renderHollandRadarChart(scores, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        canvas.width = 280;
        canvas.height = 280;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        const dimensions = ['R', 'I', 'A', 'S', 'E', 'C'];
        const dimensionNames = {
            'R': '现实型', 'I': '研究型', 'A': '艺术型', 
            'S': '社会型', 'E': '企业型', 'C': '常规型'
        };
        const angleStep = (2 * Math.PI) / dimensions.length;

        // 绘制网格
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '10px Arial';
        
        // 绘制同心圆
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
        for (let i = 0; i < dimensions.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // 绘制数据多边形
        ctx.fillStyle = 'rgba(0, 184, 148, 0.3)';
        ctx.strokeStyle = '#00B894';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < dimensions.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const maxScore = 12; // 霍兰德每题最高分
            const valueRadius = radius * (scores[dimensions[i]] / maxScore);
            const x = centerX + valueRadius * Math.cos(angle);
            const y = centerY + valueRadius * Math.sin(angle);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 绘制数据点
        ctx.fillStyle = '#00B894';
        for (let i = 0; i < dimensions.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const maxScore = 12;
            const valueRadius = radius * (scores[dimensions[i]] / maxScore);
            const x = centerX + valueRadius * Math.cos(angle);
            const y = centerY + valueRadius * Math.sin(angle);
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        // 绘制维度标签
        ctx.fillStyle = '#333';
        ctx.font = '11px Arial';
        for (let i = 0; i < dimensions.length; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = radius + 30;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            
            ctx.fillText(dimensionNames[dimensions[i]], x, y);
            ctx.fillText(scores[dimensions[i]].toString(), x, y + 15);
        }
    }

    /**
     * 渲染优势矩阵图
     */
    renderStrengthsMatrix(strengthScores, coreStrengths, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        canvas.width = 320;
        canvas.height = 280;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 优势分类
        const strengthCategories = {
            '思维类': ['分析', '战略', '理念', '关联'],
            '行动类': ['行动', '竞争', '统率', '排难'],
            '关系类': ['体谅', '伯乐', '和谐', '沟通'],
            '执行类': ['纪律', '专注', '责任', '适应', '自信']
        };

        const quadrantSize = 140;
        const padding = 20;
        
        // 绘制四个象限
        const quadrants = [
            { x: padding, y: padding, name: '思维类', color: '#FF6B6B' },
            { x: padding + quadrantSize, y: padding, name: '行动类', color: '#4ECDC4' },
            { x: padding, y: padding + quadrantSize, name: '关系类', color: '#45B7D1' },
            { x: padding + quadrantSize, y: padding + quadrantSize, name: '执行类', color: '#96CEB4' }
        ];

        quadrants.forEach(quadrant => {
            // 绘制象限背景
            ctx.fillStyle = quadrant.color + '20';
            ctx.fillRect(quadrant.x, quadrant.y, quadrantSize, quadrantSize);
            
            // 绘制边框
            ctx.strokeStyle = quadrant.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(quadrant.x, quadrant.y, quadrantSize, quadrantSize);
            
            // 绘制象限标题
            ctx.fillStyle = quadrant.color;
            ctx.font = 'bold 12px Arial';
            ctx.fillText(quadrant.name, quadrant.x + 10, quadrant.y + 20);
        });

        // 绘制优势点
        ctx.font = '10px Arial';
        quadrants.forEach(quadrant => {
            const strengths = strengthCategories[quadrant.name];
            strengths.forEach((strength, index) => {
                const score = strengthScores[strength] || 0;
                const isCore = coreStrengths.includes(strength);
                
                // 计算位置 (在象限内均匀分布)
                const row = Math.floor(index / 2);
                const col = index % 2;
                const x = quadrant.x + 40 + col * 60;
                const y = quadrant.y + 40 + row * 30;
                
                // 绘制圆点
                ctx.fillStyle = isCore ? quadrant.color : '#999';
                ctx.beginPath();
                const radius = 4 + (score / 18) * 6; // 根据分数调整大小
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
                
                if (isCore) {
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                
                // 绘制优势名称
                ctx.fillStyle = isCore ? '#333' : '#999';
                ctx.fillText(strength, x + 8, y + 4);
                ctx.fillText(score.toString(), x + 8, y + 16);
            });
        });

        // 绘制图例
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.fillText('● 核心优势 | ○ 其他优势', padding, padding + quadrantSize * 2 + 20);
    }

    /**
     * 渲染价值观标签云
     */
    renderValuesCloud(values, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        canvas.width = 280;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 价值观位置分布
        const positions = [
            { x: centerX - 60, y: centerY - 20 },
            { x: centerX + 60, y: centerY - 20 },
            { x: centerX - 40, y: centerY + 30 },
            { x: centerX + 40, y: centerY + 30 },
            { x: centerX - 80, y: centerY + 10 },
            { x: centerX + 80, y: centerY + 10 },
            { x: centerX, y: centerY - 40 },
            { x: centerX, y: centerY + 50 }
        ];

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        values.forEach((value, index) => {
            if (index >= positions.length) return;
            
            const pos = positions[index];
            const isCore = index < 2; // 前两个是核心价值观
            
            // 绘制背景圆
            ctx.fillStyle = isCore ? '#00B894' : '#E0E0E0';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
            ctx.fill();
            
            // 绘制文字
            ctx.fillStyle = isCore ? 'white' : '#666';
            ctx.font = isCore ? 'bold 11px Arial' : '10px Arial';
            
            // 处理长文本换行
            const words = value.split('');
            if (words.length <= 4) {
                ctx.fillText(value, pos.x, pos.y);
            } else {
                ctx.fillText(words.slice(0, 4).join(''), pos.x, pos.y - 6);
                ctx.fillText(words.slice(4).join(''), pos.x, pos.y + 6);
            }
        });
    }
    
    /**
     * 安全的图表渲染方法，包含错误处理
     */
    safeRender(methodName, data, canvasId, ...args) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn(`❌ Canvas元素不存在: ${canvasId}`);
                return false;
            }
            
            if (!data) {
                console.warn(`❌ ${methodName}: 数据为空`);
                return false;
            }
            
            if (typeof this[methodName] !== 'function') {
                console.warn(`❌ 渲染方法不存在: ${methodName}`);
                return false;
            }
            
            this[methodName](data, canvasId, ...args);
            console.log(`✅ ${methodName} 渲染成功`);
            return true;
        } catch (error) {
            console.error(`❌ ${methodName} 渲染失败:`, error);
            return false;
        }
    }

    /**
     * 调试用：打印数据状态
     */
    debugData(data, label) {
        console.log(`🔍 ${label}:`, data);
        if (data && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                console.log(`   ${key}:`, data[key]);
            });
        }
    }
}

// 确保 ChartRenderer 类正确导出
if (typeof window !== 'undefined') {
    window.ChartRenderer = ChartRenderer;
}

// 创建全局实例 - 这是关键修复！
window.chartRenderer = new ChartRenderer();

console.log('ChartRenderer 已加载并实例化');