const fs = require('fs');
const path = require('path');

console.log('🎯 最终完全修复版混淆脚本\n');

function finalObfuscate(code) {
  // 第一步：保护所有不应该被混淆的内容
  const PROTECTED_WORDS = new Set();
  
  // 1. 保护所有对象属性名
  const props = code.match(/(['"]?)(\w+)(['"]?)\s*:/g) || [];
  props.forEach(prop => {
    const name = prop.replace(/['"]?\s*:/g, '').replace(/['"]/g, '');
    if (name.length > 1) PROTECTED_WORDS.add(name);
  });
  
  // 2. 保护方法名
  const methods = code.match(/\.(\w+)\s*\(/g) || [];
  methods.forEach(method => {
    const name = method.replace(/^\./, '').replace(/\s*\($/, '');
    PROTECTED_WORDS.add(name);
  });
  
  // 3. 保护特定变量（从之前的错误中学习）
  const criticalVars = [
    // calculateSCL90函数中的变量
    'question', 'option', 'answer', 'answers', 'testData',
    'result', 'score', 'totalScore', 'dimensions', 'positiveItems',
    'assessment', 'factorScores', 'dimension', 'questionNum',
    'answerIndex', 'dimAnsweredCount', 'averageScore', 'totalDimensionScore',
    
    // calculateAnimalPersonality函数中的变量
    'animalScoreMap', 'animalVectors', 'dimensionKeys', 'scores',
    'userNormalized', 'bestMatchAnimal', 'bestSimilarity',
    'animalName', 'animalVector', 'animalNormalized', 'similarity',
    
    // 循环变量（特别重要！）
    'dim', 'key', 'i', 'index', 'item', 'entry',
    
    // 其他重要变量
    'calculationManager', 'CalculationManager', 'window'
  ];
  
  criticalVars.forEach(varName => PROTECTED_WORDS.add(varName));
  
  // 第二步：只混淆安全的局部变量
  let result = code;
  const varMap = new Map();
  let counter = 0;
  
  // 生成安全的短变量名
  function getSafeVarName() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let name;
    do {
      const base = letters[counter % 26];
      const num = Math.floor(counter / 26);
      name = num > 0 ? base + num : base;
      counter++;
    } while (PROTECTED_WORDS.has(name) || name === 'dim'); // 特别保护'dim'
    return name;
  }
  
  // 收集局部变量声明
  const varPattern = /\b(var|let|const)\s+(\w+)\b/g;
  const localVars = new Set();
  let match;
  
  while ((match = varPattern.exec(code)) !== null) {
    const varName = match[2];
    
    // 只混淆：小写、长度>2、不在保护列表、不是JavaScript关键字
    if (/^[a-z][a-z0-9]*$/.test(varName) &&
        varName.length > 2 &&
        !PROTECTED_WORDS.has(varName) &&
        !['function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch',
          'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw',
          'new', 'typeof', 'instanceof', 'in', 'of', 'async', 'await'].includes(varName)) {
      localVars.add(varName);
    }
  }
  
  console.log(`  找到 ${localVars.size} 个可混淆的局部变量`);
  
  // 为每个局部变量分配新名称
  localVars.forEach(varName => {
    if (!varMap.has(varName)) {
      varMap.set(varName, getSafeVarName());
    }
  });
  
  // 第三步：安全替换（特别小心）
  const sortedEntries = Array.from(varMap.entries()).sort((a, b) => b[0].length - a[0].length);
  
  sortedEntries.forEach(([oldName, newName]) => {
    // 特别检查：确保不会替换掉'dimension'中的'dim'
    if (oldName === 'dim') {
      console.log('  ⚠️  跳过混淆 "dim" 变量（可能被误用）');
      return;
    }
    
    // 构建精确的正则表达式
    const regex = new RegExp(`\\b${oldName}\\b(?![.:])`, 'g');
    result = result.replace(regex, newName);
  });
  
  // 第四步：安全压缩
  result = result
    .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
    .replace(/\/\/[^\n]*/g, '')         // 移除单行注释
    .replace(/\s+/g, ' ')              // 合并空白
    .replace(/\s*([{}();,:=])\s*/g, '$1') // 移除符号周围的空白
    .replace(/\s*([<>]=?|==|===|!=|!==)\s*/g, '$1') // 操作符周围空白
    .replace(/\s*([+\-*/%])\s*/g, '$1') // 算术操作符周围空白
    .replace(/;\s*/g, ';')             // 分号后空白
    .trim();
  
  return result;
}

// 验证关键代码段
function validateCriticalSections(code) {
  console.log('🔍 验证关键代码段:');
  
  const sections = [
    {
      name: 'calculateSCL90函数',
      checks: [
        { desc: '函数定义存在', test: () => code.includes('calculateSCL90(answers,testData){') },
        { desc: 'question变量声明', test: () => {
          const funcStart = code.indexOf('calculateSCL90(answers,testData){');
          if (funcStart === -1) return false;
          const funcCode = code.substring(funcStart, funcStart + 500);
          return funcCode.includes('const question') || funcCode.includes('let question') || 
                 funcCode.includes('question=testData.questions[');
        }},
        { desc: 'option变量使用', test: () => {
          // 检查option是否被正确使用
          return code.includes('question.options.find') && 
                 code.includes('option.score');
        }}
      ]
    },
    {
      name: 'calculateAnimalPersonality函数',
      checks: [
        { desc: '函数定义存在', test: () => code.includes('calculateAnimalPersonality(answers){') },
        { desc: 'dimensionKeys常量', test: () => {
          const funcStart = code.indexOf('calculateAnimalPersonality(answers){');
          if (funcStart === -1) return false;
          const funcCode = code.substring(funcStart, Math.min(funcStart + 1000, code.length));
          return funcCode.includes('dimensionKeys=[') || funcCode.includes('dimensionKeys = [');
        }},
        { desc: 'for...of循环正确', test: () => {
          // 检查for(const dim of dimensionKeys)是否完整
          return code.includes('for(const dim of dimensionKeys)') || 
                 code.includes('for(const ') && code.includes('of dimensionKeys)');
        }}
      ]
    },
    {
      name: '全局设置',
      checks: [
        { desc: 'CalculationManager类', test: () => code.includes('class CalculationManager') },
        { desc: 'constructor', test: () => code.includes('constructor()') },
        { desc: 'window.calculationManager', test: () => code.includes('window.calculationManager=') }
      ]
    }
  ];
  
  let allPassed = true;
  
  sections.forEach(section => {
    console.log(`\n  ${section.name}:`);
    section.checks.forEach(check => {
      const passed = check.test();
      allPassed = allPassed && passed;
      console.log(`    ${passed ? '✅' : '❌'} ${check.desc}`);
    });
  });
  
  return allPassed;
}

function main() {
  const inputFile = 'js/calculation.js';
  const outputFile = 'js-dist/calculation.final.js';
  
  console.log(`📄 处理: ${path.basename(inputFile)}`);
  
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
  console.log('🔄 执行最终混淆...');
  const processed = finalObfuscate(original);
  
  const processedSize = processed.length;
  const compressionRatio = ((originalSize - processedSize) / originalSize * 100).toFixed(1);
  
  console.log(`📊 处理后大小: ${Math.ceil(processedSize / 1024)}KB`);
  console.log(`📊 压缩率: ${compressionRatio}%`);
  
  // 验证
  console.log('\n🧪 执行验证...');
  const validationPassed = validateCriticalSections(processed);
  
  if (validationPassed) {
    console.log('\n🎉 所有验证通过！');
  } else {
    console.log('\n⚠️  验证有警告，请检查代码');
  }
  
  // 写入文件
  fs.writeFileSync(outputFile, processed);
  console.log(`\n✅ 文件已保存: ${outputFile}`);
  
  // 显示关键代码片段
  console.log('\n🔍 显示关键代码片段:');
  
  // 查找calculateAnimalPersonality函数
  const animalFuncStart = processed.indexOf('calculateAnimalPersonality(answers){');
  if (animalFuncStart !== -1) {
    const snippet = processed.substring(animalFuncStart, Math.min(animalFuncStart + 300, processed.length));
    console.log('calculateAnimalPersonality函数开头:');
    console.log(snippet + '...');
  }
  
  // 创建测试页面
  createFinalTestPage(outputFile, originalSize, processedSize, validationPassed);
}

function createFinalTestPage(jsFile, originalSize, processedSize, validationPassed) {
  const testPage = `<!DOCTYPE html>
<html>
<head>
    <title>最终混淆验证</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border-left: 5px solid #667eea;
        }
        .stat-card h3 {
            margin: 0;
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .stat-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #333;
            margin: 10px 0;
        }
        .test-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin: 30px 0;
        }
        button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .primary-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .secondary-btn {
            background: #f1f3f5;
            color: #495057;
        }
        .success-btn {
            background: linear-gradient(135deg, #51cf66 0%, #2b8a3e 100%);
            color: white;
        }
        .status-box {
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
            font-weight: bold;
            font-size: 1.2em;
        }
        .success-status {
            background: linear-gradient(135deg, #d3f9d8 0%, #b2f2bb 100%);
            color: #2b8a3e;
            border: 2px solid #51cf66;
        }
        .error-status {
            background: linear-gradient(135deg, #ffc9c9 0%, #ffa8a8 100%);
            color: #c92a2a;
            border: 2px solid #ff6b6b;
        }
        .warning-status {
            background: linear-gradient(135deg, #fff3bf 0%, #ffd43b 100%);
            color: #e67700;
            border: 2px solid #ffc078;
        }
        .test-results {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
            max-height: 500px;
            overflow-y: auto;
        }
        .test-item {
            padding: 15px;
            margin: 10px 0;
            background: white;
            border-radius: 8px;
            border-left: 4px solid #ddd;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .test-item.success {
            border-left-color: #51cf66;
            background: #ebfbee;
        }
        .test-item.error {
            border-left-color: #ff6b6b;
            background: #fff5f5;
        }
        .test-icon {
            font-size: 1.5em;
        }
        .test-details {
            flex: 1;
        }
        .test-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .test-message {
            color: #666;
            font-size: 0.9em;
        }
        .code-preview {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            margin-top: 20px;
            max-height: 400px;
            overflow: auto;
            white-space: pre-wrap;
        }
        .summary {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 JavaScript混淆最终验证</h1>
        
        <div class="stats">
            <div class="stat-card">
                <h3>原始大小</h3>
                <div class="value">${Math.ceil(originalSize / 1024)}KB</div>
            </div>
            <div class="stat-card">
                <h3>混淆后大小</h3>
                <div class="value">${Math.ceil(processedSize / 1024)}KB</div>
            </div>
            <div class="stat-card">
                <h3>压缩率</h3>
                <div class="value">${((originalSize - processedSize) / originalSize * 100).toFixed(1)}%</div>
            </div>
            <div class="stat-card">
                <h3>验证状态</h3>
                <div class="value">${validationPassed ? '✅ 通过' : '⚠️ 警告'}</div>
            </div>
        </div>
        
        <div class="summary">
            <p>这是calculation.js文件的最终混淆版本。请运行以下测试验证功能完整性。</p>
        </div>
        
        <div class="test-buttons">
            <button class="primary-btn" onclick="runQuickTest()">
                <span>⚡</span> 快速测试
            </button>
            <button class="secondary-btn" onclick="runFullTest()">
                <span>🧪</span> 完整测试
            </button>
            <button class="success-btn" onclick="showCode()">
                <span>🔍</span> 查看代码
            </button>
        </div>
        
        <div id="status" class="status-box">
            等待测试...
        </div>
        
        <div id="testResults" class="test-results">
            <!-- 测试结果将显示在这里 -->
        </div>
        
        <div id="codePreview" class="code-preview" style="display: none;">
            <!-- 代码预览将显示在这里 -->
        </div>
    </div>
    
    <script src="${jsFile}"></script>
    <script>
        const tests = [];
        let currentTestId = 0;
        
        function addTest(name, testFn) {
            tests.push({ id: currentTestId++, name, testFn, run: false, passed: false, message: '' });
        }
        
        // 定义测试用例
        addTest('全局对象检查', () => {
            if (typeof calculationManager === 'undefined') {
                throw new Error('calculationManager未定义');
            }
            return '✅ CalculationManager对象存在';
        });
        
        addTest('核心函数检查', () => {
            const requiredFunctions = [
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
            
            const missing = [];
            requiredFunctions.forEach(func => {
                if (typeof calculationManager[func] !== 'function') {
                    missing.push(func);
                }
            });
            
            if (missing.length > 0) {
                throw new Error(\`缺少函数: \${missing.join(', ')}\`);
            }
            
            return \`✅ 所有 \${requiredFunctions.length} 个核心函数可用\`;
        });
        
        addTest('calculateAnimalPersonality测试', () => {
            // 这个函数不需要外部数据
            const answers = ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'];
            const result = calculationManager.calculateAnimalPersonality(answers);
            
            if (!result || typeof result !== 'object') {
                throw new Error('返回结果不是对象');
            }
            
            const requiredProps = ['animal', 'similarity', 'testType', 'score'];
            for (const prop of requiredProps) {
                if (!(prop in result)) {
                    throw new Error(\`缺少属性: \${prop}\`);
                }
            }
            
            return \`✅ 返回动物: \${result.animal}, 相似度: \${(result.similarity * 100).toFixed(1)}%\`;
        });
        
        addTest('calculateSCL90数据结构测试', () => {
            // 创建最小测试数据
            const testData = {
                dimensions: {
                    anxiety: {
                        name: '焦虑',
                        items: [1, 4, 7],
                        highDescription: '高焦虑',
                        lowDescription: '低焦虑',
                        interpretation: '解释',
                        scoreRange: [0, 4],
                        threshold: 2.0
                    }
                },
                questions: [
                    { options: [{ id: 'A', score: 1 }, { id: 'B', score: 2 }] },
                    { options: [{ id: 'A', score: 1 }, { id: 'B', score: 2 }] },
                    { options: [{ id: 'A', score: 1 }, { id: 'B', score: 2 }] },
                    { options: [{ id: 'A', score: 1 }, { id: 'B', score: 2 }] }
                ]
            };
            
            const answers = ['A', 'B', 'A', 'B'];
            const result = calculationManager.calculateSCL90(answers, testData);
            
            // 检查关键属性
            const required = ['score', 'totalScore', 'testType', 'dimensions', 'positiveItems', 'positiveAverage'];
            for (const prop of required) {
                if (!(prop in result)) {
                    throw new Error(\`SCL90结果缺少属性: \${prop}\`);
                }
            }
            
            return \`✅ SCL90测试通过, testType: \${result.testType}, 分数: \${result.score}\`;
        });
        
        addTest('函数链式调用测试', () => {
            // 测试calculateResult调用其他函数
            const testData = {
                dimensions: {},
                questions: []
            };
            
            // 测试ID 7 (动物人格)
            const animalResult = calculationManager.calculateResult('7', ['A', 'B', 'C'], testData);
            if (animalResult.testType !== 'animal_personality') {
                throw new Error('calculateResult未能正确调用calculateAnimalPersonality');
            }
            
            return \`✅ 函数链式调用正常, testType: \${animalResult.testType}\`;
        });
        
        function runTest(test) {
            try {
                test.message = test.testFn();
                test.passed = true;
            } catch (error) {
                test.message = \`❌ \${error.message}\`;
                test.passed = false;
            }
            test.run = true;
            return test.passed;
        }
        
        function updateUI() {
            const statusEl = document.getElementById('status');
            const resultsEl = document.getElementById('testResults');
            
            let allPassed = true;
            let anyRun = false;
            
            resultsEl.innerHTML = '';
            
            tests.forEach(test => {
                if (test.run) {
                    anyRun = true;
                    allPassed = allPassed && test.passed;
                    
                    const testEl = document.createElement('div');
                    testEl.className = \`test-item \${test.passed ? 'success' : 'error'}\`;
                    testEl.innerHTML = \`
                        <div class="test-icon">\${test.passed ? '✅' : '❌'}</div>
                        <div class="test-details">
                            <div class="test-name">\${test.name}</div>
                            <div class="test-message">\${test.message}</div>
                        </div>
                    \`;
                    resultsEl.appendChild(testEl);
                }
            });
            
            if (anyRun) {
                if (allPassed) {
                    statusEl.className = 'status-box success-status';
                    statusEl.innerHTML = '🎉 所有测试通过！混淆代码完全可用！';
                } else {
                    statusEl.className = 'status-box error-status';
                    statusEl.innerHTML = '⚠️ 部分测试失败，需要检查混淆逻辑';
                }
            }
        }
        
        function runQuickTest() {
            const statusEl = document.getElementById('status');
            statusEl.className = 'status-box warning-status';
            statusEl.innerHTML = '⚡ 运行快速测试中...';
            
            // 重置测试状态
            tests.forEach(test => { test.run = false; });
            
            // 运行前两个测试
            setTimeout(() => {
                runTest(tests[0]); // 全局对象检查
                runTest(tests[1]); // 核心函数检查
                runTest(tests[2]); // 动物人格测试
                updateUI();
            }, 100);
        }
        
        function runFullTest() {
            const statusEl = document.getElementById('status');
            statusEl.className = 'status-box warning-status';
            statusEl.innerHTML = '🧪 运行完整测试中...';
            
            // 重置测试状态
            tests.forEach(test => { test.run = false; });
            
            // 分批运行所有测试
            let index = 0;
            function runNext() {
                if (index < tests.length) {
                    runTest(tests[index]);
                    index++;
                    setTimeout(runNext, 300);
                } else {
                    updateUI();
                }
            }
            
            setTimeout(runNext, 100);
        }
        
        function showCode() {
            const previewEl = document.getElementById('codePreview');
            previewEl.style.display = 'block';
            
            // 获取关键代码片段
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '${jsFile}', true);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    const code = xhr.responseText;
                    
                    // 提取关键部分
                    let preview = '';
                    
                    // 查找calculateAnimalPersonality函数
                    const animalStart = code.indexOf('calculateAnimalPersonality');
                    if (animalStart !== -1) {
                        const animalEnd = code.indexOf('}', animalStart + 100);
                        preview += '// calculateAnimalPersonality函数:\\n' + 
                                  code.substring(animalStart, Math.min(animalEnd + 100, code.length)) + '\\n\\n';
                    }
                    
                    // 查找calculateSCL90函数
                    const sclStart = code.indexOf('calculateSCL90');
                    if (sclStart !== -1) {
                        const sclEnd = code.indexOf('}', sclStart + 200);
                        preview += '// calculateSCL90函数开头:\\n' + 
                                  code.substring(sclStart, Math.min(sclEnd + 100, code.length));
                    }
                    
                    previewEl.innerHTML = preview || '无法提取代码片段';
                }
            };
            xhr.send();
        }
        
        // 页面加载后自动运行快速测试
        setTimeout(runQuickTest, 500);
    </script>
</body>
</html>`;
  
  fs.writeFileSync('test-final-fix.html', testPage);
  console.log('\n📄 最终测试页面已创建: test-final-fix.html');
  console.log('🌐 用浏览器打开进行最终验证');
  console.log('\n🎯 这是最终的修复版本！如果测试通过，我们就可以开始处理其他JS文件了。');
}

// 执行
main();
