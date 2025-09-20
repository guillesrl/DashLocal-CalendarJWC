const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
    // Serve the main dashboard HTML file
    const filePath = path.join(__dirname, '../public/Dashboard.html');
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
        const html = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
    } else {
        // Fallback HTML if Dashboard.html doesn't exist
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>KILOcode Dashboard</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-gray-100">
                <div class="container mx-auto p-4">
                    <h1 class="text-3xl font-bold text-center mb-8">KILOcode Dashboard</h1>
                    <div class="text-center">
                        <p class="text-gray-600 mb-4">Dashboard is loading...</p>
                        <a href="/api/health" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Check API Health
                        </a>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
};
