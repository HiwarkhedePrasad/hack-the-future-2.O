// improved-demo.js - Launch improved voice system with better Indian accent support
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImprovedDemoLauncher {
    constructor() {
        this.pythonPath = 'python';
        this.improvedSystemPath = path.join(__dirname, 'voice', 'improved_voice_system.py');
        this.improvedProcess = null;
        this.isRunning = false;
    }

    async startImprovedDemo() {
        try {
            console.log('🎤 MEDIPING IMPROVED VOICE SYSTEM\n');
            
            if (this.isRunning) {
                console.log('⚠️ Improved system is already running');
                return;
            }

            // Check if Gemini API key is available
            if (!process.env.GEMINI_API_KEY) {
                console.error('❌ GEMINI_API_KEY not found in .env file');
                console.log('Please add your Gemini API key to the .env file');
                return;
            }

            console.log('🇮🇳 Indian Accent Support: ENHANCED with multiple recognition methods');
            console.log('🧠 Gemini AI: ENABLED for natural conversation understanding');
            console.log('🗣️ Languages: Hindi, English, Hinglish supported');
            console.log('🎯 Natural Speech: Talk naturally, no menu system!');
            console.log('⚡ Fast & Reliable: Uses Google Speech Recognition');
            console.log('\n🎤 Make sure your microphone and speakers are ready');
            console.log('⏰ Starting improved system...\n');

            // Start improved system process
            this.improvedProcess = spawn(this.pythonPath, [this.improvedSystemPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.dirname(this.improvedSystemPath),
                env: { ...process.env }
            });

            this.isRunning = true;

            // Handle process output
            this.improvedProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`[IMPROVED SYSTEM] ${output.trim()}`);
            });

            this.improvedProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.error(`[SYSTEM ERROR] ${error.trim()}`);
            });

            this.improvedProcess.on('close', (code) => {
                console.log(`\n[IMPROVED SYSTEM] Process exited with code ${code}`);
                this.isRunning = false;
                this.improvedProcess = null;
                
                if (code === 0) {
                    console.log('✅ Improved system closed normally');
                } else {
                    console.log('❌ Improved system closed with error');
                }
            });

            this.improvedProcess.on('error', (error) => {
                console.error(`[SYSTEM ERROR] Failed to start: ${error.message}`);
                this.isRunning = false;
                this.improvedProcess = null;
            });

            console.log('✅ Improved voice system started successfully');
            console.log('🎙️ Multiple recognition methods active for Indian accents');
            console.log('🛑 Press Ctrl+C to stop the system\n');

            // Show improved instructions
            this.showImprovedInstructions();

        } catch (error) {
            console.error('❌ Failed to start improved system:', error);
        }
    }

    showImprovedInstructions() {
        const instructions = `
╔══════════════════════════════════════════════════════════════╗
║      🎤 IMPROVED VOICE SYSTEM FOR INDIAN USERS 🎤           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🗣️  SPEAK NATURALLY - MULTIPLE RECOGNITION METHODS!        ║
║                                                              ║
║  The system tries these methods in order:                   ║
║  1. Google (Indian English) - Best for Indian accents       ║
║  2. Google (Hindi) - For Hindi speech                       ║
║  3. Google (English) - Standard English                     ║
║  4. Offline recognition - No internet backup                ║
║                                                              ║
║  🇮🇳 OPTIMIZED FOR INDIAN SPEECH:                            ║
║  • Longer pause detection for Indian speaking patterns      ║
║  • Lower energy threshold for softer voices                 ║
║  • Better ambient noise handling                            ║
║  • Multiple attempts with feedback                          ║
║                                                              ║
║  💬 NATURAL CONVERSATION EXAMPLES:                           ║
║                                                              ║
║  Registration:                                              ║
║  "Namaste, mera naam Rajesh Kumar hai"                      ║
║  "Hello, my name is Priya Sharma"                           ║
║                                                              ║
║  Adding Medicine:                                           ║
║  "Mujhe BP ki medicine add karni hai"                       ║
║  "I want to add diabetes tablet"                            ║
║  "Sugar ki dawa add karo morning mein"                      ║
║                                                              ║
║  Checking Medicines:                                        ║
║  "Meri kya medicines hain?"                                 ║
║  "What are my reminders?"                                   ║
║  "Batao kya dawa leni hai"                                  ║
║                                                              ║
║  Medicine Taken:                                            ║
║  "Medicine le liya"                                         ║
║  "Tablet kha liya hai"                                      ║
║  "I took my medicine"                                       ║
║                                                              ║
║  🎯 TIPS FOR BEST RESULTS:                                   ║
║  • Speak clearly but naturally                              ║
║  • System will try multiple times if needed                 ║
║  • Mix Hindi-English as you normally speak                  ║
║  • Wait for "Please speak clearly..." before talking        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `;
        
        console.log(instructions);
        
        console.log('🚀 SYSTEM FEATURES:');
        console.log('• Multiple speech recognition methods');
        console.log('• Optimized for Indian accents and speech patterns');
        console.log('• Natural conversation with Gemini AI');
        console.log('• Hindi, English, and Hinglish support');
        console.log('• Automatic retry with different methods');
        console.log('• No rigid menu system - talk naturally');
        console.log('');
        
        console.log('⚡ RECOGNITION METHODS:');
        console.log('1. Google Indian English (en-IN) - Primary');
        console.log('2. Google Hindi (hi-IN) - For Hindi speech');
        console.log('3. Google English (en-US) - Standard English');
        console.log('4. Offline Sphinx - Internet-free backup');
        console.log('');
    }

    async stopImprovedDemo() {
        try {
            if (!this.isRunning || !this.improvedProcess) {
                console.log('⚠️ Improved system is not running');
                return;
            }

            console.log('\n🛑 Stopping improved voice system...');

            // Send termination signal
            this.improvedProcess.kill('SIGTERM');

            // Wait for process to exit
            await new Promise((resolve) => {
                this.improvedProcess.on('close', resolve);
                
                // Force kill after 5 seconds
                setTimeout(() => {
                    if (this.improvedProcess) {
                        this.improvedProcess.kill('SIGKILL');
                        resolve();
                    }
                }, 5000);
            });

            this.isRunning = false;
            this.improvedProcess = null;

            console.log('✅ Improved voice system stopped');

        } catch (error) {
            console.error('❌ Failed to stop improved system:', error);
        }
    }
}

async function main() {
    const launcher = new ImprovedDemoLauncher();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Improved system interrupted by user');
        await launcher.stopImprovedDemo();
        process.exit(0);
    });
    
    // Start improved system
    await launcher.startImprovedDemo();
    
    // Keep the process running
    if (launcher.isRunning) {
        // Monitor improved system
        const monitorInterval = setInterval(() => {
            if (!launcher.isRunning) {
                console.log('⚠️ Improved system stopped unexpectedly');
                clearInterval(monitorInterval);
                process.exit(1);
            }
        }, 5000);
    }
}

// Run the improved launcher
main().catch(console.error);
