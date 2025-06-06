const db = require('../db');

module.exports = {
    // 获取所有合同
    getAllContracts: (callback) => {
        db.all('SELECT * FROM contracts ORDER BY created_at DESC', [], (err, rows) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, rows);
        });
    },

    // 创建新合同
    createContract: (contract, callback) => {
        const { title, description, status } = contract;
        const sql = 'INSERT INTO contracts (title, description, status) VALUES (?, ?, ?)';
        db.run(sql, [title, description, status || 'pending'], function(err) {
            if (err) {
                return callback(err, null);
            }
            callback(null, { id: this.lastID, ...contract });
        });
    },

    // 获取单个合同
    getContractById: (id, callback) => {
        db.get('SELECT * FROM contracts WHERE id = ?', [id], (err, row) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, row);
        });
    },

    // 更新合同
    updateContract: (id, contract, callback) => {
        const { title, description, status } = contract;
        const sql = 'UPDATE contracts SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        db.run(sql, [title, description, status, id], function(err) {
            if (err) {
                return callback(err, null);
            }
            callback(null, { id, ...contract });
        });
    },

    // 删除合同
    deleteContract: (id, callback) => {
        db.run('DELETE FROM contracts WHERE id = ?', [id], function(err) {
            if (err) {
                return callback(err, null);
            }
            callback(null, { id, deleted: this.changes > 0 });
        });
    }
};
