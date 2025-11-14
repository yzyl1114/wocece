<?php
// redeem-management.php
session_start();

// 密码配置
$ADMIN_PASSWORD = 'wocece2025admin';

// 检查登录状态
if ($_POST['password'] ?? '') {
    if ($_POST['password'] === $ADMIN_PASSWORD) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['login_time'] = time();
    } else {
        $error = "密码错误";
    }
}

// 登出
if ($_GET['action'] ?? '' === 'logout') {
    session_destroy();
    header('Location: redeem-management.php');
    exit;
}

// 检查是否已登录（2小时有效期）
$isLoggedIn = isset($_SESSION['admin_logged_in']) && 
              $_SESSION['admin_logged_in'] && 
              (time() - $_SESSION['login_time']) < 7200;

if (!$isLoggedIn) {
    // 显示登录页面
    ?>
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title管理员登录 - 我测测</title>
        <style>
            body { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                background: #f5f6fa; 
            }
            .login-container {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
            }
            .error { color: red; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="login-container">
            <h3>兑换码管理系统</h3>
            <form method="POST">
                <input type="password" name="password" placeholder="请输入管理密码" 
                       style="padding:12px;margin:15px 0;width:200px;border:2px solid #ddd;border-radius:5px;">
                <br>
                <button type="submit" 
                        style="padding:12px 30px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer;">
                    登录
                </button>
                <?php if (isset($error)): ?>
                    <div class="error"><?php echo $error; ?></div>
                <?php endif; ?>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}
?>

<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>兑换码管理 - 我测测</title>
    <style>
        .management-section {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .logout-btn {
            padding: 8px 15px;
            background: #ff4757;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }      
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .btn {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .codes-result {
            margin-top: 20px;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
        }
        .code-item {
            font-family: monospace;
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="management-section">
        <div class="header">
            <h1>兑换码管理</h1>
            <a href="?action=logout" class="logout-btn">退出登录</a>
        </div>
        
        <div class="form-group">
            <label>测试项目</label>
            <select id="testSelect">
                <option value="6">SCL-90心理健康测试</option>
                <option value="8">精神需求测试</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>生成数量</label>
            <input type="number" id="codeCount" value="10" min="1" max="1000">
        </div>
        
        <div class="form-group">
            <label>有效期（月数）</label>
            <input type="number" id="expireMonths" value="12" min="1" max="36">
        </div>
        
        <button class="btn" onclick="generateCodes()">生成兑换码</button>
        
        <div id="codesResult" class="codes-result" style="display: none;"></div>
    </div>

    <script>
        async function generateCodes() {
            const testId = document.getElementById('testSelect').value;
            const count = document.getElementById('codeCount').value;
            const months = document.getElementById('expireMonths').value;
            
            try {
                const response = await fetch('/api/generate_codes.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        testId: testId,
                        count: parseInt(count),
                        expires_months: parseInt(months)
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const resultDiv = document.getElementById('codesResult');
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = `
                        <h3>生成成功！共 ${result.generated} 个兑换码</h3>
                        <div>绑定的测试: ${result.testId}</div>
                        <div style="margin-top: 10px;">
                            ${result.codes.map(code => `<div class="code-item">${code}</div>`).join('')}
                        </div>
                    `;
                } else {
                    alert('生成失败: ' + result.error);
                }
            } catch (error) {
                alert('请求失败: ' + error.message);
            }
        }
    </script>
</body>
</html>