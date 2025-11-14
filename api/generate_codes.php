<?php
// generate_codes.php - 批量生成兑换码
header('Content-Type: application/json; charset=utf-8');

// 配置
$config = [
    'count' => 100, // 生成数量
    'testId' => '6', // 绑定的测试ID
    'length' => 12, // 兑换码长度
    'prefix' => '', // 前缀
    'expires_months' => 12 // 有效期月数
];

function generateCode($length = 12) {
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $code = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $code;
}

// 加载现有数据
$dataFile = '/data/wwwroot/wocece/data/redeem-codes.json';
$existingData = [];

if (file_exists($dataFile)) {
    $existingData = json_decode(file_get_contents($dataFile), true);
    if (!isset($existingData['redeemCodes'])) {
        $existingData['redeemCodes'] = [];
    }
}

// 生成新兑换码
$newCodes = [];
$generatedCount = 0;

while ($generatedCount < $config['count']) {
    $code = $config['prefix'] . generateCode($config['length']);
    
    // 确保不重复
    if (!isset($existingData['redeemCodes'][$code])) {
        $newCodes[] = $code;
        
        $existingData['redeemCodes'][$code] = [
            'testId' => $config['testId'],
            'status' => 'active',
            'createdAt' => date('c'),
            'expiresAt' => date('c', strtotime("+{$config['expires_months']} months"))
        ];
        
        $generatedCount++;
    }
}

// 保存数据
if (file_put_contents($dataFile, json_encode($existingData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo json_encode([
        'success' => true,
        'generated' => $generatedCount,
        'codes' => $newCodes,
        'testId' => $config['testId']
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        'success' => false,
        'error' => '文件保存失败'
    ], JSON_UNESCAPED_UNICODE);
}
?>