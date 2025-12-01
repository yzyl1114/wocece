<?php
// secure_keys.php
// 创建时间：2025-12-01
// 注意：此文件必须设置严格的访问权限，禁止外部访问！

// ==================== 支付宝支付配置 ====================
// 支付宝应用ID
define('ALIPAY_APP_ID', '2021006108601347');

// 商户私钥 - 用于生成支付签名
define('MERCHANT_PRIVATE_KEY', 
'-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----');

// 支付宝公钥 - 用于验证回调签名
define('ALIPAY_PUBLIC_KEY',
'-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj13qFSBriUiJj3y8H+9v
6M+dQku7MtB1PsLu25kA2JM0R/fdcXvuxSaZUf5mbCAdTPHXwzherwSRoYoIH4fb
tfsfsPuJ1RCb4NFLanSKZHU+6OQa01X82zRSsdTC5hZmnHM5QEZcDwStYgzTjdO5
zwHd9BBQuCgGud63zGo53+SCS7BulOvfjBeLI0zJYvtrAiFsLnrUjt/DzSzJVHJp
3LM/jt03nIWffv8AhXYGgkNUe6bbCxWvkYR5G3g+PHBnEOu+qnG7hCFVZFknh4SH
XeCvTrH5A9vb87JaoTPi1Ol8H05NBC1lm8bsm05kwhxpKA58dZ4aM0YaLPRlTpH+
RwIDAQAB
-----END PUBLIC KEY-----');

// ==================== API签名配置 ====================
// API请求签名密钥（请定期更换）
define('API_SECRET_KEY', 'wocece_test_key_202512_993c4c8393d29d64b5784f00ceb97df2');

// API响应签名密钥
define('API_RESPONSE_SECRET', 'wocece_response_secret_' . date('Ym'));

// 签名有效期（秒）
define('SIGN_EXPIRE_TIME', 300); // 5分钟

// ==================== 项目配置 ====================
// 网站域名（用于Referer验证）
define('SITE_DOMAIN', 'wocece.com');
define('SITE_URL', 'https://wocece.com');

// 支付回调URL
define('ALIPAY_NOTIFY_URL', SITE_URL . '/api/notify.php');
define('ALIPAY_RETURN_URL', SITE_URL . '/payment-success.html');

// ==================== 安全配置 ====================
// 是否启用调试模式（生产环境必须为false）
define('DEBUG_MODE', false);

// 日志级别：debug, info, warning, error
define('LOG_LEVEL', 'info');

// 最大支付金额（元）
define('MAX_PAYMENT_AMOUNT', 1000.00);

// 最小支付金额（元）
define('MIN_PAYMENT_AMOUNT', 0.01);

// ==================== 文件存储配置 ====================
// 数据文件路径
define('DATA_DIR', dirname(__DIR__) . '/data/');
define('PAYMENT_DATA_FILE', DATA_DIR . 'payments.json');
define('USER_ACCESS_FILE', DATA_DIR . 'user_access.json');
define('REDEEM_CODES_FILE', DATA_DIR . 'redeem-codes.json');
define('TESTS_DATA_FILE', DATA_DIR . 'tests.json');

// 日志文件路径
define('LOG_DIR', dirname(__DIR__) . '/logs/');
define('SECURITY_LOG_DIR', LOG_DIR . 'security/');
define('ORDER_LOG_DIR', LOG_DIR . 'orders/');
define('NOTIFY_LOG_DIR', LOG_DIR . 'notify/');
define('ERROR_LOG_DIR', LOG_DIR . 'errors/');

// ==================== 频率限制配置 ====================
// API请求频率限制（次/分钟）
define('RATE_LIMIT_API', 60);
define('RATE_LIMIT_PAYMENT', 30);
define('RATE_LIMIT_VERIFY', 60);

// ==================== 订单配置 ====================
// 订单号前缀
define('ORDER_PREFIX', 'WO_');

// 订单过期时间（秒）
define('ORDER_EXPIRE_TIME', 1800); // 30分钟

// ==================== 访问控制配置 ====================
// 允许访问的域名列表
$allowed_domains = [
    'wocece.com',
    'www.wocece.com',
    'localhost',
    '127.0.0.1',
    '::1'
];

// 允许的文件类型
$allowed_file_types = ['jpg', 'jpeg', 'png', 'gif', 'css', 'js', 'html', 'json'];

// ==================== 错误处理配置 ====================
// 是否显示详细错误信息（生产环境必须为false）
define('DISPLAY_ERRORS', false);

// 错误日志文件
define('ERROR_LOG_FILE', ERROR_LOG_DIR . 'php_errors.log');

// ==================== 初始化检查 ====================
// 创建必要的目录
function initDirectories() {
    $dirs = [
        DATA_DIR,
        LOG_DIR,
        SECURITY_LOG_DIR,
        ORDER_LOG_DIR,
        NOTIFY_LOG_DIR,
        ERROR_LOG_DIR,
        dirname(__DIR__) . '/data/cache/'
    ];
    
    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
            // 创建索引保护文件
            file_put_contents($dir . 'index.html', '');
        }
    }
}

// 初始化目录
initDirectories();

// ==================== 安全头设置 ====================
if (!headers_sent()) {
    // 防止点击劫持
    header('X-Frame-Options: SAMEORIGIN');
    
    // 防止MIME类型嗅探
    header('X-Content-Type-Options: nosniff');
    
    // XSS保护
    header('X-XSS-Protection: 1; mode=block');
    
    // 禁用浏览器缓存（对于API）
    if (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false) {
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
}

// ==================== 环境检查 ====================
// 检查PHP版本
if (version_compare(PHP_VERSION, '7.4.0', '<')) {
    die('PHP版本必须 >= 7.4.0，当前版本：' . PHP_VERSION);
}

// 检查必要的扩展
$required_extensions = ['openssl', 'json', 'mbstring'];
foreach ($required_extensions as $ext) {
    if (!extension_loaded($ext)) {
        die('缺少必要的PHP扩展：' . $ext);
    }
}

// 禁止直接访问
if (basename($_SERVER['PHP_SELF']) === 'secure_keys.php') {
    header('HTTP/1.1 403 Forbidden');
    exit('禁止直接访问');
}
?>