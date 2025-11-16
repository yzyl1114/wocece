<?php
// generate_codes.php - 批量生成兑换码
header('Content-Type: application/json; charset=utf-8');

// 接收前端参数
$input = json_decode(file_get_contents('php://input'), true);
$requestTestId = $input['testId'] ?? '6';
$requestCount = $input['count'] ?? 10;
$requestMonths = $input['expires_months'] ?? 12;

// 配置 - 使用前端传过来的参数
$config = [
    'count' => intval($requestCount), // 使用前端传的数量
    'testId' => $requestTestId, // ⭐ 使用前端传的测试ID
    'length' => 12, // 兑换码长度
    'prefix' => '', // 前缀
    'expires_months' => intval($requestMonths) // 使用前端传的有效期
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
            'testId' => $config['testId'], // ⭐ 这里现在会使用正确的测试ID
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
        'testId' => $config['testId'] // ⭐ 返回实际使用的测试ID
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        'success' => false,
        'error' => '文件保存失败'
    ], JSON_UNESCAPED_UNICODE);
}
?>