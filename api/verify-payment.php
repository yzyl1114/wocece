<?php
// verify-payment.php - 支付状态验证
require_once 'pay.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type');
    
    $input = json_decode(file_get_contents('php://input'), true);
    $testId = $input['testId'] ?? '';
    $userId = $input['userId'] ?? '';
    
    if (!$testId || !$userId) {
        echo json_encode(['success' => false, 'paid' => false, 'error' => '缺少参数']);
        exit;
    }
    
    try {
        // 这里应该查询数据库，简化实现使用文件记录
        $paid = $this->checkPaymentStatus($testId, $userId);
        
        echo json_encode([
            'success' => true,
            'paid' => $paid,
            'testId' => $testId
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'paid' => false,
            'error' => $e->getMessage()
        ]);
    }
    exit;
}

// 检查支付状态（实际应该查询数据库）
private function checkPaymentStatus($testId, $userId) {
    $paymentFile = 'payments.log';
    
    if (!file_exists($paymentFile)) {
        return false;
    }
    
    $content = file_get_contents($paymentFile);
    // 查找包含测试ID和用户ID的成功支付记录
    $pattern = "/TEST_{$testId}_{$userId}_/";
    
    return preg_match($pattern, $content) > 0;
}

// 直接访问返回信息
echo json_encode([
    'status' => 'payment_verify_api',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>