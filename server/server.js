// Import necessary modules
const express = require('express'); // Express framework for building web applications
const path = require('path');     // Path module for handling and transforming file paths
// const db = require('./db');    // Database module (already initialized in db.js, so not directly used here for setup)
const contractRoutes = require('./routes/contractRoutes'); // Routes for contract-related API endpoints
const templateRoutes = require('./routes/templateRoutes'); // Routes for template-related API endpoints

// Initialize the Express application
const app = express();

// Middleware to parse JSON request bodies.
// This allows the application to handle JSON data sent in requests (e.g., for POST, PUT).
app.use(express.json());

// Middleware to serve static files (like HTML, CSS, client-side JavaScript)
// from the 'public' directory. __dirname is the directory of the current module (server.js).
app.use(express.static(path.join(__dirname, 'public')));

// Mount the contract routes.
// All routes defined in contractRoutes.js will be prefixed with '/api/contracts'.
app.use('/api/contracts', contractRoutes);

// Mount the template routes.
// All routes defined in templateRoutes.js will be prefixed with '/api/templates'.
app.use('/api/templates', templateRoutes);

// Default route to serve the main HTML page for any other GET requests not handled above.
// This is common for Single Page Applications (SPAs) where client-side routing takes over.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Basic error handling middleware.
// This will catch errors passed by `next(err)` or unhandled errors in synchronous code.
// For more robust error handling, specific error types and responses can be managed.
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack trace to the console
    res.status(500).json({ error: '服务器内部错误 (Internal Server Error)' });
});

// Define the port the server will listen on.
// Uses environment variable PORT if set, otherwise defaults to 3000.
const PORT = process.env.PORT || 3000;

// Start the server and listen on the defined port.
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
