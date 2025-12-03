const fs = require('fs');
const path = require('path');

// 读取配置
const config = JSON.parse(fs.readFileSync('obfuscate-config.json', 'utf8'));
const JS_DIST_DIR = './js-dist';

// 确保输出目录存在
if (!fs.existsSync(JS_DIST_DIR)) {
  fs.mkdirSync(JS_DIST_DIR, { recursive: true });
}

console.log('🚀 开始处理JavaScript文件混淆\n');

// 处理每个文件组
for (const [groupName, filePaths] of Object.entries(config.files)) {
  console.log(`📦 处理组: ${groupName}`);
  
  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  文件不存在: ${filePath}`);
      continue;
    }
    
    try {
      const fileName = path.basename(filePath);
      const outputName = fileName.replace('.js', '.min.js');
      const outputPath = path.join(JS_DIST_DIR, outputName);
      
      console.log(`  🔄 ${fileName} -> ${outputName}`);
      
      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 基础压缩（移除注释和空白）
      let compressed = content
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')  // 移除注释
        .replace(/\s+/g, ' ')                     // 合并空白
        .replace(/\s*([{}();,:])\s*/g, '$1')      // 移除符号周围的空白
        .trim();
      
      // 简单的变量名混淆（只混淆私有变量）
      const varMap = new Map();
      let varCounter = 0;
      
      compressed = compressed.replace(
        /(?:var|let|const)\s+(_[a-zA-Z0-9_$]+)\s*=/g, 
        (match, varName) => {
          if (!varMap.has(varName)) {
            varMap.set(varName, `_0x${(varCounter++).toString(16)}`);
          }
          return match.replace(varName, varMap.get(varName));
        }
      );
      
      // 写入混淆后文件
      fs.writeFileSync(outputPath, compressed);
      
      // 显示压缩率
      const originalSize = content.length;
      const compressedSize = compressed.length;
      const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      console.log(`    📊 压缩: ${originalSize} → ${compressedSize} (减小${ratio}%)`);
      
    } catch (error) {
      console.log(`    ❌ 错误: ${error.message}`);
    }
  }
  console.log('');
}

console.log('✅ 基础混淆完成');
console.log(`📁 输出目录: ${JS_DIST_DIR}`);
console.log('\n📋 生成的文件:');
const files = fs.readdirSync(JS_DIST_DIR);
files.forEach(file => {
  const stats = fs.statSync(path.join(JS_DIST_DIR, file));
  console.log(`  ${file} (${Math.ceil(stats.size / 1024)}KB)`);
});
