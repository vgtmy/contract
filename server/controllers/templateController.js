const db = require('../db');

module.exports = {
    // 获取所有模板
    getAllTemplates: (callback) => {
        db.all('SELECT * FROM templates ORDER BY created_at DESC', [], (err, rows) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, rows);
        });
    },

    // 创建新模板
    createTemplate: (template, callback) => {
        const { name, content, category } = template;
        if (!name || !content) {
            return callback(new Error('模板名称和内容不能为空'), null);
        }

        const sql = 'INSERT INTO templates (name, content, category) VALUES (?, ?, ?)';
        db.run(sql, [name, content, category], function(err) {
            if (err) {
                return callback(err, null);
            }
            callback(null, { id: this.lastID, ...template });
        });
    },

    // 获取单个模板
    getTemplateById: (id, callback) => {
        db.get('SELECT * FROM templates WHERE id = ?', [id], (err, row) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, row);
        });
    },

    // 更新模板
    updateTemplate: (id, template, callback) => {
        const { name, content, category } = template;
        if (!name || !content) {
            return callback(new Error('模板名称和内容不能为空'), null);
        }

        const sql = 'UPDATE templates SET name = ?, content = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        db.run(sql, [name, content, category, id], function(err) {
            if (err) {
                return callback(err, null);
            }
            callback(null, { id, ...template });
        });
    },

    // 删除模板
    deleteTemplate: (id, callback) => {
        db.run('DELETE FROM templates WHERE id = ?', [id], function(err) {
            if (err) {
                return callback(err, null);
            }
            callback(null, { id, deleted: this.changes > 0 });
        });
    }
};
