#!/bin/bash
echo "🚀 开始一键部署（安全加固版 - 优化速度）..."

# ========== 1. 只同步必要文件（排除node_modules等大文件） ==========
echo "📤 同步文件到服务器（排除大文件）..."

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
  --exclude='*' \
  /Users/huixu/Documents/GitHub/wocece/ \
  root@39.106.40.60:/data/wwwroot/wocece/

# ========== 2. 同步特殊权限文件 ==========
echo "📁 同步特殊权限文件..."
rsync -avz --no-perms --no-owner --no-group --progress \
  /Users/huixu/Documents/GitHub/wocece/config/.htaccess \
  root@39.106.40.60:/data/wwwroot/wocece/config/

rsync -avz --no-perms --no-owner --no-group --progress \
  /Users/huixu/Documents/GitHub/wocece/config/index.html \
  root@39.106.40.60:/data/wwwroot/wocece/config/

# ========== 3. 服务器权限设置 ==========
echo "🔧 在服务器上设置权限..."
ssh root@39.106.40.60 "
cd /data/wwwroot/wocece/ && \

# 清理不需要的文件
echo '🧹 清理服务器上的大文件...'
if [ -d 'node_modules' ]; then
    rm -rf node_modules/
    echo '🗑️ 已删除 node_modules/'
fi
if [ -d 'js' ]; then
    echo '📝 保留 js/ 目录用于对比'
fi

# 基本权限设置
chown -R nginx:nginx . && \
find . -type d -exec chmod 755 {} \; && \
find . -type f -exec chmod 644 {} \; && \

# ========== 安全加固权限设置 ==========

# 1. 配置文件特殊权限
if [ -f 'config/secure_keys.php' ]; then
    echo '🔐 设置配置文件权限...'
    chmod 600 config/secure_keys.php
    chmod 644 config/.htaccess
    chmod 644 config/index.html
fi

# 2. API目录保护
echo '🛡️ 设置API目录权限...'
chmod 755 api/
if [ -f 'api/security.php' ]; then
    chmod 644 api/security.php
fi

# 3. 数据目录权限
echo '💾 设置数据目录权限...'
chmod 755 data/
mkdir -p data/cache/
chmod 755 data/cache/
chmod 666 data/*.json 2>/dev/null || true
rm -f data/*.lock data/*.tmp 2>/dev/null || true

# 4. 日志目录权限
echo '📝 设置日志目录权限...'
mkdir -p logs/
chmod 755 logs/
mkdir -p logs/security/ logs/orders/ logs/notify/ logs/notify/processed/ logs/errors/
chmod 755 logs/security/ logs/orders/ logs/notify/ logs/notify/processed/ logs/errors/
# 创建索引保护文件（简化内容避免特殊字符问题）
for dir in logs/ logs/security/ logs/orders/ logs/notify/ logs/errors/; do
    if [ ! -f \"\$dir/index.html\" ]; then
        echo '<html><head><title>403 Forbidden</title></head><body><h1>Access Forbidden</h1></body></html>' > \"\$dir/index.html\"
        chmod 644 \"\$dir/index.html\"
    fi
done

# 5. JS混淆文件权限特别处理
echo '📜 设置JS文件权限...'
if [ -d 'js-dist' ]; then
    chmod 755 js-dist/
    find js-dist/ -name '*.js' -exec chmod 644 {} \; 2>/dev/null || true
    echo '✅ JS混淆文件权限设置完成'
fi

# 6. 特殊文件权限
echo '⚙️ 设置特殊文件权限...'
find . -name '*.php' -exec chmod 644 {} \; 2>/dev/null || true

# 7. 原有兑换码文件权限（保持兼容）
echo '🎫 设置兑换码文件权限...'
chmod 666 data/redeem-*.json data/redeem-*.log 2>/dev/null || true
rm -f data/redeem-codes.json.lock data/redeem-codes.json.tmp 2>/dev/null || true

# 8. 检查关键文件
echo '🔍 检查关键文件...'
if [ ! -f 'config/secure_keys.php' ]; then
    echo '⚠️ 警告: config/secure_keys.php 文件不存在！'
    echo '⚠️ 支付接口将使用硬编码密钥，建议立即配置！'
fi

if [ ! -f 'api/security.php' ]; then
    echo '⚠️ 警告: api/security.php 文件不存在！'
fi

# 9. 重启PHP服务
echo '🔄 重启PHP-FPM...'
systemctl restart php-fpm

# 10. 验证部署
echo '✅ 验证部署...'
echo '📋 目录结构检查:'
ls -la config/ 2>/dev/null | head -5
echo ''
echo '🔐 配置文件权限检查:'
if [ -f 'config/secure_keys.php' ]; then
    perms=\$(stat -c '%a' config/secure_keys.php)
    if [ \"\$perms\" = '600' ]; then
        echo '✅ config/secure_keys.php 权限正确 (600)'
    else
        echo '⚠️ config/secure_keys.php 权限异常: '\$perms' (应为600)'
    fi
fi

echo ''
echo '📜 JS混淆文件检查:'
if [ -d 'js-dist' ]; then
    count=\$(find js-dist/ -name '*.min.js' 2>/dev/null | wc -l)
    echo \"✅ 找到 \$count 个混淆后的JS文件\"
    ls -lh js-dist/*.min.js 2>/dev/null | head -3
else
    echo '⚠️ 警告: js-dist 目录不存在！'
fi

echo ''
echo '📁 日志目录检查:'
ls -ld logs/ logs/*/ 2>/dev/null | head -5

echo ''
echo '💾 项目大小统计:'
du -sh --exclude=node_modules . 2>/dev/null || echo '无法统计大小'

echo ''
echo '🚀 安全加固部署完成！'
echo '📌 注意：'
echo '   1. 首次支付测试建议使用小额测试（0.01元）'
echo '   2. 检查 logs/ 目录下是否有日志生成'
echo '   3. 访问 https://wocece.com/api/pay.php 验证API状态'
"

echo ""
echo "🎉 部署完成！"
echo "📋 请执行以下验证步骤："
echo "   1. 访问 https://wocece.com/api/pay.php 查看API状态"
echo "   2. 访问 https://wocece.com/api/verify-payment.php 查看验证接口"
echo "   3. 进行0.01元小额支付测试"
echo "   4. 检查服务器 /data/wwwroot/wocece/logs/ 目录下日志文件"
echo "   5. 确认原有兑换码功能正常"
echo "   6. 测试结果页面JS是否正常加载"