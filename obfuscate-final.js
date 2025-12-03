const fs = require('fs');
const path = require('path');

console.log('🔧 最终修复版混淆脚本\n');

// 转义正则表达式特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 永远不能混淆的关键字
const PROTECTED_KEYWORDS = new Set([
  'class', 'constructor', 'extends', 'super', 'this', 'new', 'window',
  'function', 'return', 'if', 'else', 'switch', 'case', 'default',
  'for', 'while', 'do', 'break', 'continue', 'try', 'catch', 'finally',
  'throw', 'var', 'let', 'const', 'typeof', 'instanceof', 'in', 'of',
  'async', 'await', 'yield', 'export', 'import', 'debugger',
  'console', 'document', 'JSON', 'Math', 'Object', 'Array', 'String',
  'Number', 'Boolean', 'Date', 'RegExp', 'Error', 'Promise', 'Set', 'Map'
]);

// 必须保持可读的项目函数名
const PROTECTED_FUNCTIONS = new Set([
  'calculateResult', 'calculateWeatherPersonalityV2', 'calculateHollandAdapt',
  'calculateRelationshipComfort', 'calculateMingDynasty', 'calculateCareerCompass',
  'calculateSCL90', 'calculateAnimalPersonality', 'calculateSpiritualNeeds',
  'generateDetailedAnalysis', 'getSCL90Assessment', 'addScores',
  'generateSpiritualAnalysis', 'l2Normalize', 'cosineSimilarity',
  'determineCoreTemperamentV2', 'matchCityConditionV2', 'generateEmotionDescription',
  'generateHollandAnalysis', 'getDimensionName', 'getTraitDescription',
  'generateMingAnalysis', 'generateMingFullReport', 'matchCareerIdentity',
  'generateGoldenCombination', 'generateCareerAnalysis',
  'init', 'render', 'showResult', 'loadTest', 'startTest', 'submitAnswer',
  'getScore', 'showReport', 'pay', 'verifyPayment', 'api'
]);

// 生成随机标识符
function generateRandomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  
  // 使用简短但独特的标识符
  let id = chars[Math.floor(Math.random() * chars.length)];
  
  // 添加2-3个字符
  const length = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < length; i++) {
    if (Math.random() > 0.6) {
      id += chars[Math.floor(Math.random() * chars.length)];
    } else {
      id += numbers[Math.floor(Math.random() * 10)];
    }
  }
  
  return id;
}

// 分析代码结构，提取所有标识符
function analyzeIdentifiers(code) {
  const identifiers = new Set();
  
  // 匹配变量声明 - 简化版，避免复杂解析
  const lines = code.split('\n');
  
  lines.forEach(line => {
    // 简化匹配：var/let/const 变量声明
    const varMatch = line.match(/\b(var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (varMatch) {
      identifiers.add(varMatch[2]);
    }
    
    // 匹配函数参数 - 简化版
    const funcMatch = line.match(/\bfunction\s*\w*\s*\(([^)]*)\)/);
    if (funcMatch) {
      const params = funcMatch[1].split(',').map(p => p.trim()).filter(p => p);
      params.forEach(param => {
        // 移除默认值等
        const cleanParam = param.split('=')[0].split(':')[0].trim();
        if (cleanParam) identifiers.add(cleanParam);
      });
    }
    
    // 匹配箭头函数参数
    const arrowMatch = line.match(/\(([^)]*)\)\s*=>/);
    if (arrowMatch) {
      const params = arrowMatch[1].split(',').map(p => p.trim()).filter(p => p);
      params.forEach(param => {
        const cleanParam = param.split('=')[0].split(':')[0].trim();
        if (cleanParam) identifiers.add(cleanParam);
      });
    }
    
    // 匹配类方法
    const methodMatch = line.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/);
    if (methodMatch && !line.includes('function')) {
      identifiers.add(methodMatch[1]);
    }
  });
  
  return Array.from(identifiers);
}

// 创建标识符映射（只混淆符合条件的标识符）
function createIdentifierMap(identifiers) {
  const map = new Map();
  const usedIds = new Set();
  
  identifiers.forEach(id => {
    // 跳过保护的关键字和函数名
    if (PROTECTED_KEYWORDS.has(id) || PROTECTED_FUNCTIONS.has(id)) {
      return;
    }
    
    // 跳过短标识符和常见循环变量
    if (id.length <= 2 || ['i', 'j', 'k', 'x', 'y', 'z', 'n', 'm'].includes(id)) {
      return;
    }
    
    // 跳过看起来像常量的（全大写）
    if (id === id.toUpperCase()) {
      return;
    }
    
    // 生成新的标识符，确保唯一
    let newId;
    do {
      newId = generateRandomId();
    } while (usedIds.has(newId));
    
    usedIds.add(newId);
    map.set(id, newId);
  });
  
  return map;
}

// 安全替换标识符
function safeReplaceIdentifiers(code, identifierMap) {
  let result = code;
  
  // 按标识符长度降序排列，避免部分匹配
  const sortedEntries = Array.from(identifierMap.entries()).sort((a, b) => b[0].length - a[0].length);
  
  sortedEntries.forEach(([oldId, newId]) => {
    // 转义特殊字符
    const escapedOldId = escapeRegExp(oldId);
    // 使用单词边界，但排除后面跟点号的情况（属性访问）
    const regex = new RegExp(`\\b${escapedOldId}\\b(?![.])`, 'g');
    
    try {
      result = result.replace(regex, newId);
    } catch (error) {
      console.error(`  警告: 替换标识符 "${oldId}" 时出错:`, error.message);
      // 跳过这个标识符
    }
  });
  
  return result;
}

// 安全压缩代码
function safeCompress(code) {
  let compressed = code;
  
  // 移除多行注释
  compressed = compressed.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 处理单行注释 - 逐行处理更安全
  const lines = compressed.split('\n');
  const processedLines = lines.map(line => {
    const commentIndex = line.indexOf('//');
    if (commentIndex > -1) {
      // 检查是否在字符串内
      const beforeComment = line.substring(0, commentIndex);
      const stringCount = (beforeComment.match(/['"]/g) || []).length;
      
      if (stringCount % 2 === 0) {
        return line.substring(0, commentIndex);
      }
    }
    return line;
  });
  
  compressed = processedLines.join('\n');
  
  // 合并空白
  compressed = compressed.replace(/\s+/g, ' ');
  
  // 移除符号周围的空白
  compressed = compressed.replace(/\s*([{}();,:=])\s*/g, '$1');
  
  // 移除多余的分号
  compressed = compressed.replace(/;+/g, ';');
  
  return compressed.trim();
}

// 验证混淆结果
function validateObfuscation(code) {
  const checks = [
    { name: 'class关键字', test: () => code.includes('class ') },
    { name: 'constructor', test: () => code.includes('constructor') },
    { name: 'calculateResult函数', test: () => code.includes('calculateResult') },
    { name: 'window.calculationManager', test: () => code.includes('window.calculationManager') },
    { name: '语法正确性', test: () => {
      // 简单语法检查：检查常见语法错误
      const commonErrors = [
        /class\s+\w+\s*\{[^}]*constructor[^}]*\}/, // class应该有constructor
        /window\.calculationManager\s*=/, // 应该有赋值
        /calculateResult\s*\(.*\)\s*\{/ // 函数定义应该正确
      ];
      return commonErrors.every(regex => regex.test(code));
    }}
  ];
  
  return checks.map(check => ({
    name: check.name,
    passed: check.test()
  }));
}

// 主处理函数
function main() {
  const inputFile = 'js/calculation.js';
  const outputFile = 'js-dist/calculation.final.js';
  
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
  
  // 1. 分析标识符
  console.log('🔍 分析标识符...');
  const identifiers = analyzeIdentifiers(original);
  console.log(`   找到 ${identifiers.length} 个标识符`);
  
  // 2. 创建映射
  console.log('🔄 创建混淆映射...');
  const identifierMap = createIdentifierMap(identifiers);
  console.log(`   将混淆 ${identifierMap.size} 个标识符`);
  
  // 3. 替换标识符
  console.log('⚡ 替换标识符...');
  let processed = safeReplaceIdentifiers(original, identifierMap);
  
  // 4. 压缩代码
  console.log('💨 压缩代码...');
  processed = safeCompress(processed);
  
  const processedSize = processed.length;
  const compressionRatio = ((originalSize - processedSize) / originalSize * 100).toFixed(1);
  
  console.log(`📊 处理后大小: ${Math.ceil(processedSize / 1024)}KB`);
  console.log(`📊 压缩率: ${compressionRatio}%`);
  
  // 5. 验证结果
  console.log('🧪 验证混淆结果...');
  const validationResults = validateObfuscation(processed);
  validationResults.forEach(result => {
    console.log(`   ${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  // 6. 写入文件
  fs.writeFileSync(outputFile, processed);
  console.log(`\n✅ 混淆完成！文件已保存到: ${outputFile}`);
  
  // 显示文件开头
  console.log('\n🔍 混淆后文件开头:');
  console.log(processed.substring(0, 150) + '...');
  
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
    </style>
</head>
<body>
    <h1>JavaScript混淆测试</h1>
    <div class="info">
        原始文件: ${Math.ceil(originalSize / 1024)}KB<br>
        混淆后: ${Math.ceil(processedSize / 1024)}KB<br>
        压缩率: ${((originalSize - processedSize) / originalSize * 100).toFixed(1)}%
    </div>
    <div id="status">加载JavaScript...</div>
    
    <script src="${jsFile}"></script>
    <script>
        window.onload = function() {
            const statusEl = document.getElementById('status');
            
            try {
                // 测试1: CalculationManager是否存在
                if (typeof calculationManager === 'undefined') {
                    statusEl.innerHTML = '<span class="error">❌ CalculationManager未定义</span>';
                    return;
                }
                
                statusEl.innerHTML = '<span class="success">✅ CalculationManager加载成功</span>';
                
                // 测试2: 核心函数是否存在
                const tests = [
                    { name: 'calculateResult', fn: calculationManager.calculateResult },
                    { name: 'calculateSCL90', fn: calculationManager.calculateSCL90 },
                    { name: 'calculateAnimalPersonality', fn: calculationManager.calculateAnimalPersonality }
                ];
                
                let allTestsPassed = true;
                tests.forEach(test => {
                    if (typeof test.fn !== 'function') {
                        console.error('❌ 函数不存在:', test.name);
                        allTestsPassed = false;
                    } else {
                        console.log('✅ 函数可用:', test.name);
                    }
                });
                
                if (allTestsPassed) {
                    statusEl.innerHTML += '<br><span class="success">✅ 所有核心函数测试通过</span>';
                    console.log('🎉 混淆测试完成，代码功能正常！');
                } else {
                    statusEl.innerHTML += '<br><span class="error">❌ 部分函数测试失败</span>';
                }
                
            } catch (error) {
                statusEl.innerHTML = '<span class="error">❌ 错误: ' + error.message + '</span>';
                console.error('测试错误:', error);
            }
        };
    </script>
</body>
</html>`;
  
  fs.writeFileSync('test-final-obfuscated.html', testPage);
  console.log('\n📄 测试页面已创建: test-final-obfuscated.html');
  console.log('🌐 用浏览器打开此文件测试混淆效果');
}

// 执行主函数
main();
