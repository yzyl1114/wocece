const fs = require('fs');
const path = require('path');

console.log('🎯 report-components.js 修复版混淆脚本\n');

function obfuscateReportComponentsFixed(code) {
  // 第一步：特别保护所有全局对象和函数
  const GLOBAL_OBJECTS = [
    // 主要对象
    'ReportComponents',
    'AnimalDisplayData',
    'WeatherCityData',
    'EmotionDescriptionMap',
    'CoreTemperamentMap',
    'CareerIdentityData',
    
    // 函数
    'getDimensionAnalysis',
    
    // 组件方法
    'getCityData',
    'getDimensionSuggestions',
    
    // 组件名称（作为对象属性）
    'fun-header', 'standard-header', 'animal-header', 'professional-header',
    'detailed-analysis', 'simple-score', 'detailed-score', 'clinical-indicators',
    'text-analysis', 'multi-analysis', 'clinical-table', 'animal-similarity',
    'animal-description', 'animal-dimensions', 'dimension-radar', 'dimension-chart',
    'risk-assessment', 'factor-interpretation', 'professional-advice',
    'professional-summary', 'animal-summary', 'spiritual-header',
    'spiritual-horizontal-bars', 'spiritual-detailed-analysis', 'spiritual-summary',
    'weather-header', 'weather-description', 'weather-summary', 'holland-header',
    'holland-core-traits', 'holland-world-script', 'holland-reality-awakening',
    'holland-dimensions', 'holland-summary', 'relationship-header',
    'relationship-comfort', 'ming-header', 'ming-character', 'ming-analysis',
    'ming-dimensions', 'ming-summary', 'career-header', 'career-identity',
    'career-golden-combination', 'career-path-map', 'career-action-plan',
    'save-actions', 'share-actions'
  ];
  
  const PROTECTED_WORDS = new Set(GLOBAL_OBJECTS);
  
  // 第二步：收集所有在全局作用域中声明的变量
  const globalVarPattern = /^(?:const|let|var|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
  let match;
  const globalVars = new Set();
  
  while ((match = globalVarPattern.exec(code)) !== null) {
    const varName = match[1];
    if (!varName.startsWith('_') && varName.length > 1) {
      globalVars.add(varName);
    }
  }
  
  // 添加所有全局变量到保护列表
  globalVars.forEach(varName => PROTECTED_WORDS.add(varName));
  
  console.log(`  保护了 ${PROTECTED_WORDS.size} 个全局名称`);
  
  // 第三步：只混淆安全的局部变量（在函数内部声明的）
  let result = code;
  const varMap = new Map();
  let counter = 0;
  
  // 生成安全的短变量名
  function getSafeVarName() {
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
                   'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    
    // 先尝试单字母
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      if (!PROTECTED_WORDS.has(name) && !Array.from(varMap.values()).includes(name)) {
        return name;
      }
    }
    
    // 用双字母
    for (let i = 0; i < names.length; i++) {
      for (let j = 0; j < names.length; j++) {
        const name = names[i] + names[j];
        if (!PROTECTED_WORDS.has(name) && !Array.from(varMap.values()).includes(name)) {
          return name;
        }
      }
    }
    
    return 'x' + counter++;
  }
  
  // 第四步：分析函数作用域，只混淆函数内部的局部变量
  console.log('  分析函数作用域...');
  
  // 查找函数声明
  const functionPattern = /(?:function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:function\s*\(|\([^)]*\)\s*=>)|(?:^|\s)(\w+)\s*:\s*\{[\s\S]*?render:\s*function\s*\(|\.render\s*=\s*function\s*\()/g;
  const functions = [];
  
  while ((match = functionPattern.exec(code)) !== null) {
    const funcName = match[1] || match[2] || match[3] || 'anonymous';
    const start = match.index;
    
    // 找到函数体开始
    let braceCount = 0;
    let funcBodyStart = -1;
    
    for (let i = start; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        if (braceCount === 1) {
          funcBodyStart = i + 1;
          break;
        }
      }
    }
    
    if (funcBodyStart !== -1) {
      // 找到函数体结束
      braceCount = 0;
      let funcBodyEnd = -1;
      
      for (let i = funcBodyStart; i < code.length; i++) {
        if (code[i] === '{') braceCount++;
        if (code[i] === '}') {
          if (braceCount === 0) {
            funcBodyEnd = i;
            break;
          }
          braceCount--;
        }
      }
      
      if (funcBodyEnd !== -1) {
        functions.push({
          name: funcName,
          body: code.substring(funcBodyStart, funcBodyEnd),
          start: funcBodyStart,
          end: funcBodyEnd
        });
      }
    }
  }
  
  console.log(`  找到 ${functions.length} 个函数`);
  
  // 第五步：对每个函数体进行局部变量混淆
  let offset = 0;
  
  functions.forEach((func, funcIndex) => {
    const funcBody = func.body;
    
    // 收集这个函数体内的局部变量
    const localVars = new Set();
    const localVarPattern = /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    
    let varMatch;
    while ((varMatch = localVarPattern.exec(funcBody)) !== null) {
      const varName = varMatch[1];
      
      // 只混淆：小写、长度>2、不是保护单词、不是单个字母
      if (/^[a-z][a-z0-9]*$/.test(varName) &&
          varName.length > 2 &&
          !PROTECTED_WORDS.has(varName) &&
          !['function', 'return', 'if', 'else', 'for', 'while'].includes(varName)) {
        localVars.add(varName);
      }
    }
    
    if (localVars.size > 0) {
      // 为这个函数内的局部变量分配新名称
      const funcVarMap = new Map();
      localVars.forEach(varName => {
        if (!varMap.has(varName)) {
          funcVarMap.set(varName, getSafeVarName());
          varMap.set(varName, funcVarMap.get(varName));
        }
      });
      
      // 替换这个函数体内的局部变量
      let newFuncBody = funcBody;
      const sortedEntries = Array.from(funcVarMap.entries())
        .sort((a, b) => b[0].length - a[0].length);
      
      sortedEntries.forEach(([oldName, newName]) => {
        // 确保只替换完整的单词，不是其他单词的一部分
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        newFuncBody = newFuncBody.replace(regex, newName);
      });
      
      // 更新结果
      if (newFuncBody !== funcBody) {
        const before = code.substring(0, func.start + offset);
        const after = code.substring(func.end + offset);
        result = before + newFuncBody + after;
        offset += (newFuncBody.length - funcBody.length);
        code = result;
        
        console.log(`    函数 ${func.name}: 混淆了 ${funcVarMap.size} 个局部变量`);
      }
    }
  });
  
  console.log(`  总共混淆了 ${varMap.size} 个局部变量`);
  
  // 第六步：安全压缩（但保持全局变量）
  console.log('  执行安全压缩...');
  result = result
    // 移除注释（但保留可能需要的重要注释）
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    // 合并空白
    .replace(/\s+/g, ' ')
    // 移除不必要的空白
    .replace(/\s*([{}();,:=])\s*/g, '$1')
    .replace(/\s*([<>]=?|==|===|!=|!==)\s*/g, '$1')
    .replace(/\s*([+\-*/%])\s*/g, '$1')
    .replace(/\s*=>\s*/g, '=>')
    // 清理行末
    .replace(/;\s*/g, ';')
    .replace(/,\s*/g, ',')
    .replace(/\)\s*\{/g, '){')
    .trim();
  
  return result;
}

// 验证函数（修复版）
function validateReportComponentsFixed(code) {
  console.log('🔍 验证关键代码段:');
  
  const sections = [
    {
      name: '全局对象定义',
      checks: [
        { desc: 'ReportComponents 对象', test: () => /(?:const|let|var)\s+ReportComponents\s*=/.test(code) },
        { desc: 'AnimalDisplayData 对象', test: () => /(?:const|let|var)\s+AnimalDisplayData\s*=/.test(code) },
        { desc: 'getDimensionAnalysis 函数', test: () => /function\s+getDimensionAnalysis/.test(code) }
      ]
    },
    {
      name: '对象完整性',
      checks: [
        { desc: 'ReportComponents 有 render 方法', test: () => {
          const reportMatch = code.match(/ReportComponents\s*=\s*\{([\s\S]*?)\}(?=;|\s*$)/);
          if (!reportMatch) return false;
          return reportMatch[1].includes('render:');
        }},
        { desc: '组件数量足够', test: () => {
          // 统计组件数量
          const componentMatches = code.match(/'[a-zA-Z-]+':\{/g);
          return componentMatches && componentMatches.length > 10;
        }}
      ]
    },
    {
      name: '数据对象',
      checks: [
        { desc: 'WeatherCityData 存在', test: () => /(?:const|let|var)\s+WeatherCityData\s*=/.test(code) },
        { desc: 'CareerIdentityData 存在', test: () => /(?:const|let|var)\s+CareerIdentityData\s*=/.test(code) }
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
  const inputFile = 'js/report-components.js';
  const outputFile = 'js-dist/report-components.fixed.js';
  
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
  console.log('🔄 执行修复版混淆...');
  const processed = obfuscateReportComponentsFixed(original);
  
  const processedSize = processed.length;
  const compressionRatio = ((originalSize - processedSize) / originalSize * 100).toFixed(1);
  
  console.log(`📊 处理后大小: ${Math.ceil(processedSize / 1024)}KB`);
  console.log(`📊 压缩率: ${compressionRatio}%`);
  
  // 验证
  console.log('\n🧪 执行验证...');
  const validationPassed = validateReportComponentsFixed(processed);
  
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
  
  // 查找 ReportComponents 定义
  const reportStart = processed.indexOf('ReportComponents=');
  if (reportStart !== -1) {
    const snippet = processed.substring(reportStart, Math.min(reportStart + 300, processed.length));
    console.log('ReportComponents 开头:');
    console.log(snippet + '...');
  }
  
  // 创建简单直接的测试页面
  createSimpleTestPage(outputFile, originalSize, processedSize, validationPassed);
}

function createSimpleTestPage(jsFile, originalSize, processedSize, validationPassed) {
  const testPage = `<!DOCTYPE html>
<html>
<head>
    <title>report-components.js 简化测试</title>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; margin: 20px; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .test-btn { padding: 10px 20px; background: #00B894; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        .test-btn:hover { background: #00a085; }
        .result { margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-family: monospace; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>report-components.js 简化测试</h1>
        <p>原始: ${Math.ceil(originalSize/1024)}KB → 混淆: ${Math.ceil(processedSize/1024)}KB (压缩率: ${((originalSize-processedSize)/originalSize*100).toFixed(1)}%)</p>
        
        <div class="test-section">
            <h3>基本功能测试</h3>
            <button class="test-btn" onclick="testBasic()">测试全局对象</button>
            <button class="test-btn" onclick="testAnimal()">测试动物数据</button>
            <button class="test-btn" onclick="testComponent()">测试组件渲染</button>
            <div id="basicResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>实际渲染测试</h3>
            <button class="test-btn" onclick="renderFunHeader()">渲染 fun-header</button>
            <button class="test-btn" onclick="renderAnimalHeader()">渲染 animal-header</button>
            <button class="test-btn" onclick="renderAnimalDescription()">渲染 animal-description</button>
            <div id="renderResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>HTML 输出</h3>
            <div id="htmlOutput" style="border: 1px solid #ccc; padding: 15px; background: #fff; min-height: 100px; font-family: monospace; font-size: 12px;"></div>
        </div>
    </div>
    
    <script src="${jsFile}"></script>
    <script>
        function logResult(elementId, message, isSuccess) {
            const element = document.getElementById(elementId);
            element.innerHTML = '<span class="' + (isSuccess ? 'success' : 'error') + '">' + 
                              (isSuccess ? '✅' : '❌') + ' ' + message + '</span>';
        }
        
        function testBasic() {
            const resultEl = document.getElementById('basicResult');
            let allPassed = true;
            let messages = [];
            
            // 测试1: ReportComponents
            if (typeof ReportComponents === 'undefined') {
                messages.push('ReportComponents 未定义');
                allPassed = false;
            } else {
                messages.push('ReportComponents 已定义');
            }
            
            // 测试2: getDimensionAnalysis
            if (typeof getDimensionAnalysis === 'undefined') {
                messages.push('getDimensionAnalysis 未定义');
                allPassed = false;
            } else {
                const result = getDimensionAnalysis('DOM', 25);
                messages.push('getDimensionAnalysis 返回: "' + result + '"');
            }
            
            // 测试3: AnimalDisplayData
            if (typeof AnimalDisplayData === 'undefined') {
                messages.push('AnimalDisplayData 未定义');
                allPassed = false;
            } else if (!AnimalDisplayData['狗']) {
                messages.push('AnimalDisplayData 缺少狗的数据');
                allPassed = false;
            } else {
                messages.push('AnimalDisplayData 有 ' + Object.keys(AnimalDisplayData).length + ' 种动物');
            }
            
            resultEl.innerHTML = messages.join('<br>');
            logResult('basicResult', '测试' + (allPassed ? '通过' : '失败'), allPassed);
        }
        
        function testAnimal() {
            const resultEl = document.getElementById('basicResult');
            
            if (typeof AnimalDisplayData === 'undefined') {
                logResult('basicResult', 'AnimalDisplayData 未定义', false);
                return;
            }
            
            const dog = AnimalDisplayData['狗'];
            const cat = AnimalDisplayData['猫'];
            
            let message = '🐶 狗: ' + (dog ? '✓' : '✗') + ' | ';
            message += '🐱 猫: ' + (cat ? '✓' : '✗') + '<br>';
            
            if (dog) {
                message += '狗 - Emoji: ' + dog.emoji + ', 颜色: ' + dog.color;
            }
            
            resultEl.innerHTML = message;
            logResult('basicResult', '动物数据测试完成', true);
        }
        
        function testComponent() {
            const resultEl = document.getElementById('basicResult');
            
            if (typeof ReportComponents === 'undefined') {
                logResult('basicResult', 'ReportComponents 未定义', false);
                return;
            }
            
            let message = '';
            const components = ['fun-header', 'animal-header', 'animal-description'];
            let validCount = 0;
            
            components.forEach(name => {
                if (ReportComponents[name] && typeof ReportComponents[name].render === 'function') {
                    message += '✓ ' + name + '<br>';
                    validCount++;
                } else {
                    message += '✗ ' + name + '<br>';
                }
            });
            
            resultEl.innerHTML = message;
            logResult('basicResult', validCount + '/' + components.length + ' 个组件有效', validCount === components.length);
        }
        
        function renderFunHeader() {
            const outputEl = document.getElementById('htmlOutput');
            
            if (!ReportComponents || !ReportComponents['fun-header']) {
                outputEl.innerHTML = '❌ fun-header 组件不可用';
                return;
            }
            
            const testData = { score: 85 };
            const testConfig = { id: '1' };
            const html = ReportComponents['fun-header'].render(testData, testConfig);
            
            outputEl.innerHTML = html;
            logResult('renderResult', 'fun-header 渲染成功', true);
        }
        
        function renderAnimalHeader() {
            const outputEl = document.getElementById('htmlOutput');
            
            if (!ReportComponents || !ReportComponents['animal-header']) {
                outputEl.innerHTML = '❌ animal-header 组件不可用';
                return;
            }
            
            const testData = { animal: '猫' };
            const html = ReportComponents['animal-header'].render(testData);
            
            outputEl.innerHTML = html;
            logResult('renderResult', 'animal-header 渲染成功', true);
        }
        
        function renderAnimalDescription() {
            const outputEl = document.getElementById('htmlOutput');
            
            if (!ReportComponents || !ReportComponents['animal-description']) {
                outputEl.innerHTML = '❌ animal-description 组件不可用';
                return;
            }
            
            const testData = { animal: '狗' };
            const html = ReportComponents['animal-description'].render(testData);
            
            outputEl.innerHTML = html;
            logResult('renderResult', 'animal-description 渲染成功', true);
        }
        
        // 页面加载后自动运行基本测试
        setTimeout(testBasic, 500);
    </script>
</body>
</html>`;
  
  fs.writeFileSync('test-report-simple.html', testPage);
  console.log('\n📄 简化测试页面已创建: test-report-simple.html');
  console.log('🌐 用浏览器打开进行验证');
}

// 执行
main();
