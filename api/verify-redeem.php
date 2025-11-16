<?php
error_log("兑换码验证开始: " . date('Y-m-d H:i:s'));
error_log("请求数据: " . json_encode($input));

// verify-redeem.php - 兑换码验证API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $code = $input['code'] ?? '';
    $testId = $input['testId'] ?? '';
    $userId = $input['userId'] ?? '';

    if (!$code || !$testId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => '缺少必要参数'
        ]);
        exit;
    }

    try {
        // 加载兑换码数据
        $dataFile = '/data/wwwroot/wocece/data/redeem-codes.json';
        if (!file_exists($dataFile)) {
            throw new Exception('兑换码数据文件不存在');
        }

        $data = json_decode(file_get_contents($dataFile), true);
        $redeemCodes = $data['redeemCodes'] ?? [];

        // 验证兑换码
        if (!isset($redeemCodes[$code])) {
            echo json_encode([
                'success' => false,
                'error' => '兑换码不存在'
            ]);
            exit;
        }

        $redeemInfo = $redeemCodes[$code];

        // 检查状态
        if ($redeemInfo['status'] !== 'active') {
            echo json_encode([
                'success' => false,
                'error' => '兑换码已被使用'
            ]);
            exit;
        }

        // 检查有效期
        if (isset($redeemInfo['expiresAt']) && strtotime($redeemInfo['expiresAt']) < time()) {
            echo json_encode([
                'success' => false,
                'error' => '兑换码已过期'
            ]);
            exit;
        }

        // 检查测试ID匹配
        if ($redeemInfo['testId'] !== $testId) {
            echo json_encode([
                'success' => false,
                'error' => '该兑换码不适用于此测试'
            ]);
            exit;
        }

        // 标记为已使用
        $redeemCodes[$code]['status'] = 'used';
        $redeemCodes[$code]['usedAt'] = date('c');
        $redeemCodes[$code]['usedBy'] = $userId;

        // 保存更新
        $data['redeemCodes'] = $redeemCodes;
        if (file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
            error_log("文件保存成功: " . $code);
            // 记录使用日志
            file_put_contents('/data/wwwroot/wocece/data/redeem-logs.log', 
                date('Y-m-d H:i:s') . " - 兑换成功: {$code} - 测试: {$testId} - 用户: {$userId}\n", 
                FILE_APPEND
            );

            echo json_encode([
                'success' => true,
                'message' => '兑换成功',
                'testId' => $testId
            ]);
        } else {
            error_log("文件保存失败: " . $dataFile);
            $error = error_get_last();
            error_log("错误信息: " . $error['message']);            
            throw new Exception('系统错误，请重试');
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    exit;
}

// GET请求返回信息
echo json_encode([
    'status' => 'redeem_verify_api',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>