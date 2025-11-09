// js/calculation.js
class CalculationManager {
    constructor() {
        // 可以在这里初始化一些配置
    }

    /**
     * 统一计分入口 - 根据测试类型调用对应的计分方法
     */
    calculateResult(testId, answers, testData) {
        // 根据测试ID选择计分方法
        if (testId === '6') {
            return this.calculateSCL90(answers, testData);
        } else {
            // 其他测试使用默认的简单计分
            return this.calculateSimpleTest(answers, testData);
        }
    }

    /**
     * SCL-90专业计分逻辑
     */
    calculateSCL90(answers, testData) {
        const dimensions = testData.dimensions;
        const result = {
            score: 0,
            totalScore: 0,
            positiveItems: 0, // 阳性项目数
            positiveAverage: 0, // 阳性症状均分
            dimensions: [],
            testType: 'scl90',
            factorScores: {}
        };
        
        // 计算总分和阳性项目
        let totalScore = 0;
        let scoreOneCount = 0; // 得分为1的题目数
        
        answers.forEach((answer, index) => {
            const question = testData.questions[index];
            const option = question.options.find(opt => opt.id === answer);
            if (option && option.score) {
                const score = option.score;
                totalScore += score;
                if (score >= 2) result.positiveItems++;
                if (score === 1) scoreOneCount++;
            }
        });
        
        result.totalScore = totalScore;
        // 计算阳性症状均分
        result.positiveAverage = result.positiveItems > 0 ? 
            (totalScore - scoreOneCount) / result.positiveItems : 0;
        
        // 计算各维度分数
        Object.keys(dimensions).forEach(dimKey => {
            const dimension = dimensions[dimKey];
            let dimensionScore = 0;
            let dimAnsweredCount = 0;
            
            // 计算该维度下所有题目的总分
            dimension.items.forEach(questionNum => {
                const answerIndex = questionNum - 1;
                if (answers[answerIndex]) {
                    const question = testData.questions[answerIndex];
                    const option = question.options.find(opt => opt.id === answers[answerIndex]);
                    if (option && option.score) {
                        dimensionScore += option.score;
                        dimAnsweredCount++;
                    }
                }
            });
            
            // 计算因子分（平均分）
            const averageScore = dimAnsweredCount > 0 ? dimensionScore / dimAnsweredCount : 0;
            const totalDimensionScore = dimensionScore; // 维度总分
            
            result.dimensions.push({
                name: dimension.name,
                score: Math.round((averageScore - 1) / 4 * 100), // 转换为百分制用于显示
                analysis: dimension.description,
                rawScore: dimensionScore,
                averageScore: averageScore, // 因子分
                totalScore: totalDimensionScore, // 维度总分
                isHigh: averageScore > 2, // 因子分超过2
                description: averageScore > 2 ? dimension.highDescription : dimension.lowDescription,
                interpretation: dimension.interpretation,
                scoreRange: dimension.scoreRange
            });
            
            result.factorScores[dimKey] = averageScore;
        });
        
        // 计算总体评分（基于因子分的平均值转换为百分制）
        const totalAverage = result.dimensions.reduce((sum, dim) => sum + dim.averageScore, 0) / result.dimensions.length;
        result.score = Math.round((totalAverage - 1) / 4 * 100);
        
        // 生成总体评估
        result.overallAssessment = this.getSCL90Assessment(result.totalScore, result.factorScores, result.positiveItems);
        
        return result;
    }

    /**
     * SCL-90总体评估
     */
    getSCL90Assessment(totalScore, factorScores, positiveItems) {
        let assessment = {
            level: '正常',
            description: '您的心理状态在正常范围内',
            suggestion: '请继续保持良好的心理状态',
            positiveItems: positiveItems
        };
        
        // 基于总分评估
        if (totalScore > 250) {
            assessment.level = '严重';
            assessment.description = '您的症状比较严重';
            assessment.suggestion = '需要作医学上的详细检查，很可能要做针对性的心理治疗或在医生的指导下服药';
        } else if (totalScore > 200) {
            assessment.level = '明显';
            assessment.description = '您有明显心理问题的可能性';
            assessment.suggestion = '可求助于心理咨询，进行专业的心理评估';
        } else if (totalScore > 160) {
            assessment.level = '关注';
            assessment.description = '您的总分超过临界值，建议关注';
            assessment.suggestion = '应作进一步检查，关注自身心理健康状态';
        }
        
        // 检查是否有因子分超过2分
        const highFactors = Object.keys(factorScores).filter(key => factorScores[key] > 2);
        if (highFactors.length > 0) {
            assessment.hasHighFactors = true;
            assessment.highFactors = highFactors;
            assessment.factorSuggestion = '部分因子分超过2分，建议重点关注这些方面的症状';
        }
        
        return assessment;
    }

    /**
     * 简单测试计分逻辑（用于非SCL-90测试）
     */
    calculateSimpleTest(answers, testData) {
        // 简单的频率统计法
        const scores = {
            A: 0, B: 0, C: 0, D: 0
        };

        answers.forEach(answer => {
            if (scores.hasOwnProperty(answer)) {
                scores[answer]++;
            }
        });

        const total = answers.length;
        const mainTrait = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );

        return {
            score: Math.floor((scores[mainTrait] / total) * 100),
            mainTrait: mainTrait,
            analysis: this.generateSimpleAnalysis(mainTrait),
            testType: 'simple'
        };
    }

    /**
     * 生成简单分析
     */
    generateSimpleAnalysis(trait) {
        const analyses = {
            'A': '你是一个独立思考者，善于分析和解决问题。在压力下保持冷静，但有时可能过于独立。',
            'B': '你重视人际关系，善于合作。能够很好地理解他人感受，但需要注意保持个人边界。',
            'C': '你谨慎而敏感，善于观察细节。需要更多时间来适应变化，但思考问题很全面。',
            'D': '你行动力强，果断坚决。善于把握机会，但需要注意考虑周全再行动。'
        };
        return analyses[trait] || '基于你的选择，这是一个个性化的分析结果。';
    }

    /**
     * 未来可以在这里添加其他测评的计分方法
     * 例如：
     * calculateTest1(answers, testData) { ... }
     * calculateTest2(answers, testData) { ... }
     */
}

// 全局计算实例
window.calculationManager = new CalculationManager();