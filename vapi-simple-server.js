// vapi-simple-server.js - Simple HTTP server for Vapi web demo
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.static(__dirname));

// CORS headers for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toLocaleTimeString('en-IN');
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'vapi-simple-demo.html'));
});

app.get('/advanced', (req, res) => {
    res.sendFile(path.join(__dirname, 'vapi-web-demo.html'));
});

// API endpoint to get Vapi configuration
app.get('/api/vapi-config', (req, res) => {
    const config = {
        publicKey: process.env.VAPI_API_KEY,
        assistantId: "99becbc5-75c1-4292-8339-79f53a8b63e2"
    };

    if (!config.publicKey) {
        return res.status(503).json({
            error: 'Vapi configuration not available',
            message: 'Please check VAPI_API_KEY in .env file'
        });
    }

    res.json(config);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        vapiConfigured: !!process.env.VAPI_API_KEY,
        uptime: process.uptime()
    });
});

// Session tracking (simple)
app.post('/api/session/start', (req, res) => {
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    console.log(`📊 New session started: ${sessionId}`);
    res.json({ sessionId, success: true });
});

app.post('/api/session/end', (req, res) => {
    const { sessionId, duration, messageCount } = req.body;
    console.log(`📊 Session ended: ${sessionId}, Duration: ${duration}ms, Messages: ${messageCount}`);
    res.json({ success: true });
});

// Error reporting
app.post('/api/error-report', (req, res) => {
    const { error, context, timestamp } = req.body;
    console.error('🚨 Client Error:', error);
    if (context) console.error('Context:', context);
    res.json({ success: true });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('🚨 Server Error:', err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🎙️ MEDIPING VAPI WEB DEMO SERVER');
    console.log('=' .repeat(50));
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`🎤 Vapi Web Demo: http://localhost:${PORT}`);
    console.log(`🔧 Health Check: http://localhost:${PORT}/health`);
    console.log(`📊 API Config: http://localhost:${PORT}/api/vapi-config`);
    
    if (process.env.VAPI_API_KEY) {
        console.log('✅ Vapi API Key: Configured');
        console.log(`🔑 Key: ${process.env.VAPI_API_KEY.substring(0, 10)}...`);
    } else {
        console.log('❌ Vapi API Key: Not found in .env');
        console.log('⚠️  Please add VAPI_API_KEY=your_key to .env file');
    }
    
    console.log('\n🚀 FEATURES:');
    console.log('• Real-time voice-to-voice conversation');
    console.log('• Natural Hindi/English/Hinglish support');
    console.log('• Web-based interface - no app installation');
    console.log('• Advanced speech recognition for Indian accents');
    console.log('• Premium voice synthesis with ElevenLabs');
    console.log('• Complete medication management through voice');
    console.log('• Session tracking and error reporting');
    
    console.log('\n🎯 USAGE:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Allow microphone access when prompted');
    console.log('3. Click "Start Voice Chat" to begin');
    console.log('4. Speak naturally in Hindi/English/Hinglish');
    console.log('5. Try commands like:');
    console.log('   • "Namaste, mera naam Rajesh hai"');
    console.log('   • "BP ki medicine add karo morning mein"');
    console.log('   • "Kya medicines hain mere paas?"');
    console.log('   • "Medicine le liya hai"');
    
    console.log('\n💡 TIPS:');
    console.log('• Mix Hindi-English naturally as you speak');
    console.log('• You can interrupt MediPing anytime');
    console.log('• System remembers your conversation context');
    console.log('• Use natural phrases like Indians normally speak');
    
    console.log('\n🛑 Press Ctrl+C to stop the server');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Server terminated gracefully...');
    process.exit(0);
});
