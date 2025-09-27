// vapi-demo.js - Launch Vapi voice system for natural voice-to-voice conversations
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VapiDemoLauncher {
    constructor() {
        this.pythonPath = 'python';
        this.vapiSystemPath = path.join(__dirname, 'voice', 'vapi_voice_system.py');
        this.vapiProcess = null;
        this.isRunning = false;
    }

    async startVapiDemo() {
        try {
            console.log('🎙️ MEDIPING VAPI VOICE SYSTEM\n');
            
            if (this.isRunning) {
                console.log('⚠️ Vapi system is already running');
                return;
            }

            // Check if Vapi API key is available
            if (!process.env.VAPI_API_KEY) {
                console.error('❌ VAPI_API_KEY not found in .env file');
                console.log('Please add your Vapi API key to the .env file:');
                console.log('VAPI_API_KEY=your_vapi_api_key_here');
                console.log('\nGet your Vapi API key from: https://vapi.ai');
                return;
            }

            console.log('🤖 Vapi AI: ENABLED for natural voice-to-voice conversations');
            console.log('🗣️ Real-time Speech: Advanced speech recognition and synthesis');
            console.log('🇮🇳 Indian Languages: Hindi, English, Hinglish fully supported');
            console.log('💬 Natural Flow: No menu system - just talk naturally!');
            console.log('🎯 Smart Understanding: Context-aware conversation');
            console.log('\n🎤 Make sure your microphone and speakers are ready');
            console.log('⏰ Starting Vapi voice system...\n');

            // Start Vapi system process
            this.vapiProcess = spawn(this.pythonPath, [this.vapiSystemPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.dirname(this.vapiSystemPath),
                env: { ...process.env }
            });

            this.isRunning = true;

            // Handle process output
            this.vapiProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`[VAPI SYSTEM] ${output.trim()}`);
            });

            this.vapiProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.error(`[SYSTEM ERROR] ${error.trim()}`);
            });

            this.vapiProcess.on('close', (code) => {
                console.log(`\n[VAPI SYSTEM] Process exited with code ${code}`);
                this.isRunning = false;
                this.vapiProcess = null;
                
                if (code === 0) {
                    console.log('✅ Vapi system closed normally');
                } else {
                    console.log('❌ Vapi system closed with error');
                }
            });

            this.vapiProcess.on('error', (error) => {
                console.error(`[SYSTEM ERROR] Failed to start: ${error.message}`);
                this.isRunning = false;
                this.vapiProcess = null;
            });

            console.log('✅ Vapi voice system started successfully');
            console.log('🎙️ Natural voice conversation is now active');
            console.log('🛑 Press Ctrl+C to stop the system\n');

            // Show Vapi instructions
            this.showVapiInstructions();

        } catch (error) {
            console.error('❌ Failed to start Vapi system:', error);
        }
    }

    showVapiInstructions() {
        const instructions = `
╔══════════════════════════════════════════════════════════════╗
║           🎙️ VAPI VOICE-TO-VOICE SYSTEM 🎙️                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🗣️  NATURAL VOICE CONVERSATION - NO TYPING NEEDED!         ║
║                                                              ║
║  🌟 VAPI ADVANTAGES:                                         ║
║  • Real-time voice-to-voice conversation                    ║
║  • Natural speech flow with interruptions                   ║
║  • Advanced speech recognition for Indian accents           ║
║  • High-quality voice synthesis                             ║
║  • Context-aware conversation memory                        ║
║  • No delays - instant responses                            ║
║                                                              ║
║  🇮🇳 PERFECT FOR INDIAN USERS:                               ║
║  • Understands Indian English perfectly                     ║
║  • Supports Hindi words in English sentences                ║
║  • Handles code-mixing (Hinglish) naturally                 ║
║  • Optimized for Indian speech patterns                     ║
║                                                              ║
║  💬 CONVERSATION EXAMPLES:                                   ║
║                                                              ║
║  Registration:                                              ║
║  You: "Hello, mera naam Rajesh hai"                         ║
║  MediPing: "Namaste Rajesh! Welcome to MediPing..."         ║
║                                                              ║
║  Adding Medicine:                                           ║
║  You: "I want to add BP medicine for morning"               ║
║  MediPing: "Sure! What time in the morning should..."       ║
║                                                              ║
║  Checking Reminders:                                        ║
║  You: "Kya medicines hain mere paas?"                       ║
║  MediPing: "Aapki medicines ye hain: BP medicine..."        ║
║                                                              ║
║  Medicine Taken:                                            ║
║  You: "Maine BP ki tablet le li"                            ║
║  MediPing: "Excellent! I've recorded that you took..."      ║
║                                                              ║
║  🎯 KEY FEATURES:                                            ║
║  • Interrupt anytime - just start speaking                  ║
║  • Natural pauses and flow                                  ║
║  • Remembers context throughout conversation                ║
║  • Handles multiple topics in one conversation              ║
║  • Smart error recovery                                     ║
║                                                              ║
║  🔊 AUDIO QUALITY:                                           ║
║  • Crystal clear voice synthesis                            ║
║  • Natural intonation and emotions                          ║
║  • Optimized for Indian accent understanding                ║
║  • Real-time processing with minimal latency                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `;
        
        console.log(instructions);
        
        console.log('🚀 VAPI SYSTEM CAPABILITIES:');
        console.log('• Real-time voice-to-voice conversation');
        console.log('• Advanced speech recognition (Deepgram Nova-2)');
        console.log('• Natural voice synthesis (ElevenLabs)');
        console.log('• GPT-4 powered conversation understanding');
        console.log('• Indian English and Hinglish support');
        console.log('• Context-aware medication management');
        console.log('• Seamless conversation flow with interruptions');
        console.log('');
        
        console.log('🎤 HOW TO USE:');
        console.log('1. Wait for the system to say "Namaste! Main MediPing hun..."');
        console.log('2. Start speaking naturally in Hindi/English/Hinglish');
        console.log('3. You can interrupt MediPing anytime by speaking');
        console.log('4. Have a natural conversation about your medicines');
        console.log('5. Say goodbye when you\'re done');
        console.log('');
        
        console.log('💡 TIPS FOR BEST EXPERIENCE:');
        console.log('• Speak naturally - no need to be formal');
        console.log('• Mix Hindi and English as you normally do');
        console.log('• You can interrupt and change topics anytime');
        console.log('• The system remembers what you said earlier');
        console.log('• Use natural phrases like "mera naam", "add karna hai"');
        console.log('');
    }

    async stopVapiDemo() {
        try {
            if (!this.isRunning || !this.vapiProcess) {
                console.log('⚠️ Vapi system is not running');
                return;
            }

            console.log('\n🛑 Stopping Vapi voice system...');

            // Send termination signal
            this.vapiProcess.kill('SIGTERM');

            // Wait for process to exit
            await new Promise((resolve) => {
                this.vapiProcess.on('close', resolve);
                
                // Force kill after 10 seconds
                setTimeout(() => {
                    if (this.vapiProcess) {
                        this.vapiProcess.kill('SIGKILL');
                        resolve();
                    }
                }, 10000);
            });

            this.isRunning = false;
            this.vapiProcess = null;

            console.log('✅ Vapi voice system stopped');

        } catch (error) {
            console.error('❌ Failed to stop Vapi system:', error);
        }
    }
}

async function main() {
    const launcher = new VapiDemoLauncher();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Vapi system interrupted by user');
        await launcher.stopVapiDemo();
        process.exit(0);
    });
    
    // Start Vapi system
    await launcher.startVapiDemo();
    
    // Keep the process running
    if (launcher.isRunning) {
        // Monitor Vapi system
        const monitorInterval = setInterval(() => {
            if (!launcher.isRunning) {
                console.log('⚠️ Vapi system stopped unexpectedly');
                clearInterval(monitorInterval);
                process.exit(1);
            }
        }, 5000);
    }
}

// Run the Vapi launcher
main().catch(console.error);
