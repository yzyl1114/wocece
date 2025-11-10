// template-engine.js - 修复模板选择逻辑
class TemplateEngine {
    static TEMPLATES = {
        // 基础趣味模板
        'fun-basic': {
            components: ['fun-header', 'simple-score', 'text-analysis', 'share-actions'],
            styles: 'fun-styles'
        },
        
        // 基础标准模板  
        'standard-basic': {
            components: [
                'standard-header', 
                'detailed-score', 
                'multi-analysis', 
                'dimension-chart', 
                'professional-summary', 
                'save-actions'
            ],
            styles: 'standard-styles'
        },
        
        // SCL-90专业模板
        'scl90-professional': {
            components: [
                'professional-header',
                'clinical-indicators',
                'detailed-analysis', 
                'dimension-radar', 
                'clinical-table',
                'factor-interpretation', 
                'professional-summary', 
                'save-actions'
            ],
            styles: 'clinical-styles'
        }
    };

    getTemplate(testConfig) {
        console.log('🔍 获取模板, 测试配置:', testConfig);
        
        // 🆕 修复：对于SCL-90测试，强制使用专业模板
        if (testConfig && testConfig.id === '6') {
            console.log('🎯 强制使用SCL-90专业模板');
            return this.constructor.TEMPLATES['scl90-professional'];
        }
        
        // 原有逻辑作为备用
        if (testConfig?.resultTemplate) {
            const template = this.constructor.TEMPLATES[testConfig.resultTemplate];
            console.log('📋 使用指定模板:', testConfig.resultTemplate);
            return template;
        }
        
        // 默认根据测试ID选择
        const templateMap = {
            '1': 'fun-basic',
            '2': 'fun-basic', 
            '3': 'standard-basic',
            '4': 'standard-basic',
            '5': 'standard-basic',
            '6': 'scl90-professional'  // 🆕 确保这里正确
        };
        
        const templateName = templateMap[testConfig?.id] || 'standard-basic';
        const template = this.constructor.TEMPLATES[templateName];
        console.log('📋 使用默认模板:', templateName);
        return template;
    }

    renderComponent(componentName, resultData, testConfig) {
        const component = ReportComponents[componentName];
        return component ? component.render(resultData, testConfig) : '';
    }
}