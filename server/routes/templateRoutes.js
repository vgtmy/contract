const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

// 获取所有模板
router.get('/', (req, res) => {
    templateController.getAllTemplates((err, templates) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(templates);
    });
});

// 创建新模板
router.post('/', (req, res) => {
    const { name, content, category } = req.body;
    if (!name || !content) {
        return res.status(400).json({ error: '模板名称和内容不能为空' });
    }

    templateController.createTemplate({ name, content, category }, (err, newTemplate) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json(newTemplate);
    });
});

// 获取单个模板
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: '无效的模板ID' });
    }

    templateController.getTemplateById(id, (err, template) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!template) {
            return res.status(404).json({ error: '模板不存在' });
        }
        res.json(template);
    });
});

// 更新模板
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: '无效的模板ID' });
    }

    const { name, content, category } = req.body;
    if (!name || !content) {
        return res.status(400).json({ error: '模板名称和内容不能为空' });
    }

    templateController.updateTemplate(id, { name, content, category }, (err, updatedTemplate) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(updatedTemplate);
    });
});

// 删除模板
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: '无效的模板ID' });
    }

    templateController.deleteTemplate(id, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!result.deleted) {
            return res.status(404).json({ error: '模板不存在' });
        }
        res.json({ message: '模板删除成功' });
    });
});

module.exports = router;
