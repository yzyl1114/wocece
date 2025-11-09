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
        canvas.width = 280;
        canvas.height = 280;
        const ctx = canvas.getContext('2d');
        
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 35;
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
        ctx.font = '10px Arial';
        
        // 绘制同心圆网格
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * i / 5, 0, 2 * Math.PI);
            ctx.stroke();
            
            // 绘制刻度值 (0-100)
            if (i === 5) {
                ctx.fillStyle = '#999';
                ctx.fillText((i * 20).toString(), centerX, centerY - radius * i / 5 - 8);
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
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        
        for (let i = 0; i < dimensions.length; i++) {
            const angle = i * angleStep - Math.PPI / 2;
            const labelRadius = radius + 25;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            
            // 处理标签文本 - 截断过长的文本
            let labelText = dimensions[i].name;
            if (labelText.length > 4) {
                labelText = labelText.substring(0, 4);
            }
            
            ctx.fillText(labelText, x, y);
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
}