<?php
/**
 * tests.json加密脚本
 * 在项目根目录执行：php encrypt_tests.php
 */

// 配置
$sourceFile = 'data/tests.json';
$encryptedFile = 'data/tests.enc';
$backupDir = 'data/backup/';

echo "🔐 开始加密测试数据...\n";
echo "工作目录: " . __DIR__ . "\n";

// 检查当前目录
if (!file_exists($sourceFile)) {
    echo "❌ 错误：在当前目录未找到 data/tests.json\n";
    echo "请确保在项目根目录执行此脚本\n";
    echo "当前目录文件列表:\n";
    system("ls -la");
    exit(1);
}

// 创建备份目录
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
    echo "✅ 创建备份目录: $backupDir\n";
}

// 读取原始数据
echo "📖 读取源文件: $sourceFile\n";
$jsonData = file_get_contents($sourceFile);
$data = json_decode($jsonData, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo "❌ JSON解析错误: " . json_last_error_msg() . "\n";
    exit(1);
}

echo "📊 数据统计:\n";
echo "  - 测试数量: " . count($data) . "\n";
echo "  - 原始大小: " . number_format(strlen($jsonData)) . " bytes\n";

// 加载安全配置获取加密密钥
$configFile = 'config/secure_keys.php';
if (file_exists($configFile)) {
    require_once $configFile;
    
    if (defined('API_SECRET_KEY')) {
        $encryptionKey = API_SECRET_KEY;
        echo "✅ 使用配置文件中的API密钥\n";
    } else {
        $encryptionKey = 'wocece_test_data_key_' . date('Ym');
        echo "⚠️ 警告: 配置文件未定义API_SECRET_KEY，使用默认密钥\n";
    }
} else {
    // 生成固定密钥
    $encryptionKey = 'wocece_secure_test_key_202412';
    echo "⚠️ 警告: 配置文件不存在，使用默认密钥\n";
    echo "⚠️ 生产环境必须配置 config/secure_keys.php\n";
}

// 加密数据
function encryptData($data, $key) {
    $method = 'AES-256-CBC';
    $ivLength = openssl_cipher_iv_length($method);
    $iv = openssl_random_pseudo_bytes($ivLength);
    
    $json = json_encode($data, JSON_UNESCAPED_UNICODE);
    $encrypted = openssl_encrypt($json, $method, $key, OPENSSL_RAW_DATA, $iv);
    
    if ($encrypted === false) {
        throw new Exception('加密失败: ' . openssl_error_string());
    }
    
    // 组合IV和加密数据
    $combined = $iv . $encrypted;
    $encoded = base64_encode($combined);
    
    // 添加验证头
    $hash = hash_hmac('sha256', $encoded, $key);
    $result = [
        'data' => $encoded,
        'hash' => $hash,
        'ver' => '1.0',
        'time' => time(),
        'method' => $method
    ];
    
    return base64_encode(json_encode($result, JSON_UNESCAPED_UNICODE));
}

// 执行加密
echo "🔒 开始加密数据...\n";
try {
    $encryptedData = encryptData($data, $encryptionKey);
    echo "✅ 数据加密成功\n";
    echo "  - 加密方法: AES-256-CBC\n";
    echo "  - 加密后大小: " . number_format(strlen($encryptedData)) . " bytes\n";
} catch (Exception $e) {
    echo "❌ 加密失败: " . $e->getMessage() . "\n";
    exit(1);
}

// 保存加密文件
echo "💾 保存加密文件: $encryptedFile\n";
if (file_put_contents($encryptedFile, $encryptedData)) {
    echo "✅ 加密文件保存成功\n";
    
    // 创建备份
    $backupFile = $backupDir . 'tests_backup_' . date('Ymd_His') . '.json';
    if (copy($sourceFile, $backupFile)) {
        echo "✅ 备份创建成功: $backupFile\n";
    } else {
        echo "⚠️ 备份创建失败\n";
    }
    
    // 验证文件
    if (file_exists($encryptedFile)) {
        $fileSize = filesize($encryptedFile);
        echo "✅ 文件验证: 存在 (" . number_format($fileSize) . " bytes)\n";
    }
    
} else {
    echo "❌ 加密文件保存失败\n";
    exit(1);
}

// 安全建议
echo "\n🔐 安全建议:\n";
echo "  1. 备份原始文件: data/tests.json\n";
echo "  2. 设置加密文件权限: chmod 600 data/tests.enc\n";
echo "  3. 测试解密接口是否能正常读取数据\n";
echo "  4. 确认无误后，可考虑删除或重命名原始文件\n";

echo "\n📋 文件操作建议:\n";
echo "  重命名原始文件:\n";
echo "    mv data/tests.json data/tests.json.bak\n";
echo "  \n";
echo "  设置文件权限:\n";
echo "    chmod 600 data/tests.enc\n";
echo "    chmod 700 data/backup/\n";

echo "\n🎉 加密完成！\n";
echo "下一步操作:\n";
echo "  1. 上传加密文件到服务器\n";
echo "  2. 部署解密接口 api/get-tests.php\n";
echo "  3. 修改前端代码使用新的API\n";
echo "  4. 在服务器上设置文件权限\n";
