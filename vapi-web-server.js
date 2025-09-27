// enhanced-mediping-server.js - Advanced server for MediPing Pro
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MediPingProServer {
    constructor() {
        this.app = express();
        this.PORT = process.env.PORT || 3000;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.skypack.dev", "https://cdnjs.cloudflare.com"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    connectSrc: ["'self'", "https://api.vapi.ai", "wss://api.vapi.ai"],
                    mediaSrc: ["'self'", "blob:", "data:"],
                    imgSrc: ["'self'", "data:", "blob:"]
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' 
                ? ['https://your-domain.com'] 
                : ['http://localhost:3000', 'http://127.0.0.1:3000'],
            credentials: true
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per windowMs
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Static files with cache headers
        this.app.use(express.static(__dirname, {
            maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
            etag: true
        }));

        // Request logging
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
            next();
        });
    }

    setupRoutes() {
        // Main demo page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'enhanced-mediping.html'));
        });

        // Legacy support
        this.app.get('/simple', (req, res) => {
            res.sendFile(path.join(__dirname, 'vapi-simple-demo.html'));
        });

        // API Routes
        this.setupApiRoutes();

        // Health and monitoring routes
        this.setupHealthRoutes();
    }

    setupApiRoutes() {
        const apiRouter = express.Router();

        // Vapi configuration endpoint
        apiRouter.get('/vapi-config', (req, res) => {
            const config = {
                publicKey: process.env.VAPI_PUBLIC_KEY || process.env.VAPI_API_KEY,
                assistantId: process.env.VAPI_ASSISTANT_ID || "99becbc5-75c1-4292-8339-79f53a8b63e2",
                environment: process.env.NODE_ENV || 'development'
            };

            // Don't expose sensitive data
            if (!config.publicKey) {
                return res.status(503).json({
                    error: 'Vapi configuration not available',
                    message: 'Please check server configuration'
                });
            }

            res.json(config);
        });

        // Session tracking (for analytics)
        apiRouter.post('/session/start', (req, res) => {
            const session = {
                id: this.generateSessionId(),
                startTime: new Date().toISOString(),
                userAgent: req.get('User-Agent'),
                ip: req.ip
            };

            console.log('📊 New session started:', session.id);
            res.json({ sessionId: session.id, success: true });
        });

        apiRouter.post('/session/end', (req, res) => {
            const { sessionId, duration, messageCount } = req.body;
            console.log(`📊 Session ended: ${sessionId}, Duration: ${duration}ms, Messages: ${messageCount}`);
            res.json({ success: true });
        });

        // Feedback endpoint
        apiRouter.post('/feedback', (req, res) => {
            const { rating, comment, sessionId } = req.body;
            console.log(`📝 Feedback received: Rating ${rating}/5, Session: ${sessionId}`);
            if (comment) {
                console.log(`💬 Comment: ${comment}`);
            }
            res.json({ success: true, message: 'Thank you for your feedback!' });
        });

        // Error reporting
        apiRouter.post('/error-report', (req, res) => {
            const { error, context, timestamp, userAgent } = req.body;
            console.error('🚨 Client Error Report:');
            console.error(`Time: ${timestamp}`);
            console.error(`Error: ${error}`);
            console.error(`Context: ${JSON.stringify(context, null, 2)}`);
            console.error(`User Agent: ${userAgent}`);
            res.json({ success: true });
        });

        this.app.use('/api', apiRouter);
    }

    setupHealthRoutes() {
        // Comprehensive health check
        this.app.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version,
                environment: process.env.NODE_ENV || 'development',
                configuration: {
                    vapiConfigured: !!process.env.VAPI_PUBLIC_KEY || !!process.env.VAPI_API_KEY,
                    assistantConfigured: !!process.env.VAPI_ASSISTANT_ID,
                    port: this.PORT
                }
            };

            res.json(health);
        });

        // Simple ping endpoint
        this.app.get('/ping', (req, res) => {
            res.json({ 
                pong: true, 
                timestamp: new Date().toISOString() 
            });
        });

        // Detailed system info (development only)
        this.app.get('/system-info', (req, res) => {
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({ error: 'Not available in production' });
            }

            const systemInfo = {
                process: {
                    pid: process.pid,
                    version: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    uptime: process.uptime(),
                    memory: process.memoryUsage()
                },
                environment: process.env,
                timestamp: new Date().toISOString()
            };

            res.json(systemInfo);
        });
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.originalUrl} not found`,
                timestamp: new Date().toISOString()
            });
        });

        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('🚨 Server Error:', err);
            
            const isDevelopment = process.env.NODE_ENV !== 'production';
            
            res.status(err.status || 500).json({
                error: err.message || 'Internal Server Error',
                ...(isDevelopment && { stack: err.stack }),
                timestamp: new Date().toISOString()
            });
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('🚨 Unhandled Promise Rejection at:', promise, 'reason:', reason);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error('🚨 Uncaught Exception:', err);
            process.exit(1);
        });
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    start() {
        this.app.listen(this.PORT, () => {
            this.printStartupBanner();
        });
    }

    printStartupBanner() {
        const banner = `
╔══════════════════════════════════════════════════════════════╗
║                    🏥 MEDIPING PRO SERVER                    ║
╠══════════════════════════════════════════════════════════════╣
║  Advanced Voice-Powered Medication Assistant with Vapi AI   ║
╚══════════════════════════════════════════════════════════════╝

🌐 Server Details:
   • URL: http://localhost:${this.PORT}
   • Environment: ${process.env.NODE_ENV || 'development'}
   • Node.js: ${process.version}
   • Platform: ${process.platform} (${process.arch})

🎙️ Vapi AI Configuration:
   • Public Key: ${process.env.VAPI_PUBLIC_KEY || process.env.VAPI_API_KEY ? '✅ Configured' : '❌ Missing'}
   • Assistant ID: ${process.env.VAPI_ASSISTANT_ID ? '✅ Configured' : '⚠️ Using Default'}

🚀 Available Endpoints:
   • Main App: http://localhost:${this.PORT}
   • Health Check: http://localhost:${this.PORT}/health
   • API Config: http://localhost:${this.PORT}/api/vapi-config
   • System Ping: http://localhost:${this.PORT}/ping

🎯 Key Features:
   • Real-time voice-to-voice conversation
   • Hindi/English/Hinglish support optimized for Indian users
   • Advanced speech recognition for regional accents
   • Intelligent medication management through voice
   • Web-based interface - no app installation required
   • Enhanced error handling and monitoring
   • Session tracking and analytics
   • Security hardened for production deployment

💡 Usage Instructions:
   1. Open http://localhost:${this.PORT} in your browser
   2. Allow microphone permissions when prompted
   3. Click "Start Voice Chat" to begin
   4. Speak naturally in Hindi/English/Hinglish
   5. Try commands like:
      • "Namaste, mera naam Rajesh hai"
      • "BP ki medicine add karo morning mein"
      • "Kya medicines hain mere paas?"
      • "Medicine le liya hai"

🔧 Environment Variables:
   • VAPI_PUBLIC_KEY or VAPI_API_KEY (required)
   • VAPI_ASSISTANT_ID (optional - has default)
   • PORT (optional - defaults to 3000)
   • NODE_ENV (optional - defaults to development)

📊 Monitoring:
   • Health: http://localhost:${this.PORT}/health
   • System Info: http://localhost:${this.PORT}/system-info (dev only)

🛑 Press Ctrl+C to stop the server

${process.env.VAPI_PUBLIC_KEY || process.env.VAPI_API_KEY ? 
'✅ Server is ready for voice interactions!' : 
'⚠️ Warning: VAPI_PUBLIC_KEY not configured. Please set it in .env file.'}
`;

        console.log(banner);
    }
}

// Start the server
const server = new MediPingProServer();
server.start();

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});