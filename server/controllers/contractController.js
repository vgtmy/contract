const db = require('../db');

/**
 * Contract Controller.
 * Handles database operations related to contracts.
 */
module.exports = {
    /**
     * Retrieves all contracts, with optional filtering and pagination.
     * @param {object} queryParams - Parameters for filtering (status, search) and pagination (limit).
     * @param {function} callback - The callback function (err, rows) to handle the result.
     */
    getAllContracts: (queryParams, callback) => {
        let sql = 'SELECT * FROM contracts';
        const params = [];
        const conditions = [];

        if (queryParams.status) {
            conditions.push('status = ?');
            params.push(queryParams.status);
        }

        if (queryParams.search) {
            const searchTerm = `%${queryParams.search}%`;
            conditions.push('(title LIKE ? OR description LIKE ?)');
            params.push(searchTerm);
            params.push(searchTerm);
        }

        // Example for future type filtering:
        // if (queryParams.type) {
        //     conditions.push('type = ?');
        //     params.push(queryParams.type);
        // }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC';

        if (queryParams.limit) {
            const limit = parseInt(queryParams.limit, 10);
            if (isNaN(limit) || limit <= 0) {
                // Invalid limit, proceed without it or return an error
                console.warn("Invalid limit parameter received:", queryParams.limit);
            } else {
                sql += ' LIMIT ?';
                params.push(limit);
            }
        }

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error("Error in getAllContracts DB call:", err.message);
                return callback(err, null);
            }
            callback(null, rows);
        });
    },

    /**
     * Creates a new contract in the database.
     * @param {object} contract - The contract object to create { title, description, status }.
     * @param {function} callback - The callback function (err, newContract) to handle the result.
     */
    createContract: (contract, callback) => {
        const { title, description, status } = contract;
        const sql = 'INSERT INTO contracts (title, description, status) VALUES (?, ?, ?)';
        db.run(sql, [title, description, status || 'pending'], function(err) {
            if (err) {
                console.error("Error in createContract DB call:", err.message);
                return callback(err, null);
            }
            callback(null, { id: this.lastID, ...contract, status: status || 'pending' });
        });
    },

    /**
     * Retrieves a single contract by its ID.
     * @param {number} id - The ID of the contract to retrieve.
     * @param {function} callback - The callback function (err, row) to handle the result.
     */
    getContractById: (id, callback) => {
        db.get('SELECT * FROM contracts WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error("Error in getContractById DB call:", err.message);
                return callback(err, null);
            }
            callback(null, row);
        });
    },

    /**
     * Updates an existing contract by its ID.
     * @param {number} id - The ID of the contract to update.
     * @param {object} contract - The contract object with updated fields { title, description, status }.
     * @param {function} callback - The callback function (err, updatedContract) to handle the result.
     */
    updateContract: (id, contract, callback) => {
        const { title, description, status } = contract;
        // Ensure status is provided, otherwise backend might set it to null if not careful
        if (!status) {
             console.warn(`Updating contract ${id} without a status. Consider providing a default or fetching existing.`);
        }
        const sql = 'UPDATE contracts SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        db.run(sql, [title, description, status, id], function(err) {
            if (err) {
                console.error("Error in updateContract DB call:", err.message);
                return callback(err, null);
            }
            // Check if any row was changed to confirm the contract was found and updated
            if (this.changes === 0) {
                return callback(new Error(`Contract with ID ${id} not found or no changes made.`), null);
            }
            callback(null, { id, ...contract });
        });
    },

    /**
     * Deletes a contract by its ID.
     * @param {number} id - The ID of the contract to delete.
     * @param {function} callback - The callback function (err, result) to handle the result.
     *                            Result contains { id, deleted: boolean }.
     */
    deleteContract: (id, callback) => {
        db.run('DELETE FROM contracts WHERE id = ?', [id], function(err) {
            if (err) {
                console.error("Error in deleteContract DB call:", err.message);
                return callback(err, null);
            }
            callback(null, { id, deleted: this.changes > 0 });
        });
    },

    /**
     * Retrieves statistics about contracts (counts by status, etc.).
     * @param {function} callback - The callback function (err, stats) to handle the result.
     *                            Stats is an object like { pendingApproval, ongoing, expiringSoon, addedThisMonth }.
     */
    getContractStats: (callback) => {
        const stats = {
            pendingApproval: 0,
            ongoing: 0,
            expiringSoon: 0,
            addedThisMonth: 0
        };
        let queriesCompleted = 0;
        // Define the number of distinct DB queries expected to run for stats
        const totalQueries = 4;
        let firstError = null; // To store the first error encountered

        const checkDone = (err) => {
            if (firstError) return; // If an error already occurred, don't proceed
            if (err) {
                firstError = err;
                console.error("Error in getContractStats DB query:", err.message);
                return callback(err, null);
            }
            queriesCompleted++;
            if (queriesCompleted === totalQueries) {
                callback(null, stats);
            }
        };

        db.get("SELECT COUNT(*) AS count FROM contracts WHERE status = 'pending'", [], (err, row) => {
            if (row) stats.pendingApproval = row.count;
            checkDone(err);
        });

        db.get("SELECT COUNT(*) AS count FROM contracts WHERE status = 'executed'", [], (err, row) => {
            if (row) stats.ongoing = row.count;
            checkDone(err);
        });

        // Placeholder for "expiringSoon"
        db.get("SELECT COUNT(*) AS count FROM contracts WHERE status NOT IN ('completed', 'terminated')", [], (err, row) => {
            if (row) stats.expiringSoon = row.count;
            checkDone(err);
        });

        // Placeholder for "addedThisMonth" (using total contracts for now)
        // Real implementation would use:
        // const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // db.get("SELECT COUNT(*) AS count FROM contracts WHERE created_at >= ?", [thirtyDaysAgo.toISOString()], (err, row) => { ... });
        db.get("SELECT COUNT(*) AS count FROM contracts", [], (err, row) => {
            if (row) stats.addedThisMonth = row.count;
            checkDone(err);
        });
    }
};
