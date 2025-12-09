#!/bin/bash
echo "🔄 我测测 - 一键打包部署工作流"
echo "=".repeat(50)

# 1. 检查环境
echo "🔧 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js"
    exit 1
fi

# 2. 备份原始HTML文件
echo "💾 备份原始HTML文件..."
backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"
cp *.html "$backup_dir/" 2>/dev/null || true
echo "✅ 备份到: $backup_dir"

# 3. 打包
echo "📦 开始打包..."
node package-for-deploy.js

if [ $? -ne 0 ]; then
    echo "❌ 打包失败"
    exit 1
fi

# 4. 本地测试（可选）
read -p "🧪 是否本地测试打包结果？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 启动本地测试服务器..."
    cd packaged
    python3 -m http.server 8888 &
    TEST_PID=$!
    
    echo "✅ 服务器启动在 http://localhost:8888"
    echo "📱 请打开浏览器测试，完成后按 Enter 继续部署..."
    read
    
    kill $TEST_PID 2>/dev/null || true
    cd ..
fi

# 5. 部署
read -p "🚀 是否部署到服务器？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 开始部署..."
    ./deploy-from-packaged.sh
else
    echo "📁 打包完成，文件在 packaged/ 目录"
    echo "🔄 如需部署请运行: ./deploy-from-packaged.sh"
fi

echo ""
echo "🎉 工作流完成！"
echo "📌 注意："
echo "   - 原始HTML文件已备份到 $backup_dir"
echo "   - 如需还原，从备份目录复制HTML文件"
echo "=".repeat(50)