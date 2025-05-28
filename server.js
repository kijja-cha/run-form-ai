const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo'
};

const requestHandler = (req, res) => {
    // Parse URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html for root path
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Construct file path
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    console.log(`📁 ${req.method} ${pathname}`);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block'
            });
            res.end(`
                <html>
                    <head><title>404 - File Not Found</title></head>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h1>🚫 404 - File Not Found</h1>
                        <p>The file <code>${pathname}</code> was not found.</p>
                        <a href="/">← Back to RunForm.AI</a>
                    </body>
                </html>
            `);
            return;
        }
        
        // Read and serve file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*',
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY',
                    'X-XSS-Protection': '1; mode=block'
                });
                res.end(`
                    <html>
                        <head><title>500 - Server Error</title></head>
                        <body style="font-family: Arial; text-align: center; padding: 50px;">
                            <h1>⚠️ 500 - Server Error</h1>
                            <p>Error reading file: ${err.message}</p>
                            <a href="/">← Back to RunForm.AI</a>
                        </body>
                    </html>
                `);
                return;
            }
            
            // Set headers for CORS, security, and caching
            const headers = {
                'Content-Type': mimeType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'SAMEORIGIN',
                'X-XSS-Protection': '1; mode=block',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            };
            
            // Add CSP header for HTML files
            if (ext === '.html') {
                headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net data: blob:; media-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net";
            }
            
            res.writeHead(200, headers);
            res.end(data);
        });
    });
};

// Get port from command line args or use default
const PORT = process.argv.includes('--port') 
    ? parseInt(process.argv[process.argv.indexOf('--port') + 1]) || 3000
    : 3000;

// Create HTTP server
const server = http.createServer(requestHandler);

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Try a different port.`);
        console.log(`💡 Try: node server.js --port 3001`);
    } else {
        console.error('❌ Server error:', err.message);
    }
    process.exit(1);
});

// Start server
server.listen(PORT, () => {
    console.log('\n🏃‍♂️ RunForm.AI Local Server Started!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📱 Mobile access: http://[YOUR_IP]:${PORT}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Available endpoints:');
    console.log(`   • Main App: http://localhost:${PORT}/`);
    console.log(`   • Test Page: http://localhost:${PORT}/test.html`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 Tips:');
    console.log('   • Press Ctrl+C to stop server');
    console.log('   • Use --port flag to change port (e.g., --port 3001)');
    console.log('   • Check firewall if mobile can\'t connect');
    console.log('   • For HTTPS, use Chrome flags or localhost');
    console.log('\n🚀 Ready for testing!\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down RunForm.AI server...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});

// Display network interfaces for mobile access
const os = require('os');
const interfaces = os.networkInterfaces();
console.log('📱 For mobile testing, use one of these IPs:');
Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
            console.log(`   • http://${iface.address}:${PORT}`);
        }
    });
}); 