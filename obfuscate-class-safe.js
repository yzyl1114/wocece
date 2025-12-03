const fs = require('fs');
const path = require('path');

console.log('🔧 Class语法安全混淆脚本\n');

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
function generateRandomId(prefix = '') {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  
  let id = prefix;
  // 首字符必须是字母
  id += chars[Math.floor(Math.random() * chars.length)];
  
  // 后续字符
  for (let i = 0; i < 3; i++) {
    if (Math.random() > 0.5) {
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
  
  // 匹配变量声明
  const varPattern = /\b(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  let match;
  while ((match = varPattern.exec(code)) !== null) {
    identifiers.add(match[1]);
  }
  
  // 匹配函数参数
  const paramPattern = /(?:function\s*\w*)?\s*\(([^)]*)\)/g;
  while ((match = paramPattern.exec(code)) !== null) {
    const params = match[1].split(',').map(p => p.trim()).filter(p => p);
    params.forEach(param => {
      // 移除默认值和类型注释
      const cleanParam = param.split('=')[0].split(':')[0].trim();
      if (cleanParam) identifiers.add(cleanParam);
    });
  }
  
  // 匹配类属性
  const propPattern = /this\.([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
  while ((match = propPattern.exec(code)) !== null) {
    identifiers.add(match[1]);
  }
  
  // 匹配方法定义
  const methodPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g;
  while ((match = methodPattern.exec(code)) !== null) {
    identifiers.add(match[1]);
  }
  
  return Array.from(identifiers);
}

// 创建标识符映射
function createIdentifierMap(identifiers) {
  const map = new Map();
  
  identifiers.forEach(id => {
    // 跳过保护的关键字和函数名
    if (PROTECTED_KEYWORDS.has(id) || PROTECTED_FUNCTIONS.has(id) || id.length <= 2) {
      return;
    }
    
    // 跳过常见缩写和短变量
    if (['i', 'j', 'k', 'x', 'y', 'z', 'n', 'm'].includes(id)) {
      return;
    }
    
    // 生成新的标识符
    if (!map.has(id)) {
      map.set(id, generateRandomId());
    }
  });
  
  return map;
}

// 安全替换标识符（避免部分匹配）
function safeReplaceIdentifiers(code, identifierMap) {
  let result = code;
  
  // 按标识符长度降序排列，避免部分匹配
  const sortedEntries = Array.from(identifierMap.entries()).sort((a, b) => b[0].length - a[0].length);
  
  sortedEntries.forEach(([oldId, newId]) => {
    // 构建更精确的正则表达式
    const regex = new RegExp(`\\b${oldId}\\b(?![.:])`, 'g');
    result = result.replace(regex, newId);
  });
  
  return result;
}

// 安全压缩代码（保持语法正确）
function safeCompress(code) {
  let compressed = code;
  
  // 第一步：移除注释（但要小心可能包含//的字符串）
  // 先处理多行注释
  compressed = compressed.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 处理单行注释 - 更安全的方式
  const lines = compressed.split('\n');
  const processedLines = lines.map(line => {
    // 查找行内注释，但要避开URL等包含//的情况
    const commentIndex = line.indexOf('//');
    if (commentIndex !== -1) {
      // 检查//前面是否有引号
      const beforeComment = line.substring(0, commentIndex);
      const quoteCount = (beforeComment.match(/['"]/g) || []).length;
      
      // 如果引号数量是奇数，说明在字符串内，不删除
      if (quoteCount % 2 === 0) {
        return line.substring(0, commentIndex).trim();
      }
    }
    return line;
  });
  
  compressed = processedLines.join('\n');
  
  // 第二步：合并连续的空白
  compressed = compressed.replace(/\s+/g, ' ');
  
  // 第三步：移除不必要的空白（但保持语法正确）
  // 移除符号周围的空白
  compressed = compressed.replace(/\s*([{}();,:])\s*/g, '$1');
  
  // 移除赋值符号周围的空白
  compressed = compressed.replace(/\s*=\s*/g, '=');
  
  // 移除比较符号周围的空白
  compressed = compressed.replace(/\s*([<>]=?|==|===|!=|!==)\s*/g, '$1');
  
  // 移除运算符周围的空白
  compressed = compressed.replace(/\s*([+\-*/%])\s*/g, '$1');
  
  // 第四步：合并连续的分号
  compressed = compressed.replace(/;+/g, ';');
  
  // 移除开头的空白
  compressed = compressed.trim();
  
  return compressed;
}

// 主处理函数
function processClassFile(inputFile, outputFile) {
  console.log(`📄 处理: ${path.basename(inputFile)}`);
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 文件不存在: ${inputFile}`);
    return null;
  }
  
  const original = fs.readFileSync(inputFile, 'utf8');
  const originalSize = original.length;
  
  console.log(`  原始大小: ${Math.ceil(originalSize / 1024)}KB`);
  
  // 第一步：分析标识符
  const identifiers = analyzeIdentifiers(original);
  console.log(`  找到 ${identifiers.length} 个标识符`);
  
  // 第二步：创建映射
  const identifierMap = createIdentifierMap(identifiers);
  console.log(`  将混淆 ${identifierMap.size} 个标识符`);
  
  // 第三步：替换标识符
  let processed = safeReplaceIdentifiers(original, identifierMap);
  
  // 第四步：安全压缩
  processed = safeCompress(processed);
  
  const processedSize = processed.length;
  const compressionRatio = ((originalSize - processedSize) / originalSize * 100).toFixed(1);
  
  console.log(`  处理后: ${Math.ceil(processedSize / 1024)}KB`);
  console.log(`  压缩率: ${compressionRatio}%`);
  
  // 验证关键元素是否仍然存在
  const validationChecks = [
    { name: 'class关键字', regex: /\bclass\b/ },
    { name: 'constructor', regex: /\bconstructor\b/ },
    { name: 'calculateResult', regex: /\bcalculateResult\b/ },
    { name: 'window.calculationManager', regex: /window\.calculationManager/ }
  ];
  
  console.log(`  验证结果:`);
  validationChecks.forEach(check => {
    const found = check.regex.test(processed);
    console.log(`    ${found ? '✅' : '❌'} ${check.name}`);
  });
  
  // 写入文件
  fs.writeFileSync(outputFile, processed);
  
  return {
    original: inputFile,
    processed: outputFile,
    originalSize,
    processedSize,
    ratio: compressionRatio,
    identifiersConfused: identifierMap.size
  };
}

// 确保输出目录存在
if (!fs.existsSync('js-dist')) {
  fs.mkdirSync('js-dist', { recursive: true });
}

// 处理calculation.js
console.log('🚀 开始处理calculation.js\n');

const inputFile = 'js/calculation.js';
const outputFile = 'js-dist/calculation.secure.js';

const result = processClassFile(inputFile, outputFile);

if (result) {
  console.log('\n✅ 处理完成！');
  console.log(`📁 输出文件: ${outputFile}`);
  
  // 显示文件开头
  console.log('\n🔍 文件开头（前200字符）:');
  const content = fs.readFileSync(outputFile, 'utf8');
  console.log(content.substring(0, 200) + '...');
  
  // 创建测试页面
  const testPage = `<!DOCTYPE html>
<html>
<head>
    <title>安全混淆测试</title>
</head>
<body>
    <h1>Class语法安全混淆测试</h1>
    <div id="status">加载中...</div>
    
    <script src="${outputFile}"></script>
    <script>
        setTimeout(() => {
            const statusEl = document.getElementById('status');
            try {
                if (typeof calculationManager !== 'undefined') {
                    statusEl.innerHTML = '✅ CalculationManager加载成功！';
                    statusEl.style.color = 'green';
                    
                    // 测试核心函数
                    if (typeof calculationManager.calculateResult === 'function') {
                        console.log('✅ calculateResult函数可用');
                        console.log('✅ 混淆成功，文件大小: ${Math.ceil(result.processedSize/1024)}KB (原${Math.ceil(result.originalSize/1024)}KB)');
                    }
                } else {
                    statusEl.innerHTML = '❌ CalculationManager未定义';
                    statusEl.style.color = 'red';
                }
            } catch (error) {
                statusEl.innerHTML = '❌ 错误: ' + error.message;
                statusEl.style.color = 'red';
                console.error('测试错误:', error);
            }
        }, 100);
    </script>
</body>
</html>`;
  
  fs.writeFileSync('test-class-obfuscated.html', testPage);
  console.log('\n📄 测试页面已创建: test-class-obfuscated.html');
}
