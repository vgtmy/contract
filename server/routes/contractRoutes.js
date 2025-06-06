const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');

// 获取所有合同
router.get('/', (req, res) => {
    contractController.getAllContracts(req.query, (err, contracts) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(contracts);
    });
});

// 获取合同统计数据
router.get('/stats', (req, res) => {
    contractController.getContractStats((err, stats) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(stats);
    });
});

// 创建新合同
router.post('/', (req, res) => {
    const { title, description, status } = req.body;
    if (!title) {
        return res.status(400).json({ error: '合同标题不能为空' });
    }

    contractController.createContract({ title, description, status }, (err, newContract) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json(newContract);
    });
});

// 获取单个合同
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: '无效的合同ID' });
    }

    contractController.getContractById(id, (err, contract) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!contract) {
            return res.status(404).json({ error: '合同不存在' });
        }
        res.json(contract);
    });
});

// 更新合同
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: '无效的合同ID' });
    }

    const { title, description, status } = req.body;
    if (!title) {
        return res.status(400).json({ error: '合同标题不能为空' });
    }

    contractController.updateContract(id, { title, description, status }, (err, updatedContract) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(updatedContract);
    });
});

// 删除合同
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: '无效的合同ID' });
    }

    contractController.deleteContract(id, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!result.deleted) {
            return res.status(404).json({ error: '合同不存在' });
        }
        res.json({ message: '合同删除成功' });
    });
});

module.exports = router;
