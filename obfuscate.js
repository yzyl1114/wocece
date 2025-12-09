// /Users/huixu/Documents/GitHub/wocece/obfuscate.js
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

console.log('🔒 JavaScript Obfuscator - 文件混淆工具');
console.log('='.repeat(50));

// 项目根目录
const ROOT_DIR = __dirname;

// 路径配置
const PATHS = {
  sourceDir: path.join(ROOT_DIR, 'js'),          // 原始JS文件目录
  outputDir: path.join(ROOT_DIR, 'js-dist'),     // 输出目录
  configFile: path.join(ROOT_DIR, 'obfuscator.config.js')
};

// 需要混淆的5个核心文件
const TARGET_FILES = [
  'calculation.js',
  'chart-renderer.js',
  'result-manager.js',
  'template-engine.js',
  'report-components.js'
];

// 读取混淆配置
const OBFUSCATOR_CONFIG = require('./obfuscator.simple.js');

// 确保输出目录存在
if (!fs.existsSync(PATHS.outputDir)) {
  fs.mkdirSync(PATHS.outputDir, { recursive: true });
  console.log(`📁 创建输出目录: ${PATHS.outputDir}`);
}

console.log(`📂 源目录: ${PATHS.sourceDir}`);
console.log(`📂 输出目录: ${PATHS.outputDir}`);
console.log(`📋 目标文件: ${TARGET_FILES.length} 个`);
console.log('='.repeat(50));

// 统计信息
const stats = {
  total: TARGET_FILES.length,
  success: 0,
  failed: 0,
  totalOriginalSize: 0,
  totalObfuscatedSize: 0
};

// 混淆单个文件
function obfuscateFile(filename) {
  try {
    const sourcePath = path.join(PATHS.sourceDir, filename);
    const outputFilename = filename.replace('.js', '.min.js');
    const outputPath = path.join(PATHS.outputDir, outputFilename);
    
    // 检查源文件是否存在
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ 文件不存在: ${sourcePath}`);
      stats.failed++;
      return false;
    }
    
    // 读取源文件
    const originalCode = fs.readFileSync(sourcePath, 'utf8');
    const originalSize = originalCode.length;
    stats.totalOriginalSize += originalSize;
    
    console.log(`\n📄 处理: ${filename}`);
    console.log(`   📊 原始大小: ${(originalSize / 1024).toFixed(2)} KB`);
    
    // 执行混淆
    const startTime = Date.now();
    const obfuscationResult = JavaScriptObfuscator.obfuscate(
      originalCode,
      OBFUSCATOR_CONFIG
    );
    
    const obfuscatedCode = obfuscationResult.getObfuscatedCode();
    const obfuscatedSize = obfuscatedCode.length;
    stats.totalObfuscatedSize += obfuscatedSize;
    
    // 写入文件
    fs.writeFileSync(outputPath, obfuscatedCode, 'utf8');
    
    const endTime = Date.now();
    const timeCost = endTime - startTime;
    
    // 计算变化
    const sizeDiff = obfuscatedSize - originalSize;
    const sizeDiffPercent = ((sizeDiff / originalSize) * 100).toFixed(2);
    
    console.log(`   📊 混淆后: ${(obfuscatedSize / 1024).toFixed(2)} KB`);
    console.log(`   📈 大小变化: ${sizeDiff > 0 ? '+' : ''}${sizeDiffPercent}%`);
    console.log(`   ⏱️ 耗时: ${timeCost}ms`);
    console.log(`   ✅ 输出: ${outputFilename}`);
    
    // 验证混淆效果
    verifyObfuscation(filename, originalCode, obfuscatedCode);
    
    stats.success++;
    return true;
    
  } catch (error) {
    console.error(`❌ 混淆失败 ${filename}:`, error.message);
    stats.failed++;
    return false;
  }
}

// 验证混淆效果
function verifyObfuscation(filename, original, obfuscated) {
  const originalLines = original.split('\n').length;
  const obfuscatedLines = obfuscated.split('\n').length;
  
  // 检查关键标识符是否被混淆
  const originalIdentifiers = extractIdentifiers(original);
  const obfuscatedIdentifiers = extractIdentifiers(obfuscated);
  
  // 计算混淆率（标识符被重命名的比例）
  let obfuscatedCount = 0;
  for (const id of originalIdentifiers) {
    if (!obfuscated.includes(id)) {
      obfuscatedCount++;
    }
  }
  
  const obfuscationRate = originalIdentifiers.length > 0 
    ? (obfuscatedCount / originalIdentifiers.length * 100).toFixed(1)
    : '0.0';
  
  console.log(`   🔒 混淆强度: ${obfuscationRate}%`);
  console.log(`   📝 行数: ${originalLines} → ${obfuscatedLines}`);
  
  return {
    lineReduction: ((originalLines - obfuscatedLines) / originalLines * 100).toFixed(1),
    obfuscationRate
  };
}

// 提取标识符（简化版）
function extractIdentifiers(code) {
  const identifiers = new Set();
  // 匹配函数名、类名、变量名
  const regex = /(?:function|class|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    identifiers.add(match[1]);
  }
  return Array.from(identifiers);
}

// 显示混淆配置摘要
function showConfigSummary() {
  console.log('\n⚙️ 混淆配置摘要:');
  console.log('='.repeat(40));
  console.log(`控制流扁平化: ${OBFUSCATOR_CONFIG.controlFlowFlattening ? '✅ 启用' : '❌ 禁用'}`);
  console.log(`字符串编码: ${OBFUSCATOR_CONFIG.stringArray ? '✅ 启用' : '❌ 禁用'}`);
  console.log(`调试保护: ${OBFUSCATOR_CONFIG.debugProtection ? '✅ 启用' : '❌ 禁用'}`);
  console.log(`死代码注入: ${OBFUSCATOR_CONFIG.deadCodeInjection ? '✅ 启用' : '❌ 禁用'}`);
  console.log(`全局变量重命名: ${OBFUSCATOR_CONFIG.renameGlobals ? '✅ 启用' : '❌ 禁用'}`);
  console.log(`自防御: ${OBFUSCATOR_CONFIG.selfDefending ? '✅ 启用' : '❌ 禁用'}`);
}

// 主函数
async function main() {
  console.log('🚀 开始混淆处理...\n');
  
  // 显示配置
  showConfigSummary();
  
  console.log('\n' + '='.repeat(50));
  
  // 批量混淆
  for (const filename of TARGET_FILES) {
    obfuscateFile(filename);
  }
  
  // 输出统计
  console.log('\n' + '='.repeat(50));
  console.log('📊 处理完成统计:');
  console.log('='.repeat(50));
  console.log(`✅ 成功: ${stats.success} 个文件`);
  console.log(`❌ 失败: ${stats.failed} 个文件`);
  console.log(`📈 成功率: ${(stats.success / stats.total * 100).toFixed(1)}%`);
  
  if (stats.success > 0) {
    const totalReduction = ((stats.totalOriginalSize - stats.totalObfuscatedSize) / stats.totalOriginalSize * 100).toFixed(2);
    console.log(`\n📦 大小统计:`);
    console.log(`   原始总大小: ${(stats.totalOriginalSize / 1024).toFixed(2)} KB`);
    console.log(`   混淆总大小: ${(stats.totalObfuscatedSize / 1024).toFixed(2)} KB`);
    console.log(`   总体变化: ${totalReduction}%`);
    
    console.log(`\n📁 输出文件位置: ${PATHS.outputDir}`);
    console.log(`   每个文件已重命名为 .min.js 格式`);
  }
  
  console.log('\n🎯 混淆完成！');
  
  // 显示使用提示
  console.log('\n💡 使用提示:');
  console.log('1. 混淆后的文件在 js-dist/ 目录下');
  console.log('2. 在生产环境中使用 .min.js 文件');
  console.log('3. 原始文件仍保留在 js/ 目录中');
  console.log('4. 如需调整混淆强度，请修改 obfuscator.config.js');
}

// 执行主函数
main().catch(error => {
  console.error('❌ 程序执行失败:', error);
  process.exit(1);
});