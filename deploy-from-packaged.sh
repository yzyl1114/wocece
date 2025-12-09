#!/bin/bash
echo "🚀 开始从 packaged 目录部署..."

# 检查 packaged 目录是否存在
if [ ! -d "packaged" ]; then
    echo "❌ packaged 目录不存在，请先运行打包脚本："
    echo "   node package-for-deploy.js"
    exit 1
fi

echo "📁 切换到 packaged 目录..."
cd packaged

# 使用类似 deploy-fast.sh 的 rsync 命令
echo "📤 同步文件到服务器..."

rsync -avz --no-perms --no-owner --no-group --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='npm-debug.log*' \
  --exclude='logs/' \
  --exclude='data/cache/' \
  --exclude='config/.htaccess' \
  --exclude='config/index.html' \
  --include='*.html' \
  --include='*.css' \
  --include='*.js' \
  --include='*.php' \
  --include='*.json' \
  --include='js-dist/' \
  --include='js-dist/*' \
  --include='css/' \
  --include='css/*' \
  --include='config/' \
  --include='config/*' \
  --include='api/' \
  --include='api/*' \
  --include='data/' \
  --include='data/*.json' \
  --include='images/' \
  --include='images/*' \
  --exclude='*' \
  ./ \
  root@39.106.40.60:/data/wwwroot/wocece/

# 同步特殊权限文件
echo "📁 同步特殊权限文件..."
rsync -avz --no-perms --no-owner --no-group --progress \
  ./config/.htaccess \
  root@39.106.40.60:/data/wwwroot/wocece/config/

rsync -avz --no-perms --no-owner --no-group --progress \
  ./config/index.html \
  root@39.106.40.60:/data/wwwroot/wocece/config/

echo "✅ 文件同步完成！"
echo ""
echo "📋 部署完成！"
echo "🌐 访问 https://wocece.com 测试"