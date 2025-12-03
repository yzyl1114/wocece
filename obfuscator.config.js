// /Users/huixu/Documents/GitHub/wocece/obfuscator.config.js
module.exports = {
  // 基础配置
  compact: true,                      // 压缩代码为一行
  sourceMap: false,                   // 不生成source map
  
  // 控制流混淆（增加逆向难度）
  controlFlowFlattening: true,        // 控制流扁平化
  controlFlowFlatteningThreshold: 0.8, // 80%的代码进行控制流扁平化
  
  // 死代码注入（增加虚假逻辑）
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,    // 注入40%的死代码
  
  // 调试保护
  debugProtection: true,              // 防止在开发者工具中调试
  debugProtectionInterval: 500,       // 每隔500ms触发一次防调试
  
  // 标识符混淆
  identifierNamesGenerator: 'hexadecimal', // 使用十六进制标识符
  renameGlobals: true,                // 重命名全局变量
  
  // 字符串保护
  stringArray: true,                  // 提取字符串到数组
  stringArrayEncoding: ['base64', 'rc4'], // 双重编码
  stringArrayThreshold: 1,            // 100%的字符串编码
  splitStrings: true,                 // 分割字符串
  splitStringsChunkLength: 5,         // 每5个字符分割一次
  
  // 其他保护
  rotateStringArray: true,            // 旋转字符串数组
  selfDefending: true,                // 自防御（防止格式化）
  transformObjectKeys: true,          // 转换对象键
  unicodeEscapeSequence: false,       // 不使用unicode转义
  
  // 目标环境
  target: 'browser',
  
  // 简化配置（减少文件大小）
  simplify: true,
  numbersToExpressions: true,         // 数字转为表达式
  
  // 日志
  log: false
};