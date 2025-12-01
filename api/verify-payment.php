<?php
// verify-payment.php - 支付状态验证（安全加固版）
// 创建时间：2025-12-01
// 修改说明：1. 添加API安全验证 2. 增强支付状态检查 3. 添加缓存机制 4. 保持兼容性

// 加载安全模块和配置文件
require_once 'security.php';
if (file_exists(dirname(__DIR__) . '/config/secure_keys.php')) {
    require_once dirname(__DIR__) . '/config/secure_keys.php';
}

// 只允许POST请求（API接口）
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // 初始化API安全验证（不强制签名，保持前端兼容）
    initApiSecurity([
        'require_signature' => false, // 暂时关闭签名验证
        'check_rate_limit' => true,
        'check_referer' => true,
        'rate_limit' => 60, // 每分钟60次
        'allowed_domains' => ['wocece.com', 'localhost', '127.0.0.1']
    ]);
    
    // 处理预检请求（CORS）
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
        exit(0);
    }
    
    // 设置响应头
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Credentials: true');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // 解析请求数据
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // 兼容旧版本前端（application/x-www-form-urlencoded）
    if (json_last_error() !== JSON_ERROR_NONE) {
        parse_str($input, $data);
    }
    
    // 获取参数
    $testId = trim($data['testId'] ?? '');
    $userId = trim($data['userId'] ?? '');
    $orderNo = trim($data['orderNo'] ?? '');
    
    // 参数验证
    if (empty($testId) || empty($userId)) {
        apiResponse(ERR_INVALID_PARAM, '缺少必要参数', [
            'paid' => false,
            'testId' => $testId,
            'userId' => $userId
        ]);
    }
    
    // 验证参数格式（防止注入）
    if (!preg_match('/^[a-zA-Z0-9_-]{1,50}$/', $testId) || 
        !preg_match('/^[a-zA-Z0-9_-]{1,50}$/', $userId)) {
        apiResponse(ERR_INVALID_PARAM, '参数格式错误', [
            'paid' => false,
            'testId' => $testId,
            'userId' => $userId
        ]);
    }
    
    try {
        // 检查支付状态
        $paymentStatus = checkPaymentStatus($testId, $userId, $orderNo);
        
        // 记录查询日志（防滥用）
        if (function_exists('logSecurityEvent')) {
            logSecurityEvent('payment_verify_request', [
                'test_id' => $testId,
                'user_id' => substr($userId, 0, 8) . '...', // 部分隐藏
                'order_no' => $orderNo ?: 'none',
                'result' => $paymentStatus['paid'] ? 'paid' : 'unpaid',
                'source' => $paymentStatus['source'],
                'ip' => getClientIp()
            ]);
        }
        
        // 返回结果（保持原有格式）
        apiResponse(0, '查询成功', [
            'paid' => $paymentStatus['paid'],
            'testId' => $testId,
            'orderNo' => $paymentStatus['orderNo'],
            'payTime' => $paymentStatus['payTime'],
            'amount' => $paymentStatus['amount'],
            'hasAccess' => $paymentStatus['paid'], // 是否具有访问权限
            'cacheHit' => $paymentStatus['cacheHit'],
            'source' => $paymentStatus['source']
        ]);
        
    } catch (Exception $e) {
        // 记录错误
        if (function_exists('logSecurityEvent')) {
            logSecurityEvent('payment_verify_error', [
                'test_id' => $testId,
                'user_id' => substr($userId, 0, 8) . '...',
                'error' => $e->getMessage(),
                'ip' => getClientIp()
            ]);
        }
        
        apiResponse(500, '查询失败: ' . $e->getMessage(), [
            'paid' => false,
            'testId' => $testId
        ]);
    }
    exit;
}

// ==================== 辅助函数 ====================

/**
 * 检查支付状态
 * 优先级：1.缓存 2.用户权限文件 3.支付记录文件 4.旧日志文件
 */
function checkPaymentStatus($testId, $userId, $orderNo = '') {
    $result = [
        'paid' => false,
        'orderNo' => '',
        'payTime' => '',
        'amount' => '0.00',
        'cacheHit' => false,
        'source' => 'none'
    ];
    
    // 检查缓存（减少文件读取）
    $cacheKey = 'payment_' . md5($testId . '_' . $userId);
    $cachedResult = getCache($cacheKey);
    
    if ($cachedResult !== null) {
        $result = array_merge($result, $cachedResult);
        $result['cacheHit'] = true;
        $result['source'] = 'cache';
        return $result;
    }
    
    // 方案1：检查用户访问权限文件（最快）
    $accessFile = defined('USER_ACCESS_FILE') ? USER_ACCESS_FILE : dirname(__DIR__) . '/data/user_access.json';
    if (file_exists($accessFile)) {
        $access = json_decode(file_get_contents($accessFile), true);
        if (is_array($access) && isset($access[$userId])) {
            if (in_array($testId, $access[$userId]['tests'] ?? [])) {
                $result['paid'] = true;
                $result['source'] = 'user_access';
                
                // 尝试获取详细信息
                $paymentDetails = getPaymentDetails($testId, $userId, $orderNo);
                if ($paymentDetails['paid']) {
                    $result = array_merge($result, $paymentDetails);
                }
                
                // 缓存结果（5分钟）
                setCache($cacheKey, $result, 300);
                return $result;
            }
        }
    }
    
    // 方案2：检查支付记录文件
    $paymentFile = defined('PAYMENT_DATA_FILE') ? PAYMENT_DATA_FILE : dirname(__DIR__) . '/data/payments.json';
    if (file_exists($paymentFile)) {
        $payments = json_decode(file_get_contents($paymentFile), true);
        if (is_array($payments)) {
            
            // 如果有指定订单号，优先检查该订单
            if (!empty($orderNo)) {
                foreach ($payments as $payment) {
                    if (isset($payment['order_no']) && $payment['order_no'] === $orderNo && 
                        isset($payment['user_id']) && $payment['user_id'] === $userId && 
                        isset($payment['test_id']) && $payment['test_id'] === $testId &&
                        isset($payment['status']) && $payment['status'] === 'paid') {
                        
                        $result['paid'] = true;
                        $result['orderNo'] = $payment['order_no'];
                        $result['payTime'] = $payment['pay_time'] ?? $payment['gmt_payment'] ?? '';
                        $result['amount'] = $payment['amount'] ?? '0.00';
                        $result['source'] = 'payments_json';
                        break;
                    }
                }
            }
            
            // 如果没找到指定订单或未指定订单，查找该用户对该测试的所有支付记录
            if (!$result['paid']) {
                foreach ($payments as $payment) {
                    if (isset($payment['user_id']) && $payment['user_id'] === $userId && 
                        isset($payment['test_id']) && $payment['test_id'] === $testId &&
                        isset($payment['status']) && $payment['status'] === 'paid') {
                        
                        $result['paid'] = true;
                        $result['orderNo'] = $payment['order_no'] ?? '';
                        $result['payTime'] = $payment['pay_time'] ?? $payment['gmt_payment'] ?? '';
                        $result['amount'] = $payment['amount'] ?? '0.00';
                        $result['source'] = 'payments_json';
                        break;
                    }
                }
            }
        }
    }
    
    // 方案3：检查旧版日志文件（保持兼容）
    if (!$result['paid']) {
        $legacyLogFile = 'payments.log';
        if (file_exists($legacyLogFile)) {
            $content = file_get_contents($legacyLogFile);
            
            // 构建搜索模式
            $pattern = "/TEST_{$testId}_{$userId}_/";
            if (preg_match($pattern, $content)) {
                // 尝试提取详细信息
                $lines = explode("\n", $content);
                foreach ($lines as $line) {
                    if (strpos($line, "TEST_{$testId}_{$userId}_") !== false && 
                        strpos($line, '支付成功') !== false) {
                        
                        // 提取订单号
                        if (preg_match('/TEST_[^ ]+/', $line, $matches)) {
                            $result['orderNo'] = $matches[0];
                        }
                        
                        // 提取时间
                        if (preg_match('/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/', $line, $matches)) {
                            $result['payTime'] = $matches[0];
                        }
                        
                        // 提取金额
                        if (preg_match('/金额: ([\d.]+)元/', $line, $matches)) {
                            $result['amount'] = $matches[1];
                        }
                        
                        $result['paid'] = true;
                        $result['source'] = 'legacy_log';
                        break;
                    }
                }
            }
        }
    }
    
    // 方案4：检查通知日志（备份方案）
    if (!$result['paid']) {
        $notifyLogDir = defined('NOTIFY_LOG_DIR') ? NOTIFY_LOG_DIR : dirname(__DIR__) . '/logs/notify/';
        $notifyLogFile = $notifyLogDir . 'success_' . date('Y-m-d') . '.log';
        
        if (file_exists($notifyLogFile)) {
            $lines = file($notifyLogFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            
            foreach ($lines as $line) {
                $log = json_decode($line, true);
                if ($log && 
                    isset($log['test_id']) && $log['test_id'] === $testId &&
                    isset($log['user_id']) && strpos($log['user_id'], substr($userId, 0, 8)) === 0 &&
                    isset($log['status']) && $log['status'] === 'payment_success') {
                    
                    $result['paid'] = true;
                    $result['orderNo'] = $log['out_trade_no'] ?? '';
                    $result['payTime'] = $log['gmt_payment'] ?? $log['time'] ?? '';
                    $result['amount'] = $log['amount'] ?? '0.00';
                    $result['source'] = 'notify_log';
                    break;
                }
            }
        }
    }
    
    // 缓存结果（未支付也缓存，减少IO）
    setCache($cacheKey, $result, 60); // 1分钟缓存
    
    return $result;
}

/**
 * 获取支付详细信息
 */
function getPaymentDetails($testId, $userId, $orderNo = '') {
    $result = [
        'paid' => false,
        'orderNo' => '',
        'payTime' => '',
        'amount' => '0.00'
    ];
    
    $paymentFile = defined('PAYMENT_DATA_FILE') ? PAYMENT_DATA_FILE : dirname(__DIR__) . '/data/payments.json';
    if (file_exists($paymentFile)) {
        $payments = json_decode(file_get_contents($paymentFile), true);
        
        if (is_array($payments)) {
            // 优先搜索指定订单
            if (!empty($orderNo)) {
                foreach ($payments as $payment) {
                    if (isset($payment['order_no']) && $payment['order_no'] === $orderNo && 
                        isset($payment['user_id']) && $payment['user_id'] === $userId && 
                        isset($payment['test_id']) && $payment['test_id'] === $testId &&
                        isset($payment['status']) && $payment['status'] === 'paid') {
                        
                        $result['paid'] = true;
                        $result['orderNo'] = $payment['order_no'];
                        $result['payTime'] = $payment['pay_time'] ?? $payment['gmt_payment'] ?? '';
                        $result['amount'] = $payment['amount'] ?? '0.00';
                        return $result;
                    }
                }
            }
            
            // 搜索最近的成功支付
            foreach ($payments as $payment) {
                if (isset($payment['user_id']) && $payment['user_id'] === $userId && 
                    isset($payment['test_id']) && $payment['test_id'] === $testId &&
                    isset($payment['status']) && $payment['status'] === 'paid') {
                    
                    $result['paid'] = true;
                    $result['orderNo'] = $payment['order_no'] ?? '';
                    $result['payTime'] = $payment['pay_time'] ?? $payment['gmt_payment'] ?? '';
                    $result['amount'] = $payment['amount'] ?? '0.00';
                    return $result;
                }
            }
        }
    }
    
    return $result;
}

/**
 * 获取缓存
 */
function getCache($key) {
    $cacheDir = defined('DATA_DIR') ? DATA_DIR . 'cache/' : dirname(__DIR__) . '/data/cache/';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }
    
    $cacheFile = $cacheDir . $key . '.json';
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
        if ($data && isset($data['expire']) && $data['expire'] > time()) {
            return $data['data'] ?? null;
        }
    }
    
    return null;
}

/**
 * 设置缓存
 */
function setCache($key, $data, $ttl = 60) {
    $cacheDir = defined('DATA_DIR') ? DATA_DIR . 'cache/' : dirname(__DIR__) . '/data/cache/';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }
    
    $cacheFile = $cacheDir . $key . '.json';
    $cacheData = [
        'data' => $data,
        'expire' => time() + $ttl,
        'created' => date('Y-m-d H:i:s')
    ];
    
    @file_put_contents($cacheFile, json_encode($cacheData, JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// ==================== 直接访问处理 ====================

// 如果是GET请求（直接访问API页面）
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json; charset=utf-8');
    
    // 显示API信息
    echo json_encode([
        'status' => 'payment_verify_api',
        'version' => '2.0',
        'timestamp' => date('Y-m-d H:i:s'),
        'security' => 'enabled',
        'description' => '支付状态验证接口',
        'usage' => 'POST方法传入 {testId, userId, [orderNo]}',
        'config_source' => file_exists(dirname(__DIR__) . '/config/secure_keys.php') ? 'secure_keys.php' : 'not_found',
        'data_files' => [
            'user_access' => file_exists(dirname(__DIR__) . '/data/user_access.json') ? 'exists' : 'not_found',
            'payments' => file_exists(dirname(__DIR__) . '/data/payments.json') ? 'exists' : 'not_found',
            'legacy_log' => file_exists('payments.log') ? 'exists' : 'not_found'
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// ==================== 其他请求方法 ====================

// 不支持的请求方法
header('Content-Type: application/json');
http_response_code(405);
echo json_encode([
    'success' => false,
    'error' => 'Method not allowed',
    'code' => 'METHOD_NOT_ALLOWED'
], JSON_UNESCAPED_UNICODE);
?>