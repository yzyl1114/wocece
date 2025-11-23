class CalculationManager {
    constructor() {
        // 可以在这里初始化一些配置
    }

    /**
     * 统一计分入口 - 根据测试类型调用对应的计分方法
     */
    calculateResult(testId, answers, testData) {
        // 根据测试ID选择计分方法
        switch(testId) {
            case '1':
                return this.calculateWeatherPersonalityV2(answers, testData);
            case '2':
                return this.calculateHollandAdapt(answers, testData);
            case '3':
                return this.calculateRelationshipComfort(answers, testData);
            case '4':
                return this.calculateMingDynasty(answers, testData);
            case '6':
                return this.calculateSCL90(answers, testData);
            case '7':
                return this.calculateAnimalPersonality(answers);
            case '8':
                return this.calculateSpiritualNeeds(answers, testData);            
            default:
                throw new Error(`未找到测试ID: ${testId} 的计分方法`);
        }
    }

    /**
     * SCL-90专业计分逻辑 - 测试ID: 6
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
        result.score = totalScore; // 综合评分直接等于总分
        
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
                score: Math.round(averageScore * 20), // 转换为20分制用于显示
                rawScore: dimensionScore,
                averageScore: averageScore, // 因子分
                totalScore: totalDimensionScore, // 维度总分
                isHigh: averageScore > 2, // 因子分超过2
                description: averageScore > 2 ? dimension.highDescription : dimension.lowDescription,
                interpretation: dimension.interpretation,
                scoreRange: dimension.scoreRange,
                threshold: dimension.threshold || 2.0
            });
            
            result.factorScores[dimKey] = averageScore;
        });
        
        // 生成总体评估
        result.overallAssessment = this.getSCL90Assessment(result.totalScore, result.factorScores, result.positiveItems);
        
        // 生成详细分析
        result.detailedAnalysis = this.generateDetailedAnalysis(result);
        
        return result;
    }

    generateDetailedAnalysis(result) {
        const totalQuestions = 90;
        const positivePercentage = Math.round((result.positiveItems / totalQuestions) * 100);
        
        let assessmentText = '';
        if (result.totalScore <= 160) {
            assessmentText = '≤160分，初步评估无明显心理问题';
        } else if (result.totalScore <= 250) {
            assessmentText = '≤250分，初步评估无明显心理问题';
        } else if (result.totalScore <= 290) {
            assessmentText = '得分在251~290分之间，有心理问题的可能性';
        } else if (result.totalScore <= 340) {
            assessmentText = '得分在291~340分之间，有明显心理问题的可能性';
        } else {
            assessmentText = '得分超过340分，初步评估心理问题比较严重';
        }
        
        return `您的阳性症状（单项得分≥2）共${result.positiveItems}项，占比${positivePercentage}%。您的总分为${result.totalScore}分，按照SCL-90中国版常模，${assessmentText}。`;
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
     * 动物人格测试计分逻辑 - 测试ID: 7
     */
    calculateAnimalPersonality(answers) {
        // 动物人格测试评分映射 - 纯数据，不包含展示信息
        const animalScoreMap = [
            { A: { AES: 2 }, B: { COM: 2 }, C: { SOL: 2 }, D: { AGI: 2 } },
            { A: { COM: 2 }, B: { SEC: 2 }, C: { AES: 2 }, D: { STR: 2 } },
            { A: { STR: 2 }, B: { COM: 2 }, C: { SEC: 2 }, D: { DOM: 2 } },
            { A: { STR: 2 }, B: { AGI: 2 }, C: { DOM: 2 }, D: { SOL: 2 } },
            { A: { SOL: 2 }, B: { AGI: 2 }, C: { DOM: 2 }, D: { SEC: 2 } },
            { A: { AES: 2 }, B: { DOM: 2 }, C: { STR: 2 }, D: { COM: 2 } },
            { A: { SOL: 2 }, B: { COM: 2 }, C: { SEC: 2 }, D: { AES: 2 } },
            { A: { SEC: 2 }, B: { COM: 2 }, C: { SOL: 2 }, D: { DOM: 2 } },
            { A: { COM: 2 }, B: { SEC: 2 }, C: { STR: 2 }, D: { AGI: 2 } },
            { A: { DOM: 2 }, B: { SEC: 2 }, C: { AES: 2 }, D: { SEC: 2 } },
            { A: { STR: 2 }, B: { AES: 2 }, C: { DOM: 2 }, D: { AES: 2 } },
            { A: { AES: 2 }, B: { DOM: 2 }, C: { SOL: 2 }, D: { SEC: 2 } },
            { A: { AES: 2 }, B: { DOM: 2 }, C: { AES: 2 }, D: { SOL: 2 } },
            { A: { AES: 2 }, B: { COM: 2 }, C: { STR: 2 }, D: { SEC: 2 } },
            { A: { SOL: 2 }, B: { STR: 2 }, C: { COM: 2 }, D: { AGI: 2 } },
            { A: { DOM: 2 }, B: { COM: 2 }, C: { SOL: 2 }, D: { AGI: 2 } },
            { A: { DOM: 2 }, B: { SEC: 2 }, C: { AGI: 2 }, D: { SOL: 2 } },
            { A: { STR: 2 }, B: { AGI: 2 }, C: { SOL: 2 }, D: { DOM: 2 } },
            { A: { STR: 2 }, B: { DOM: 2 }, C: { COM: 2 }, D: { SOL: 2 } },
            { A: { SOL: 2 }, B: { DOM: 2 }, C: { AES: 2 }, D: { COM: 2 } },
            { A: { SOL: 2 }, B: { DOM: 2 }, C: { SEC: 2 }, D: { COM: 2 } },
            { A: { DOM: 2 }, B: { SOL: 2 }, C: { COM: 2 }, D: { STR: 2 } },
            { A: { AGI: 2 }, B: { COM: 2 }, C: { AES: 2 }, D: { SOL: 2 } },
            { A: { SEC: 2 }, B: { AGI: 2 }, C: { SOL: 2 }, D: { DOM: 2 } },
            { A: { AES: 2 }, B: { COM: 2 }, C: { SOL: 2 }, D: { DOM: 2 } },
            { A: { AES: 2 }, B: { COM: 2 }, C: { DOM: 2 }, D: { STR: 2 } },
            { A: { DOM: 2 }, B: { AGI: 2 }, C: { SEC: 2 }, D: { COM: 2 } },
            { A: { STR: 2 }, B: { COM: 2 }, C: { SEC: 2 }, D: { DOM: 2 } },
            { A: { SOL: 2 }, B: { COM: 2 }, C: { AES: 2 }, D: { DOM: 2 } },
            { A: { AES: 2 }, B: { COM: 2 }, C: { DOM: 2 }, D: { STR: 2 } },
            { A: { STR: 2 }, B: { DOM: 2 }, C: { AGI: 2 }, D: { COM: 2 } },
            { A: { SOL: 2 }, B: { COM: 2 }, C: { AGI: 2 }, D: { STR: 2 } },
            { A: { DOM: 2 }, B: { AES: 2 }, C: { AGI: 2 }, D: { STR: 2 } },
            { A: { DOM: 2 }, B: { COM: 2 }, C: { AGI: 2 }, D: { STR: 2 } },
            { A: { STR: 2 }, B: { COM: 2 }, C: { AGI: 2 }, D: { SEC: 2 } },
            { A: { DOM: 2 }, B: { AGI: 2 }, C: { SOL: 2 }, D: { SEC: 2 } },
            { A: { DOM: 2 }, B: { STR: 2 }, C: { SEC: 2 }, D: { AES: 2 } },
            { A: { SOL: 2 }, B: { DOM: 2 }, C: { COM: 2 }, D: { AES: 2 } },
            { A: { STR: 2 }, B: { COM: 2 }, C: { AES: 2 }, D: { DOM: 2 } },
            { A: { STR: 2 }, B: { SEC: 2 }, C: { AGI: 2 }, D: { DOM: 2 } },
            { A: { STR: 2 }, B: { DOM: 2 }, C: { SEC: 2 }, D: { AGI: 2 } },
            { A: { SOL: 2 }, B: { DOM: 2 }, C: { COM: 2 }, D: { STR: 2 } },
            { A: { STR: 2 }, B: { DOM: 2 }, C: { COM: 2 }, D: { AES: 2 } },
            { A: { DOM: 2 }, B: { SEC: 2 }, C: { AES: 2 }, D: { SOL: 2 } },
            { A: { DOM: 2 }, B: { STR: 2 }, C: { COM: 2 }, D: { AGI: 2 } },
            { A: { DOM: 2 }, B: { AES: 2 }, C: { STR: 2 }, D: { SOL: 2 } },
            { A: { DOM: 2 }, B: { COM: 2 }, C: { SEC: 2 }, D: { AGI: 2 } },
            { A: { STR: 2 }, B: { COM: 2 }, C: { SEC: 2 }, D: { DOM: 2 } },
            { A: { AES: 2 }, B: { DOM: 2 }, C: { SEC: 2 }, D: { SOL: 2 } },
            { A: { STR: 2 }, B: { AES: 2 }, C: { COM: 2 }, D: { SOL: 2 } },
            { A: { DOM: 2 }, B: { AES: 2 }, C: { COM: 2 }, D: { SEC: 2 } },
            { A: { AGI: 2 }, B: { COM: 2 }, C: { SEC: 2 }, D: { STR: 2 } },
            { A: { STR: 2 }, B: { DOM: 2 }, C: { AES: 2 }, D: { COM: 2 } },
            { A: { STR: 2 }, B: { COM: 2 }, C: { SEC: 2 }, D: { DOM: 2 } },
            { A: { AGI: 2 }, B: { COM: 2 }, C: { SEC: 2 }, D: { DOM: 2 } },
            { A: { SOL: 2 }, B: { COM: 2 }, C: { SEC: 2 }, D: { AES: 2 } },
            { A: { STR: 2 }, B: { COM: 2 }, C: { AGI: 2 }, D: { SOL: 2 } },
            { A: { AGI: 2 }, B: { DOM: 2 }, C: { STR: 2 }, D: { AES: 2 } },
            { A: { STR: 2 }, B: { COM: 2 }, C: { SEC: 2 }, D: { SOL: 2 } },
            { A: { AES: 2 }, B: { COM: 2 }, C: { SEC: 2 }, D: { DOM: 2 } }
        ];

        // 动物原型向量数据 - 纯数学数据
        const animalVectors = {
            "狗": { DOM: 1, STR: 1, COM: 5, SOL: 0, AGI: 3, SEC: 4, AES: 1 },
            "猫": { DOM: 1, STR: 2, COM: 0, SOL: 5, AGI: 4, SEC: 2, AES: 3 },
            "狼": { DOM: 4, STR: 4, COM: 3, SOL: 2, AGI: 2, SEC: 1, AES: 0 },
            "狐": { DOM: 1, STR: 5, COM: 0, SOL: 4, AGI: 4, SEC: 1, AES: 1 },
            "狮": { DOM: 5, STR: 2, COM: 3, SOL: 3, AGI: 1, SEC: 2, AES: 2 },
            "熊": { DOM: 3, STR: 1, COM: 1, SOL: 4, AGI: 0, SEC: 5, AES: 1 },
            "兔": { DOM: 0, STR: 1, COM: 2, SOL: 2, AGI: 5, SEC: 5, AES: 2 },
            "仓鼠": { DOM: 0, STR: 0, COM: 2, SOL: 4, AGI: 1, SEC: 5, AES: 1 },
            "天鹅": { DOM: 2, STR: 1, COM: 2, SOL: 3, AGI: 1, SEC: 2, AES: 5 },
            "鹿": { DOM: 1, STR: 1, COM: 3, SOL: 3, AGI: 3, SEC: 4, AES: 4 },
            "鹰": { DOM: 4, STR: 3, COM: 0, SOL: 5, AGI: 2, SEC: 1, AES: 2 },
            "乌鸦": { DOM: 2, STR: 5, COM: 4, SOL: 2, AGI: 3, SEC: 1, AES: 0 },
            "水豚": { DOM: 0, STR: 0, COM: 5, SOL: 2, AGI: 1, SEC: 5, AES: 2 },
            "鲸": { DOM: 2, STR: 3, COM: 4, SOL: 4, AGI: 0, SEC: 2, AES: 4 },
            "鹦鹉": { DOM: 1, STR: 2, COM: 5, SOL: 1, AGI: 5, SEC: 1, AES: 2 },
            "章鱼": { DOM: 2, STR: 5, COM: 0, SOL: 5, AGI: 4, SEC: 1, AES: 1 },
            "鲨鱼": { DOM: 5, STR: 3, COM: 0, SOL: 5, AGI: 3, SEC: 0, AES: 0 },
            "海豚": { DOM: 3, STR: 4, COM: 5, SOL: 0, AGI: 4, SEC: 1, AES: 1 },
            "浣熊": { DOM: 1, STR: 4, COM: 2, SOL: 3, AGI: 5, SEC: 2, AES: 0 },
            "猫鼬": { DOM: 2, STR: 3, COM: 5, SOL: 1, AGI: 3, SEC: 5, AES: 0 }
        };

        const dimensionKeys = ["DOM", "STR", "COM", "SOL", "AGI", "SEC", "AES"];
        const scores = {};
        dimensionKeys.forEach(key => scores[key] = 0);

        // 计算各维度分数
        for (let i = 0; i < answers.length && i < animalScoreMap.length; i++) {
            const option = answers[i];
            const mapRow = animalScoreMap[i];
            if (!option || !mapRow) continue;
            
            const questionScores = mapRow[option];
            if (!questionScores) continue;
            
            for (const dim of dimensionKeys) {
                scores[dim] += (questionScores[dim] || 0);
            }
        }

        // L2归一化
        const userNormalized = this.l2Normalize(scores);
        
        // 寻找最佳匹配的动物
        let bestMatchAnimal = null;
        let bestSimilarity = -1;

        for (const [animalName, animalVector] of Object.entries(animalVectors)) {
            const animalNormalized = this.l2Normalize(animalVector);
            const similarity = this.cosineSimilarity(userNormalized, animalNormalized);
            
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatchAnimal = animalName;
            }
        }
        
        return {
            animal: bestMatchAnimal,
            similarity: bestSimilarity,
            dimensions: scores,
            totalScore: Object.values(scores).reduce((sum, score) => sum + score, 0),
            testType: 'animal_personality',
            score: Math.round(bestSimilarity * 100)
        };
    }

    /**
     * 精神需求测试计分逻辑 - 测试ID: 8
     */
    calculateSpiritualNeeds(answers, testData) {
        // 添加错误检查
        if (!testData || !testData.dimensions) {
            console.error('❌ 测试数据缺失:', testData);
            throw new Error('测试配置数据不完整，无法计算结果');
        }
        const dimensions = testData.dimensions;
        const result = {
            score: 0,
            totalScore: 0,
            dimensions: [],
            testType: 'spiritual_needs',
            dimensionScores: {},
            topDimensions: []
        };
        
        // 初始化维度分数
        Object.keys(dimensions).forEach(dimKey => {
            result.dimensionScores[dimKey] = 0;
        });
        
        // 计算各维度分数
        answers.forEach((answer, index) => {
            const question = testData.questions[index];
            if (!question || !answer) return;
            
            switch(question.type) {
                case 'binary':
                case 'single':
                    // 单选题直接计分
                    const selectedOption = question.options.find(opt => opt.id === answer);
                    if (selectedOption && selectedOption.score) {
                        this.addScores(result.dimensionScores, selectedOption.score);
                    }
                    break;
                    
                case 'sort':
                    // 排序题特殊计分逻辑
                    if (Array.isArray(answer)) {
                        answer.forEach((itemId, position) => {
                            const itemOption = question.options.find(opt => opt.id === itemId);
                            if (itemOption && itemOption.score) {
                                // 第1位得满分，第2位得1/2分，第3位得1/3分...
                                const sortedScores = {};
                                Object.entries(itemOption.score).forEach(([dim, score]) => {
                                    sortedScores[dim] = Math.round(score / Math.pow(2, position));
                                });
                                this.addScores(result.dimensionScores, sortedScores);
                            }
                        });
                    }
                    break;
                    
                case 'multiple':
                    // 多选题累加计分
                    if (Array.isArray(answer)) {
                        answer.forEach(itemId => {
                            const itemOption = question.options.find(opt => opt.id === itemId);
                            if (itemOption && itemOption.score) {
                                this.addScores(result.dimensionScores, itemOption.score);
                            }
                        });
                    }
                    break;
            }
        });
        
        // 构建维度结果数组
        Object.keys(dimensions).forEach(dimKey => {
            const dim = dimensions[dimKey];
            const score = result.dimensionScores[dimKey];
            const percentage = Math.min(100, Math.round((score / 100) * 100));
            
            result.dimensions.push({
                code: dimKey,
                name: dim.name,
                score: percentage,
                rawScore: score,
                color: dim.color,
                description: dim.description,
                interpretation: score > 50 ? dim.highDescription : dim.lowDescription,
                isHigh: score > 50
            });
        });
        
        // 按分数排序
        result.dimensions.sort((a, b) => b.score - a.score);
        
        // 识别前3个最高分维度
        result.topDimensions = result.dimensions.slice(0, 3);
        
        // 计算综合评分（平均分）
        result.score = Math.round(result.dimensions.reduce((sum, dim) => sum + dim.score, 0) / result.dimensions.length);
        
        // 生成详细分析
        result.detailedAnalysis = this.generateSpiritualAnalysis(result);
        
        return result;
    }

    /**
     * 辅助方法：累加分数到维度
     */
    addScores(dimensionScores, scoresToAdd) {
        Object.entries(scoresToAdd).forEach(([dim, score]) => {
            const roundedScore = Math.round(score);
            dimensionScores[dim] = (dimensionScores[dim] || 0) + score;
            // 上限100分
            dimensionScores[dim] = Math.min(100, dimensionScores[dim]);
        });
    }

    /**
     * 生成精神需求测试的详细分析
     */
    generateSpiritualAnalysis(result) {
        const topDim = result.topDimensions[0];
        const analysisTemplates = {
            'A': `你的核心精神需求是「意义」。你渴望生活有明确的目标和方向，追求超越日常琐事的深层价值。建议寻找能体现你价值观的事业或使命。`,
            'B': `你的核心精神需求是「爱」。情感连接和亲密关系对你至关重要。建议投入时间培养深度关系，表达和接受爱与关怀。`,
            'C': `你的核心精神需求是「连接」。你渴望归属感和群体认同。建议参与社区活动，建立广泛的社交网络。`,
            'D': `你的核心精神需求是「成长」。你持续追求自我提升和能力拓展。建议设定学习目标，不断挑战自我。`,
            'E': `你的核心精神需求是「创造」。你有强烈的表达欲和创新冲动。建议通过艺术、写作或其他创造性渠道表达自我。`,
            'F': `你的核心精神需求是「权力」。你渴望影响力和掌控感。建议寻找能发挥领导力的机会，但注意平衡。`,
            'G': `你的核心精神需求是「乐趣」。你重视生活中的快乐和愉悦体验。建议培养兴趣爱好，保持生活的趣味性。`,
            'H': `你的核心精神需求是「安全感」。你需要稳定和可预测的环境。建议建立可靠的支持系统，但也要适度冒险。`,
            'I': `你的核心精神需求是「自由」。你极度重视独立性和自主权。建议创造能自主决策的空间，保持个人边界。`,
            'J': `你的核心精神需求是「贡献」。你有强烈的利他主义倾向。建议参与志愿服务，帮助他人实现价值。`
        };
        
        let analysis = analysisTemplates[topDim.code] || `基于你的测试结果，你在多个精神维度都有显著需求。`;
        
        // 添加平衡建议
        const lowDimensions = result.dimensions.filter(dim => !dim.isHigh).slice(0, 2);
        if (lowDimensions.length > 0) {
            analysis += ` 同时，你可以关注${lowDimensions.map(dim => dim.name).join('和')}方面的成长，以获得更平衡的精神满足。`;
        }
        
        return analysis;
    }

    /**
     * L2归一化函数
     */
    l2Normalize(vector) {
        let sumSquares = 0;
        for (const key in vector) {
            sumSquares += Math.pow(vector[key], 2);
        }
        const magnitude = Math.sqrt(sumSquares);
        
        if (magnitude === 0) return vector;
        
        const normalized = {};
        for (const key in vector) {
            normalized[key] = vector[key] / magnitude;
        }
        return normalized;
    }

    /**
     * 余弦相似度计算
     */
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;
        
        const dimensions = Object.keys(vecA);
        for (const dim of dimensions) {
            const a = vecA[dim] || 0;
            const b = vecB[dim] || 0;
            dotProduct += a * b;
            magnitudeA += a * a;
            magnitudeB += b * b;
        }
        
        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);
        
        if (magnitudeA === 0 || magnitudeB === 0) return 0;
        
        return dotProduct / (magnitudeA * magnitudeB);
    }

    /**
     * 心灵气象图计分逻辑 V2 (第二版方案)
     */
    calculateWeatherPersonalityV2(answers, testData) {
        console.log('使用第二版心灵气象图计分方案');
        
        // 第一步：确定核心气质（使用第1,2,3,5题）
        const coreTemperament = this.determineCoreTemperamentV2(answers);
        
        // 第二步：微调匹配城市条件（使用第4,6,7,8,9,10题）
        const matchResult = this.matchCityConditionV2(coreTemperament, answers);
        
        // 第三步：生成情绪描述
        const emotionDesc = this.generateEmotionDescription(answers);
        
        // 返回纯计算数据，不包含展示文案
        return {
            score: this.calculateScore(coreTemperament.code, matchResult.conditionKey),
            coreCode: coreTemperament.code,
            conditionKey: matchResult.conditionKey,
            emotionDesc: emotionDesc,
            testType: 'weather_personality_v2',
            testId: '1'
        };
    }

    /**
     * 确定核心气质 V2
     */
    determineCoreTemperamentV2(answers) {
        // 第1、2题判断外向性(E)
        const e1 = this.getTemperamentScore(answers[0], 'E');
        const e2 = this.getTemperamentScore(answers[1], 'E');
        let E;
        
        if ((e1 === '高' && e2 === '高') || (e1 === '低' && e2 === '低')) {
            E = e1; // 两题倾向一致，取该倾向
        } else {
            E = '中'; // 倾向混合，取中
        }
        
        // 第3题判断开放性(O)
        const O = this.getTemperamentScore(answers[2], 'O');
        
        // 第5题判断尽责性(C)  
        const C = this.getTemperamentScore(answers[4], 'C');
        
        // 核心气质匹配
        const temperamentMap = {
            '高高高': { code: 'A1', name: '热情的规划师' },
            '高高中': { code: 'A2', name: '奔放的探险家' },
            '高低高': { code: 'A2', name: '奔放的探险家' },
            '高中高': { code: 'B1', name: '可靠的社交家' },
            '高中中': { code: 'B2', name: '随和的享乐者' },
            '高低中': { code: 'B2', name: '随和的享乐者' },
            '高高低': { code: 'C1', name: '恋旧的暖阳' },
            '高中低': { code: 'C1', name: '恋旧的暖阳' },
            '中高高': { code: 'D1', name: '独立的沉思者' },
            '中高中': { code: 'D1', name: '独立的沉思者' },
            '中高低': { code: 'D2', name: '自由的灵魂' },
            '低高高': { code: 'D1', name: '独立的沉思者' },
            '低高中': { code: 'D1', name: '独立的沉思者' },
            '低高低': { code: 'D2', name: '自由的灵魂' },
            '中中高': { code: 'E1', name: '精致的鉴赏家' },
            '中低高': { code: 'E1', name: '精致的鉴赏家' },
            '低中高': { code: 'E1', name: '精致的鉴赏家' },
            '低低高': { code: 'E1', name: '精致的鉴赏家' },
            '中中中': { code: 'E2', name: '淡然的隐士' },
            '中中低': { code: 'E2', name: '淡然的隐士' },
            '中低中': { code: 'E2', name: '淡然的隐士' },
            '中低低': { code: 'E2', name: '淡然的隐士' },
            '低中中': { code: 'E2', name: '淡然的隐士' },
            '低中低': { code: 'E2', name: '淡然的隐士' },
            '低低中': { code: 'E2', name: '淡然的隐士' },
            '低低低': { code: 'E2', name: '淡然的隐士' }
        };
        
        const key = E + O + C;
        console.log('核心气质计算:', { E, O, C, key });
        
        return temperamentMap[key] || { code: 'E2', name: '淡然的隐士' };
    }

    /**
     * 获取气质分数
     */
    getTemperamentScore(answer, dimension) {
        const scoreMap = {
            'E': { 'A': '高', 'B': '低', 'C': '中' }, // 外向性
            'O': { 'A': '高', 'B': '中', 'C': '低' }, // 开放性
            'C': { 'A': '高', 'B': '中', 'C': '低' }  // 尽责性
        };
        
        return scoreMap[dimension][answer] || '中';
    }

    /**
     * 匹配城市条件 V2 - 只返回条件代码，不包含展示文案
     */
    matchCityConditionV2(coreTemperament, answers) {
        let conditionKey;
        
        switch(coreTemperament.code) {
            case 'A1':
            case 'A2':
            case 'B1':
            case 'B2':
            case 'E1':
            case 'E2':
                conditionKey = this.getAnswer7Type(answers[6]);
                break;
            case 'C1':
                conditionKey = this.getAnswer6Type(answers[5]);
                break;
            case 'D1':
                conditionKey = this.getAnswer7Type(answers[6]);
                break;
            case 'D2':
                conditionKey = this.getD2Condition(answers[3], answers[8]);
                break;
            default:
                conditionKey = 'A/B';
        }
        
        console.log('城市条件匹配:', { code: coreTemperament.code, conditionKey });
        
        return { conditionKey };
    }

    /**
     * 获取第7题类型
     */
    getAnswer7Type(answer7) {
        return answer7 === 'C' ? 'C' : 'A/B';
    }

    /**
     * 获取第6题类型  
     */
    getAnswer6Type(answer6) {
        return answer6 === 'C' ? 'C' : 'A/B';
    }

    /**
     * 获取D2核心气质条件
     */
    getD2Condition(answer4, answer9) {
        // 第4题选B/C 且 第9题选B/C → condition1
        // 第4题选A 或 第9题选A → condition2
        if ((answer4 === 'B' || answer4 === 'C') && answer9 === 'B') {
            return 'condition1';
        } else {
            return 'condition2';
        }
    }

    /**
     * 生成情绪描述
     */
    generateEmotionDescription(answers) {
        const answer9 = answers[8]; // 第9题
        const answer10 = answers[9]; // 第10题
        
        if (answer9 === 'A' || answer10 === 'A') {
            return '高敏感性';
        } else if (answer9 === 'B' && answer10 === 'B') {
            return '情绪稳定';
        } else {
            return '平衡型';
        }
    }

    /**
     * 计算分数
     */
    calculateScore(coreCode, conditionKey) {
        const baseScores = {
            'A1': 88, 'A2': 87, 'B1': 84, 'B2': 82, 
            'C1': 79, 'D1': 83, 'D2': 79, 'E1': 81, 'E2': 75
        };
        return baseScores[coreCode] || 80;
    }

    /**
     * 异世界职业测评计分逻辑 - 测试ID: 2
     */
    calculateHollandAdapt(answers, testData) {
    // 统计每个选项的数量
    const scoreCount = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    
    answers.forEach(answer => {
        if (answer && scoreCount.hasOwnProperty(answer)) {
        scoreCount[answer]++;
        }
    });

    // 找出最高分的选项
    const scores = Object.entries(scoreCount);
    scores.sort((a, b) => b[1] - a[1]);
    
    const maxScore = scores[0][1];
    const topTypes = scores.filter(([type, score]) => score === maxScore).map(([type]) => type);
    
    let resultType, resultName, resultDescription;
    
    // 判断结果类型
    if (topTypes.length === 1) {
        // 单一主导类型
        const typeMap = {
        'A': { name: '神匠之手', desc: '万物皆可造，世界在手中。你是点石成金的大师，相信双手创造的价值。' },
        'B': { name: '万象贤者', desc: '真理是唯一的信仰。你是真理的追光者，沉迷于世界的运行规律。' },
        'C': { name: '幻梦诗人', desc: '为世界染上我的颜色。你是情绪的捕捉者，美的创造者。' },
        'D': { name: '盟约领主', desc: '我的舞台，是整个世界。你是天生的策略家与领导者。' },
        'E': { name: '心语祭司', desc: '我修复破碎的，联结孤立的。你是最受爱戴的精神领袖。' },
        'F': { name: '秩序之钥', desc: '我是文明运转的沉默基石。你是王国运转的隐形引擎。' }
        };
        
        resultType = topTypes[0];
        resultName = typeMap[resultType].name;
        resultDescription = typeMap[resultType].desc;
        
    } else if (topTypes.length === 2) {
        // 双核融合类型
        const fusionMap = {
        'AB': { name: '奥秘工匠', desc: '以双手践行理论，用创造验证真理。你是实践型学者，在工作室与实验室间穿梭。' },
        'AC': { name: '艺术建筑师', desc: '将想象力浇筑为不朽的现实。你是梦想的筑造师，让艺术拥有实用的骨架。' },
        'AD': { name: '工程统帅', desc: '我的蓝图，由千军万马来实现。你不仅是设计师，更是伟大的项目总指挥。' },
        'AE': { name: '守护铸造师', desc: '我铸造武器，是为了守护我想守护的一切。你锻造的武器充满灵性。' },
        'AF': { name: '精密制造者', desc: '误差，是不存在的词汇。你是品质控，打造完美无瑕的装备。' },
        'BC': { name: '哲理诗人', desc: '用诗意的语言讲述宇宙真理。你在理性与感性间自由穿梭。' },
        'BD': { name: '战略顾问', desc: '运筹帷幄之中，决胜千里之外。你是智力与权力的完美结合体。' },
        'BE': { name: '启蒙导师', desc: '知识若不能启迪心灵，便毫无意义。你是最伟大的教育家。' },
        'BF': { name: '法典编纂者', desc: '将世界的混乱，归于理性的条文。你编写的法律逻辑严密。' },
        'CD': { name: '剧团主宰', desc: '我不仅创造美，更经营美的帝国。你是艺术与商业的完美结合。' },
        'CE': { name: '灵魂歌者', desc: '我的艺术，是为了疗愈每一颗心。你的作品直击灵魂深处。' },
        'CF': { name: '美学规划师', desc: '在秩序的框架内，演奏最美的乐章。你将创意系统化。' },
        'DE': { name: '仁心领袖', desc: '用力量守护善意，用智慧引导人心。人们为你而战，也为你所守护的价值观而战。' },
        'DF': { name: '市政官', desc: '卓越的治理，是无声的史诗。你让百万人口的城市像精密的钟表一样运转。' },
        'EF': { name: '圣堂执政官', desc: '用温暖的制度，守护每一个人。你是善良与秩序最完美的结合。' }
        };
        
        const fusionKey = topTypes.sort().join('');
        const fusionResult = fusionMap[fusionKey] || { name: '多面手', desc: '你拥有多种天赋，能在不同领域间自如切换。' };
        
        resultType = fusionKey;
        resultName = fusionResult.name;
        resultDescription = fusionResult.desc;
        
    } else {
        // 三核或多核类型
        resultType = 'MULTI';
        resultName = '创世者';
        resultDescription = '构想、解构、然后亲手创造新世界。你的灵魂是多种天赋的完美熔炉，能在理性与感性、抽象与具体之间自由穿梭。';
    }

    // 计算匹配度分数（基于答案一致性）
    const totalQuestions = answers.length;
    const consistencyScore = (maxScore / totalQuestions) * 100;
    
    return {
        score: Math.round(consistencyScore),
        resultType: resultType,
        resultName: resultName,
        resultDescription: resultDescription,
        dimensionScores: scoreCount,
        testType: 'holland_adapt',
        testId: '2',
        detailedAnalysis: this.generateHollandAnalysis(resultType, resultName, scoreCount)
    };
    }

    /**
     * 生成异世界职业测评的详细分析
     */
    generateHollandAnalysis(resultType, resultName, scores) {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    let analysis = `恭喜你！经过9个维度的探索，你的异世界身份是「${resultName}」。`;
    
    if (resultType.length === 1) {
        analysis += ` 你在${this.getDimensionName(resultType)}领域达到了极致，是该领域登峰造极的专家。`;
    } else if (resultType.length === 2) {
        analysis += ` 你同时拥有${resultType.split('').map(t => this.getDimensionName(t)).join('和')}的双重天赋，这种独特的组合让你在异世界中独树一帜。`;
    } else {
        analysis += ` 你是一个罕见的通才，在多个领域都展现出卓越的潜力，这种多样性让你能适应各种挑战。`;
    }
    
    // 添加特质描述
    analysis += ` ${this.getTraitDescription(resultType)}`;
    
    return analysis;
    }

    getDimensionName(type) {
    const names = {
        'A': '动手实践', 'B': '理论研究', 'C': '艺术创作',
        'D': '领导管理', 'E': '社会服务', 'F': '组织规划'
    };
    return names[type] || '未知领域';
    }

    getTraitDescription(resultType) {
    const traits = {
        'A': '你注重实际效果，善于将想法变为现实，在工程、制造等领域能发挥巨大价值。',
        'B': '你追求真理和知识，擅长深度思考和分析，是推动文明进步的重要力量。', 
        'C': '你富有创造力和想象力，能为世界带来美和灵感，是文化的塑造者。',
        'D': '你具备领导才能和战略眼光，善于整合资源达成目标，是天生的组织者。',
        'E': '你充满同理心和关怀，善于建立和谐关系，是团队中温暖的凝聚者。',
        'F': '你重视秩序和效率，擅长规划和管理，是系统稳定运行的保障。',
        'AB': '你能将理论知识与实践技能完美结合，在研发和创新领域表现出色。',
        'AC': '你在艺术表达和技术实现间找到平衡，适合从事需要创意和技能的工作。',
        'MULTI': '你的多面性让你能胜任各种角色，建议在保持广度的同时深化核心专长。'
    };
    
    return traits[resultType] || '你的独特天赋组合让你在异世界中拥有无限可能。';
    }

    /**
     * 关系舒适区测试计分逻辑 - 测试ID: 3
     */
    calculateRelationshipComfort(answers, testData) {
        // 统计每个选项的数量
        const scoreCount = { A: 0, B: 0, C: 0, D: 0 };
        
        answers.forEach(answer => {
            if (answer && scoreCount.hasOwnProperty(answer)) {
                scoreCount[answer]++;
            }
        });

        // 找出最高分的选项
        const scores = Object.entries(scoreCount);
        scores.sort((a, b) => b[1] - a[1]);
        
        const maxScore = scores[0][1];
        const topTypes = scores.filter(([type, score]) => score === maxScore).map(([type]) => type);
        
        // 按照优先级排序：D > A > C > B
        const priorityOrder = ['D', 'A', 'C', 'B'];
        let resultType = topTypes[0];
        
        // 如果有并列，按照优先级选择
        if (topTypes.length > 1) {
            for (const type of priorityOrder) {
                if (topTypes.includes(type)) {
                    resultType = type;
                    break;
                }
            }
        }
        
        // 结果映射 - 添加完整的沟通偏好和兼容性数据
        const resultMap = {
            'B': { 
                name: '阳光树懒型',
                description: '心态放松，享受在一起的温暖，也安然于各自的独处',
                detailed: '你的关系模式就像一只在阳光下慵懒的树懒，情绪稳定，容易满足。你善于沟通，懂得尊重彼此的边界，既能给予温暖的回应，也能保持自我的充实。你的稳定和包容是维系长期关系的宝贵财富。',
                advice: '你的稳定是关系的宝藏。可以偶尔主动创造一些小惊喜或深度对话，为关系注入持续的新鲜感。同时，留意并安抚好关系中那位可能更敏感的伴侣。',
                communication: {
                    preferred: '清晰直接的沟通和明确的时间安排',
                    uncomfortable: '突然的情绪爆发和模糊不清的期待',
                    strengths: '善于倾听，能够给予理性而温暖的回应',
                    tips: '偶尔可以尝试更主动地表达内心需求'
                },
                compatibility: [
                    { type: 'C', name: '独立猫猫型', rating: 5, desc: '彼此尊重个人空间，相处轻松自在，都能理解对方对独立时间的需求' },
                    { type: 'D', name: '机警海螺型', rating: 3, desc: '需要更多耐心和理解，但一旦建立信任，关系会非常稳固' },
                    { type: 'A', name: '暖心考拉型', rating: 2, desc: '需要平衡亲密与独立的需求，找到适合双方的相处节奏' }
                ]
            },
            'A': { 
                name: '暖心考拉型', 
                description: '渴望紧密的连接，细心呵护关系',
                detailed: '你就像一只喜欢紧紧抱住树干的小考拉，渴望高浓度的亲密和及时的回应。你对关系高度投入，情感细腻且富有同理心，善于表达爱，也乐于营造浪漫温馨的二人世界。你会细心呵护关系，愿意付出，同时也希望得到对方明确的爱意表达来获得安心。',
                advice: '在感到不安时，可以尝试先进行自我安抚，告诉自己"我是被爱的"。同时，发展自己的兴趣爱好和社会支持圈，让情感的支点更多元，你会感到更轻松和安全。',
                communication: {
                    preferred: '频繁的情感确认和温暖的肢体语言',
                    uncomfortable: '长时间的沉默和回避问题的态度',
                    strengths: '善于表达情感，能够营造温暖的沟通氛围',
                    tips: '学会在焦虑时进行自我安抚'
                },
                compatibility: [
                    { type: 'B', name: '阳光树懒型', rating: 5, desc: '一个需要亲密，一个给予稳定，形成完美的互补平衡' },
                    { type: 'D', name: '机警海螺型', rating: 3, desc: '需要更多安全感建设，但深度连接后关系会很紧密' },
                    { type: 'C', name: '独立猫猫型', rating: 2, desc: '需要理解对方对个人空间的需求，找到亲密与独立的平衡点' }
                ]
            },
            'C': { 
                name: '独立猫猫型',
                description: '珍视个人空间与自主性，来去自如',
                detailed: '你非常珍视个人空间与自主性，就像一只来去自如的猫。你享受亲密，但更需要保持"我自己"的完整感。你独立、自信、不依赖他人来获得自我价值感，能给伴侣充分的信任和空间。对你而言，最好的爱是相互陪伴又彼此独立。',
                advice: '记得偶尔主动与伴侣分享你的内心世界和日常趣事，一句"今天遇到件有趣的事……"就是很好的开始。适度的自我暴露和依赖，能让亲密感更上一层楼。',
                communication: {
                    preferred: '尊重个人决定的信任和适度的独处时间',
                    uncomfortable: '过度的情感索取和侵入个人边界的行为',
                    strengths: '理性清晰，能够给予对方充分的自由和信任',
                    tips: '偶尔主动分享内心世界能增进亲密感'
                },
                compatibility: [
                    { type: 'B', name: '阳光树懒型', rating: 5, desc: '彼此理解对空间的需求，关系轻松无压力' },
                    { type: 'A', name: '暖心考拉型', rating: 3, desc: '需要明确边界，但温暖的关怀能让你感到被爱' },
                    { type: 'D', name: '机警海螺型', rating: 2, desc: '两个都需要空间的类型，需要建立独特的连接方式' }
                ]
            },
            'D': { 
                name: '机警海螺型',
                description: '渴望深刻亲密但又害怕受伤，谨慎试探',
                detailed: '你就像一只优雅的海螺，拥有一个坚硬而美丽的外壳来保护内部柔软的身体。你极度渴望深刻而安全的亲密，但又非常害怕在关系中受伤。你常常在"渴望靠近"和"害怕受伤"之间谨慎地试探。你的内心世界丰富而深邃，对情感有极强的洞察力。',
                advice: '建立关系时，请给自己和对方多一点耐心。尝试小步地、循序渐进地敞开心扉。学会识别哪些是过去的伤痛在发出警报，哪些是当下关系中真实存在的问题。选择一个安全、稳定的伴侣对你至关重要。',
                communication: {
                    preferred: '耐心渐进的理解和稳定可靠的承诺',
                    uncomfortable: '急促的推进和不可预测的情绪变化',
                    strengths: '情感洞察力强，能够深度理解他人',
                    tips: '学会区分过去伤痛和现实情况'
                },
                compatibility: [
                    { type: 'B', name: '阳光树懒型', rating: 5, desc: '稳定的陪伴能给你足够的安全感，慢慢建立信任' },
                    { type: 'C', name: '独立猫猫型', rating: 3, desc: '彼此都需要空间，但需要找到独特的连接方式' },
                    { type: 'A', name: '暖心考拉型', rating: 2, desc: '一个需要空间，一个需要亲密，需要大量沟通协调' }
                ]
            }
        };
        
        const result = resultMap[resultType] || resultMap['B'];
        
        // 计算匹配度分数
        const totalQuestions = answers.length;
        const consistencyScore = Math.round((maxScore / totalQuestions) * 100);
        
        return {
            score: consistencyScore,
            resultType: resultType,
            resultName: result.name,
            resultDescription: result.description,
            detailedAnalysis: result.detailed,
            advice: result.advice,
            communication: result.communication,
            compatibility: result.compatibility,
            dimensionScores: scoreCount,
            testType: 'relationship_comfort',
            testId: '3'
        };
    }

    /**
    * 大明王朝职场生存人格测评计分逻辑 - 测试ID: 4
    */
    calculateMingDynasty(answers, testData) {
        const dimensions = {
            'openness': 0,      // 开放性
            'conscientiousness': 0, // 尽责性  
            'agreeableness': 0,     // 宜人性
            'neuroticism': 0,        // 情绪稳定性
            'extraversion': 0       // 新增：外向性
        };
        
        // 题目维度映射
        const questionMapping = {
            1: { A: 'openness', B: 'conscientiousness', C: 'neuroticism', D: 'agreeableness' },
            1: { A: 'openness', B: 'conscientiousness', C: 'neuroticism', D: 'agreeableness' },
            2: { A: 'conscientiousness', B: 'agreeableness', C: 'neuroticism', D: 'openness' },
            3: { A: 'conscientiousness', B: 'extraversion', C: 'neuroticism', D: 'openness' },
            4: { A: 'openness', B: 'conscientiousness', C: 'neuroticism', D: 'agreeableness' },
            5: { A: 'agreeableness', B: 'agreeableness', C: 'openness', D: 'extraversion' },
            6: { A: 'openness', B: 'conscientiousness', C: 'agreeableness', D: 'conscientiousness' },
            7: { A: 'conscientiousness', B: 'openness', C: 'agreeableness', D: 'extraversion' },
            8: { A: 'neuroticism', B: 'agreeableness', C: 'conscientiousness', D: 'neuroticism' },
            9: { A: 'conscientiousness', B: 'neuroticism', C: 'openness', D: 'agreeableness' },
            10: { A: 'extraversion', B: 'neuroticism', C: 'openness', D: 'agreeableness' },
            11: { A: 'openness', B: 'neuroticism', C: 'agreeableness', D: 'conscientiousness' },
            12: { A: 'openness', B: 'conscientiousness', C: 'agreeableness', D: 'extraversion' }
        };
        
        // 计算维度分数
        answers.forEach((answer, index) => {
            const questionNum = index + 1;
            const dimension = questionMapping[questionNum]?.[answer];
            if (dimension) {
                dimensions[dimension]++;
            }
        });
        
        // 角色匹配逻辑
        const characters = {
            '嘉靖帝': { openness: 3, conscientiousness: 0, agreeableness: 0, neuroticism: 3, extraversion: 2 },
            '海瑞': { openness: 0, conscientiousness: 3, agreeableness: 0, neuroticism: 0, extraversion: 1 },
            '胡宗宪': { openness: 1, conscientiousness: 3, agreeableness: 1, neuroticism: 2, extraversion: 1 },
            '张居正': { openness: 3, conscientiousness: 3, agreeableness: 1, neuroticism: 0, extraversion: 2 },
            '吕芳': { openness: 1, conscientiousness: 1, agreeableness: 3, neuroticism: 0, extraversion: 2 },
            '严世蕃': { openness: 3, conscientiousness: 0, agreeableness: 0, neuroticism: 1, extraversion: 2 },
            '严嵩': { openness: 0, conscientiousness: 1, agreeableness: 0, neuroticism: 0, extraversion: 1 },
            '裕王': { openness: 0, conscientiousness: 1, agreeableness: 3, neuroticism: 2, extraversion: 1 },
            '杨金水': { openness: 3, conscientiousness: 1, agreeableness: 0, neuroticism: 3, extraversion: 1 },
            '王用汲': { openness: 0, conscientiousness: 3, agreeableness: 3, neuroticism: 0, extraversion: 1 },
            '高翰文': { openness: 3, conscientiousness: 0, agreeableness: 3, neuroticism: 3, extraversion: 1 },
            '冯保': { openness: 3, conscientiousness: 1, agreeableness: 1, neuroticism: 2, extraversion: 2 }
        };
        
        // 计算与每个角色的匹配度
        let bestMatch = '';
        let bestSimilarity = -1;
        
        Object.entries(characters).forEach(([character, charDimensions]) => {
            let similarity = 0;
            Object.keys(dimensions).forEach(dim => {
                similarity += Math.min(dimensions[dim], charDimensions[dim]);
            });
            
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = character;
            }
        });
        
        // 计算匹配度百分比
        const maxPossible = 12; // 最大可能匹配度
        const matchPercentage = Math.round((bestSimilarity / maxPossible) * 100);
        
        return {
            score: matchPercentage,
            character: bestMatch,
            dimensions: dimensions,
            similarity: bestSimilarity,
            testType: 'ming_dynasty',
            testId: '4',
            detailedAnalysis: this.generateMingAnalysis(bestMatch, dimensions),
            fullReport: this.generateMingFullReport(bestMatch, dimensions)
        };
    }

    /**
     * 生成大明王朝测评的详细分析
     */
    generateMingFullReport(character, dimensions) {
        const reportMap = {
            '嘉靖帝': {
                advantages: '你拥有顶级的大局观和战略思维，是天生的布局者。你善于制衡，能透过迷雾直指核心，在复杂的权力结构中游刃有余。与你博弈，对手常会感到无所遁形。',
                challenges: '极致的掌控欲可能让你事必躬亲，身心俱疲。对他人缺乏信任，会使你成为孤家寡人，难以培养出真正忠诚的左膀右臂。',
                advice: '尝试建立一套可靠的授权与监督机制，找到1-2个真正可托付大事的"吕芳"，学会"看不见"，从而解放自己，专注于最顶层的战略思考。'
            },
            '海瑞': {
                advantages: '你原则性极强，是非分明，是规则的坚定捍卫者。你的正直与无畏让你在需要破局时成为一柄利剑，能够打破不合理的现状。',
                challenges: '过于刚直可能让你缺乏弹性，在需要协作和妥协的情境中容易碰壁，显得"不近人情"，影响团队和谐。',
                advice: '在坚守底线的前提下，可以尝试学习更富弹性的沟通艺术。让道理变得可接受，本身也是一种重要的能力。'
            },
            '胡宗宪': {
                advantages: '你是团队中最可靠的中流砥柱。责任心极强，敢于担当，能在上司、同僚与下属的复杂期望中，找到那条最艰难的实干之路，并坚持走下去。',
                challenges: '你习惯把所有人的压力都扛在自己肩上，这让你成为了团队的守护神，却也让你自己不堪重负，容易陷入焦虑和疲惫。',
                advice: '学会"拆分"压力，将非核心任务交付给值得培养的下属。定期给自己留出"喘息"的空间，意识到有时"慢下来"是为了更好地前进。'
            },
            '张居正': {
                advantages: '你兼具长远眼光与实干精神，是富有魄力的战略家。你不墨守成规，懂得为实现最终目标进行策略性的妥协与谋划。',
                challenges: '过于强大的目标感，有时可能会让你忽略执行过程中的"人心"细节，显得有些不近人情，影响团队凝聚力。',
                advice: '在推行宏大计划时，别忘了花些时间向团队阐释愿景，凝聚共识。让人理解，才能让人真心追随。'
            },
            '吕芳': {
                advantages: '你拥有顶级的情商和共情能力，是团队的"粘合剂"和"定盘星"。你总能体贴所有人，在复杂局面中维持和谐与平衡。',
                challenges: '为了维持表面的和谐，你有时会过度隐藏自己的真实情绪和观点，这可能会让你感到内心孤独，或错失一些表达立场的机会。',
                advice: '在维持良好关系的同时，可以尝试在关键议题上，更清晰地表达自己的核心诉求。你的善良，应该带点锋芒。'
            },
            '严世蕃': {
                advantages: '你聪明敏锐，善于打破常规，在复杂局面中为自己抓住机会。你的果断和精明是你在竞争中脱颖而出的利器。',
                challenges: '过于聚焦短期目标和个人利益，可能会让你忽略长期的风险与人际的积累，从而树敌过多，影响长远发展。',
                advice: '试着在关键决策前，将眼光放得更长远一些。建立稳固的同盟，而非临时的利益组合，能让你的成功之路走得更稳。'
            },
            '严嵩': {
                advantages: '你深谙组织权力的运行规则，拥有极强的政治嗅觉和经营能力。你善于通过对关键人物的服务，来巩固自己的地位。',
                challenges: '你的权力根基完全建立在上级的宠信和庞大的关系网上，一旦失去庇护，便容易墙倒众人推。',
                advice: '在经营关系的同时，培养一些不依赖于任何人的核心专业能力。这将为你提供最稳固的底气，让你在任何风浪中都能找到立足之地。'
            },
            '裕王': {
                advantages: '你性格宽厚，善于倾听和信任专家，能营造一个令人安心的团队氛围。你不是独裁者，而是一位优秀的"守护者"与"支持者"。',
                challenges: '在需要独断专行或快速决策时，你的优柔寡断和过度依赖可能会错失良机，让团队陷入迷茫。',
                advice: '在广泛听取意见后，要有勇气做出自己的判断并承担责任。温和的领导力也需要坚定的内核。'
            },
            '杨金水': {
                advantages: '你是一个极致的"情景主义者"，为达目的可以全身心投入角色。你心思缜密，演技高超，能完成许多常人无法想象的任务。',
                challenges: '长期在高压下"扮演"另一个人，会让你身心分离，承受巨大的精神压力，游走在崩溃的边缘。',
                advice: '需要找到一个可以卸下伪装、安全做自己的空间或人。定期释放压力，是维持这台"精密仪器"长久运转的关键。'
            },
            '王用汲': {
                advantages: '你不忘初心，务实而善良。你遵守规则，同时在规则内尽可能地做好事、帮好人，是混乱局势中难得的温暖和确定性。',
                challenges: '在需要打破常规才能破局的情境下，你的守成和过于恪守本分，可能会限制你的影响力。',
                advice: '保持你的善良和务实，这是非常宝贵的品质。同时，可以试着在更大范围内思考，如何用你的方式去影响和改变不合理的"规则"。'
            },
            '高翰文': {
                advantages: '你才华横溢，心怀对"美"与"理想秩序"的追求。你的纯粹和创造力，能带来清新之风，为团队注入艺术气息。',
                challenges: '你缺乏对现实复杂性和人性幽暗面的认知，易在残酷的竞争中受挫，需要强有力的保护。',
                advice: '在坚持理想的同时，需要有意识地去理解和学习现实的"游戏规则"。这不是妥协，而是为了让你的理想能更好地落地生根。'
            },
            '冯保': {
                advantages: '你拥有极强的上进心和洞察力，善于抓住机会，懂得在何时隐忍、在何时表现。你对目标有清晰的规划。',
                challenges: '对权力的极度渴望和过程中的巨大压力，可能让你如履薄冰，心态时常在极度自信与焦虑中摇摆。',
                advice: '在向上攀登的路上，除了算计，也试着去建立一些真正稳固的、基于信任的同盟。这不仅能让你走得更稳，也能让你的内心更有支点。'
            }
        };
        
        const report = reportMap[character] || reportMap['胡宗宪'];
        return report;
    }
}
// 全局计算实例
window.calculationManager = new CalculationManager();