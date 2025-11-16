#!/bin/bash
echo "🚀 开始一键部署..."
rsync -avz --no-perms --no-owner --no-group --progress /Users/huixu/Documents/GitHub/wocece/ root@39.106.40.60:/data/wwwroot/wocece/
ssh root@39.106.40.60 "cd /data/wwwroot/wocece/ && chown -R nginx:nginx . && find . -type d -exec chmod 755 {} \; && find . -type f -exec chmod 644 {} \; && chmod 666 data/redeem-*.json data/redeem-*.log 2>/dev/null || true && systemctl restart php-fpm && echo '✅ 部署完成'"
