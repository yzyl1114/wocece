<?php
// test_simple.php - 简化测试
echo "=== 配置文件测试 ===\n\n";

// 测试1：检查配置文件
$configFile = 'config/secure_keys.php';
if (file_exists($configFile)) {
    echo "✅ 配置文件存在: $configFile\n";
    
    // 读取前几行看看
    $lines = file($configFile, FILE_IGNORE_NEW_LINES);
    echo "✅ 文件行数: " . count($lines) . "\n";
    
    // 检查关键内容
    foreach ($lines as $line) {
        if (strpos($line, 'ALIPAY_APP_ID') !== false) {
            echo "✅ 找到支付宝APP_ID配置\n";
            break;
        }
    }
} else {
    echo "❌ 配置文件不存在\n";
    echo "当前路径: " . __DIR__ . "\n";
}

// 测试2：检查权限
echo "\n=== 文件权限 ===\n";
$files = [
    'config/secure_keys.php' => '应该为600',
    'config/.htaccess' => '应该为644',
    'config/index.html' => '应该为644'
];

foreach ($files as $file => $expected) {
    if (file_exists($file)) {
        $perms = substr(sprintf('%o', fileperms($file)), -3);
        $icon = ($perms === '600' || $perms === '644') ? '✅' : '⚠️';
        echo "$icon $file - 权限: $perms ($expected)\n";
    } else {
        echo "❌ $file 不存在\n";
    }
}

// 测试3：检查目录
echo "\n=== 目录结构 ===\n";
exec('ls -la config/', $output);
foreach ($output as $line) {
    echo $line . "\n";
}

echo "\n=== 测试完成 ===\n";
echo "如果看到✅表示正常，❌表示有问题\n";
?>