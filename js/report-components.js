const ReportComponents = {
    // === 头部组件 ===
    'fun-header': {
        render: (data, config) => {
            const getFunResultText = (testId) => {
                const resultTexts = {
                    '1': '外向型人格',
                    '2': '心理年龄：28岁', 
                    '3': '轻度焦虑',
                    '4': '艺术型职业倾向',
                    '5': '情绪管理良好'
                };
                return resultTexts[testId] || '测试完成';
            };
            
            return `
                <section class="result-header">
                    <div class="result-title">测试完成！</div>
                    <div class="result-content">
                        <div class="result-label">您的结果</div>
                        <div class="result-text">${getFunResultText(config?.id)}</div>
                    </div>
                </section>
            `;
        }
    },

    'professional-header': {
        render: (data, config) => `
            <section class="result-header">
                <div class="result-title">专业评估报告</div>
                <div class="result-content">
                    <div class="score-number">${data.score}</div>
                    <div class="score-label">综合评分</div>
                </div>
            </section>
        `
    },

    // === 分数展示组件 ===
    'simple-score': {
        render: (data, config) => `
            <div class="score-display">
                <div class="score-circle">${data.score}</div>
                <div class="score-label">综合评分</div>
            </div>
        `
    },

    'clinical-indicators': {
        render: (data, config) => `
            <div class="professional-indicators">
                <h3>核心临床指标</h3>
                <div class="indicator-grid">
                    <div class="indicator-item ${data.totalScore > 160 ? 'abnormal' : ''}">
                        <div class="indicator-value">${data.totalScore || 0}</div>
                        <div class="indicator-label">总分</div>
                        <div class="indicator-reference">参考: &lt;160</div>
                    </div>
                    <div class="indicator-item">
                        <div class="indicator-value">${data.positiveItems || 0}</div>
                        <div class="indicator-label">阳性项目</div>
                        <div class="indicator-reference">参考: &lt;43</div>
                    </div>
                    <div class="indicator-item">
                        <div class="indicator-value">${data.positiveAverage ? data.positiveAverage.toFixed(2) : '0.00'}</div>
                        <div class="indicator-label">阳性均分</div>
                        <div class="indicator-reference">-</div>
                    </div>
                </div>
            </div>
        `
    },

    // === 分析组件 ===
    'text-analysis': {
        render: (data, config) => `
            <section class="analysis-section">
                <h3>详细结果分析</h3>
                <div class="analysis-content">${data.analysis || '基于你的答题情况分析...'}</div>
            </section>
        `
    },

    'clinical-table': {
        render: (data, config) => {
            const dimensions = data.dimensions || [];
            return `
                <div class="clinical-table">
                    <h3>各维度详细分析</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>维度</th>
                                <th>因子分</th>
                                <th>总分</th>
                                <th>状态</th>
                                <th>参考范围</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dimensions.map(dim => `
                                <tr class="${dim.isHigh ? 'abnormal' : 'normal'}">
                                    <td>${dim.name}</td>
                                    <td>${dim.averageScore ? dim.averageScore.toFixed(2) : '0.00'}</td>
                                    <td>${dim.totalScore || dim.score}</td>
                                    <td>${dim.isHigh ? '⚠️ 异常' : '✅ 正常'}</td>
                                    <td>${dim.scoreRange || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    },

    // === 图表组件 ===
    'dimension-radar': {
        render: (data, config) => `
            <div class="radar-chart-container">
                <canvas id="radarChart" width="280" height="280"></canvas>
            </div>
        `
    },

    // === 风险评估组件 ===
    'risk-assessment': {
        render: (data, config) => {
            // ✅ 修复：使用内部函数，避免this上下文问题
            const getRiskLevel = (data) => {
                if (data.totalScore > 250) return 'high';
                if (data.totalScore > 200) return 'medium';
                if (data.totalScore > 160) return 'low';
                return 'normal';
            };

            const getRiskTitle = (data) => {
                if (data.totalScore > 250) return '高风险：建议立即寻求专业帮助';
                if (data.totalScore > 200) return '中等风险：建议心理咨询';
                if (data.totalScore > 160) return '低风险：建议关注心理健康';
                return '正常范围：继续保持良好状态';
            };

            const getRiskDescription = (data) => {
                return data.overallAssessment?.suggestion || '请关注自身心理健康状态';
            };

            const riskLevel = getRiskLevel(data);
            const riskTitle = getRiskTitle(data);
            const riskDesc = getRiskDescription(data);
            const highDimensions = (data.dimensions || []).filter(dim => dim.isHigh);

            return `
                <div class="risk-assessment">
                    <h3>风险评估</h3>
                    <div class="risk-level ${riskLevel}">
                        <div class="risk-title">${riskTitle}</div>
                        <div class="risk-desc">${riskDesc}</div>
                    </div>
                    ${highDimensions.length > 0 ? `
                        <div class="abnormal-factors">
                            <h4>需要关注的维度</h4>
                            <div class="factor-tags">
                                ${highDimensions.map(dim => `
                                    <span class="factor-tag high">${dim.name} (${dim.averageScore ? dim.averageScore.toFixed(2) : '0.00'})</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    },

    // === 专业建议组件 ===
    'professional-advice': {
        render: (data, config) => {
            const adviceItems = [
                '本测试结果仅供参考，不能替代专业医疗诊断',
                '如有需要，请咨询专业心理医生或精神科医生',
                '保持良好的生活习惯和社交活动有助于心理健康',
                '如感到持续不适，请及时寻求专业帮助'
            ];

            return `
                <div class="professional-advice">
                    <div class="advice-title">专业建议</div>
                    <ul class="advice-list">
                        ${adviceItems.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    },

    // === 行动组件 ===
    'save-actions': {
        render: (data, config) => `
            <section class="result-actions">
                <button id="saveResultBtn" class="action-btn secondary">保存结果到本地</button>
                <button onclick="window.location.href='index.html'" class="action-btn primary">回首页</button>
            </section>
        `
    },

    'share-actions': {
        render: (data, config) => `
            <section class="result-actions">
                <button class="action-btn secondary">分享给好友</button>
                <button onclick="window.location.href='index.html'" class="action-btn primary">回首页</button>
            </section>
        `
    }
};