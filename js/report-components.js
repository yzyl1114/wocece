// js/report-components.js - 完整修复版
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
                    <div class="score-number">${data.score || 0}</div>
                    <div class="score-label">综合评分</div>
                </div>
            </section>
        `
    },

    'standard-header': {
        render: (data, config) => `
            <section class="result-header">
                <div class="result-title">测试完成</div>
                <div class="result-content">
                    <div class="score-number">${data.score || 0}</div>
                    <div class="score-label">综合评分</div>
                </div>
            </section>
        `
    },

    // === 分数展示组件 ===
    'simple-score': {
        render: (data, config) => `
            <div class="score-display">
                <div class="score-circle">${data.score || 0}</div>
                <div class="score-label">综合评分</div>
            </div>
        `
    },

    'detailed-score': {
        render: (data, config) => `
            <section class="analysis-section">
                <h3>详细评分</h3>
                <div class="score-details">
                    <div class="score-item">
                        <span class="score-label">总分</span>
                        <span class="score-value">${data.totalScore || data.score || 0}</span>
                    </div>
                    ${data.positiveItems ? `
                    <div class="score-item">
                        <span class="score-label">阳性项目数</span>
                        <span class="score-value">${data.positiveItems}</span>
                    </div>
                    ` : ''}
                    ${data.positiveAverage ? `
                    <div class="score-item">
                        <span class="score-label">阳性症状均分</span>
                        <span class="score-value">${data.positiveAverage.toFixed(2)}</span>
                    </div>
                    ` : ''}
                </div>
            </section>
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

    'multi-analysis': {
        render: (data, config) => {
            const analysis = data.analysis || '基于您的答题情况，系统进行了综合分析。';
            return `
                <section class="analysis-section">
                    <h3>结果分析</h3>
                    <div class="analysis-content">
                        <p>${analysis}</p>
                    </div>
                </section>
            `;
        }
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

    'dimension-chart': {
        render: (data, config) => {
            if (data.dimensions && data.dimensions.length > 0) {
                return `
                    <section class="analysis-section">
                        <h3>维度分析</h3>
                        <div class="radar-chart-container">
                            <canvas id="radarChart" width="280" height="280"></canvas>
                        </div>
                    </section>
                `;
            }
            return '';
        }
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

    'professional-summary': {
        render: (data, config) => {
            const summary = data.overallAssessment || { description: '测试完成，感谢您的参与。' };
            return `
                <section class="analysis-section">
                    <h3>专业总结</h3>
                    <div class="professional-summary-content">
                        <p>${summary.description || summary}</p>
                        ${summary.suggestion ? `<p class="suggestion">${summary.suggestion}</p>` : ''}
                        ${summary.factorSuggestion ? `<p class="factor-suggestion">${summary.factorSuggestion}</p>` : ''}
                    </div>
                </section>
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

// 添加必要的CSS样式到文档中（如果尚未存在）
if (!document.querySelector('#report-components-styles')) {
    const style = document.createElement('style');
    style.id = 'report-components-styles';
    style.textContent = `
        /* 评分详情样式 */
        .score-details {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 15px;
        }

        .score-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .score-label {
            color: #666;
            font-size: 14px;
        }

        .score-value {
            font-weight: bold;
            color: #333;
            font-size: 16px;
        }

        /* 临床指标样式 */
        .professional-indicators {
            margin: 20px 0;
        }

        .indicator-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 15px;
        }

        .indicator-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 2px solid #e8f4fd;
        }

        .indicator-item.abnormal {
            border-color: #ff4757;
            background: #fff5f5;
        }

        .indicator-value {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }

        .indicator-item.abnormal .indicator-value {
            color: #ff4757;
        }

        .indicator-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 3px;
        }

        .indicator-reference {
            font-size: 10px;
            color: #999;
        }

        /* 临床表格样式 */
        .clinical-table {
            margin: 20px 0;
            overflow-x: auto;
        }

        .clinical-table table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .clinical-table th,
        .clinical-table td {
            padding: 12px 8px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
            font-size: 12px;
        }

        .clinical-table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #333;
        }

        .clinical-table tr.abnormal {
            background: #fff5f5;
        }

        .clinical-table tr.normal {
            background: #f8f9fa;
        }

        /* 风险评估样式 */
        .risk-assessment {
            margin: 20px 0;
        }

        .risk-level {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
        }

        .risk-level.high {
            background: #fff5f5;
            border: 2px solid #ff4757;
        }

        .risk-level.medium {
            background: #fff3cd;
            border: 2px solid #ffa502;
        }

        .risk-level.low {
            background: #d1ecf1;
            border: 2px solid #17a2b8;
        }

        .risk-level.normal {
            background: #d4edda;
            border: 2px solid #28a745;
        }

        .risk-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 8px;
        }

        .risk-desc {
            font-size: 14px;
            line-height: 1.5;
        }

        .abnormal-factors {
            margin-top: 15px;
        }

        .factor-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }

        .factor-tag {
            padding: 6px 12px;
            background: #ff4757;
            color: white;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
        }

        /* 专业总结样式 */
        .professional-summary-content {
            line-height: 1.6;
            color: #666;
        }

        .suggestion {
            background: #e8f4fd;
            padding: 12px;
            border-radius: 6px;
            margin-top: 10px;
            border-left: 4px solid #667eea;
            font-weight: 500;
        }

        .factor-suggestion {
            background: #fff3cd;
            padding: 12px;
            border-radius: 6px;
            margin-top: 10px;
            border-left: 4px solid #ffa502;
            font-weight: 500;
        }

        /* 雷达图容器 */
        .radar-chart-container {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        /* 响应式调整 */
        @media (max-width: 480px) {
            .indicator-grid {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .clinical-table th,
            .clinical-table td {
                padding: 8px 4px;
                font-size: 11px;
            }
            
            .factor-tags {
                gap: 5px;
            }
            
            .factor-tag {
                font-size: 10px;
                padding: 4px 8px;
            }
        }
    `;
    document.head.appendChild(style);
}