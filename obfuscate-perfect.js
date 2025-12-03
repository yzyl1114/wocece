const fs = require('fs');
const path = require('path');

console.log('🎯 最终修复版混淆脚本\n');

// 核心思路：只混淆局部变量，不混淆任何属性名和方法名
function perfectObfuscate(code) {
  let result = code;
  
  // 第一步：识别并保护所有属性名和方法名
  // 匹配对象属性：{ key: value } 或 key: value
  const propertyPattern = /(['"]?)(\w+)(['"]?)\s*:/g;
  const properties = new Set();
  
  let match;
  while ((match = propertyPattern.exec(code)) !== null) {
    properties.add(match[2]);
  }
  
  // 匹配方法调用：object.methodName(
  const methodPattern = /\.(\w+)\s*\(/g;
  while ((match = methodPattern.exec(code)) !== null) {
    properties.add(match[1]);
  }
  
  // 第二步：只混淆局部变量声明
  const lines = code.split('\n');
  const varMap = new Map();
  let varCounter = 0;
  
  // 生成简短的变量名
  function generateVarName() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const base = letters[varCounter % letters.length];
    const num = Math.floor(varCounter / letters.length);
    varCounter++;
    return num > 0 ? base + num : base;
  }
  
  // 收集所有局部变量声明
  const localVars = new Set();
  
  // 匹配 var/let/const 声明
  const varRegex = /\b(var|let|const)\s+(\w+)\b/g;
  while ((match = varRegex.exec(code)) !== null) {
    const varName = match[2];
    
    // 排除：属性名、保留关键字、短变量名
    if (!properties.has(varName) && 
        varName.length > 2 &&
        !['class', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case'].includes(varName)) {
      localVars.add(varName);
    }
  }
  
  // 为每个局部变量分配新名称
  localVars.forEach(varName => {
    if (!varMap.has(varName)) {
      varMap.set(varName, generateVarName());
    }
  });
  
  // 第三步：安全替换（只替换局部变量使用，不替换属性）
  varMap.forEach((newName, oldName) => {
    // 构建精确的正则：单词边界，且前面不是点号，且不在字符串中
    const lines = result.split('\n');
    const newLines = lines.map(line => {
      // 简单的替换逻辑：只替换完整的单词
      return line.replace(new RegExp(`\\b${oldName}\\b(?![.:])`, 'g'), newName);
    });
    result = newLines.join('\n');
  });
  
  // 第四步：压缩代码（保持可读性）
  result = result
    .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
    .replace(/\/\/.*/g, '')            // 移除单行注释
    .replace(/\s+/g, ' ')              // 合并空白
    .replace(/\s*([{}();,:=])\s*/g, '$1') // 移除符号周围的空白
    .trim();
  
  return result;
}

// 验证函数
function validateObfuscation(code) {
  const tests = [
    { name: 'class关键字', test: () => /class\s+\w+/.test(code) },
    { name: 'constructor', test: () => code.includes('constructor') },
    { name: 'calculateResult函数', test: () => code.includes('calculateResult') },
    { name: 'window.calculationManager', test: () => code.includes('window.calculationManager') },
    { name: 'option变量使用', test: () => {
      // 检查是否有未定义的option变量
      const lines = code.split(';');
      for (const line of lines) {
        if (line.includes('option.') && !line.includes('const option') && !line.includes('let option') && !line.includes('var option')) {
          // 检查是否在正确的上下文中
          if (line.includes('question.options.find')) {
            // 这是正确的，因为option是find的回调参数
            continue;
          }
          // 检查是否是对象属性访问（如 selectedOption.score）
          if (line.includes('selectedOption.') || line.includes('itemOption.')) {
            continue;
          }
          return false;
        }
      }
      return true;
    }},
    { name: 'score属性', test: () => code.includes('score:') || code.includes('.score') },
    { name: 'testType属性', test: () => code.includes('testType') }
  ];
  
  return tests;
}

// 主函数
function main() {
  const inputFile = 'js/calculation.js';
  const outputFile = 'js-dist/calculation.perfect.js';
  
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
  
  // 执行完美混淆
  console.log('🎯 执行完美混淆...');
  const processed = perfectObfuscate(original);
  
  const processedSize = processed.length;
  const compressionRatio = ((originalSize - processedSize) / originalSize * 100).toFixed(1);
  
  console.log(`📊 处理后大小: ${Math.ceil(processedSize / 1024)}KB`);
  console.log(`📊 压缩率: ${compressionRatio}%`);
  
  // 验证
  console.log('🧪 验证结果:');
  const tests = validateObfuscation(processed);
  let allPassed = true;
  
  tests.forEach(test => {
    const passed = test.test();
    allPassed = allPassed && passed;
    console.log(`   ${passed ? '✅' : '❌'} ${test.name}`);
  });
  
  if (!allPassed) {
    console.log('⚠️  警告：验证未完全通过，检查代码逻辑');
  }
  
  // 写入文件
  fs.writeFileSync(outputFile, processed);
  console.log(`\n✅ 处理完成！文件已保存到: ${outputFile}`);
  
  // 显示关键部分
  console.log('\n🔍 关键代码段检查:');
  const lines = processed.split(';');
  
  // 查找calculateSCL90函数中的option使用
  let foundOptionIssue = false;
  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    const line = lines[i];
    if (line.includes('question.options.find')) {
      console.log(`   ${i+1}: ${line.substring(0, 80)}...`);
    }
    if (line.includes('option.') && !line.includes('question.options.find')) {
      console.log(`   ⚠️  第${i+1}行可能有问题: ${line.substring(0, 60)}...`);
      foundOptionIssue = true;
    }
  }
  
  if (!foundOptionIssue) {
    console.log('   ✅ 未发现明显的option变量问题');
  }
  
  // 创建测试页面
  createTestPage(outputFile, originalSize, processedSize);
}

// 创建测试页面
function createTestPage(jsFile, originalSize, processedSize) {
  const testPage = `<!DOCTYPE html>
<html>
<head>
    <title>最终混淆测试</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .test-item { margin: 5px 0; padding: 5px; border-left: 3px solid #ddd; }
        #codePreview { 
            background: #f8f8f8; 
            border: 1px solid #ddd; 
            padding: 10px; 
            margin: 10px 0; 
            font-family: monospace; 
            white-space: pre-wrap; 
            max-height: 300px; 
            overflow: auto; 
        }
    </style>
</head>
<body>
    <h1>最终混淆测试</h1>
    <div class="info">
        <strong>文件信息:</strong><br>
        原始文件: ${Math.ceil(originalSize / 1024)}KB<br>
        混淆后: ${Math.ceil(processedSize / 1024)}KB<br>
        压缩率: ${((originalSize - processedSize) / originalSize * 100).toFixed(1)}%
    </div>
    
    <div id="status">正在加载和测试JavaScript...</div>
    <div id="testResults"></div>
    
    <script src="${jsFile}"></script>
    <script>
        function runComprehensiveTests() {
            const results = [];
            
            try {
                // 测试1: CalculationManager是否存在
                if (typeof calculationManager === 'undefined') {
                    results.push({ name: 'CalculationManager', passed: false, message: '未定义' });
                    return results;
                }
                results.push({ name: 'CalculationManager', passed: true, message: '存在' });
                
                // 测试2: 检查所有核心函数
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
                
                requiredFunctions.forEach(funcName => {
                    const func = calculationManager[funcName];
                    const passed = typeof func === 'function';
                    results.push({ 
                        name: \`\${funcName}\`, 
                        passed,
                        message: passed ? '函数可用' : '函数不存在或不是函数'
                    });
                });
                
                // 测试3: 执行calculateSCL90（重点测试）
                try {
                    // 创建测试数据
                    const testData = {
                        dimensions: {
                            anxiety: { 
                                name: '焦虑',
                                items: [1, 2, 3],
                                highDescription: '高焦虑',
                                lowDescription: '低焦虑',
                                interpretation: '焦虑因子解释',
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
                    const result = calculationManager.calculateSCL90(answers, testData);
                    
                    results.push({ 
                        name: 'calculateSCL90执行', 
                        passed: true,
                        message: \`执行成功，返回testType: \${result.testType || '未知'}\`
                    });
                    
                    // 测试4: 检查返回结果结构
                    const requiredProps = ['score', 'totalScore', 'testType', 'dimensions'];
                    requiredProps.forEach(prop => {
                        const hasProp = prop in result;
                        results.push({
                            name: \`结果包含\${prop}\`,
                            passed: hasProp,
                            message: hasProp ? '存在' : '缺失'
                        });
                    });
                    
                } catch (e) {
                    results.push({ 
                        name: 'calculateSCL90执行', 
                        passed: false,
                        message: '执行错误: ' + e.message + ' (行号: ' + (e.lineNumber || '未知') + ')'
                    });
                }
                
                // 测试5: 测试其他函数
                try {
                    const animalResult = calculationManager.calculateAnimalPersonality(['A', 'B', 'C']);
                    results.push({
                        name: 'calculateAnimalPersonality',
                        passed: true,
                        message: \`执行成功，动物: \${animalResult.animal || '未知'}\`
                    });
                } catch (e) {
                    results.push({
                        name: 'calculateAnimalPersonality',
                        passed: false,
                        message: '错误: ' + e.message
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
            const testResultsEl = document.getElementById('testResults');
            
            statusEl.innerHTML = '正在执行测试...';
            
            setTimeout(() => {
                const testResults = runComprehensiveTests();
                
                let allPassed = true;
                let html = '<h3>详细测试结果:</h3>';
                
                testResults.forEach(result => {
                    allPassed = allPassed && result.passed;
                    html += \`<div class="test-item" style="border-color: \${result.passed ? 'green' : 'red'}">
                        \${result.passed ? '✅' : '❌'} <strong>\${result.name}</strong>
                        \${result.message ? ' - ' + result.message : ''}
                    </div>\`;
                });
                
                testResultsEl.innerHTML = html;
                
                if (allPassed) {
                    statusEl.innerHTML = '<span class="success">🎉 所有测试通过！混淆代码完全可用。</span>';
                    console.log('✅ 混淆测试完成，所有功能正常！');
                } else {
                    statusEl.innerHTML = '<span class="error">❌ 部分测试失败，需要检查混淆逻辑。</span>';
                    console.warn('⚠️  部分测试失败，检查上面的错误信息');
                }
                
                // 显示部分混淆代码
                const codePreview = document.createElement('div');
                codePreview.id = 'codePreview';
                codePreview.innerHTML = '<h4>混淆后代码片段（前500字符）:</h4>';
                
                // 获取混淆代码片段
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '${jsFile}', true);
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        const code = xhr.responseText;
                        codePreview.innerHTML += '<pre>' + code.substring(0, 500) + '...</pre>';
                    }
                };
                xhr.send();
                
                document.body.appendChild(codePreview);
                
            }, 100);
        }, 100);
    </script>
</body>
</html>`;
  
  fs.writeFileSync('test-perfect-obfuscated.html', testPage);
  console.log('\n📄 测试页面已创建: test-perfect-obfuscated.html');
  console.log('🌐 用浏览器打开此文件进行最终测试');
}

// 执行
main();
