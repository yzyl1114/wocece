<?php
// notify.php - 支付宝异步通知处理（安全加固版）
// 创建时间：2025-12-01
// 修改说明：1. 增强安全性 2. 添加日志记录 3. 保持支付宝回调兼容性

// 设置时区
date_default_timezone_set('Asia/Shanghai');

// 只允许POST请求（支付宝回调使用POST）
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: text/plain; charset=utf-8');
    echo 'fail';
    error_log('[' . date('Y-m-d H:i:s') . '] notify.php - 非法请求方法: ' . $_SERVER['REQUEST_METHOD']);
    exit;
}

// 记录原始通知数据（用于调试和审计）
$rawData = file_get_contents('php://input');
$postData = $_POST;

// 加载安全配置
if (file_exists(dirname(__DIR__) . '/config/secure_keys.php')) {
    require_once dirname(__DIR__) . '/config/secure_keys.php';
}

// 初始化日志目录
$logDir = defined('NOTIFY_LOG_DIR') ? NOTIFY_LOG_DIR : dirname(__DIR__) . '/logs/notify/';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
    // 创建索引保护文件
    file_put_contents($logDir . 'index.html', '');
}

// 创建已处理订单目录
$processedDir = $logDir . 'processed/';
if (!is_dir($processedDir)) {
    mkdir($processedDir, 0755, true);
}

// 记录通知原始数据（用于调试）
$debugLog = [
    'time' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
    'raw_data_length' => strlen($rawData),
    'post_params_count' => count($postData),
    'type' => 'callback_received'
];

// 保存调试日志
$debugFile = $logDir . 'debug_' . date('Y-m-d') . '.log';
@file_put_contents(
    $debugFile,
    json_encode($debugLog, JSON_UNESCAPED_UNICODE) . PHP_EOL,
    FILE_APPEND | LOCK_EX
);

// 加载支付服务
require_once 'pay.php';

try {
    $alipay = new AlipayService();
    
    // 验证签名
    if (!$alipay->verifyNotify($postData)) {
        // 签名验证失败
        $errorLog = [
            'time' => date('Y-m-d H:i:s'),
            'status' => 'signature_failed',
            'out_trade_no' => $postData['out_trade_no'] ?? 'unknown',
            'trade_no' => $postData['trade_no'] ?? 'unknown',
            'trade_status' => $postData['trade_status'] ?? 'unknown',
            'amount' => $postData['total_amount'] ?? '0.00',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'error' => '支付宝签名验证失败'
        ];
        
        $errorFile = $logDir . 'error_' . date('Y-m-d') . '.log';
        @file_put_contents(
            $errorFile,
            json_encode($errorLog, JSON_UNESCAPED_UNICODE) . PHP_EOL,
            FILE_APPEND | LOCK_EX
        );
        
        // 记录详细错误数据（安全考虑，不记录完整数据）
        $detailFile = $logDir . 'details_' . date('Y-m-d') . '.log';
        @file_put_contents(
            $detailFile,
            date('Y-m-d H:i:s') . " - 签名验证失败 - IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . PHP_EOL,
            FILE_APPEND | LOCK_EX
        );
        
        echo 'fail';
        exit;
    }
    
    // 获取关键参数
    $outTradeNo = $postData['out_trade_no'] ?? '';
    $tradeNo = $postData['trade_no'] ?? '';
    $tradeStatus = $postData['trade_status'] ?? '';
    $totalAmount = $postData['total_amount'] ?? '0.00';
    $buyerId = $postData['buyer_id'] ?? '';
    $sellerId = $postData['seller_id'] ?? '';
    $gmtPayment = $postData['gmt_payment'] ?? date('Y-m-d H:i:s');
    
    // 验证必要参数
    if (empty($outTradeNo) || empty($tradeNo) || empty($tradeStatus)) {
        $errorLog = [
            'time' => date('Y-m-d H:i:s'),
            'status' => 'missing_params',
            'params_received' => array_keys($postData),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'error' => '缺少必要参数'
        ];
        
        $errorFile = $logDir . 'error_' . date('Y-m-d') . '.log';
        @file_put_contents($errorFile, json_encode($errorLog, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
        
        echo 'fail';
        exit;
    }
    
    // 记录通知日志
    $notifyLog = [
        'time' => date('Y-m-d H:i:s'),
        'out_trade_no' => $outTradeNo,
        'trade_no' => $tradeNo,
        'trade_status' => $tradeStatus,
        'amount' => $totalAmount,
        'buyer_id' => substr($buyerId, 0, 6) . '...', // 部分隐藏保护隐私
        'seller_id' => $sellerId,
        'gmt_payment' => $gmtPayment,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'status' => 'received'
    ];
    
    $notifyFile = $logDir . 'notify_' . date('Y-m-d') . '.log';
    @file_put_contents(
        $notifyFile,
        json_encode($notifyLog, JSON_UNESCAPED_UNICODE) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
    
    // 检查是否已经处理过（防止重复处理）
    $processedFile = $processedDir . $tradeNo . '.json';
    if (file_exists($processedFile)) {
        // 已经处理过，直接返回success避免支付宝重复通知
        $processedData = json_decode(file_get_contents($processedFile), true);
        
        $duplicateLog = [
            'time' => date('Y-m-d H:i:s'),
            'out_trade_no' => $outTradeNo,
            'trade_no' => $tradeNo,
            'status' => 'already_processed',
            'original_process_time' => $processedData['process_time'] ?? 'unknown',
            'current_time' => date('Y-m-d H:i:s')
        ];
        
        $duplicateFile = $logDir . 'duplicate_' . date('Y-m-d') . '.log';
        @file_put_contents(
            $duplicateFile,
            json_encode($duplicateLog, JSON_UNESCAPED_UNICODE) . PHP_EOL,
            FILE_APPEND | LOCK_EX
        );
        
        echo 'success';
        exit;
    }
    
    // 处理交易状态
    if ($tradeStatus === 'TRADE_SUCCESS' || $tradeStatus === 'TRADE_FINISHED') {
        // 解析订单信息
        // 订单格式: TEST_{testId}_{userId}_{timestamp}_{random}
        preg_match('/^TEST_([^_]+)_([^_]+)_/', $outTradeNo, $matches);
        $testId = $matches[1] ?? '';
        $userId = $matches[2] ?? '';
        
        if (empty($testId) || empty($userId)) {
            // 如果解析失败，尝试其他格式
            $parts = explode('_', $outTradeNo);
            if (count($parts) >= 4) {
                $testId = $parts[1] ?? '';
                $userId = $parts[2] ?? '';
            }
        }
        
        if (empty($testId) || empty($userId)) {
            $errorLog = [
                'time' => date('Y-m-d H:i:s'),
                'out_trade_no' => $outTradeNo,
                'trade_no' => $tradeNo,
                'status' => 'parse_failed',
                'error' => '无法解析订单号中的测试ID和用户ID',
                'pattern_used' => 'TEST_{testId}_{userId}_'
            ];
            
            $errorFile = $logDir . 'error_' . date('Y-m-d') . '.log';
            @file_put_contents($errorFile, json_encode($errorLog, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
            
            // 即使解析失败也返回success，避免支付宝重复通知
            echo 'success';
            exit;
        }
        
        // 更新支付状态（使用文件存储模拟数据库）
        $this->updatePaymentStatus($outTradeNo, $tradeNo, $testId, $userId, $totalAmount, $gmtPayment);
        
        // 标记为已处理
        $processedData = [
            'out_trade_no' => $outTradeNo,
            'trade_no' => $tradeNo,
            'test_id' => $testId,
            'user_id' => $userId,
            'amount' => $totalAmount,
            'trade_status' => $tradeStatus,
            'gmt_payment' => $gmtPayment,
            'process_time' => date('Y-m-d H:i:s'),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
        
        file_put_contents($processedFile, json_encode($processedData, JSON_UNESCAPED_UNICODE));
        
        // 记录成功日志
        $successLog = [
            'time' => date('Y-m-d H:i:s'),
            'out_trade_no' => $outTradeNo,
            'trade_no' => $tradeNo,
            'test_id' => $testId,
            'user_id' => substr($userId, 0, 8) . '...', // 部分隐藏
            'amount' => $totalAmount,
            'trade_status' => $tradeStatus,
            'gmt_payment' => $gmtPayment,
            'status' => 'payment_success',
            'processed' => true
        ];
        
        $successFile = $logDir . 'success_' . date('Y-m-d') . '.log';
        @file_put_contents(
            $successFile,
            json_encode($successLog, JSON_UNESCAPED_UNICODE) . PHP_EOL,
            FILE_APPEND | LOCK_EX
        );
        
        // 同时记录到原来的payments.log（保持兼容性）
        $legacyLog = date('Y-m-d H:i:s') . " - 支付成功: {$outTradeNo} - 支付宝交易号: {$tradeNo} - 金额: {$totalAmount}元 - 测试ID: {$testId} - 用户ID: {$userId}" . PHP_EOL;
        @file_put_contents('payments.log', $legacyLog, FILE_APPEND);
        
        echo 'success';
        
    } elseif ($tradeStatus === 'TRADE_CLOSED') {
        // 交易关闭
        $closedLog = [
            'time' => date('Y-m-d H:i:s'),
            'out_trade_no' => $outTradeNo,
            'trade_no' => $tradeNo,
            'trade_status' => $tradeStatus,
            'amount' => $totalAmount,
            'status' => 'trade_closed',
            'reason' => '用户取消或超时关闭'
        ];
        
        $closedFile = $logDir . 'closed_' . date('Y-m-d') . '.log';
        @file_put_contents($closedFile, json_encode($closedLog, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
        
        echo 'success'; // 支付宝要求返回success
        
    } else {
        // 其他状态（WAIT_BUYER_PAY等）
        $otherLog = [
            'time' => date('Y-m-d H:i:s'),
            'out_trade_no' => $outTradeNo,
            'trade_no' => $tradeNo,
            'trade_status' => $tradeStatus,
            'amount' => $totalAmount,
            'status' => 'other_status',
            'note' => '等待支付或其他状态'
        ];
        
        $otherFile = $logDir . 'other_' . date('Y-m-d') . '.log';
        @file_put_contents($otherFile, json_encode($otherLog, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
        
        echo 'success'; // 支付宝要求无论什么状态都返回success
    }
    
} catch (Exception $e) {
    // 异常处理
    $exceptionLog = [
        'time' => date('Y-m-d H:i:s'),
        'status' => 'exception',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => substr($e->getTraceAsString(), 0, 500), // 限制长度
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    $exceptionFile = $logDir . 'exception_' . date('Y-m-d') . '.log';
    @file_put_contents(
        $exceptionFile,
        json_encode($exceptionLog, JSON_UNESCAPED_UNICODE) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
    
    // 记录到PHP错误日志
    error_log('notify.php异常: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    
    echo 'fail';
}

exit;

// ==================== 辅助函数 ====================

/**
 * 更新支付状态（文件存储模拟数据库）
 */
function updatePaymentStatus($outTradeNo, $tradeNo, $testId, $userId, $amount, $payTime) {
    $dataDir = defined('DATA_DIR') ? DATA_DIR : dirname(__DIR__) . '/data/';
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    
    $paymentFile = $dataDir . 'payments.json';
    $userAccessFile = $dataDir . 'user_access.json';
    
    // 更新支付记录
    $payments = [];
    if (file_exists($paymentFile)) {
        $payments = json_decode(file_get_contents($paymentFile), true) ?: [];
    }
    
    $paymentRecord = [
        'order_no' => $outTradeNo,
        'trade_no' => $tradeNo,
        'test_id' => $testId,
        'user_id' => $userId,
        'amount' => $amount,
        'status' => 'paid',
        'pay_time' => $payTime,
        'notify_time' => date('Y-m-d H:i:s'),
        'update_time' => date('Y-m-d H:i:s')
    ];
    
    // 防止重复
    $payments[$tradeNo] = $paymentRecord;
    
    @file_put_contents(
        $paymentFile,
        json_encode($payments, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
        LOCK_EX
    );
    
    // 更新用户访问权限
    updateUserAccess($userId, $testId);
    
    // 同步更新到原来的payments.log（保持兼容）
    $legacyLog = date('Y-m-d H:i:s') . " - [DB] 支付成功记录: {$outTradeNo}" . PHP_EOL;
    @file_put_contents('payments.log', $legacyLog, FILE_APPEND);
}

/**
 * 更新用户访问权限
 */
function updateUserAccess($userId, $testId) {
    $dataDir = defined('DATA_DIR') ? DATA_DIR : dirname(__DIR__) . '/data/';
    $accessFile = $dataDir . 'user_access.json';
    
    $access = [];
    if (file_exists($accessFile)) {
        $access = json_decode(file_get_contents($accessFile), true) ?: [];
    }
    
    if (!isset($access[$userId])) {
        $access[$userId] = [
            'tests' => [],
            'last_access' => date('Y-m-d H:i:s'),
            'total_paid' => 0
        ];
    }
    
    // 添加测试权限
    if (!in_array($testId, $access[$userId]['tests'])) {
        $access[$userId]['tests'][] = $testId;
        $access[$userId]['last_access'] = date('Y-m-d H:i:s');
    }
    
    @file_put_contents(
        $accessFile,
        json_encode($access, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
        LOCK_EX
    );
}

// 创建索引保护文件
if (!file_exists(dirname(__DIR__) . '/logs/index.html')) {
    file_put_contents(dirname(__DIR__) . '/logs/index.html', '<!DOCTYPE html><html><head><title>403 Forbidden</title></head><body><h1>Access Forbidden</h1></body></html>');
}
?>