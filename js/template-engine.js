// js/template-engine.js
class TemplateEngine {
    static TEMPLATES = {
        // 基础趣味模板
        'fun-basic': {
            components: ['fun-header', 'simple-score', 'text-analysis', 'share-actions'],
            styles: 'fun-styles'
        },
        
        // 基础标准模板  
        'standard-basic': {
            components: ['standard-header', 'detailed-score', 'multi-analysis', 'dimension-chart', 'professional-summary', 'save-actions'],
            styles: 'standard-styles'
        },
        
        // SCL-90专业模板
        'scl90-professional': {
            components: [
                'professional-header',
                'clinical-indicators',
                'dimension-radar', 
                'clinical-table',
                'risk-assessment',
                'professional-advice',
                'save-actions'
            ],
            styles: 'clinical-styles'
        }
    };

    getTemplate(testConfig) {
        // 根据测试配置选择模板
        if (testConfig?.resultTemplate) {
            return this.constructor.TEMPLATES[testConfig.resultTemplate];
        }
        
        // 默认根据测试ID选择
        const templateMap = {
            '1': 'fun-basic',           // 性格色彩
            '2': 'fun-basic',           // 心理年龄
            '3': 'standard-basic',      // 焦虑水平
            '4': 'standard-basic',      // 职业倾向
            '5': 'standard-basic',      // 情绪管理
            '6': 'scl90-professional'   // SCL-90
        };
        
        const templateName = templateMap[testConfig?.id] || 'standard-basic';
        return this.constructor.TEMPLATES[templateName];
    }

    renderComponent(componentName, resultData, testConfig) {
        const component = ReportComponents[componentName];
        return component ? component.render(resultData, testConfig) : '';
    }
}