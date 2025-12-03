const fs = require('fs');
const path = require('path');

console.log('🔧 ES6语法增强混淆脚本\n');

// 需要保护的关键函数名（保持可读）
const PROTECTED_FUNCTIONS = [
  'calculateResult', 'calculateWeatherPersonalityV2', 'calculateHollandAdapt',
  'calculateRelationshipComfort', 'calculateMingDynasty', 'calculateCareerCompass',
  'calculateSCL90', 'calculateAnimalPersonality', 'calculateSpiritualNeeds',
  'init', 'render', 'showResult', 'loadTest', 'startTest', 'submitAnswer',
  'getScore', 'showReport', 'pay', 'verifyPayment'
];

// 需要保护的类名
const PROTECTED_CLASSES = [
  'CalculationManager', 'ResultManager', 'TemplateEngine',
  'ChartRenderer', 'PaymentProcessor', 'StorageManager'
];

// 生成随机标识符
function generateRandomName(prefix = '') {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const randomChar = () => chars[Math.floor(Math.random() * chars.length)];
  const randomNum = () => numbers[Math.floor(Math.random() * numbers.length)];
  
  let result = prefix;
  // 首字符必须是字母
  result += randomChar();
  // 后续字符可以是字母或数字
  for (let i = 0; i < 2; i++) {
    result += Math.random() > 0.5 ? randomChar() : randomNum();
  }
  return result;
}

// 混淆变量名
function obfuscateVariables(code) {
  // 匹配私有变量（以_开头的）
  const privateVarRegex = /\b(_[a-zA-Z0-9_$]+)\b(?![.:])/g;
  const varMap = new Map();
  
  return code.replace(privateVarRegex, (match, varName) => {
    if (PROTECTED_FUNCTIONS.includes(varName) || PROTECTED_CLASSES.includes(varName)) {
      return varName;
    }
    
    if (!varMap.has(varName)) {
      varMap.set(varName, generateRandomName('_'));
    }
    return varMap.get(varName);
  });
}

// 混淆方法名（类中的方法）
function obfuscateClassMethods(code) {
  let modifiedCode = code;
  
  // 匹配类方法定义
  const methodRegex = /(\w+)\s*\([^)]*\)\s*\{/g;
  const matches = [];
  let match;
  
  while ((match = methodRegex.exec(code)) !== null) {
    if (!matches.includes(match[1]) && 
        !PROTECTED_FUNCTIONS.includes(match[1]) &&
        match[1].length > 2) {
      matches.push(match[1]);
    }
  }
  
  // 为每个方法生成混淆名
  const methodMap = new Map();
  matches.forEach(method => {
    if (!methodMap.has(method)) {
      methodMap.set(method, generateRandomName('m'));
    }
  });
  
  // 替换方法调用（需要更精确的替换）
  methodMap.forEach((newName, oldName) => {
    // 替换 this.methodName()
    const thisMethodRegex = new RegExp(`this\\.${oldName}\\s*\\(`, 'g');
    modifiedCode = modifiedCode.replace(thisMethodRegex, `this.${newName}(`);
    
    // 替换 methodName()
    const standaloneRegex = new RegExp(`(?<!\\.)\\b${oldName}\\s*\\(`, 'g');
    modifiedCode = modifiedCode.replace(standaloneRegex, `${newName}(`);
  });
  
  return modifiedCode;
}

// 混淆局部变量
function obfuscateLocalVars(code) {
  // 查找局部变量声明
  const varDeclarations = code.match(/(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:=|;|,)/g) || [];
  const localVars = new Set();
  
  varDeclarations.forEach(decl => {
    const varName = decl.match(/(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/)[1];
    if (varName.length > 3 && !varName.startsWith('_') && 
        !PROTECTED_FUNCTIONS.includes(varName)) {
      localVars.add(varName);
    }
  });
  
  const varMap = new Map();
  let modifiedCode = code;
  
  localVars.forEach(varName => {
    if (!varMap.has(varName)) {
      varMap.set(varName, generateRandomName('v'));
    }
    
    const newName = varMap.get(varName);
    // 替换变量声明
    const declRegex = new RegExp(`(?:var|let|const)\\s+${varName}\\b`, 'g');
    modifiedCode = modifiedCode.replace(declRegex, `let ${newName}`);
    
    // 替换变量使用（需要避免替换属性访问）
    const useRegex = new RegExp(`(?<!\\.)\\b${varName}\\b(?!\\s*:)`, 'g');
    modifiedCode = modifiedCode.replace(useRegex, newName);
  });
  
  return modifiedCode;
}

// 字符串加密（简单版）
function encryptStrings(code) {
  // 匹配字符串常量
  const stringRegex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  const strings = [];
  
  // 收集所有字符串
  let match;
  while ((match = stringRegex.exec(code)) !== null) {
    strings.push({
      original: match[0],
      index: match.index,
      length: match[0].length
    });
  }
  
  // 处理字符串（这里简单处理，实际可以更复杂）
  let result = code;
  strings.reverse().forEach(str => {
    // 只处理较长的字符串（减少对短字符串的影响）
    if (str.original.length > 10 && !str.original.includes('http')) {
      const base64 = Buffer.from(str.original.slice(1, -1)).toString('base64');
      const replacement = `atob('${base64}')`;
      result = result.slice(0, str.index) + replacement + result.slice(str.index + str.length);
    }
  });
  
  return result;
}

// 压缩代码
function compressCode(code) {
  return code
    // 移除多行注释
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 移除单行注释
    .replace(/\/\/.*$/gm, '')
    // 合并多个空白
    .replace(/\s+/g, ' ')
    // 移除语句前后的空白
    .replace(/\s*([{}();,:])\s*/g, '$1')
    // 移除语句末尾分号前的空白
    .replace(/;\s*/g, ';')
    // 移除对象字面量中的空白
    .replace(/\{\s*/g, '{')
    .replace(/\s*\}/g, '}')
    .trim();
}

// 主处理函数
function processFile(inputFile, outputFile) {
  console.log(`📄 处理: ${path.basename(inputFile)}`);
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 文件不存在: ${inputFile}`);
    return null;
  }
  
  const original = fs.readFileSync(inputFile, 'utf8');
  const originalSize = original.length;
  
  console.log(`  原始大小: ${Math.ceil(originalSize / 1024)}KB`);
  
  let processed = original;
  
  // 步骤1: 压缩
  processed = compressCode(processed);
  
  // 步骤2: 混淆变量
  processed = obfuscateVariables(processed);
  
  // 步骤3: 混淆类方法
  processed = obfuscateClassMethods(processed);
  
  // 步骤4: 混淆局部变量
  processed = obfuscateLocalVars(processed);
  
  // 步骤5: 字符串加密（可选）
  // processed = encryptStrings(processed);
  
  const processedSize = processed.length;
  const compressionRatio = ((originalSize - processedSize) / originalSize * 100).toFixed(1);
  
  console.log(`  处理后: ${Math.ceil(processedSize / 1024)}KB`);
  console.log(`  压缩率: ${compressionRatio}%`);
  
  // 写入文件
  fs.writeFileSync(outputFile, processed);
  
  return {
    original: inputFile,
    processed: outputFile,
    originalSize,
    processedSize,
    ratio: compressionRatio
  };
}

// 确保输出目录存在
if (!fs.existsSync('js-dist')) {
  fs.mkdirSync('js-dist', { recursive: true });
}

// 处理主要文件
const filesToProcess = [
  'js/calculation.js',
  'js/report-components.js',
  'js/result-manager.js',
  'js/app.js',
  'js/template-engine.js',
  'js/payment.js',
  'js/chart-renderer.js',
  'js/storage.js',
  'js/share.js'
];

console.log('🚀 开始增强混淆处理\n');

const results = [];
filesToProcess.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const outputName = path.basename(filePath).replace('.js', '.obf.js');
    const outputPath = path.join('js-dist', outputName);
    
    const result = processFile(filePath, outputPath);
    if (result) {
      results.push(result);
    }
  } else {
    console.log(`⚠️  跳过: ${filePath} (不存在)`);
  }
});

console.log('\n📊 处理完成汇总:');
results.forEach((result, i) => {
  const filename = path.basename(result.original);
  console.log(`${i+1}. ${filename}: ${Math.ceil(result.originalSize/1024)}KB → ${Math.ceil(result.processedSize/1024)}KB (${result.ratio}%)`);
});

console.log('\n✅ 增强混淆完成！');
console.log('📁 输出目录: js-dist/');
console.log('\n🔍 查看混淆效果示例:');
if (results.length > 0) {
  const sampleFile = results[0].processed;
  console.log(`\n前100字符(${path.basename(sampleFile)}):`);
  const sampleContent = fs.readFileSync(sampleFile, 'utf8').substring(0, 200);
  console.log(sampleContent + '...');
}
