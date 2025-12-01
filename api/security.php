<?php
/**
 * 我测测 - API安全验证模块
 * 创建日期：2025-12-01
 */

// 定义错误码
define('ERR_SIGNATURE_FAILED', 1001);
define('ERR_TIMESTAMP_EXPIRED', 1002);
define('ERR_FREQUENCY_LIMIT', 1003);
define('ERR_INVALID_PARAM', 1004);
define('ERR_ACCESS_DENIED', 1005);

/**
 * 生成API签名
 * @param array $params 请求参数（不含sign）
 * @param string $secret 密钥
 * @param string $timestamp 时间戳（如不传则自动生成）
 * @return array 包含签名和时间戳的参数数组
 */
function generateApiSignature($params, $secret, $timestamp = null) {
    if ($timestamp === null) {
        $timestamp = time();
    }
    
    $params['timestamp'] = $timestamp;
    
    // 参数按字典序排序
    ksort($params);
    
    // 构建签名字符串
    $signStr = '';
    foreach ($params as $key => $value) {
        // 跳过空值和签名字段
        if ($key === 'sign' || $value === '') {
            continue;
        }
        $signStr .= $key . '=' . $value . '&';
    }
    $signStr = rtrim($signStr, '&') . $secret;
    
    // 生成签名（可根据需要改用sha256）
    $params['sign'] = md5($signStr);
    
    return $params;
}

/**
 * 验证API签名
 * @param array $params 请求参数（包含sign）
 * @param string $secret 密钥
 * @param int $expireSeconds 签名有效期（秒）
 * @return bool 验证结果
 */
function verifyApiSignature($params, $secret, $expireSeconds = 300) {
    // 检查必要参数
    if (!isset($params['sign']) || !isset($params['timestamp'])) {
        return false;
    }
    
    $sign = $params['sign'];
    $timestamp = $params['timestamp'];
    
    // 验证时间戳（防止重放攻击）
    if (abs(time() - $timestamp) > $expireSeconds) {
        error_log("签名过期: timestamp={$timestamp}, current=" . time());
        return false;
    }
    
    // 移除sign参数进行验证
    unset($params['sign']);
    
    // 重新生成签名进行比较
    $expectedSign = generateApiSignature($params, $secret, $timestamp)['sign'];
    
    // 安全比较签名（防止时序攻击）
    return hash_equals($expectedSign, $sign);
}

/**
 * 频率限制检查
 * @param string $key 限制键（如IP、用户ID）
 * @param int $limit 限制次数
 * @param int $period 限制周期（秒）
 * @return bool 是否允许访问
 */
function checkRateLimit($key, $limit = 10, $period = 60) {
    // 使用文件缓存（实际项目建议用Redis）
    $cacheDir = '../data/cache/';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }
    
    $cacheFile = $cacheDir . 'ratelimit_' . md5($key) . '.json';
    
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
        
        // 检查是否在周期内
        if (time() - $data['start_time'] <= $period) {
            if ($data['count'] >= $limit) {
                return false;
            }
            $data['count']++;
        } else {
            // 新周期
            $data = ['count' => 1, 'start_time' => time()];
        }
    } else {
        $data = ['count' => 1, 'start_time' => time()];
    }
    
    file_put_contents($cacheFile, json_encode($data));
    return true;
}

/**
 * 验证请求来源域名
 * @param array $allowedDomains 允许的域名列表
 * @return bool
 */
function validateReferer($allowedDomains = []) {
    if (empty($allowedDomains)) {
        $allowedDomains = [
            'your-domain.com',
            'localhost',
            '127.0.0.1'
        ];
    }
    
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    foreach ($allowedDomains as $domain) {
        if (strpos($referer, $domain) !== false || strpos($origin, $domain) !== false) {
            return true;
        }
    }
    
    return false;
}

/**
 * 获取客户端IP
 * @return string
 */
function getClientIp() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    
    // 处理代理情况
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ipList = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ip = trim($ipList[0]);
    }
    
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
}

/**
 * 记录安全日志
 * @param string $event 事件类型
 * @param array $data 相关数据
 */
function logSecurityEvent($event, $data = []) {
    $logDir = '../logs/security/';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logEntry = [
        'time' => date('Y-m-d H:i:s'),
        'event' => $event,
        'ip' => getClientIp(),
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'data' => $data
    ];
    
    $logFile = $logDir . date('Y-m-d') . '.log';
    file_put_contents(
        $logFile, 
        json_encode($logEntry, JSON_UNESCAPED_UNICODE) . PHP_EOL, 
        FILE_APPEND
    );
}

/**
 * 统一API响应格式
 * @param int $code 响应码（0=成功）
 * @param string $message 消息
 * @param array $data 数据
 */
function apiResponse($code = 0, $message = 'success', $data = []) {
    header('Content-Type: application/json');
    
    $response = [
        'code' => $code,
        'msg' => $message,
        'data' => $data,
        'timestamp' => time()
    ];
    
    // 如果是成功响应，添加响应签名
    if ($code === 0) {
        $secret = defined('API_RESPONSE_SECRET') ? API_RESPONSE_SECRET : 'default_response_secret';
        $response['sign'] = generateApiSignature($response, $secret, $response['timestamp'])['sign'];
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * 初始化API安全检查
 * @param array $config 配置数组
 */
function initApiSecurity($config = []) {
    // 默认配置
    $defaultConfig = [
        'require_signature' => true,
        'check_rate_limit' => true,
        'check_referer' => true,
        'rate_limit' => 60, // 每分钟最多60次
        'rate_period' => 60,
        'allowed_domains' => []
    ];
    
    $config = array_merge($defaultConfig, $config);
    
    // 1. 验证Referer
    if ($config['check_referer'] && !validateReferer($config['allowed_domains'])) {
        logSecurityEvent('invalid_referer', ['referer' => $_SERVER['HTTP_REFERER'] ?? '']);
        apiResponse(ERR_ACCESS_DENIED, '访问被拒绝');
    }
    
    // 2. 频率限制（基于IP）
    if ($config['check_rate_limit']) {
        $ip = getClientIp();
        $cacheKey = 'api_limit_' . $ip;
        
        if (!checkRateLimit($cacheKey, $config['rate_limit'], $config['rate_period'])) {
            logSecurityEvent('rate_limit_exceeded', ['ip' => $ip]);
            apiResponse(ERR_FREQUENCY_LIMIT, '请求过于频繁，请稍后再试');
        }
    }
    
    // 3. 验证签名
    if ($config['require_signature']) {
        // 获取请求参数
        $params = $_SERVER['REQUEST_METHOD'] === 'POST' ? $_POST : $_GET;
        
        // 对于JSON请求
        if (empty($params) && strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
            $input = file_get_contents('php://input');
            $params = json_decode($input, true) ?: [];
        }
        
        $secret = defined('API_SECRET_KEY') ? API_SECRET_KEY : 'your_default_secret_key_here';
        
        if (!verifyApiSignature($params, $secret)) {
            logSecurityEvent('signature_failed', [
                'params' => $params,
                'ip' => getClientIp()
            ]);
            apiResponse(ERR_SIGNATURE_FAILED, '签名验证失败');
        }
    }
}
?>