const db = require('../db');

/**
 * Template Controller.
 * Handles database operations related to contract templates.
 */
module.exports = {
    /**
     * Retrieves all contract templates from the database.
     * @param {function} callback - The callback function (err, rows) to handle the result.
     */
    getAllTemplates: (callback) => {
        db.all('SELECT * FROM templates ORDER BY created_at DESC', [], (err, rows) => {
            if (err) {
                console.error("Error in getAllTemplates DB call:", err.message);
                return callback(err, null);
            }
            callback(null, rows);
        });
    },

    /**
     * Creates a new contract template in the database.
     * @param {object} template - The template object { name, content, category }.
     * @param {function} callback - The callback function (err, newTemplate) to handle the result.
     */
    createTemplate: (template, callback) => {
        const { name, content, category } = template;
        if (!name || !content) { // Basic validation
            const err = new Error('Template name and content cannot be empty');
            console.error("Error in createTemplate: ", err.message);
            return callback(err, null);
        }

        const sql = 'INSERT INTO templates (name, content, category) VALUES (?, ?, ?)';
        db.run(sql, [name, content, category], function(err) {
            if (err) {
                console.error("Error in createTemplate DB call:", err.message);
                return callback(err, null);
            }
            callback(null, { id: this.lastID, ...template });
        });
    },

    /**
     * Retrieves a single contract template by its ID.
     * @param {number} id - The ID of the template to retrieve.
     * @param {function} callback - The callback function (err, row) to handle the result.
     */
    getTemplateById: (id, callback) => {
        db.get('SELECT * FROM templates WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error("Error in getTemplateById DB call:", err.message);
                return callback(err, null);
            }
            callback(null, row);
        });
    },

    /**
     * Updates an existing contract template by its ID.
     * @param {number} id - The ID of the template to update.
     * @param {object} template - The template object with updated fields { name, content, category }.
     * @param {function} callback - The callback function (err, updatedTemplate) to handle the result.
     */
    updateTemplate: (id, template, callback) => {
        const { name, content, category } = template;
        if (!name || !content) { // Basic validation
            const err = new Error('Template name and content cannot be empty');
            console.error("Error in updateTemplate: ", err.message);
            return callback(err, null);
        }

        const sql = 'UPDATE templates SET name = ?, content = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        db.run(sql, [name, content, category, id], function(err) {
            if (err) {
                console.error("Error in updateTemplate DB call:", err.message);
                return callback(err, null);
            }
            if (this.changes === 0) {
                return callback(new Error(`Template with ID ${id} not found or no changes made.`), null);
            }
            callback(null, { id, ...template });
        });
    },

    /**
     * Deletes a contract template by its ID.
     * @param {number} id - The ID of the template to delete.
     * @param {function} callback - The callback function (err, result) to handle the result.
     *                            Result contains { id, deleted: boolean }.
     */
    deleteTemplate: (id, callback) => {
        db.run('DELETE FROM templates WHERE id = ?', [id], function(err) {
            if (err) {
                console.error("Error in deleteTemplate DB call:", err.message);
                return callback(err, null);
            }
            callback(null, { id, deleted: this.changes > 0 });
        });
    }
};
