// demo-voice-system.js - Launch demo voice system for laptop testing
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DemoVoiceSystemLauncher {
    constructor() {
        this.pythonPath = 'python';
        this.demoSystemPath = path.join(__dirname, 'voice', 'demo_voice_system.py');
        this.demoProcess = null;
        this.isRunning = false;
    }

    async startDemoSystem(useRealGSM = false, gsmPort = 'COM3') {
        try {
            console.log('🎭 MEDIPING DEMO VOICE SYSTEM LAUNCHER\n');
            
            if (this.isRunning) {
                console.log('⚠️ Demo system is already running');
                return;
            }

            // Build command arguments
            const args = [this.demoSystemPath];
            
            if (useRealGSM) {
                args.push('--real-gsm', '--gsm-port', gsmPort);
                console.log(`📡 Starting with REAL GSM module on ${gsmPort}`);
            } else {
                console.log('🎭 Starting in DEMO mode (GSM simulated)');
            }

            console.log('🎤 Make sure your microphone and speakers are ready');
            console.log('⏰ Starting demo system...\n');

            // Start demo system process
            this.demoProcess = spawn(this.pythonPath, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.dirname(this.demoSystemPath)
            });

            this.isRunning = true;

            // Handle process output
            this.demoProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`[DEMO SYSTEM] ${output.trim()}`);
            });

            this.demoProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.error(`[DEMO ERROR] ${error.trim()}`);
            });

            this.demoProcess.on('close', (code) => {
                console.log(`\n[DEMO SYSTEM] Process exited with code ${code}`);
                this.isRunning = false;
                this.demoProcess = null;
                
                if (code === 0) {
                    console.log('✅ Demo system closed normally');
                } else {
                    console.log('❌ Demo system closed with error');
                }
            });

            this.demoProcess.on('error', (error) => {
                console.error(`[DEMO ERROR] Failed to start: ${error.message}`);
                this.isRunning = false;
                this.demoProcess = null;
            });

            console.log('✅ Demo voice system started successfully');
            console.log('🎤 Voice interaction is now active');
            console.log('🛑 Press Ctrl+C to stop the demo system\n');

            // Show demo instructions
            this.showDemoInstructions(useRealGSM);

        } catch (error) {
            console.error('❌ Failed to start demo system:', error);
        }
    }

    showDemoInstructions(useRealGSM) {
        const instructions = `
╔══════════════════════════════════════════════════════════════╗
║                🎤 DEMO VOICE SYSTEM READY 🎤                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🗣️  VOICE COMMANDS TO TRY:                                  ║
║                                                              ║
║  • "register" - Create new user account                     ║
║  • "add medicine" - Add medication with reminders           ║
║  • "check reminders" - View your medication schedule        ║
║  • "took medicine" - Mark medication as taken               ║
║  • "demo emergency" - Test emergency alert system           ║
║  • "gsm status" - Check GSM module status                   ║
║  • "system status" - View system information                ║
║  • "help" - Show all available commands                     ║
║  • "exit" - Quit the demo system                            ║
║                                                              ║
║  📱 GSM MODE: ${useRealGSM ? 'REAL GSM MODULE' : 'DEMO SIMULATION'.padEnd(17)} ║
║                                                              ║
║  🎯 DEMO FEATURES:                                           ║
║  • Voice-to-voice interaction                               ║
║  • Offline user registration                                ║
║  • Medicine management via voice                            ║
║  • Automatic medication reminders                           ║
║  • Emergency alert system                                   ║
║  • ${useRealGSM ? 'Real SMS and voice calls' : 'Simulated SMS and voice calls'.padEnd(27)} ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `;
        
        console.log(instructions);
        
        if (!useRealGSM) {
            console.log('💡 To switch to real GSM module:');
            console.log('   node demo-voice-system.js --real-gsm --gsm-port COM3\n');
        }
    }

    async stopDemoSystem() {
        try {
            if (!this.isRunning || !this.demoProcess) {
                console.log('⚠️ Demo system is not running');
                return;
            }

            console.log('\n🛑 Stopping demo voice system...');

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

            console.log('✅ Demo voice system stopped');

        } catch (error) {
            console.error('❌ Failed to stop demo system:', error);
        }
    }
}

async function main() {
    const launcher = new DemoVoiceSystemLauncher();
    
    // Parse command line arguments
    const useRealGSM = process.argv.includes('--real-gsm');
    const gsmPortIndex = process.argv.indexOf('--gsm-port');
    const gsmPort = gsmPortIndex !== -1 ? process.argv[gsmPortIndex + 1] : 'COM3';
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Demo system interrupted by user');
        await launcher.stopDemoSystem();
        process.exit(0);
    });
    
    // Start demo system
    await launcher.startDemoSystem(useRealGSM, gsmPort);
    
    // Keep the process running
    if (launcher.isRunning) {
        // Monitor demo system
        const monitorInterval = setInterval(() => {
            if (!launcher.isRunning) {
                console.log('⚠️ Demo system stopped unexpectedly');
                clearInterval(monitorInterval);
                process.exit(1);
            }
        }, 5000);
    }
}

// Run the demo launcher
main().catch(console.error);
