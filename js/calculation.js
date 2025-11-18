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
            case '6':
                return this.calculateSCL90(answers, testData);
            case '7':
                return this.calculateAnimalPersonality(answers);
            case '8': // 新增精神需求测试
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
     * 未来可以在这里添加其他测评的计分方法
     * 例如：
     * calculateTest8(answers, testData) { ... }
     * calculateTest9(answers, testData) { ... }
     */
}

// 全局计算实例
window.calculationManager = new CalculationManager();