// ============================================
// package-for-deploy.js - 适配现有部署脚本的打包方案
// 使用方法：node package-for-deploy.js
// ============================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 开始打包适配部署脚本...');
console.log('📌 适配: deploy-fast.sh 的 rsync 部署方式');

// 1. 清理旧的打包目录
const packagedDir = path.join(__dirname, 'packaged');
if (fs.existsSync(packagedDir)) {
  fs.rmSync(packagedDir, { recursive: true, force: true });
}
fs.mkdirSync(packagedDir, { recursive: true });

// 2. 复制原始项目结构
console.log('📁 复制项目结构...');
const dirsToCopy = ['api', 'config', 'data', 'css', 'js-dist'];
dirsToCopy.forEach(dir => {
  if (fs.existsSync(dir)) {
    const destDir = path.join(packagedDir, dir);
    fs.mkdirSync(destDir, { recursive: true });
    
    // 复制文件（保持原有权限）
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const src = path.join(dir, file);
      const dest = path.join(destDir, file);
      
      // 跳过.gitkeep等隐藏文件
      if (!file.startsWith('.')) {
        try {
          const stats = fs.statSync(src);
          if (stats.isDirectory()) {
            // 递归复制目录
            copyDirRecursive(src, dest);
          } else {
            fs.copyFileSync(src, dest);
          }
        } catch (err) {
          console.log(`  ⚠️ 跳过: ${src} (${err.message})`);
        }
      }
    });
    console.log(`  ✓ 复制: ${dir}/`);
  }
});

// 3. 处理JS文件 - 合并关键文件，保留结构
console.log('📦 处理JS文件...');
const jsFilesToMerge = [
  'js/app.js',
  'js/storage.js',
  'js/payment.js',
  'js/testing.js'
];

// 创建一个合并的核心JS文件
let coreJS = `// ============================================
// 我测测 - 核心合并文件
// 生成时间: ${new Date().toLocaleString()}
// 哈希: ${crypto.randomBytes(4).toString('hex')}
// ============================================\n\n`;

jsFilesToMerge.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    coreJS += `\n// ========== ${file} ==========\n`;
    coreJS += content + '\n';
    console.log(`  ✓ 合并: ${file}`);
  }
});

// 添加 domain-guard.js 到开头
if (fs.existsSync('js/domain-guard.js')) {
  const domainGuard = fs.readFileSync('js/domain-guard.js', 'utf8');
  coreJS = `// ========== 域名保护 ==========\n${domainGuard}\n\n${coreJS}`;
  console.log('  ✓ 添加: js/domain-guard.js (域名保护)');
}

// 创建 js-dist 目录（如果不存在）
const jsDistDir = path.join(packagedDir, 'js-dist');
if (!fs.existsSync(jsDistDir)) {
  fs.mkdirSync(jsDistDir, { recursive: true });
}

// 保存合并后的核心JS文件
const coreJSFileName = 'core.bundle.min.js';
const coreJSPath = path.join(jsDistDir, coreJSFileName);
fs.writeFileSync(coreJSPath, coreJS);
console.log(`✅ 核心JS合并完成: js-dist/${coreJSFileName}`);

// 4. 处理HTML文件 - 修改引用路径
console.log('📄 处理HTML文件...');
const htmlFiles = [
  'index.html',
  'detail.html',
  'testing.html',
  'result.html',
  'payment-success.html',
  'redeem.html',
  'discover.html',
  'feedback.html'
];

htmlFiles.forEach(htmlFile => {
  if (fs.existsSync(htmlFile)) {
    let content = fs.readFileSync(htmlFile, 'utf8');
    
    // 替换JS引用
    content = replaceJSReferences(content, coreJSFileName);
    
    // 保存到packaged目录
    fs.writeFileSync(path.join(packagedDir, htmlFile), content);
    console.log(`  ✓ 处理: ${htmlFile}`);
  }
});

// 5. 复制图片资源（保持原有结构）
console.log('🖼️ 复制图片资源...');
if (fs.existsSync('images')) {
  const imagesDest = path.join(packagedDir, 'images');
  fs.mkdirSync(imagesDest, { recursive: true });
  
  // 复制所有图片
  copyDirRecursive('images', imagesDest);
  console.log(`  ✓ 复制: images/ 目录`);
}

// 6. 创建部署说明
const deployInfo = `# 我测测 - 打包部署版本 (适配 deploy-fast.sh)

## 打包说明
- 生成时间: ${new Date().toLocaleString()}
- 打包方式: 合并核心JS，保持API结构不变
- 适配脚本: deploy-fast.sh (rsync)

## 文件变更
1. **HTML文件**: 
   - 移除了对 js/app.js, js/payment.js 等的引用
   - 添加了对 js-dist/core.bundle.min.js 的引用

2. **JS文件**:
   - 合并了 app.js, storage.js, payment.js, testing.js
   - 添加了 domain-guard.js
   - 保存在 js-dist/core.bundle.min.js

3. **其他文件**:
   - API、CSS、数据文件保持原样
   - 图片资源保持原样

## 部署步骤
1. 运行部署脚本: ./deploy-fast.sh
2. 脚本会自动同步 packaged/ 目录到服务器
3. 原有权限设置保持不变

## 还原方法
如需还原到原始结构，请使用原始代码仓库。

生成者: package-for-deploy.js
`;

fs.writeFileSync(path.join(packagedDir, 'DEPLOY-INFO.md'), deployInfo);

console.log('\n🎉 打包完成！');
console.log('='.repeat(60));
console.log(`📁 输出目录: ${packagedDir}`);
console.log(`📄 处理HTML: ${htmlFiles.length} 个文件`);
console.log(`📦 合并JS: ${jsFilesToMerge.length} 个文件 → js-dist/${coreJSFileName}`);
console.log(`🖼️ 图片资源: 保持原结构`);
console.log('='.repeat(60));
console.log('\n🚀 下一步：');
console.log('1. 测试打包结果:');
console.log(`   cd ${packagedDir} && python3 -m http.server 8000`);
console.log('2. 部署到服务器:');
console.log('   ./deploy-from-packaged.sh  （见下一步创建的脚本）');
console.log('='.repeat(60));

// ========== 工具函数 ==========
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (!entry.name.startsWith('.')) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function replaceJSReferences(htmlContent, coreJSFile) {
  // 需要移除的JS文件列表
  const jsFilesToRemove = [
    'js/domain-guard.js',
    'js/app.js', 
    'js/storage.js',
    'js/payment.js',
    'js/testing.js',
    'js/calculation.js',
    'js/result-manager.js',
    'js/template-engine.js',
    'js/chart-renderer.js',
    'js/report-components.js'
  ];
  
  let result = htmlContent;
  
  // 移除原有JS引用
  jsFilesToRemove.forEach(jsFile => {
    const regex = new RegExp(`<script[^>]*src=["']${jsFile}["'][^>]*></script>\\s*`, 'gi');
    result = result.replace(regex, '');
  });
  
  // 添加核心JS引用（在body结束前）
  const coreJSScript = `<script src="js-dist/${coreJSFile}"></script>`;
  
  // 检查是否已有其他js-dist引用
  if (!result.includes('js-dist/')) {
    // 没有则直接添加在body结束前
    result = result.replace(/<\/body>/i, `  ${coreJSScript}\n</body>`);
  } else {
    // 有则替换第一个js-dist引用
    const jsDistRegex = /<script[^>]*src=["']js-dist\/[^"']*["'][^>]*><\/script>/i;
    if (jsDistRegex.test(result)) {
      result = result.replace(jsDistRegex, coreJSScript);
    } else {
      result = result.replace(/<\/body>/i, `  ${coreJSScript}\n</body>`);
    }
  }
  
  return result;
}