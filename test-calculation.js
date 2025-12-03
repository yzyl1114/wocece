const fs = require('fs');
const path = require('path');

console.log('🧪 测试 calculation.js 混淆\n');

const inputFile = 'js/calculation.js';
const outputFile = 'js-dist/calculation-test.min.js';

if (!fs.existsSync(inputFile)) {
  console.error('❌ 文件不存在:', inputFile);
  process.exit(1);
}

// 读取原始文件
const original = fs.readFileSync(inputFile, 'utf8');
console.log(`📄 原始文件: ${inputFile}`);
console.log(`📊 大小: ${Math.ceil(original.length / 1024)}KB`);
console.log(`📝 行数: ${original.split('\n').length}`);

// 分析文件内容
console.log('\n🔍 文件分析:');

// 统计函数数量
const functionMatches = original.match(/function\s+([a-zA-Z0-9_$]+)/g) || [];
console.log(`  ⚙️  函数数量: ${functionMatches.length}`);

// 查找关键函数
const criticalFunctions = ['calculate', 'getScore', 'processAnswers', 'computeResult'];
criticalFunctions.forEach(func => {
  if (original.includes(`function ${func}`) || original.includes(`${func}: function`)) {
    console.log(`  ✅ 关键函数存在: ${func}`);
  }
});

// 基础处理：保持关键函数名
let processed = original;

// 1. 移除注释
processed = processed.replace(/\/\*[\s\S]*?\*\//g, '');
processed = processed.replace(/\/\/.*/g, '');

// 2. 保护关键函数名
criticalFunctions.forEach(func => {
  const regex = new RegExp(`\\b(${func})\\b(?=\\s*\\(|\\s*:)`, 'g');
  processed = processed.replace(regex, `/*PROTECTED*/$1/*END*/`);
});

// 3. 混淆其他函数名（除了关键函数）
let functionCounter = 0;
const functionMap = new Map();

processed = processed.replace(
  /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
  (match, funcName) => {
    if (!criticalFunctions.includes(funcName) && !funcName.startsWith('_')) {
      if (!functionMap.has(funcName)) {
        functionMap.set(funcName, `f${functionCounter++}`);
      }
      return `function ${functionMap.get(funcName)}(`;
    }
    return match;
  }
);

// 4. 混淆变量名（私有变量）
let varCounter = 0;
const varMap = new Map();

processed = processed.replace(
  /(?:var|let|const)\s+(_[a-zA-Z0-9_$]+)\b/g,
  (match, varName) => {
    if (!varMap.has(varName)) {
      varMap.set(varName, `v${varCounter++}`);
    }
    return match.replace(varName, varMap.get(varName));
  }
);

// 5. 移除保护标记
processed = processed.replace(/\/\*PROTECTED\*\//g, '');
processed = processed.replace(/\/\*END\*\//g, '');

// 6. 压缩空白
processed = processed
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}();,:])\s*/g, '$1')
  .trim();

// 写入测试文件
fs.writeFileSync(outputFile, processed);

console.log('\n📊 处理结果:');
console.log(`  原始大小: ${original.length} 字节`);
console.log(`  处理后: ${processed.length} 字节`);
console.log(`  压缩率: ${((original.length - processed.length) / original.length * 100).toFixed(1)}%`);
console.log(`  混淆函数: ${functionMap.size} 个`);
console.log(`  混淆变量: ${varMap.size} 个`);

console.log('\n🔍 混淆示例（前200字符）:');
console.log(processed.substring(0, 200) + '...');

console.log('\n✅ 测试完成，文件已保存到:', outputFile);
