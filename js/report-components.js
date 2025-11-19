function getDimensionAnalysis(key, value) {
    const analyses = {
        'DOM': value > 20 ? '较强的领导力和支配欲' : '偏好合作而非主导',
        'STR': value > 20 ? '善于策略思考和问题解决' : '更注重直觉和感性',
        'COM': value > 20 ? '社交活跃，善于沟通' : '享受独处，社交谨慎',
        'SOL': value > 20 ? '独立思考，享受孤独' : '依赖社交，害怕孤独',
        'AGI': value > 20 ? '适应力强，灵活变通' : '偏好稳定，习惯常规',
        'SEC': value > 20 ? '重视安全，守护意识强' : '敢于冒险，不惧变化',
        'AES': value > 20 ? '审美敏感，艺术倾向' : '实用主义，注重功能'
    };
    return analyses[key] || '维度特征分析';
}

// 动物展示数据 - 与UI相关的放在这里
const AnimalDisplayData = {
    "狗": { 
        emoji: "🐶", 
        desc: "你是忠诚的伙伴与热情的守护者。你的世界围绕着'我们'展开，无论是家人、朋友还是团队。你擅长建立连接，给予温暖，并在群体中找到自己的价值。你的快乐简单而纯粹，来源于陪伴与被需要。",
        color: "#ff6b6b"
    },
    "猫": { 
        emoji: "🐱", 
        desc: "你是优雅的独立思想家，神秘且自我满足。你享受独处，拥有丰富的内心世界。你行动敏捷，好奇心强，但只对自己感兴趣的事物投入精力。你的魅力在于那份若即若离的疏离感和无法预测的灵动。",
        color: "#4ecdc4"
    },
    "狼": { 
        emoji: "🐺", 
        desc: "你是天生的领袖与战略家，兼具力量与社群智慧。你既能独立思考，又能无缝地融入团队。你对目标执着，有强烈的责任感和领地意识，为了守护族群，你会展现出惊人的统御力和谋略。",
        color: "#95a5a6"
    },
    "狐": { 
        emoji: "🦊", 
        desc: "你是机敏的策略家与孤独的观察者。你拥有超凡的智慧和适应能力，擅长在复杂的环境中找到最优解。你倾向于独立行动，用敏锐的洞察力规避风险，达成目标。你的生存哲学是'智取'而非'强攻'。",
        color: "#e67e22"
    },
    "狮": { 
        emoji: "🦁", 
        desc: "你是自信的王者，天生自带光环。你有强烈的统御欲和表现力，享受成为焦点的感觉。你慷慨、富有魅力，但有时也需要独处的空间来积蓄力量。你的存在本身就是一种宣告，充满力量与威严。",
        color: "#f1c40f"
    },
    "熊": { 
        emoji: "🐻", 
        desc: "你是沉稳的守护者，强大而内敛。你大部分时间安静、平和，享受自己的节奏，但当领地或家人受到威胁时，会爆发出无与伦比的力量。你重视安全感，喜欢为自己和亲近的人建立一个舒适、安全的庇护所。",
        color: "#8b4513"
    },
    "兔": { 
        emoji: "🐰", 
        desc: "你是警觉的和平主义者，敏捷且富有同情心。你极度需要安全感，对环境变化非常敏感。你行动迅速，擅长躲避冲突。虽然有时会显得胆小，但你在熟悉和安全的小圈子里，会展现出活泼、温和的一面。",
        color: "#f8a5c2"
    },
    "仓鼠": { 
        emoji: "🐹", 
        desc: "你是专注的囤积者与安逸的生活家。你最大的幸福来自于建立一个充满安全感的'小窝'。你喜欢收集和整理，无论是物质还是信息。你享受在自己的小世界里自得其乐，对外界的纷扰保持着一种可爱的迟钝。",
        color: "#f39c12"
    },
    "天鹅": { 
        emoji: "🦢", 
        desc: "你是优雅的理想主义者，对美有着极致的追求。你姿态高贵，带有一种天生的距离感，但内心深处对伴侣和家庭极为忠诚。你的世界里，精神的契合与外在的和谐同样重要，绝不容忍粗俗与将就。",
        color: "#ffffff"
    },
    "鹿": { 
        emoji: "🦌", 
        desc: "你是温和的自然之子，敏感而优雅。你对美和宁静有着天生的向往，常常沉浸在自己的精神世界里。你警惕性高，需要安全的环境才能放松。你的美在于那份不染尘埃的纯净和与自然融为一体的灵性。",
        color: "#cd853f"
    },
    "鹰": { 
        emoji: "🦅", 
        desc: "你是高傲的远见者，拥有无与伦比的视野和决心。你习惯于从高处审视全局，制定长远的目标。你享受孤独，因为那能让你看得更清。你的力量不仅在于捕猎的利爪，更在于那份凌驾于一切之上的独立意志和宏大格局。",
        color: "#34495e"
    },
    "乌鸦": { 
        emoji: "🐦‍⬛", 
        desc: "你是聪慧的谜题解决者与信息的传递者。你拥有极高的智商和好奇心，善于观察、学习和使用工具。你具有复杂的社会结构，擅长合作与沟通。在别人看来，你或许有些神秘甚至不祥，但这正是你智慧的保护色。",
        color: "#2c3e50"
    },
    "水豚": { 
        emoji: "🦫", 
        desc: "你是随和的社交大师，情绪稳定，万物皆可为友。你的存在本身就能给周围带来平静与和谐。你享受社群生活，但从不强求，用一种'佛系'的态度接纳一切。你的哲学是：放轻松，没什么大不了的。",
        color: "#7f8c8d"
    },
    "鲸": { 
        emoji: "🐋", 
        desc: "你是深海的哲学家，古老而智慧。你承载着厚重的记忆，用深沉的歌声在广阔的社群中交流。你既能融入庞大的集体，又保持着个体的深邃孤独。你的内心像海洋一样，平静时包容万物，翻涌时充满力量。",
        color: "#3498db"
    },
    "鹦鹉": { 
        emoji: "🦜", 
        desc: "你是聪明的社交达人与天生的表演家。你热爱互动，擅长模仿和学习，是群体中的'开心果'和信息中心。你活泼好动，充满好奇心，总能给平淡的生活增添色彩和戏剧性。你的智慧体现在与他人的互动和交流中。",
        color: "#2ecc71"
    },
    "章鱼": { 
        emoji: "🐙", 
        desc: "你是深海的智者与伪装大师。你拥有惊人的智慧和解决问题的能力，身体的每一次变形都是一次策略的展现。你习惯于独立思考和行动，在复杂环境中展现出极强的适应性和创造力。你是真正的'多面手'。",
        color: "#9b59b6"
    },
    "鲨鱼": { 
        emoji: "🦈", 
        desc: "你是高效的目标追逐者，专注、直接、充满力量。你一旦锁定目标，便会心无旁骛地前进。你习惯独来独往，不需要复杂的社交关系。你的生存法则简单而纯粹：不断前进，永不停止。",
        color: "#95a5a6"
    },
    "海豚": { 
        emoji: "🐬", 
        desc: "你是智慧的嬉戏者与团队合作的典范。你拥有高度发达的大脑和复杂的社会行为，擅长通过合作解决问题。你充满玩乐精神，将生活视为一场有趣的游戏。你的快乐来源于与同伴的协作和探索世界的无穷乐趣。",
        color: "#1abc9c"
    },
    "浣熊": { 
        emoji: "🦝", 
        desc: "你是机灵的都市探险家，总能找到解决问题的'歪路子'。你好奇心极强，动手能力超群，为了达成目的可以不择手段（通常是为了吃的）。你非常灵活，总能在人类制定的规则中找到自己的生存空间。",
        color: "#795548"
    },
    "猫鼬": { 
        emoji: "🦨", 
        desc: "你是警惕的哨兵与家庭的守护者。你对集体有着极强的归属感和责任心，时刻为家人的安全站岗放哨。你们的生存依赖于高效的团队协作和分工。你的勇敢不是为了个人，而是为了整个族群的安危。",
        color: "#8d6e63"
    }
};

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

    'standard-header': {
        render: (data, config) => `
            <section class="result-header">
                <div class="result-title">测试完成</div>
                <div class="result-content">
                    <div class="score-number">${data.score || 0}</div>
                    <div class="score-label">总分</div>
                </div>
            </section>
        `
    },

    'animal-header': {
        render: (data, config) => {
            const animalData = AnimalDisplayData[data.animal] || {};
            const headerColor = '#8E8E93'; // 中性灰
            
            return `
                <section class="result-header" style="background: linear-gradient(135deg, ${headerColor}, #AEAEB2); padding: 25px 15px; height: 180px;">
                    <div class="result-content">
                        <div class="animal-emoji" style="font-size: 50px; margin-bottom: 8px;">${animalData.emoji || '🐾'}</div>
                        <div class="result-label" style="margin-bottom: 5px;">你的灵魂动物是</div>
                        <div class="result-text" style="font-size: 24px;">${data.animal || '未知'}</div>
                    </div>
                </section>
            `;
        }
    },

    'professional-header': {
        render: (data, config) => `
            <section class="result-header" style="padding: 20px;">
                <div class="result-title" style="margin-bottom: 10px; font-size: 18px; font-weight: bold;">测评报告</div>
                <div class="result-content">
                    <div class="score-number" style="font-size: 48px;">${data.score || 0}</div>
                    <div class="score-label" style="color: white; opacity: 0.9;">总分</div>
                </div>
            </section>
        `
    },

    // 详细分析组件
    'detailed-analysis': {
        render: (data, config) => {
            if (data.detailedAnalysis) {
                return `
                    <section class="analysis-section">
                        <h3>结果分析</h3>
                        <div class="analysis-content">
                            <p>${data.detailedAnalysis}</p>
                        </div>
                    </section>
                `;
            }
            return '';
        }
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
            <section class="analysis-section">
                <h3>核心临床指标</h3>
                <div class="score-details">
                    <div class="score-item">
                        <span class="score-label" style="color: #666;">总分</span>
                        <span class="score-value">${data.totalScore || 0}</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label" style="color: #666;">阳性项目数</span>
                        <span class="score-value">${data.positiveItems || 0}</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label" style="color: #666;">阳性症状均分</span>
                        <span class="score-value">${data.positiveAverage ? data.positiveAverage.toFixed(2) : '0.00'}</span>
                    </div>
                </div>
            </section>
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
                <section class="analysis-section">
                    <h3>各维度详细分析</h3>
                    <div class="clinical-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>维度</th>
                                    <th>因子分</th>
                                    <th>总分</th>
                                    <th>状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${dimensions.map(dim => `
                                    <tr class="${dim.isHigh ? 'abnormal' : 'normal'}">
                                        <td>${dim.name}</td>
                                        <td>${dim.averageScore ? dim.averageScore.toFixed(2) : '0.00'}</td>
                                        <td>${dim.totalScore || dim.rawScore || 0}</td>
                                        <td>${dim.isHigh ? '⚠️ 异常' : '✅ 正常'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </section>
            `;
        }
    },

    // === 动物人格测试专用组件 ===
    'animal-similarity': {
        render: (data, config) => {
            return `
                <section class="analysis-section">
                    <h3>匹配度分析</h3>
                    <div class="score-display">
                        <div class="score-circle" style="background: linear-gradient(135deg, #8E8E93, #AEAEB2); border: 3px solid #F0F0F0;">
                            ${data.score || 0}%
                        </div>
                        <div class="score-label">与 ${data.animal} 的契合度</div>
                        <div class="similarity-desc" style="margin-top: 10px; color: #666; font-size: 14px;">
                            百分比反映了你的性格特质与 ${data.animal} 原型的相似程度
                        </div>
                    </div>
                </section>
            `;
        }
    },

    'animal-description': {
        render: (data, config) => {
            const animalData = AnimalDisplayData[data.animal] || {};
            
            return `
                <section class="analysis-section">
                    <h3>🐾 动物解读</h3>
                    <div class="analysis-content">
                        <p style="font-size: 16px; line-height: 1.8; text-align: justify; color: #333;">
                            ${animalData.desc || '暂无描述信息'}
                        </p>
                    </div>
                </section>
            `;
        }
    },

    'animal-dimensions': {
        render: (data, config) => {
            const dimensionConfigs = {
                'DOM': { max: 36, name: '支配性', desc: '领导力与掌控欲' },
                'STR': { max: 32, name: '策略性', desc: '智慧与谋略' },
                'COM': { max: 28, name: '社交性', desc: '亲和力与沟通' },
                'SOL': { max: 32, name: '孤独性', desc: '独立与内省' },
                'AGI': { max: 30, name: '灵活性', desc: '适应与变通' },
                'SEC': { max: 34, name: '安全性', desc: '稳定与守护' },
                'AES': { max: 24, name: '审美性', desc: '艺术与美感' }
            };
            
            // 获取维度等级
            const getDimensionLevel = (percentage) => {
                if (percentage >= 80) return 'high';
                if (percentage >= 60) return 'medium-high';
                if (percentage >= 40) return 'medium';
                if (percentage >= 20) return 'low';
                return 'very-low';
            };
            
            // 获取等级文本
            const getLevelText = (level) => {
                const levels = {
                    'high': '高',
                    'medium-high': '中高', 
                    'medium': '中等',
                    'low': '低',
                    'very-low': '很低'
                };
                return levels[level] || '中等';
            };
            
            // 获取详细分析
            const getDetailedDimensionAnalysis = (key, value, percentage) => {
                const analyses = {
                    'DOM': {
                        high: '你具有很强的领导潜质和决策能力，在群体中往往扮演主导角色，善于掌控局面并推动事情发展。',
                        'medium-high': '你具备良好的领导能力，能够在需要时承担领导责任，但也会尊重他人意见。',
                        medium: '你在领导力方面表现均衡，既不过分强势也不过分被动，善于团队协作。',
                        low: '你更倾向于合作而非主导，享受团队协作的过程，愿意跟随有能力的领导者。',
                        'very-low': '你偏好跟随而非领导，在团队中通常扮演支持角色，避免承担领导责任。'
                    },
                    'STR': {
                        high: '你拥有出色的策略思维和问题解决能力，善于制定长远计划并预见潜在问题。',
                        'medium-high': '你具备良好的分析能力和策略思维，能够有效解决复杂问题并制定合理计划。',
                        medium: '你在策略思考方面表现均衡，能够应对大多数日常情况，具备基本的问题解决能力。',
                        low: '你更注重直觉和感性，策略思维相对保守，倾向于简单直接的解决方案。',
                        'very-low': '你倾向于简单直接的解决方案，避免复杂策略思考，更相信直觉和运气。'
                    },
                    'COM': {
                        high: '你拥有卓越的社交能力和沟通技巧，善于建立广泛的人际关系网络，是人群中的焦点。',
                        'medium-high': '你具备良好的社交能力，能够轻松与人建立联系，在社交场合中游刃有余。',
                        medium: '你在社交方面表现均衡，能够维持稳定的社交圈，在需要时展现良好的沟通能力。',
                        low: '你的社交圈相对较小但质量很高，更注重深度关系而非广泛社交。',
                        'very-low': '你倾向于小范围深度社交或独处，在大型社交场合可能感到不适。'
                    },
                    'SOL': {
                        high: '你非常享受独处时光，拥有丰富的内心世界，独立思考能力强且不依赖外部认可。',
                        'medium-high': '你具备较强的独立能力，经常需要独处时间来充电和思考，享受个人空间。',
                        medium: '你在独处和社交间保持良好平衡，既能享受群体活动，也需要适当的个人时间。',
                        low: '你更倾向于群体活动，享受与他人相处的时光，独处时间相对较少。',
                        'very-low': '你非常依赖社交环境，很少感到需要独处，在群体中才能获得能量。'
                    },
                    'AGI': {
                        high: '你具有极强的适应能力和灵活性，能够快速适应环境变化并找到最优解决方案。',
                        'medium-high': '你具备良好的适应能力，面对变化时能够保持冷静并快速调整策略。',
                        medium: '你在适应性方面表现稳定，能够应对大多数变化，但需要一定时间来完全适应。',
                        low: '你偏好稳定和可预测的环境，面对变化时需要更多时间来适应和调整。',
                        'very-low': '你非常依赖固定模式和熟悉环境，面对变化时容易感到焦虑和不适。'
                    },
                    'SEC': {
                        high: '你具有强烈的安全意识和守护本能，非常重视稳定性和可预测性，善于建立安全环境。',
                        'medium-high': '你具备良好的安全意识，重视稳定和秩序，但也能在必要时接受适度风险。',
                        medium: '你在安全需求方面表现均衡，既重视稳定性也愿意在可控范围内尝试新事物。',
                        low: '你对安全性的需求相对较低，更愿意尝试新事物和接受挑战，不太担心风险。',
                        'very-low': '你非常喜欢冒险和变化，对安全稳定的需求很低，享受不确定性和新鲜感。'
                    },
                    'AES': {
                        high: '你具有极高的审美敏感度和艺术感知力，对美有独到见解，善于发现和创造美。',
                        'medium-high': '你具备良好的审美能力，对艺术和美有较强感知，重视生活品质和美感。',
                        medium: '你在审美方面表现均衡，能够欣赏美的事物，但不会过度追求艺术表达。',
                        low: '你对美的感知相对实用主义，更注重功能性而非纯粹的美学价值。',
                        'very-low': '你非常注重实用性，对艺术和美学的兴趣较低，更关注事物的实际功能。'
                    }
                };
                
                const dimAnalysis = analyses[key] || analyses['DOM'];
                return dimAnalysis[getDimensionLevel(percentage)] || '该维度表现均衡';
            };

            let html = `
                <section class="analysis-section">
                    <h3>📊 人格维度分析</h3>
                    <div class="dimensions-detail">
            `;
            
            Object.entries(data.dimensions || {}).forEach(([key, value]) => {
                const dimConfig = dimensionConfigs[key];
                if (!dimConfig) return;
                
                const percentage = Math.min(100, (value / dimConfig.max) * 100);
                const level = getDimensionLevel(percentage);
                const levelText = getLevelText(level);
                
                html += `
                    <div class="dimension-card ${level}">
                        <div class="dimension-header">
                            <div class="dimension-title">
                                <h4>${dimConfig.name}</h4>
                                <span class="dimension-desc">${dimConfig.desc}</span>
                            </div>
                            <div class="dimension-score-display">
                                <span class="score">${value}<small>/${dimConfig.max}</small></span>
                                <span class="level-badge ${level}">${levelText}</span>
                            </div>
                        </div>
                        
                        <div class="dimension-analysis">
                            ${getDetailedDimensionAnalysis(key, value, percentage)}
                        </div>
                    </div>
                `;
            });
            
            html += `</div></section>`;
            return html;
        }
    },

    // === 图表组件 ===
    'dimension-radar': {
        render: (data, config) => `
            <div class="radar-chart-container">
                <canvas id="radarChart" width="270" height="270"></canvas>
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

    // 新增指标解读组件
    'factor-interpretation': {
        render: (data, config) => {
            const dimensions = data.dimensions || [];
            
            // 维度解释文案
            const dimensionInterpretations = {
                '躯体化': '主要反映身体不适感，包括心血管、胃肠道、呼吸和其他系统的不适，和头痛、背痛、肌肉酸痛，焦虑等躯体不适表现。该分量表得分在12-60分之间。36分以上表明个体在身体上有较明显的不适感，24分以下躯体症状表现不明显。',
                '强迫症状': '主要指那些明知没有必要，但又无法摆脱的无意义的思想、冲动和行为，还有一些比较一般的认知障碍的行为征象也在这一因子中反映。该分量表得分在10-50分之间。得分在30分以上，强迫症状较明显。20分以下强迫症状不明显。',
                '人际敏感': '主要是指某些人际的不自在与自卑感，以及人际交流中的不良自我暗示，消极的期待等是这方面症状的典型原因。该分量表得分在9-45分之间。得分在27分以上表明个体人际关系较为敏感，人际交往中自卑感较强，并伴有行为症状（如坐立不安，退缩等）。18分以下表明个体在人际关系上较为正常。',
                '抑郁': '苦闷的情感与心境为代表性症状，还以生活兴趣的减退，动力缺乏，活力丧失等为特征。还表现出失望、悲观以及与抑郁相联系的认知和躯体方面的感受。该分量表得分在13-65分之间。得分在39分以上表明个体的抑郁程度较强，生活缺乏足够的兴趣，缺乏运动活力，极端情况下可能会有自杀的观念。26分以下表明个体抑郁程度较弱，生活态度乐观积极，充满活力，心境愉快。',
                '焦虑': '一般指那些烦躁，坐立不安，神经过敏，紧张以及由此产生的躯体征象如震颤等。该分量表得分在10-50分之间。得分在30分以上表明个体较易焦虑，易表现出烦躁、不安静和神经过敏，极端时可能导致惊恐发作。20分以下表明个体不易焦虑，易表现出安定的状态。',
                '敌对': '主要从三方面来反映敌对的表现：思想、感情及行为。其项目包括厌烦的感觉，摔物，争论直到不可控制的脾气暴发等各方面。该分量表得分在6-30分之间。得分在18分以上表明个体易表现出敌对的思想、情感和行为。12分以下表明个体容易表现出友好的思想、情感和行为，脾气温和无破坏行为。',
                '恐怖': '害怕的对象包括出门旅行，空旷场地，人群或公共场所和交通工具。此外，还有社交恐怖。该分量表得分在7-35分之间。得分在21分以上表明个体恐怖症状较为明显，常表现出社交、广场和人群恐惧，14分以下表明个体的恐怖症状不明显，能正常交往和活动。',
                '偏执': '主要指投射性思维，敌对，猜疑，妄想，被动体验和夸大等。该分量表的得分在6-30分之间。得分在18分以上，表明个体的偏执症状明显，较易猜疑和敌对，得分在12分以下，表明个体的偏执症状不明显，个体思维越不易走极端。',
                '精神病性': '反映各式各样的急性症状和行为，即限定不严的精神病性过程的症状表现。该分量表得分在10-50分之间。得分在30分以上表明个体的精神病性症状较为明显，20分以下表明个体的精神病性症状不明显。',
                '其他': '包含一些无法归入前面9个因子的7个项目，主要反映睡眠及饮食情况。得分在21分以上表明个体可能存在睡眠障碍（入睡困难、多梦、易醒等）、饮食不规律或食欲异常（如食欲不振、暴饮暴食等）。14分以下表明个体无明显不适。'
            };
            
            return `
                <section class="analysis-section">
                    <h3>指标解读</h3>
                    <div class="factor-interpretation-list">
                        ${dimensions.map(dim => `
                            <div class="factor-item ${dim.isHigh ? 'high-factor' : ''}">
                                <div class="factor-header">
                                    <div class="factor-name">${dim.name}</div>
                                    <div class="factor-score">${dim.totalScore || dim.rawScore || 0}</div>
                                    <div class="factor-assessment ${dim.isHigh ? 'high' : 'normal'}">
                                        ${dim.isHigh ? '需关注' : '正常'}
                                    </div>
                                </div>
                                <div class="factor-interpretation">
                                    ${dimensionInterpretations[dim.name] || '暂无详细解释。'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
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
            const summary = data.overallAssessment || {};
            const highDimensions = (data.dimensions || []).filter(dim => dim.isHigh);
            
            const adviceItems = [];
            
            if (summary.suggestion) {
                adviceItems.push(summary.suggestion);
            }
            
            if (highDimensions.length > 0) {
                adviceItems.push(`重点关注维度：${highDimensions.map(dim => dim.name).join('、')}`);
            }
            
            if (summary.factorSuggestion) {
                adviceItems.push(summary.factorSuggestion);
            }
            
            adviceItems.push('本测试结果仅供参考，不能替代专业医疗诊断。如有需要，请咨询专业心理医生或精神科医生。');
            
            return `
                <div class="professional-advice">
                    <div class="advice-title">专业总结</div>
                    <ul class="advice-list">
                        ${adviceItems.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    },

    // 动物测试报告建议
    'animal-summary': {
        render: (data, config) => {
            const getOverallAdvice = (dimensions) => {
                if (!dimensions || typeof dimensions !== 'object') {
                    return '<div class="professional-advice"><div class="advice-title">综合建议</div><ul class="advice-list"><li>🌟 基于你的动物人格特征，在适合的环境中发挥个人优势</li><li>📈 关注各维度的平衡发展，持续个人成长</li></ul></div>';
                }
                
                // 分析各维度表现 - 修复数据格式问题
                const dimensionConfigs = {
                    'DOM': 36, 'STR': 32, 'COM': 28, 'SOL': 32, 
                    'AGI': 30, 'SEC': 34, 'AES': 24
                };
                
                const dimensionScores = Object.entries(dimensions).map(([key, value]) => {
                    const maxScore = dimensionConfigs[key] || 30;
                    const percentage = value / maxScore;
                    return {
                        key,
                        value,
                        percentage: percentage,
                        level: percentage >= 0.8 ? 'high' : 
                            percentage >= 0.6 ? 'medium-high' :
                            percentage >= 0.4 ? 'medium' :
                            percentage >= 0.2 ? 'low' : 'very-low'
                    };
                });

                const highDimensions = dimensionScores.filter(d => d.level === 'high' || d.level === 'medium-high');
                const lowDimensions = dimensionScores.filter(d => d.level === 'low' || d.level === 'very-low');

                let advice = '<div class="professional-advice"><div class="advice-title">综合建议</div><ul class="advice-list">';
                
                // 基于优势维度给出建议
                const hasHighDOM = highDimensions.some(d => d.key === 'DOM');
                const hasHighSTR = highDimensions.some(d => d.key === 'STR');
                const hasHighCOM = highDimensions.some(d => d.key === 'COM');
                const hasHighAGI = highDimensions.some(d => d.key === 'AGI');
                const hasHighAES = highDimensions.some(d => d.key === 'AES');
                const hasHighSOL = highDimensions.some(d => d.key === 'SOL');
                const hasHighSEC = highDimensions.some(d => d.key === 'SEC');
                
                if (hasHighDOM && hasHighSTR) {
                    advice += '<li>🎯 <strong>领导战略型</strong>：你具备优秀的领导力和战略思维，适合承担管理或决策角色</li>';
                }
                
                if (hasHighCOM && hasHighAGI) {
                    advice += '<li>🤝 <strong>社交适应型</strong>：你的社交能力和适应力突出，善于在不同环境中建立关系</li>';
                }
                
                if (hasHighAES && hasHighSOL) {
                    advice += '<li>🎨 <strong>艺术创造型</strong>：你具有强烈的审美感知和独立思考能力，适合创意领域</li>';
                }
                
                if (hasHighSEC && hasHighSTR) {
                    advice += '<li>🛡️ <strong>稳健策划型</strong>：你的安全意识和策略思维结合，适合需要规划的工作</li>';
                }
                
                // 基于待发展维度给出建议
                if (lowDimensions.some(d => d.key === 'SOL')) {
                    advice += '<li>🌱 <strong>培养独处能力</strong>：适当安排独处时间，有助于深度思考和自我认知</li>';
                }
                
                if (lowDimensions.some(d => d.key === 'AGI')) {
                    advice += '<li>🔄 <strong>提升适应能力</strong>：多接触新环境，提升应对变化的能力</li>';
                }
                
                if (lowDimensions.some(d => d.key === 'COM')) {
                    advice += '<li>💬 <strong>拓展社交圈</strong>：逐步建立更广泛的人际网络</li>';
                }
                
                if (lowDimensions.some(d => d.key === 'AES')) {
                    advice += '<li>✨ <strong>培养审美感知</strong>：多接触艺术和自然美景</li>';
                }
                
                // 通用建议
                if (advice === '<div class="professional-advice"><div class="advice-title">综合建议</div><ul class="advice-list">') {
                    advice += '<li>🌟 基于你的动物人格特征，在适合的环境中发挥个人优势</li>';
                    advice += '<li>📈 关注各维度的平衡发展，持续个人成长</li>';
                }
                
                advice += '</ul></div>';
                
                return advice;
            };

            return getOverallAdvice(data.dimensions);
        }
    },

    // 精神需求测试专用组件
    'spiritual-header': {
        render: (data, config) => {
            const topDim = data.topDimensions[0];
            const headerColor = '#1ABC9C'; // 协调的蓝绿色
            
            return `
                <section class="result-header" style="background: linear-gradient(135deg, ${headerColor}, #16A085); padding: 25px 15px; height: 160px;">
                    <div class="result-content">
                        <div class="result-label" style="margin-bottom: 8px;">你的核心精神需求</div>
                        <div class="result-text" style="font-size: 26px;">${topDim.name}</div>
                        <div class="score-label" style="color: white; opacity: 0.9; margin-top: 5px;">综合匹配度 ${data.score}%</div>
                    </div>
                </section>
            `;
        }
    },

    'spiritual-horizontal-bars': {
        render: (data, config) => {
            // 按分数排序
            const sortedDimensions = [...data.dimensions].sort((a, b) => b.score - a.score);
            
            // 统一的渐变色方案
            const getBarColor = (score) => {
                if (score >= 80) return '#667eea';
                if (score >= 60) return '#5a67d8';
                if (score >= 40) return '#4c51bf';
                return '#718096';
            };
            
            return `
                <section class="analysis-section">
                    <h3>10大精神维度分析</h3>
                    <div class="horizontal-bars-container">
                        ${sortedDimensions.map(dim => `
                            <div class="bar-item">
                                <div class="bar-info">
                                    <span class="bar-label">${dim.name}</span>
                                    <span class="bar-score">${Math.round(dim.score)}%</span> <!-- 确保整数 -->
                                </div>
                                <div class="bar-track">
                                    <div class="bar-fill" style="width: ${Math.round(dim.score)}%; background: ${getBarColor(dim.score)};"></div> <!-- 确保整数 -->
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }
    },

    'spiritual-detailed-analysis': {
        render: (data, config) => {
            const sortedDimensions = [...data.dimensions].sort((a, b) => b.score - a.score);
            
            return `
                <section class="analysis-section">
                    <h3>深度解读</h3>
                    <div class="dimensions-analysis">
                        ${sortedDimensions.map(dim => `
                            <div class="dimension-analysis-item">
                                <div class="dimension-header">
                                    <h4 class="dimension-title">${dim.name} (${Math.round(dim.score)}%)</h4> <!-- 确保整数 -->
                                </div>
                                <div class="dimension-content">
                                    <p><strong>含义：</strong>${dim.description}</p>
                                    <p><strong>你的表现：</strong>${dim.interpretation}</p>
                                    <div class="suggestions-box">
                                        <strong>针对性建议：</strong>
                                        <div class="suggestion-list">
                                            ${ReportComponents.getDimensionSuggestions(dim.code, dim.score).map(suggestion => 
                                                `<div class="suggestion-item">${suggestion}</div>`
                                            ).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }
    },

    getDimensionSuggestions: function(dimensionCode, score) {
        const suggestionsMap = {
            'A': { // 意义
                high: [
                    '寻找能体现你价值观的事业或使命',
                    '定期反思生活的意义和方向',
                    '参与有社会价值的工作或志愿活动',
                    '建立个人使命宣言'
                ],
                low: [
                    '尝试从日常小事中发现意义',
                    '思考什么对你真正重要',
                    '设定个人成长目标',
                    '寻找能激发热情的活动'
                ]
            },
            'B': { // 爱
                high: [
                    '投入时间培养深度关系',
                    '学习表达和接受爱与关怀',
                    '建立健康的依恋模式',
                    '在亲密关系中保持真诚沟通'
                ],
                low: [
                    '尝试向信任的人敞开心扉',
                    '练习表达情感和关心',
                    '参与社交活动建立连接',
                    '学习情感沟通技巧'
                ]
            },
            'C': { // 连接
                high: [
                    '积极参与社区或团体活动',
                    '建立广泛的社交网络',
                    '寻找志同道合的伙伴',
                    '参与集体项目或活动'
                ],
                low: [
                    '尝试参加小型社交活动',
                    '寻找共同兴趣的小组',
                    '练习主动与人交流',
                    '从一对一的关系开始建立'
                ]
            },
            'D': { // 成长
                high: [
                    '设定具体的学习目标',
                    '持续挑战自我能力边界',
                    '寻找导师或学习伙伴',
                    '定期反思个人进步'
                ],
                low: [
                    '从小目标开始培养学习习惯',
                    '尝试新的兴趣爱好',
                    '寻找激发好奇心的领域',
                    '记录个人成长历程'
                ]
            },
            'E': { // 创造
                high: [
                    '建立固定的创作时间',
                    '尝试不同的艺术表达形式',
                    '将想法转化为具体作品',
                    '分享创作过程和成果'
                ],
                low: [
                    '从简单的创作活动开始',
                    '培养观察和想象力',
                    '尝试手工或DIY项目',
                    '记录灵感和想法'
                ]
            },
            'F': { // 权力
                high: [
                    '寻找能发挥领导力的机会',
                    '学习决策和影响力技巧',
                    '在团队中主动承担责任',
                    '注意平衡权力欲与他人需求'
                ],
                low: [
                    '练习在小范围内做决定',
                    '学习表达自己的观点',
                    '尝试组织小型活动',
                    '培养自信心和决断力'
                ]
            },
            'G': { // 乐趣
                high: [
                    '保持对生活的幽默感',
                    '培养多样化的兴趣爱好',
                    '创造轻松愉快的生活环境',
                    '与有趣的人交往'
                ],
                low: [
                    '尝试新的娱乐活动',
                    '学习放松和享受当下',
                    '寻找能带来快乐的小事',
                    '培养幽默感和玩乐心态'
                ]
            },
            'H': { // 安全感
                high: [
                    '建立稳定的生活节奏',
                    '制定应对风险的预案',
                    '培养应对变化的能力',
                    '在稳定中寻找适度挑战'
                ],
                low: [
                    '学习基本的风险管理',
                    '建立紧急备用计划',
                    '培养适应变化的心态',
                    '在安全范围内尝试新事物'
                ]
            },
            'I': { // 自由
                high: [
                    '创造自主决策的空间',
                    '学习时间管理和自律',
                    '在关系中保持个人边界',
                    '平衡自由与责任'
                ],
                low: [
                    '练习在小事上自己做决定',
                    '培养独立思考能力',
                    '学习设定个人边界',
                    '尝试新的体验和选择'
                ]
            },
            'J': { // 贡献
                high: [
                    '参与志愿服务或公益活动',
                    '在工作中寻找服务他人的机会',
                    '分享知识和经验帮助他人',
                    '关注社会问题并采取行动'
                ],
                low: [
                    '从小范围的帮助开始',
                    '关注身边人的需求',
                    '培养同理心和关怀',
                    '参与社区服务活动'
                ]
            }
        };
        
        const level = score > 50 ? 'high' : 'low';
        return suggestionsMap[dimensionCode]?.[level] || [
            '基于你的得分情况，建议关注这方面的平衡发展',
            '尝试相关的新活动和体验',
            '设定小目标逐步培养兴趣'
        ];
    },

    'spiritual-summary': {
        render: (data, config) => {
            const topDimensions = data.topDimensions.slice(0, 3);
            const lowDimensions = data.dimensions.filter(dim => dim.score < 40).slice(0, 2);
            
            return `
                <section class="analysis-section">
                    <h3>总结与建议</h3>
                    <div class="summary-content">
                        <div class="summary-point">
                            <strong>核心优势：</strong>你在${topDimensions.map(dim => dim.name).join('、')}方面表现突出，
                            这构成了你精神世界的主要驱动力。
                        </div>
                        
                        ${lowDimensions.length > 0 ? `
                        <div class="summary-point">
                            <strong>发展建议：</strong>可以关注${lowDimensions.map(dim => dim.name).join('和')}方面的平衡发展，
                            以获得更全面的精神满足。
                        </div>
                        ` : ''}
                        
                        <div class="summary-point">
                            <strong>行动指引：</strong>基于你的精神需求特征，建议在生活中创造更多能够满足
                            ${topDimensions[0].name}和${topDimensions[1].name}需求的机会。
                        </div>
                        
                        <div class="professional-note">
                            *本测试结果基于你的答题情况生成，反映了当前阶段的精神需求倾向，会随着个人成长而发生变化。
                        </div>
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

        /* 动物测试专用样式 */
        .animal-emoji {
            font-size: 60px;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .similarity-desc {
            margin-top: 10px;
            color: #666;
            font-size: 14px;
            text-align: center;
        }
        
        .dimension-desc {
            font-size: 12px;
            color: #666;
            margin-top: 2px;
        }

        /* 横向柱状图样式 */
        .horizontal-bars-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin: 20px 0;
        }

        .bar-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .bar-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }

        .bar-label {
            font-size: 14px;
            font-weight: 500;
            color: #333;
            flex-shrink: 0;
        }

        .bar-score {
            font-weight: bold;
            color: #333;
            font-size: 14px;
            flex-shrink: 0;
        }

        .bar-track {
            width: 100%;
            height: 20px;
            background: #f0f0f0;
            border-radius: 10px;
            position: relative;
            overflow: hidden;
        }

        .bar-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 1s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* 深度解读优化样式 */
        .dimensions-analysis {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .dimension-analysis-item {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
        }

        .dimension-header {
            margin-bottom: 12px;
        }

        .dimension-title {
            text-align: left;
            margin: 0;
            color: #333;
            font-size: 16px;
            font-weight: 600;
        }

        .dimension-content {
            line-height: 1.6;
        }

        .dimension-content p {
            margin: 8px 0;
            color: #555;
        }

        .suggestions-box {
            margin-top: 12px;
            padding: 12px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .suggestions-box strong {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-size: 14px;
        }

        .suggestion-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .suggestion-item {
            padding: 6px 0;
            color: #555;
            line-height: 1.5;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
        }

        .suggestion-item:last-child {
            border-bottom: none;
        }        

        /* 总结区块样式 */
        .summary-content {
            line-height: 1.8;
        }

        .summary-point {
            margin: 15px 0;
            padding: 0;
            background: none;
        }

        .professional-note {
            font-size: 12px;
            color: #666;
            font-style: italic;
            margin-top: 20px;
            text-align: center;
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

            .bar-info {
                flex-direction: row;
            }
            
            .bar-label {
                font-size: 13px;
            }
            
            .bar-score {
                font-size: 13px;
            }
            
            .bar-track {
                height: 16px;
            }
            
            .dimension-title {
                font-size: 15px;
            }
            
            .suggestion-item {
                font-size: 13px;
                padding: 4px 0;
            }
        }

        @media (max-width: 375px) {
            .bar-info {
                flex-direction: row;
                align-items: center;
            }
            
            .bar-label {
                width: auto;
                margin-right: 10px;
            }
            
            .dimension-analysis-item {
                padding: 12px;
            }
        }
    `;
    document.head.appendChild(style);
}