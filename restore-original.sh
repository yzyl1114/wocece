#!/bin/bash
echo "🔄 还原到原始结构"

# 查找最新的备份
latest_backup=$(ls -d backup_* 2>/dev/null | tail -1)

if [ -z "$latest_backup" ]; then
    echo "❌ 未找到备份文件"
    exit 1
fi

echo "📂 找到备份: $latest_backup"
echo "⚠️  这将覆盖 packaged/ 目录中的修改"

read -p "确定要还原吗？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消还原"
    exit 0
fi

# 还原HTML文件
echo "📄 还原HTML文件..."
cp "$latest_backup"/*.html ./

echo "✅ 还原完成！"
echo "📋 现在可以运行原始部署脚本: ./deploy-fast.sh"