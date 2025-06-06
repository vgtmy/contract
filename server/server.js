const express = require('express');
const path = require('path');
const db = require('./db');
const contractRoutes = require('./routes/contractRoutes');
const templateRoutes = require('./routes/templateRoutes');

const app = express();

// 解析 JSON 请求体
app.use(express.json());

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 挂载合同路由
app.use('/api/contracts', contractRoutes);

// 挂载模板路由
app.use('/api/templates', templateRoutes);

// 默认路由返回首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
