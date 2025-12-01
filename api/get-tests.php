<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// 使用绝对路径
$key = 'wocece_test_key_202512_993c4c8393d29d64b5784f00ceb97df2';
$encryptedFile = '/data/wwwroot/wocece/data/tests.enc'; // 绝对路径

try {
    // 1. 检查文件
    if (!file_exists($encryptedFile)) {
        throw new Exception('加密文件不存在: ' . $encryptedFile);
    }
    
    // 2. 读取并解析
    $content = file_get_contents($encryptedFile);
    $data = json_decode($content, true);
    
    if (!$data || !isset($data['data'])) {
        throw new Exception('数据格式错误');
    }
    
    // 3. 解密
    $decoded = base64_decode($data['data']);
    $iv = substr($decoded, 0, 16);
    $encrypted = substr($decoded, 16);
    
    $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    if ($decrypted === false) {
        throw new Exception('解密失败');
    }
    
    $decryptedData = json_decode($decrypted, true);
    if (!$decryptedData) {
        throw new Exception('解密后JSON解析失败');
    }
    
    // 4. 提取数据 - 结构是: {_meta: {...}, data: {tests: {...}}}
    if (!isset($decryptedData['data']['tests'])) {
        throw new Exception('数据结构错误，找不到tests');
    }
    
    $allTests = $decryptedData['data']['tests']; // 🔥 保持为对象，不转数组
    
    // 5. 处理请求
    $testId = isset($_GET['id']) ? $_GET['id'] : '';
    $category = isset($_GET['category']) ? $_GET['category'] : '';
    $format = isset($_GET['format']) ? $_GET['format'] : 'json';
    $callback = isset($_GET['callback']) ? $_GET['callback'] : '';
    
    $resultData = [];
    
    if (!empty($testId)) {
        // 🔥 直接通过键名访问对象
        if (isset($allTests[$testId])) {
            $resultData = $allTests[$testId];
        } else {
            throw new Exception('测试不存在: ' . $testId);
        }
        
    } elseif (!empty($category)) {
        // 按分类过滤
        foreach ($allTests as $test) {
            if (isset($test['category']) && $test['category'] == $category) {
                $resultData[] = $test;
            }
        }
        
    } else {
        // 🔥 返回原始结构 {"tests": {...}}
        $resultData = ['tests' => $allTests];
    }
    
    // 6. 构建响应
    $response = [
        'code' => 0,
        'msg' => 'success',
        'data' => $resultData,
        'count' => is_array($resultData) ? count($resultData) : 1,
        'timestamp' => time()
    ];
    
    // 7. 输出
    if ($format === 'jsonp' && !empty($callback)) {
        $callback = preg_replace('/[^a-zA-Z0-9_]/', '', $callback);
        header('Content-Type: application/javascript');
        echo $callback . '(' . json_encode($response, JSON_UNESCAPED_UNICODE) . ');';
    } else {
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'code' => 500,
        'msg' => '系统错误: ' . $e->getMessage(),
        'data' => [],
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE);
}
?>