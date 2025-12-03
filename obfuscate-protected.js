const fs = require('fs');
const path = require('path');

console.log('🔧 保护对象属性的安全混淆脚本\n');

// 必须保护的标识符列表（包括对象属性名）
const PROTECTED_IDENTIFIERS = new Set([
  // CalculationManager核心方法
  'calculateResult', 'calculateWeatherPersonalityV2', 'calculateHollandAdapt',
  'calculateRelationshipComfort', 'calculateMingDynasty', 'calculateCareerCompass',
  'calculateSCL90', 'calculateAnimalPersonality', 'calculateSpiritualNeeds',
  
  // 其他重要方法
  'generateDetailedAnalysis', 'getSCL90Assessment', 'addScores',
  'generateSpiritualAnalysis', 'l2Normalize', 'cosineSimilarity',
  'determineCoreTemperamentV2', 'matchCityConditionV2', 'generateEmotionDescription',
  'generateHollandAnalysis', 'getDimensionName', 'getTraitDescription',
  'generateMingAnalysis', 'generateMingFullReport', 'matchCareerIdentity',
  'generateGoldenCombination', 'generateCareerAnalysis',
  
  // 全局对象和API
  'window', 'calculationManager', 'console', 'document',
  
  // 重要变量名（避免混淆）
  'score', 'totalScore', 'dimensions', 'result', 'answers', 'testData',
  'question', 'options', 'positiveItems', 'assessment', 'level',
  'description', 'suggestion', 'factorScores', 'overallAssessment',
  'detailedAnalysis', 'animal', 'similarity', 'testType', 'testId'
]);

// JavaScript保留关键字
const RESERVED_KEYWORDS = new Set([
  'class', 'constructor', 'extends', 'super', 'this', 'new',
  'function', 'return', 'if', 'else', 'switch', 'case', 'default',
  'for', 'while', 'do', 'break', 'continue', 'try', 'catch', 'finally',
  'throw', 'var', 'let', 'const', 'typeof', 'instanceof', 'in', 'of',
  'async', 'await', 'yield', 'export', 'import', 'debugger',
  'true', 'false', 'null', 'undefined', 'NaN', 'Infinity'
]);

// 分析代码，提取需要保护的变量名
function analyzeProtectedNames(code) {
  const protectedNames = new Set();
  
  // 查找对象属性定义：{ name: ..., score: ... }
  const propPattern = /['"]?(\w+)['"]?\s*:/g;
  let match;
  while ((match = propPattern.exec(code)) !== null) {
    const propName = match[1];
    // 只添加有意义的属性名（长度>1，不是数字）
    if (propName.length > 1 && !/^\d+$/.test(propName)) {
      protectedNames.add(propName);
    }
  }
  
  // 查找方法调用：this.methodName(
  const methodPattern = /\.(\w+)\s*\(/g;
  while ((match = methodPattern.exec(code)) !== null) {
    protectedNames.add(match[1]);
  }
  
  // 查找赋值语句：variableName = 
  const assignPattern = /(\w+)\s*=[^=]/g;
  while ((match = assignPattern.exec(code)) !== null) {
    const varName = match[1];
    if (varName.length > 2 && !RESERVED_KEYWORDS.has(varName)) {
      protectedNames.add(varName);
    }
  }
  
  return Array.from(protectedNames);
}

// 生成安全的混淆标识符
function generateObfuscatedName(counter) {
  const prefixes = ['a', 'b', 'c', 'x', 'y', 'z'];
  const prefix = prefixes[counter % prefixes.length];
  const num = Math.floor(counter / prefixes.length);
  return `${prefix}${num}`;
}

// 智能标识符混淆 - 只混淆局部变量
function smartObfuscate(code) {
  // 分析代码结构
  const lines = code.split('\n');
  let obfuscatedCode = code;
  const varMap = new Map();
  let counter = 0;
  
  // 第一步：识别局部变量声明
  const varDeclarations = [];
  
  // 匹配 var/let/const 声明
  const varPattern = /\b(var|let|const)\s+(\w+)\b/g;
  let match;
  while ((match = varPattern.exec(code)) !== null) {
    const varName = match[2];
    
    // 检查是否需要保护
    if (!PROTECTED_IDENTIFIERS.has(varName) && 
        !RESERVED_KEYWORDS.has(varName) &&
        varName.length > 2 &&
        !varName.startsWith('$') &&
        !varName.startsWith('_')) {
      varDeclarations.push(varName);
    }
  }
  
  // 为每个局部变量生成混淆名
  varDeclarations.forEach(varName => {
    if (!varMap.has(varName)) {
      varMap.set(varName, generateObfuscatedName(counter++));
    }
  });
  
  // 第二步：安全替换（只替换局部变量使用）
  varMap.forEach((newName, oldName) => {
    // 构建精确的正则表达式：单词边界，且前面不是点号
    const regex = new RegExp(`\\b${oldName}\\b(?![.:])`, 'g');
    obfuscatedCode = obfuscatedCode.replace(regex, newName);
  });
  
  return obfuscatedCode;
}

// 安全压缩代码
function safeCompress(code) {
  let compressed = code;
  
  // 移除注释
  compressed = compressed.replace(/\/\*[\s\S]*?\*\//g, '');
  compressed = compressed.replace(/\/\/.*/g, '');
  
  // 压缩空白
  compressed = compressed.replace(/\s+/g, ' ');
  compressed = compressed.replace(/\s*([{}();,:=])\s*/g, '$1');
  compressed = compressed.replace(/^\s+|\s+$/g, '');
  
  return compressed;
}

// 验证混淆结果
function validateResult(code) {
  const checks = [
    { name: 'class关键字', test: () => code.includes('class ') },
    { name: 'constructor', test: () => code.includes('constructor') },
    { name: 'calculateResult函数', test: () => code.includes('calculateResult') },
    { name: 'window.calculationManager', test: () => code.includes('window.calculationManager') },
    { name: 'score属性', test: () => code.includes('score:') || code.includes('"score"') || code.includes("'score'") },
    { name: 'totalScore属性', test: () => code.includes('totalScore') },
    { name: 'testType属性', test: () => code.includes('testType') }
  ];
  
  return checks;
}

// 主处理函数
function main() {
  const inputFile = 'js/calculation.js';
  const outputFile = 'js-dist/calculation.protected.js';
  
  console.log(`📄 处理文件: ${path.basename(inputFile)}`);
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 文件不存在: ${inputFile}`);
    return;
  }
  
  // 确保输出目录存在
  if (!fs.existsSync('js-dist')) {
    fs.mkdirSync('js-dist', { recursive: true });
  }
  
  // 读取原始文件
  const original = fs.readFileSync(inputFile, 'utf8');
  const originalSize = original.length;
  console.log(`📊 原始大小: ${Math.ceil(originalSize / 1024)}KB`);
  
  // 1. 智能混淆
  console.log('🔄 智能混淆...');
  let processed = smartObfuscate(original);
  
  // 2. 压缩代码
  console.log('💨 压缩代码...');
  processed = safeCompress(processed);
  
  const processedSize = processed.length;
  const compressionRatio = ((originalSize - processedSize) / originalSize * 100).toFixed(1);
  
  console.log(`📊 处理后大小: ${Math.ceil(processedSize / 1024)}KB`);
  console.log(`📊 压缩率: ${compressionRatio}%`);
  
  // 3. 验证结果
  console.log('🧪 验证结果...');
  const validationChecks = validateResult(processed);
  let allPassed = true;
  
  validationChecks.forEach(check => {
    const passed = check.test();
    allPassed = allPassed && passed;
    console.log(`   ${passed ? '✅' : '❌'} ${check.name}`);
  });
  
  if (!allPassed) {
    console.log('⚠️  警告：部分验证未通过，但继续生成文件...');
  }
  
  // 4. 写入文件
  fs.writeFileSync(outputFile, processed);
  console.log(`\n✅ 处理完成！文件已保存到: ${outputFile}`);
  
  // 显示文件开头
  console.log('\n🔍 处理后的文件开头:');
  const preview = processed.substring(0, 200);
  console.log(preview + '...');
  
  // 创建测试页面
  createTestPage(outputFile, originalSize, processedSize);
}

// 创建测试页面
function createTestPage(jsFile, originalSize, processedSize) {
  const testPage = `<!DOCTYPE html>
<html>
<head>
    <title>保护属性混淆测试</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        #testResults { margin-top: 20px; }
        .test-item { margin: 5px 0; padding: 5px; border-left: 3px solid #ddd; }
    </style>
</head>
<body>
    <h1>保护对象属性混淆测试</h1>
    <div class="info">
        <strong>文件信息:</strong><br>
        原始文件: ${Math.ceil(originalSize / 1024)}KB<br>
        混淆后: ${Math.ceil(processedSize / 1024)}KB<br>
        压缩率: ${((originalSize - processedSize) / originalSize * 100).toFixed(1)}%
    </div>
    
    <div id="status">加载JavaScript...</div>
    <div id="testResults"></div>
    
    <script src="${jsFile}"></script>
    <script>
        function runTests() {
            const results = [];
            const testResultsEl = document.getElementById('testResults');
            
            // 测试1: CalculationManager是否存在
            try {
                if (typeof calculationManager === 'undefined') {
                    results.push({ name: 'CalculationManager存在', passed: false, message: '未定义' });
                    return results;
                }
                results.push({ name: 'CalculationManager存在', passed: true });
                
                // 测试2: 核心函数
                const coreFunctions = [
                    'calculateResult',
                    'calculateSCL90', 
                    'calculateAnimalPersonality',
                    'calculateSpiritualNeeds',
                    'calculateWeatherPersonalityV2'
                ];
                
                coreFunctions.forEach(funcName => {
                    const passed = typeof calculationManager[funcName] === 'function';
                    results.push({ 
                        name: \`\${funcName}函数\`, 
                        passed,
                        message: passed ? '可用' : '不可用'
                    });
                });
                
                // 测试3: 创建一个简单的测试数据
                const testData = {
                    dimensions: {
                        anxiety: { name: '焦虑', items: [1, 2, 3] }
                    },
                    questions: [
                        { options: [{ id: 'A', score: 1 }, { id: 'B', score: 2 }] },
                        { options: [{ id: 'A', score: 1 }, { id: 'B', score: 2 }] },
                        { options: [{ id: 'A', score: 1 }, { id: 'B', score: 2 }] }
                    ]
                };
                
                // 测试4: 尝试调用calculateSCL90
                try {
                    const testResult = calculationManager.calculateSCL90(['A', 'B', 'A'], testData);
                    results.push({ 
                        name: 'calculateSCL90执行', 
                        passed: true,
                        message: '执行成功，返回: ' + (testResult.testType || '未知')
                    });
                } catch (e) {
                    results.push({ 
                        name: 'calculateSCL90执行', 
                        passed: false,
                        message: '执行错误: ' + e.message
                    });
                }
                
            } catch (error) {
                results.push({ 
                    name: '整体测试', 
                    passed: false, 
                    message: '测试过程中出错: ' + error.message 
                });
            }
            
            return results;
        }
        
        // 执行测试
        setTimeout(() => {
            const statusEl = document.getElementById('status');
            const testResults = runTests();
            
            let allPassed = true;
            let html = '<h3>测试结果:</h3>';
            
            testResults.forEach(result => {
                allPassed = allPassed && result.passed;
                html += \`<div class="test-item" style="border-color: \${result.passed ? 'green' : 'red'}">
                    \${result.passed ? '✅' : '❌'} \${result.name}
                    \${result.message ? ' - ' + result.message : ''}
                </div>\`;
            });
            
            document.getElementById('testResults').innerHTML = html;
            
            if (allPassed) {
                statusEl.innerHTML = '<span class="success">✅ 所有测试通过！代码功能正常。</span>';
                console.log('🎉 混淆测试完成，所有功能正常！');
            } else {
                statusEl.innerHTML = '<span class="error">❌ 部分测试失败。</span>';
            }
        }, 100);
    </script>
</body>
</html>`;
  
  fs.writeFileSync('test-protected-obfuscated.html', testPage);
  console.log('\n📄 测试页面已创建: test-protected-obfuscated.html');
  console.log('🌐 用浏览器打开此文件测试混淆效果');
}

// 执行主函数
main();
