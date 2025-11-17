<?php
// verify-redeem.php - 兑换码验证API (修复版本)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// 启用错误日志
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// 自定义日志函数
function log_message($message) {
    $log_file = '/data/wwwroot/wocece/data/redeem-debug.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

log_message("=== 兑换码验证请求开始 ===");
log_message("请求方法: " . $_SERVER['REQUEST_METHOD']);
log_message("请求时间: " . date('Y-m-d H:i:s'));

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    log_message("OPTIONS 预检请求，直接返回");
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $code = $input['code'] ?? '';
    $testId = $input['testId'] ?? '';
    $userId = $input['userId'] ?? '';

    log_message("请求参数 - code: $code, testId: $testId, userId: $userId");
    log_message("完整请求数据: " . json_encode($input));

    if (!$code || !$testId) {
        log_message("错误: 缺少必要参数");
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
        log_message("数据文件路径: $dataFile");
        
        // 检查文件是否存在和可读
        if (!file_exists($dataFile)) {
            $error_msg = '兑换码数据文件不存在: ' . $dataFile;
            log_message("错误: $error_msg");
            throw new Exception($error_msg);
        }
        
        log_message("文件存在性检查通过");
        
        // 检查文件权限（简化版本，移除有问题的posix函数）
        $filePerms = substr(sprintf('%o', fileperms($dataFile)), -4);
        $isReadable = is_readable($dataFile);
        $isWritable = is_writable($dataFile);
        
        log_message("文件权限信息 - 权限: $filePerms, 可读: " . ($isReadable ? '是' : '否') . ", 可写: " . ($isWritable ? '是' : '否'));
        
        if (!$isReadable) {
            $error_msg = '兑换码数据文件不可读，权限: ' . $filePerms;
            log_message("错误: $error_msg");
            throw new Exception($error_msg);
        }
        
        $fileContent = file_get_contents($dataFile);
        if ($fileContent === false) {
            $error_msg = '无法读取文件内容';
            log_message("错误: $error_msg");
            throw new Exception($error_msg);
        }
        
        log_message("文件内容读取成功，长度: " . strlen($fileContent) . " 字节");
        
        $data = json_decode($fileContent, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $error_msg = 'JSON解析错误: ' . json_last_error_msg();
            log_message("错误: $error_msg");
            throw new Exception($error_msg);
        }
        
        $redeemCodes = $data['redeemCodes'] ?? [];
        log_message("成功加载 " . count($redeemCodes) . " 个兑换码");

        // 验证兑换码
        if (!isset($redeemCodes[$code])) {
            log_message("兑换码不存在: $code");
            log_message("现有兑换码: " . implode(', ', array_keys($redeemCodes)));
            echo json_encode([
                'success' => false,
                'error' => '兑换码不存在'
            ]);
            exit;
        }

        $redeemInfo = $redeemCodes[$code];
        log_message("找到兑换码信息: " . json_encode($redeemInfo));

        // ⭐ 新增：使用文件锁和原子操作确保写入可靠性
        $lockFile = $dataFile . '.lock';
        $lockHandle = fopen($lockFile, 'w+');

        if ($lockHandle && flock($lockHandle, LOCK_EX)) { // 获取独占锁
            try {
                log_message("成功获取文件锁，开始原子操作");
                
                // 重新读取文件，确保获取最新数据（避免竞争条件）
                $fileContent = file_get_contents($dataFile);
                $data = json_decode($fileContent, true);
                $redeemCodes = $data['redeemCodes'] ?? [];
                
                // 再次验证兑换码状态（避免重复使用）
                if (!isset($redeemCodes[$code]) || $redeemCodes[$code]['status'] !== 'active') {
                    log_message("警告：兑换码状态在锁期间已变更，状态: " . ($redeemCodes[$code]['status'] ?? '不存在'));
                    echo json_encode([
                        'success' => false,
                        'error' => '兑换码状态已变更，请重试'
                    ]);
                    exit;
                }

                // ⭐ 新增：在锁内部进行有效期检查
                $redeemInfo = $redeemCodes[$code];
                if (isset($redeemInfo['expiresAt'])) {
                    $expiresTime = strtotime($redeemInfo['expiresAt']);
                    $currentTime = time();
                    log_message("原子操作有效期检查 - 过期时间: " . $redeemInfo['expiresAt'] . " (" . $expiresTime . "), 当前时间: " . $currentTime);
                    
                    if ($expiresTime < $currentTime) {
                        log_message("兑换码在锁期间已过期");
                        echo json_encode([
                            'success' => false,
                            'error' => '兑换码已过期'
                        ]);
                        exit;
                    }
                }

                // ⭐ 新增：在锁内部进行测试ID匹配检查
                log_message("原子操作测试ID检查 - 期望: {$redeemInfo['testId']}, 实际: $testId");
                if ($redeemInfo['testId'] !== $testId) {
                    log_message("测试ID在锁期间不匹配");
                    echo json_encode([
                        'success' => false,
                        'error' => '该兑换码不适用于此测试'
                    ]);
                    exit;
                }

                log_message("所有原子验证通过，开始标记为已使用");

                // 更新兑换码状态
                $redeemCodes[$code]['status'] = 'used';
                $redeemCodes[$code]['usedAt'] = date('c');
                $redeemCodes[$code]['usedBy'] = $userId;
                
                $data['redeemCodes'] = $redeemCodes;
                $jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                
                log_message("准备保存数据，JSON长度: " . strlen($jsonData) . " 字节");
                
                // 使用临时文件避免写入中断
                $tempFile = $dataFile . '.tmp';
                $writeResult = file_put_contents($tempFile, $jsonData);
                
                if ($writeResult !== false) {
                    // 原子性重命名操作
                    if (rename($tempFile, $dataFile)) {
                        log_message("文件保存成功（原子操作），写入字节数: $writeResult");
                        
                        // 记录使用日志
                        $logMessage = date('Y-m-d H:i:s') . " - 兑换成功: {$code} - 测试: {$testId} - 用户: {$userId}\n";
                        file_put_contents('/data/wwwroot/wocece/data/redeem-logs.log', $logMessage, FILE_APPEND);
                        log_message("使用日志记录成功");

                        echo json_encode([
                            'success' => true,
                            'message' => '兑换成功',
                            'testId' => $testId
                        ]);
                    } else {
                        throw new Exception('文件重命名失败，原子操作未完成');
                    }
                } else {
                    throw new Exception('临时文件写入失败');
                }
                
            } finally {
                // 释放锁
                flock($lockHandle, LOCK_UN);
                fclose($lockHandle);
                // 清理临时文件
                if (file_exists($tempFile)) {
                    unlink($tempFile);
                }
                if (file_exists($lockFile)) {
                    unlink($lockFile);
                }
                log_message("文件锁和临时文件已清理");
            }
        } else {
            throw new Exception('无法获取文件锁，可能系统繁忙');
        }

    } catch (Exception $e) {
        log_message("捕获异常: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    log_message("=== 兑换码验证请求结束 ===");
    exit;
}

// GET请求返回信息
log_message("GET请求，返回API信息");
echo json_encode([
    'status' => 'redeem_verify_api',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>