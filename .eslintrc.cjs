module.exports = {
  extends: '@chatie', // 确保这个包已经安装，并且包含了你想要继承的规则
  rules: {
    'multiline-ternary': 'off', // 禁用多行三元运算符检查
    'no-use-before-define': 'off', // 允许在类、函数和变量定义之前使用它们
  },
  // 如果你需要添加解析器选项或其他配置，也可以在这里添加
}
