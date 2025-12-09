<?php
// pay.php - 支付宝支付后端（安全加固版）
// 创建时间：2025-12-01
// 修改说明：1. 从配置文件读取密钥 2. 添加API安全验证 3. 保持原有功能不变

// 加载安全模块和配置文件
require_once 'security.php';
if (file_exists(dirname(__DIR__) . '/config/secure_keys.php')) {
    require_once dirname(__DIR__) . '/config/secure_keys.php';
}

class AlipayService {
    private $appId;
    private $merchantPrivateKey;
    private $alipayPublicKey;
    private $notifyUrl;
    private $returnUrl;

    public function __construct() {
        // 从配置文件或环境变量读取配置
        $this->loadSecureConfig();
    }

    // 从配置文件加载安全配置
    private function loadSecureConfig() {
        // 优先从配置文件读取
        if (defined('ALIPAY_APP_ID')) {
            $this->appId = ALIPAY_APP_ID;
        } else {
            // 兼容旧配置
            $this->appId = '2021006108601347';
        }

        if (defined('MERCHANT_PRIVATE_KEY')) {
            $this->merchantPrivateKey = MERCHANT_PRIVATE_KEY;
        } else {
            // 旧配置（建议尽快迁移到配置文件）
            $this->merchantPrivateKey = '-----BEGIN RSA PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtsOBnYmGKhzI1
Y4TiTlKAeZFXtn9Q7kJVNEd5RUGFdpcsMuqr88yud7N0yC3UQWX9HNPpRpt6MG22
SZgfg0JN8FGviqE/6mtybVzUONQ38QY9odlyXbawm3yvin6+glqo3x6eMI3HekUb
6/NNuq6azwoC3k7cy+iKyjxudcGdxhowMxN7ryDOmd/9yrWIg+in+tgjxBZP6siq
BdjjKLKQt+nDvaXt6+/K8WdUKveUbIBw3nheudyAhnUq+TfErL0OvbMBG1ji9d/J
RExzepQNXrIUb77WzQL2xwF1oID9Z//OuPd05B1nAevuZn/ohz3FOfj6XNspRv4o
9+u4RlZDAgMBAAECggEAcrWH3n9Yz/YtsJjDH/p9/h9LX9RFDRvtbvwR4ANfHFeP
yz7tQRbILMkdGZlCuxVd1+X8Ben9sJrfOi4sa1NyrKp0KCy0BdQ5ld6oGfhWH4Ps
jTOguikuCEEH/Z7HyeWpHjIMtIh4ei9ECQaxLrqFqfPmNrK+/o8kStT5SDI45ord
SZ2dE0+Uz4UUIPO8JZwLmsaMxivXfCKryIJZ6oJkRskCi+0zm0mzRQsAux5MaQgC
umTCpHZm8MEIL7DWAO12XqRn/62l9jPo2d2SWzCCh2nyWJbWHtyGb+dnqcUAWcmE
0Uar85rohJvoF4vC5lGrs2g21VjUBxRo07Ai+BTFUQKBgQD+HcHj3WbjTwvVcXhu
9W638YcI5STKBbS0ZFs9tJ5YkpZNwhMTruCaEKkwe3mQSw4XqiatULgqPUdIDHdR
n78EwRetigyQrKfPhtOplOCQ8/HL7w8yTxOHb4atKeDPm4+O4zMFE7geWDxioEA0
09hjWCVj12KmPISFpqXvwyqW7QKBgQCu+n59cD0AZ5zgmdTUiwOUubRdgC1Y8o3y
zL7bCCPwlfdAlViSmSckejxyASrGn6louf4W05xMW39JOLcfC4i2figCxHiuVI2w
B1mCKCDGNr9mDdpyWn83DqbJSBz9my7vH4c9ovY+KJe6kO1qNx1yNu0JFEN7Unda
x/1dWPxL7wKBgAq8lSGcjClUgKp/BdiiVBA/izYMAHbssMriZpx/0iTp5KHablXp
kKHRzGQ5A1TeZvUHAmVWQMHAHw/jPvNa7YY05lw1tfwy31A8YRsMKETXmcLFEf5N
KwUQ6D7OwyniZ7lgzhoL0D6v+bUtEilpPf5Mjh/ezNM7QVooRWCQ/W6tAoGADPnO
f4bfPzRv0cgWnFxiu5i542Up97qlBChizuNfpuu4FjX9B4IMAQx/hwTHI0ubyIRi
b1bp9E+ktM1b5xV34fChDvN675KdnzwsSxamt4w/zVWhqXFEldSkUbDjVXs4k8sG
wG9hS2K/PbqZoJLNwDaKhW3XQ0HuT/EcvNtoekkCgYEAjzPglfdg+UPQTByIjlwY
oIgR87vvDQ7XTDL6f+mexonn/PrVHzJjt3u53xvi9mW6QUc29faeMsljnmwspa1z
9ZQVCGOrEpI8IN3um+dqGpD/CCblQGXeMmyehBX/WTqPpVQ9jNO5RyM+5vMiWh5D
5I0WUZmXMC4qviHbah4qHWw=
-----END RSA PRIVATE KEY-----';
        }

        if (defined('ALIPAY_PUBLIC_KEY')) {
            $this->alipayPublicKey = ALIPAY_PUBLIC_KEY;
        } else {
            // 旧配置
            $this->alipayPublicKey = '-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj13qFSBriUiJj3y8H+9v
6M+dQku7MtB1PsLu25kA2JM0R/fdcXvuxSaZUf5mbCAdTPHXwzherwSRoYoIH4fb
tfsfsPuJ1RCb4NFLanSKZHU+6OQa01X82zRSsdTC5hZmnHM5QEZcDwStYgzTjdO5
zwHd9BBQuCgGud63zGo53+SCS7BulOvfjBeLI0zJYvtrAiFsLnrUjt/DzSzJVHJp
3LM/jt03nIWffv8AhXYGgkNUe6bbCxWvkYR5G3g+PHBnEOu+qnG7hCFVZFknh4SH
XeCvTrH5A9vb87JaoTPi1Ol8H05NBC1lm8bsm05kwhxpKA58dZ4aM0YaLPRlTpH+
RwIDAQAB
-----END PUBLIC KEY-----';
        }

        // URL配置
        if (defined('ALIPAY_NOTIFY_URL')) {
            $this->notifyUrl = ALIPAY_NOTIFY_URL;
        } else {
            $this->notifyUrl = 'https://wocece.com/api/notify.php';
        }

        if (defined('ALIPAY_RETURN_URL')) {
            $this->returnUrl = ALIPAY_RETURN_URL;
        } else {
            $this->returnUrl = 'https://wocece.com/payment-success.html';
        }

        // 验证密钥是否有效
        if (empty($this->merchantPrivateKey) || empty($this->alipayPublicKey)) {
            throw new Exception('支付密钥未正确配置，请检查config/secure_keys.php文件');
        }
    }

    // 创建支付订单 - 保持原有功能不变
    public function createOrder($testId, $amount, $userId) {
        $outTradeNo = $this->generateOutTradeNo($userId, $testId);

        // 检测用户设备类型
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $isMobile = $this->isMobileDevice($userAgent);
        
        // 根据设备类型选择产品代码
        if ($isMobile) {
            // 手机端使用手机网站支付
            $productCode = 'QUICK_WAP_WAY';
            $method = 'alipay.trade.wap.pay';
        } else {
            // 电脑端使用电脑网站支付（支持扫码）
            $productCode = 'FAST_INSTANT_TRADE_PAY';
            $method = 'alipay.trade.page.pay';
        }

        $bizContent = [
            'out_trade_no' => $outTradeNo,
            'total_amount' => $amount,
            'subject' => '心理测试付费解锁 - ' . $testId,
            'body' => '解锁专业心理测试内容',
            'product_code' => $productCode
        ];

        $dynamicReturnUrl = $this->returnUrl . '?testId=' . $testId;

        $params = [
            'app_id' => $this->appId,
            'method' => $method,  // 动态设置方法
            'charset' => 'utf-8',
            'sign_type' => 'RSA2',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '1.0',
            'notify_url' => $this->notifyUrl,
            'return_url' => $dynamicReturnUrl,
            'biz_content' => json_encode($bizContent, JSON_UNESCAPED_UNICODE)
        ];        

        // 移除空值
        $params = array_filter($params);
        
        $params['sign'] = $this->generateSignature($params);
        
        // 记录订单日志
        $this->logOrderCreation($outTradeNo, $testId, $userId, $amount, $isMobile);
        
        return [
            'tradeNo' => $outTradeNo,
            'paymentUrl' => 'https://openapi.alipay.com/gateway.do?' . http_build_query($params),
            'isMobile' => $isMobile
        ];
    }

    // 新增设备检测方法 - 保持不变
    private function isMobileDevice($userAgent) {
        $mobileKeywords = [
            'mobile', 'android', 'iphone', 'ipod', 'ipad', 
            'blackberry', 'webos', 'opera mini', 'windows phone'
        ];
        
        $userAgent = strtolower($userAgent);
        foreach ($mobileKeywords as $keyword) {
            if (strpos($userAgent, $keyword) !== false) {
                return true;
            }
        }
        return false;
    }

    // 生成商户订单号（包含测试ID信息） - 保持不变
    private function generateOutTradeNo($userId, $testId) {
        $time = time();
        $random = mt_rand(1000, 9999);
        return 'TEST_' . $testId . '_' . $userId . '_' . $time . '_' . $random;
    }

    // 生成签名（修复版） - 保持不变
    private function generateSignature($params) {
        ksort($params);
        $stringToSign = '';
        foreach ($params as $k => $v) {
            $stringToSign .= "{$k}={$v}&";
        }
        $stringToSign = rtrim($stringToSign, '&');
        
        // 获取私钥资源
        $privateKey = openssl_pkey_get_private($this->merchantPrivateKey);
        if (!$privateKey) {
            throw new Exception('私钥格式错误: ' . openssl_error_string());
        }
        
        $signature = '';
        if (!openssl_sign($stringToSign, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new Exception('签名生成失败: ' . openssl_error_string());
        }
        
        openssl_free_key($privateKey);
        return base64_encode($signature);
    }

    // 验证异步通知（修复版） - 保持不变
    public function verifyNotify($params) {
        $sign = $params['sign'];
        $signType = $params['sign_type'];
        unset($params['sign'], $params['sign_type']);
        
        ksort($params);
        $stringToSign = '';
        foreach ($params as $k => $v) {
            $stringToSign .= "{$k}={$v}&";
        }
        $stringToSign = rtrim($stringToSign, '&');
        
        // 获取公钥资源
        $publicKey = openssl_pkey_get_public($this->alipayPublicKey);
        if (!$publicKey) {
            throw new Exception('支付宝公钥格式错误: ' . openssl_error_string());
        }
        
        $result = openssl_verify($stringToSign, base64_decode($sign), $publicKey, OPENSSL_ALGO_SHA256);
        openssl_free_key($publicKey);
        
        return $result === 1;
    }

    // 安全订单日志记录
    private function logOrderCreation($outTradeNo, $testId, $userId, $amount, $isMobile) {
        $logDir = defined('ORDER_LOG_DIR') ? ORDER_LOG_DIR : dirname(__DIR__) . '/logs/orders/';
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $logEntry = [
            'time' => date('Y-m-d H:i:s'),
            'order_no' => $outTradeNo,
            'test_id' => $testId,
            'user_id' => substr($userId, 0, 10) . '...', // 部分隐藏保护隐私
            'amount' => $amount,
            'device' => $isMobile ? 'mobile' : 'desktop',
            'type' => 'order_created',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
        
        $logFile = $logDir . date('Y-m-d') . '.log';
        @file_put_contents(
            $logFile, 
            json_encode($logEntry, JSON_UNESCAPED_UNICODE) . PHP_EOL, 
            FILE_APPEND | LOCK_EX
        );
    }
}

// ==================== 主请求处理 ====================

// 如果是POST请求（创建订单）
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // 初始化API安全验证（不强制要求签名，保持前端兼容性）
    initApiSecurity([
        'require_signature' => false, // 暂时关闭签名验证，避免影响现有前端
        'check_rate_limit' => true,
        'check_referer' => true,
        'rate_limit' => 30, // 每分钟30次
        'allowed_domains' => ['wocece.com', 'localhost', '127.0.0.1']
    ]);
    
    // 处理预检请求（CORS）
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        exit(0);
    }
    
    // 设置响应头
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    
    // 解析请求数据
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // 兼容旧版本前端（application/x-www-form-urlencoded）
    if (json_last_error() !== JSON_ERROR_NONE) {
        parse_str($input, $data);
    }
    
    $testId = $data['testId'] ?? '';
    $amount = $data['amount'] ?? 1;
    $userId = $data['userId'] ?? '';
    
    // 参数验证（保持原有验证逻辑）
    if (!$testId || !$userId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => '缺少必要参数',
            'code' => 'MISSING_PARAMS'
        ]);
        exit;
    }
    
    // 验证金额（保持原有验证逻辑）
    if ($amount <= 0 || $amount > 1000) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => '金额无效',
            'code' => 'INVALID_AMOUNT'
        ]);
        exit;
    }
    
    try {
        $alipay = new AlipayService();
        $orderInfo = $alipay->createOrder($testId, $amount, $userId);
        
        // 成功响应（保持原有响应格式）
        echo json_encode([
            'success' => true,
            'tradeNo' => $orderInfo['tradeNo'],
            'paymentUrl' => $orderInfo['paymentUrl'],
            'isMobile' => $orderInfo['isMobile']
        ]);
        
    } catch (Exception $e) {
        // 错误处理（保持原有格式）
        error_log('支付订单创建失败: ' . $e->getMessage());
        
        // 记录安全日志
        if (function_exists('logSecurityEvent')) {
            logSecurityEvent('order_create_failed', [
                'test_id' => $testId,
                'user_id' => $userId,
                'amount' => $amount,
                'error' => $e->getMessage(),
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
        }
        
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => '创建订单失败: ' . $e->getMessage(),
            'code' => 'ORDER_CREATE_FAILED'
        ]);
    }
    exit;
}

// ==================== 直接访问处理 ====================

// 如果是GET请求（直接访问API页面）
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    
    // 显示API信息（保持原有格式）
    echo json_encode([
        'status' => 'alipay_api',
        'message' => '支付宝支付API（安全加固版-支持扫码）',
        'version' => '2.0',
        'timestamp' => date('Y-m-d H:i:s'),
        'security' => 'enabled',
        'config_source' => file_exists(dirname(__DIR__) . '/config/secure_keys.php') ? 'secure_keys.php' : 'hardcoded'
    ]);
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
]);
?>