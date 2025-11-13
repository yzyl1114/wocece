<?php
// notify.php - 支付宝异步通知处理
require_once 'pay.php';

$alipay = new AlipayService();
$params = $_POST;

// 验证签名
if ($alipay->verifyNotify($params)) {
    $tradeStatus = $params['trade_status'];
    
    if ($tradeStatus === 'TRADE_SUCCESS') {
        $outTradeNo = $params['out_trade_no'];
        
        // 解析测试ID和用户ID
        preg_match('/TEST_([^_]+)_/', $outTradeNo, $matches);
        $userId = $matches[1] ?? '';
        
        // 这里应该更新数据库中的支付状态
        // 暂时使用文件存储模拟
        file_put_contents('payments.log', 
            date('Y-m-d H:i:s') . " - 支付成功: {$outTradeNo}\n", 
            FILE_APPEND
        );
        
        echo 'success';
    } else {
        echo 'fail';
    }
} else {
    echo 'fail';
}
?>