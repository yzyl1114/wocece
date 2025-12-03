const fs = require('fs');
const path = require('path');

console.log('🔐 完整正确混淆脚本\n');

// 完全正确的混淆函数
function completeObfuscate(code) {
  // 第一步：识别并保护所有不应该被混淆的内容
  const protected = new Set();
  
  // 1. 保护对象属性名（所有冒号前的单词）
  const propMatches = code.match(/(['"]?)(\w+)(['"]?)\s*:/g) || [];
  propMatches.forEach(match => {
    const propName = match.replace(/['"]?\s*:/g, '').replace(/['"]/g, '');
    if (propName.length > 1) protected.add(propName);
  });
  
  // 2. 保护方法名（点号后的单词）
  const methodMatches = code.match(/\.(\w+)\s*\(/g) || [];
  methodMatches.forEach(match => {
    const methodName = match.replace(/^\./, '').replace(/\s*\($/, '');
    protected.add(methodName);
  });
  
  // 3. 保护全局常量（全大写或特定名称）
  const constMatches = code.match(/\b(const|let|var)\s+([A-Z_][A-Z0-9_]+)\b/g) || [];
  constMatches.forEach(match => {
    const constName = match.split(/\s+/)[1];
    protected.add(constName);
  });
  
  // 4. 保护特定已知变量（从错误分析中得到）
  const knownVars = [
    'question', 'option', 'answer', 'answers', 'testData', 'testId',
    'result', 'score', 'totalScore', 'dimensions', 'positiveItems',
    'assessment', 'factorScores', 'animalScoreMap', 'animalVectors',
    'dimensionKeys', 'animal', 'similarity', 'testType', 'testId',
    'calculationManager', 'CalculationManager', 'window'
  ];
  knownVars.forEach(varName => protected.add(varName));
  
  // 第二步：只混淆局部小写变量
  let result = code;
  const varMap = new Map();
  let counter = 0;
  
  // 生成简短的变量名（避免与保护名冲突）
  function generateVarName() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let name;
    do {
      const base = letters[counter % letters.length];
      const num = Math.floor(counter / letters.length);
      name = num > 0 ? base + num : base;
      counter++;
    } while (protected.has(name));
    return name;
  }
  
  // 收集所有局部变量声明（var/let/const）
  const varDeclRegex = /\b(var|let|const)\s+(\w+)\b/g;
  const localVars = new Set();
  let match;
  
  while ((match = varDeclRegex.exec(code)) !== null) {
    const varName = match[2];
    // 只混淆：小写、长度>2、不在保护列表中、不是常见保留字
    if (/^[a-z][a-z0-9]*$/.test(varName) && 
        varName.length > 2 && 
        !protected.has(varName) &&
        !['function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'default', 'break', 'continue'].includes(varName)) {
      localVars.add(varName);
    }
  }
  
  // 为每个局部变量分配新名称
  localVars.forEach(varName => {
    if (!varMap.has(varName)) {
      varMap.set(varName, generateVarName());
    }
  });
  
  console.log(`  将混淆 ${varMap.size} 个局部变量`);
  
  // 第三步：按长度降序安全替换（避免部分匹配）
  const sortedVars = Array.from(varMap.entries()).sort((a, b) => b[0].length - a[0].length);
  
  sortedVars.forEach(([oldName, newName]) => {
    // 精确替换：单词边界，且前面不是点号
    const regex = new RegExp(`\\b${oldName}\\b(?![.:])`, 'g');
    result = result.replace(regex, newName);
  });
  
  // 第四步：安全压缩
  result = result
    .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
    .replace(/\/\/[^\n]*/g, '')         // 移除单行注释
    .replace(/\s+/g, ' ')              // 合并空白
    .replace(/\s*([{}();,:=])\s*/g, '$1') // 移除符号周围的空白
    .replace(/^\s+|\s+$/g, '');         // 移除首尾空白
  
  return result;
}

// 验证函数
function validateCode(code) {
  console.log('🧪 验证代码完整性:');
  
  const checks = [
    { name: 'class CalculationManager', test: () => code.includes('class CalculationManager') },
    { name: 'constructor', test: () => code.includes('constructor') },
    { name: 'calculateSCL90函数', test: () => code.includes('calculateSCL90') },
    { name: 'question变量定义', test: () => {
      // 检查question变量是否被正确声明
      const lines = code.split(';');
      for (const line of lines) {
        if (line.includes('const question') || line.includes('let question') || line.includes('var question')) {
          return true;
        }
      }
      // 也可能是函数参数
      return code.includes('calculateSCL90(answers,testData)');
    }},
    { name: 'dimensionKeys常量', test: () => {
      // dimensionKeys应该以const dimensionKeys = [...]形式存在
      return code.includes('dimensionKeys=[') || code.includes('dimensionKeys = [');
    }},
    { name: 'window.calculationManager', test: () => code.includes('window.calculationManager') }
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    const passed = check.test();
    allPassed = allPassed && passed;
    console.log(`   ${passed ? '✅' : '❌'} ${check.name}`);
  });
  
  return allPassed;
}

// 主函数
function main() {
  const inputFile = 'js/calculation.js';
  const outputFile = 'js-dist/calculation.complete.js';
  
  console.log(`📄 处理文件: ${inputFile}`);
  
  if (!fs.existsSync(inputFile)) {
    console.error('❌ 文件不存在');
    return;
  }
  
  // 创建输出目录
  if (!fs.existsSync('js-dist')) {
    fs.mkdirSync('js-dist', { recursive: true });
  }
  
  // 读取文件
  const original = fs.readFileSync(inputFile, 'utf8');
  const originalSize = original.length;
  console.log(`📊 原始大小: ${Math.ceil(originalSize / 1024)}KB`);
  
  // 执行混淆
  console.log('🔄 执行安全混淆...');
  const processed = completeObfuscate(original);
  
  const processedSize = processed.length;
  const compressionRatio = ((originalSize - processedSize) / originalSize * 100).toFixed(1);
  
  console.log(`📊 处理后大小: ${Math.ceil(processedSize / 1024)}KB`);
  console.log(`📊 压缩率: ${compressionRatio}%`);
  
  // 验证
  const validationPassed = validateCode(processed);
  
  if (!validationPassed) {
    console.log('⚠️  验证失败，但继续生成文件...');
  }
  
  // 写入文件
  fs.writeFileSync(outputFile, processed);
  console.log(`\n✅ 文件已保存: ${outputFile}`);
  
  // 显示关键代码段
  console.log('\n🔍 关键代码段检查:');
  const lines = processed.split(';');
  
  // 查找特定关键代码
  const keySections = [
    'calculateSCL90函数开始',
    'dimensionKeys常量',
    'question变量使用',
    'window.calculationManager'
  ];
  
  keySections.forEach(section => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (section === 'calculateSCL90函数开始' && line.includes('calculateSCL90')) {
        console.log(`   ${section}: 第${i+1}行`);
        console.log(`     ${line.substring(0, 80)}...`);
        break;
      }
      if (section === 'dimensionKeys常量' && line.includes('dimensionKeys')) {
        console.log(`   ${section}: 第${i+1}行`);
        console.log(`     ${line.substring(0, 80)}...`);
        break;
      }
      if (section === 'question变量使用' && line.includes('question.options.find')) {
        console.log(`   ${section}: 第${i+1}行`);
        console.log(`     ${line.substring(0, 80)}...`);
        break;
      }
      if (section === 'window.calculationManager' && line.includes('window.calculationManager')) {
        console.log(`   ${section}: 第${i+1}行`);
        console.log(`     ${line}`);
        break;
      }
    }
  });
  
  // 创建测试页面
  createTestPage(outputFile, originalSize, processedSize, validationPassed);
}

function createTestPage(jsFile, originalSize, processedSize, validationPassed) {
  const testPage = `<!DOCTYPE html>
<html>
<head>
    <title>完整混淆测试</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .info { 
            margin: 10px 0; 
            padding: 10px; 
            background: #f5f5f5; 
            border-radius: 5px;
            border-left: 4px solid #4CAF50;
        }
        .test-item { 
            margin: 8px 0; 
            padding: 8px; 
            border-left: 3px solid #ddd;
            background: white;
        }
        #status { 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 5px;
            font-weight: bold;
        }
        #codePreview {
            background: #f8f8f8;
            border: 1px solid #ddd;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            max-height: 400px;
            overflow: auto;
            white-space: pre-wrap;
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #45a049;
        }
        .button-row {
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <h1>完整混淆测试</h1>
    
    <div class="info">
        <strong>📊 混淆信息</strong><br>
        原始文件: ${Math.ceil(originalSize / 1024)}KB<br>
        混淆后: ${Math.ceil(processedSize / 1024)}KB<br>
        压缩率: ${((originalSize - processedSize) / originalSize * 100).toFixed(1)}%<br>
        验证状态: ${validationPassed ? '✅ 通过' : '⚠️ 有警告'}
    </div>
    
    <div class="button-row">
        <button onclick="runBasicTests()">运行基础测试</button>
        <button onclick="runAdvancedTests()">运行高级测试</button>
        <button onclick="showCodePreview()">显示代码预览</button>
    </div>
    
    <div id="status">等待测试...</div>
    <div id="testResults"></div>
    <div id="codePreview" style="display: none;"></div>
    
    <script src="${jsFile}"></script>
    <script>
        let testResults = [];
        
        function addTestResult(name, passed, message = '') {
            testResults.push({ name, passed, message });
            return passed;
        }
        
        function runBasicTests() {
            testResults = [];
            const statusEl = document.getElementById('status');
            const resultsEl = document.getElementById('testResults');
            
            statusEl.innerHTML = '🔍 运行基础测试...';
            statusEl.style.background = '#fff3cd';
            statusEl.style.color = '#856404';
            
            try {
                // 测试1: 全局对象
                const hasCalculationManager = typeof calculationManager !== 'undefined';
                addTestResult('CalculationManager全局对象', hasCalculationManager, 
                    hasCalculationManager ? '存在' : '未定义');
                
                if (!hasCalculationManager) {
                    updateResults();
                    return;
                }
                
                // 测试2: 核心函数存在性
                const coreFunctions = [
                    'calculateResult',
                    'calculateSCL90',
                    'calculateAnimalPersonality',
                    'calculateSpiritualNeeds',
                    'calculateWeatherPersonalityV2',
                    'calculateHollandAdapt',
                    'calculateRelationshipComfort',
                    'calculateMingDynasty',
                    'calculateCareerCompass'
                ];
                
                coreFunctions.forEach(funcName => {
                    const func = calculationManager[funcName];
                    const isFunction = typeof func === 'function';
                    addTestResult(\`\${funcName}函数\`, isFunction, 
                        isFunction ? '可用' : '不可用');
                });
                
                // 测试3: 简单功能测试
                try {
                    // 测试动物人格计算（不需要外部数据）
                    const animalResult = calculationManager.calculateAnimalPersonality(['A', 'B', 'C', 'D']);
                    addTestResult('calculateAnimalPersonality执行', true, 
                        \`成功返回: \${animalResult.animal || '未知动物'}\`);
                } catch (e) {
                    addTestResult('calculateAnimalPersonality执行', false, 
                        \`错误: \${e.message}\`);
                }
                
            } catch (error) {
                addTestResult('测试框架', false, \`框架错误: \${error.message}\`);
            }
            
            updateResults();
        }
        
        function runAdvancedTests() {
            const statusEl = document.getElementById('status');
            statusEl.innerHTML = '🧪 运行高级测试...';
            statusEl.style.background = '#d1ecf1';
            statusEl.style.color = '#0c5460';
            
            try {
                // 测试SCL90计算（需要测试数据）
                const testData = {
                    dimensions: {
                        anxiety: {
                            name: '焦虑',
                            items: [1, 2, 3],
                            highDescription: '高焦虑描述',
                            lowDescription: '低焦虑描述',
                            interpretation: '解释文本',
                            scoreRange: [0, 4],
                            threshold: 2.0
                        }
                    },
                    questions: [
                        {
                            options: [
                                { id: 'A', score: 1 },
                                { id: 'B', score: 2 }
                            ]
                        },
                        {
                            options: [
                                { id: 'A', score: 1 },
                                { id: 'B', score: 2 }
                            ]
                        },
                        {
                            options: [
                                { id: 'A', score: 1 },
                                { id: 'B', score: 2 }
                            ]
                        }
                    ]
                };
                
                const answers = ['A', 'B', 'A'];
                const sclResult = calculationManager.calculateSCL90(answers, testData);
                
                addTestResult('calculateSCL90完整测试', true, 
                    \`成功: testType=\${sclResult.testType}, score=\${sclResult.score}\`);
                
                // 测试数据结构
                const requiredProps = ['score', 'totalScore', 'testType', 'dimensions', 'positiveItems'];
                let structTestPassed = true;
                let structMessage = '';
                
                requiredProps.forEach(prop => {
                    if (!(prop in sclResult)) {
                        structTestPassed = false;
                        structMessage += \`\${prop}缺失 \`;
                    }
                });
                
                addTestResult('SCL90数据结构', structTestPassed,
                    structTestPassed ? '完整' : \`不完整: \${structMessage}\`);
                
            } catch (error) {
                addTestResult('高级测试', false, \`错误: \${error.message}\`);
            }
            
            updateResults();
        }
        
        function updateResults() {
            const statusEl = document.getElementById('status');
            const resultsEl = document.getElementById('testResults');
            
            let allPassed = true;
            let html = '<h3>测试结果:</h3>';
            
            testResults.forEach(result => {
                allPassed = allPassed && result.passed;
                const color = result.passed ? 'green' : 'red';
                html += \`
                <div class="test-item" style="border-color: \${color}">
                    \${result.passed ? '✅' : '❌'} 
                    <strong>\${result.name}</strong>
                    \${result.message ? '<br><span style="font-size: 0.9em; color: #666;">' + result.message + '</span>' : ''}
                </div>\`;
            });
            
            resultsEl.innerHTML = html;
            
            if (allPassed) {
                statusEl.innerHTML = '🎉 所有测试通过！混淆成功！';
                statusEl.style.background = '#d4edda';
                statusEl.style.color = '#155724';
            } else {
                statusEl.innerHTML = '⚠️ 部分测试失败';
                statusEl.style.background = '#f8d7da';
                statusEl.style.color = '#721c24';
            }
        }
        
        function showCodePreview() {
            const previewEl = document.getElementById('codePreview');
            previewEl.style.display = 'block';
            
            // 获取代码前1000字符
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '${jsFile}', true);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    const code = xhr.responseText;
                    previewEl.innerHTML = \`
                    <strong>混淆代码预览（前1000字符）:</strong>
                    <pre>\${code.substring(0, 1000)}...</pre>
                    <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                        🔍 检查要点: question变量、dimensionKeys常量、函数调用
                    </div>\`;
                }
            };
            xhr.send();
        }
        
        // 页面加载后自动运行基础测试
        setTimeout(runBasicTests, 500);
    </script>
</body>
</html>`;
  
  fs.writeFileSync('test-complete-obfuscated.html', testPage);
  console.log('\n📄 测试页面已创建: test-complete-obfuscated.html');
  console.log('🌐 用浏览器打开进行最终验证');
}

// 执行
main();
