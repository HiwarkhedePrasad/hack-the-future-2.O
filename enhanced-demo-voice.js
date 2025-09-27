// enhanced-demo-voice.js - Launch enhanced voice system with Gemini AI
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedDemoLauncher {
    constructor() {
        this.pythonPath = 'python';
        this.enhancedSystemPath = path.join(__dirname, 'voice', 'enhanced_voice_system.py');
        this.demoProcess = null;
        this.isRunning = false;
    }

    async startEnhancedDemo() {
        try {
            console.log('🤖 MEDIPING ENHANCED VOICE SYSTEM WITH GEMINI AI\n');
            
            if (this.isRunning) {
                console.log('⚠️ Enhanced system is already running');
                return;
            }

            // Check if Gemini API key is available
            if (!process.env.GEMINI_API_KEY) {
                console.error('❌ GEMINI_API_KEY not found in .env file');
                console.log('Please add your Gemini API key to the .env file');
                return;
            }

            console.log('🧠 Gemini AI: ENABLED for natural conversation');
            console.log('🇮🇳 Indian Accent Support: ENHANCED');
            console.log('🎤 Natural Conversation: ENABLED');
            console.log('🎯 No Menu System: Talk naturally!');
            console.log('\n🎤 Make sure your microphone and speakers are ready');
            console.log('⏰ Starting enhanced system...\n');

            // Start enhanced system process
            this.demoProcess = spawn(this.pythonPath, [this.enhancedSystemPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.dirname(this.enhancedSystemPath),
                env: { ...process.env }  // Pass all environment variables including GEMINI_API_KEY
            });

            this.isRunning = true;

            // Handle process output
            this.demoProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`[ENHANCED SYSTEM] ${output.trim()}`);
            });

            this.demoProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.error(`[SYSTEM ERROR] ${error.trim()}`);
            });

            this.demoProcess.on('close', (code) => {
                console.log(`\n[ENHANCED SYSTEM] Process exited with code ${code}`);
                this.isRunning = false;
                this.demoProcess = null;
                
                if (code === 0) {
                    console.log('✅ Enhanced system closed normally');
                } else {
                    console.log('❌ Enhanced system closed with error');
                }
            });

            this.demoProcess.on('error', (error) => {
                console.error(`[SYSTEM ERROR] Failed to start: ${error.message}`);
                this.isRunning = false;
                this.demoProcess = null;
            });

            console.log('✅ Enhanced voice system started successfully');
            console.log('🤖 Gemini AI is processing your natural speech');
            console.log('🛑 Press Ctrl+C to stop the system\n');

            // Show enhanced instructions
            this.showEnhancedInstructions();

        } catch (error) {
            console.error('❌ Failed to start enhanced system:', error);
        }
    }

    showEnhancedInstructions() {
        const instructions = `
╔══════════════════════════════════════════════════════════════╗
║           🤖 ENHANCED VOICE SYSTEM WITH GEMINI AI 🤖         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🗣️  TALK NATURALLY - NO MENU SYSTEM!                       ║
║                                                              ║
║  Just speak naturally in Hindi-English mix:                 ║
║                                                              ║
║  • "My name is Rajesh Kumar"                                 ║
║  • "I want to add blood pressure medicine"                  ║
║  • "What are my medicines?"                                  ║
║  • "I took my medicine just now"                             ║
║  • "Set reminder for diabetes tablet at 8 AM"               ║
║  • "Show my medication schedule"                             ║
║  • "I forgot to take my medicine yesterday"                 ║
║                                                              ║
║  🇮🇳 INDIAN ACCENT SUPPORT:                                  ║
║  • Understands Indian English patterns                      ║
║  • Multiple recognition attempts                             ║
║  • Longer listening timeout                                 ║
║  • Hindi-English code mixing supported                      ║
║                                                              ║
║  🤖 GEMINI AI FEATURES:                                      ║
║  • Natural conversation understanding                       ║
║  • Context-aware responses                                  ║
║  • Extracts information from natural speech                ║
║  • No rigid command structure needed                       ║
║                                                              ║
║  💡 TIPS FOR BEST RESULTS:                                   ║
║  • Speak clearly but naturally                              ║
║  • Use simple sentences                                     ║
║  • Mix Hindi-English as you normally do                     ║
║  • System will ask for clarification if needed              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `;
        
        console.log(instructions);
        
        console.log('🎯 EXAMPLE CONVERSATIONS:');
        console.log('');
        console.log('You: "Hello, mera naam Priya hai"');
        console.log('System: "Nice to meet you Priya! How can I help with your medicines?"');
        console.log('');
        console.log('You: "I need to add BP ki medicine, morning 8 baje"');
        console.log('System: "I\'ll add blood pressure medicine at 8 AM for you."');
        console.log('');
        console.log('You: "Kya medicines hai mere paas?"');
        console.log('System: "Here are your medicines: Blood pressure medicine at 8 AM..."');
        console.log('');
    }

    async stopEnhancedDemo() {
        try {
            if (!this.isRunning || !this.demoProcess) {
                console.log('⚠️ Enhanced system is not running');
                return;
            }

            console.log('\n🛑 Stopping enhanced voice system...');

            // Send termination signal
            this.demoProcess.kill('SIGTERM');

            // Wait for process to exit
            await new Promise((resolve) => {
                this.demoProcess.on('close', resolve);
                
                // Force kill after 5 seconds
                setTimeout(() => {
                    if (this.demoProcess) {
                        this.demoProcess.kill('SIGKILL');
                        resolve();
                    }
                }, 5000);
            });

            this.isRunning = false;
            this.demoProcess = null;

            console.log('✅ Enhanced voice system stopped');

        } catch (error) {
            console.error('❌ Failed to stop enhanced system:', error);
        }
    }
}

async function main() {
    const launcher = new EnhancedDemoLauncher();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Enhanced system interrupted by user');
        await launcher.stopEnhancedDemo();
        process.exit(0);
    });
    
    // Start enhanced system
    await launcher.startEnhancedDemo();
    
    // Keep the process running
    if (launcher.isRunning) {
        // Monitor enhanced system
        const monitorInterval = setInterval(() => {
            if (!launcher.isRunning) {
                console.log('⚠️ Enhanced system stopped unexpectedly');
                clearInterval(monitorInterval);
                process.exit(1);
            }
        }, 5000);
    }
}

// Run the enhanced launcher
main().catch(console.error);
