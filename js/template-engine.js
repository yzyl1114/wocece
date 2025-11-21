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
        },

        'animal-personality': {
            components: [
                'animal-header',
                'animal-similarity', 
                'animal-description',
                'animal-dimensions',
                'animal-summary',
                'save-actions'
            ],
            styles: 'fun-styles'
        },

        'spiritual-needs': {
            components: [
                'spiritual-header',
                'spiritual-horizontal-bars', // 新增：横向柱状图
                'spiritual-detailed-analysis', // 扩展：深度解读
                'spiritual-summary', // 新增：总结区块
                'save-actions'
            ],
            styles: 'spiritual-styles'
        },
        
        // 心灵气象图模板
        'weather-personality': {
            components: [
                'weather-header',
                'weather-description', 
                'weather-dimensions',
                'weather-summary',
                'share-actions'
            ],
            styles: 'fun-styles'
        },

        'holland-adapt': {
            components: [
                'holland-header',
                'holland-slogan',
                'holland-core-traits', 
                'holland-world-script',
                'holland-reality-awakening',
                'holland-dimensions',
                'holland-summary',
                'share-actions'
            ],
            styles: 'fun-styles'
        },
    };

    getTemplate(testConfig) {
        console.log('获取模板, 测试配置:', testConfig);
        
        // SCL-90测试使用专业模板
        if (testConfig && testConfig.id === '6') {
            console.log('使用SCL-90专业模板');
            return this.constructor.TEMPLATES['scl90-professional'];
        }
        
        // 动物人格测试使用动物模板
        if (testConfig && testConfig.id === '7') {
            console.log('使用动物人格模板');
            return this.constructor.TEMPLATES['animal-personality'];
        }

        if (testConfig && (testConfig.id === '8' || testConfig.calculationType === 'spiritual_needs')) {
            console.log('使用精神需求测试模板');
            return this.constructor.TEMPLATES['spiritual-needs'];
        }

        // 心灵气象图测试
        if (testConfig && testConfig.id === '1') {
            console.log('使用心灵气象图模板');
            return this.constructor.TEMPLATES['weather-personality'];
        }

        // 异世界职业测评
        if (testConfig && testConfig.id === '2') {
        console.log('使用异世界职业测评模板');
        return this.constructor.TEMPLATES['holland-adapt'];
        }

        // 原有逻辑作为备用
        if (testConfig?.resultTemplate) {
            const template = this.constructor.TEMPLATES[testConfig.resultTemplate];
            console.log('使用指定模板:', testConfig.resultTemplate);
            return template;
        }
        
        // 默认根据测试ID选择
        const templateMap = {
            '1': 'fun-basic',
            '2': 'fun-basic', 
            '3': 'standard-basic',
            '4': 'standard-basic',
            '5': 'standard-basic',
            '6': 'scl90-professional',
            '7': 'animal-personality',
            '8': 'spiritual-needs' 
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