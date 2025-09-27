// services/voiceSystemService.js - Node.js integration with Python Voice System
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VoiceSystemService {
    constructor() {
        this.pythonPath = 'python';
        this.voiceSystemPath = path.join(__dirname, '..', 'voice', 'integrated_voice_system.py');
        this.voiceProcess = null;
        this.isRunning = false;
        this.gsmPort = 'COM3';
        this.gsmEnabled = true;
    }

    /**
     * Start the integrated voice system
     */
    async startVoiceSystem(options = {}) {
        try {
            if (this.isRunning) {
                console.log('⚠️ Voice system is already running');
                return { success: false, message: 'Voice system already running' };
            }

            const {
                gsmPort = this.gsmPort,
                enableGSM = this.gsmEnabled,
                testMode = false
            } = options;

            console.log('🎤 Starting MediPing Voice System...');
            console.log(`📡 GSM Port: ${gsmPort}`);
            console.log(`📶 GSM Enabled: ${enableGSM}`);

            // Build command arguments
            const args = [this.voiceSystemPath];
            
            if (!enableGSM) {
                args.push('--no-gsm');
            } else if (gsmPort) {
                args.push('--gsm-port', gsmPort);
            }

            if (testMode) {
                args.push('--test-gsm');
            }

            // Start voice system process
            this.voiceProcess = spawn(this.pythonPath, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.dirname(this.voiceSystemPath)
            });

            this.isRunning = true;

            // Handle process output
            this.voiceProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`[VOICE SYSTEM] ${output.trim()}`);
            });

            this.voiceProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.error(`[VOICE ERROR] ${error.trim()}`);
            });

            this.voiceProcess.on('close', (code) => {
                console.log(`[VOICE SYSTEM] Process exited with code ${code}`);
                this.isRunning = false;
                this.voiceProcess = null;
            });

            this.voiceProcess.on('error', (error) => {
                console.error(`[VOICE ERROR] Failed to start: ${error.message}`);
                this.isRunning = false;
                this.voiceProcess = null;
            });

            console.log('✅ Voice system started successfully');
            
            return {
                success: true,
                message: 'Voice system started',
                pid: this.voiceProcess.pid,
                gsmEnabled: enableGSM,
                gsmPort: gsmPort
            };

        } catch (error) {
            console.error('❌ Failed to start voice system:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to start voice system'
            };
        }
    }

    /**
     * Stop the voice system
     */
    async stopVoiceSystem() {
        try {
            if (!this.isRunning || !this.voiceProcess) {
                console.log('⚠️ Voice system is not running');
                return { success: false, message: 'Voice system not running' };
            }

            console.log('🛑 Stopping voice system...');

            // Send termination signal
            this.voiceProcess.kill('SIGTERM');

            // Wait for process to exit
            await new Promise((resolve) => {
                this.voiceProcess.on('close', resolve);
                
                // Force kill after 5 seconds
                setTimeout(() => {
                    if (this.voiceProcess) {
                        this.voiceProcess.kill('SIGKILL');
                        resolve();
                    }
                }, 5000);
            });

            this.isRunning = false;
            this.voiceProcess = null;

            console.log('✅ Voice system stopped');

            return {
                success: true,
                message: 'Voice system stopped'
            };

        } catch (error) {
            console.error('❌ Failed to stop voice system:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to stop voice system'
            };
        }
    }

    /**
     * Get voice system status
     */
    async getVoiceSystemStatus() {
        try {
            const status = {
                running: this.isRunning,
                pid: this.voiceProcess?.pid || null,
                gsmEnabled: this.gsmEnabled,
                gsmPort: this.gsmPort,
                pythonPath: this.pythonPath,
                voiceSystemPath: this.voiceSystemPath
            };

            // Check if voice system files exist
            try {
                await fs.access(this.voiceSystemPath);
                status.voiceSystemExists = true;
            } catch {
                status.voiceSystemExists = false;
            }

            // Check Python availability
            try {
                const pythonTest = spawn(this.pythonPath, ['--version'], { stdio: 'pipe' });
                await new Promise((resolve, reject) => {
                    pythonTest.on('close', (code) => {
                        status.pythonAvailable = code === 0;
                        resolve();
                    });
                    pythonTest.on('error', reject);
                });
            } catch {
                status.pythonAvailable = false;
            }

            return status;

        } catch (error) {
            console.error('❌ Failed to get voice system status:', error);
            return {
                running: false,
                error: error.message
            };
        }
    }

    /**
     * Test GSM module
     */
    async testGSMModule(gsmPort = this.gsmPort) {
        try {
            console.log(`📡 Testing GSM module on ${gsmPort}...`);

            const testProcess = spawn(this.pythonPath, [
                this.voiceSystemPath,
                '--test-gsm',
                '--gsm-port', gsmPort
            ], {
                stdio: 'pipe',
                cwd: path.dirname(this.voiceSystemPath)
            });

            let stdout = '';
            let stderr = '';

            testProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            testProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            const exitCode = await new Promise((resolve) => {
                testProcess.on('close', resolve);
            });

            const result = {
                success: exitCode === 0,
                exitCode,
                output: stdout,
                error: stderr,
                gsmPort
            };

            if (result.success) {
                console.log('✅ GSM module test successful');
            } else {
                console.log('❌ GSM module test failed');
            }

            return result;

        } catch (error) {
            console.error('❌ GSM test failed:', error);
            return {
                success: false,
                error: error.message,
                gsmPort
            };
        }
    }

    /**
     * Send command to voice system
     */
    async sendCommand(command) {
        try {
            if (!this.isRunning || !this.voiceProcess) {
                return {
                    success: false,
                    message: 'Voice system not running'
                };
            }

            // Send command to voice system stdin
            this.voiceProcess.stdin.write(command + '\n');

            return {
                success: true,
                message: 'Command sent to voice system'
            };

        } catch (error) {
            console.error('❌ Failed to send command:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get voice system database info
     */
    async getDatabaseInfo() {
        try {
            const dbPath = path.join(__dirname, '..', 'voice', 'mediping_offline.db');
            
            try {
                const stats = await fs.stat(dbPath);
                return {
                    exists: true,
                    path: dbPath,
                    size: stats.size,
                    modified: stats.mtime,
                    created: stats.birthtime
                };
            } catch {
                return {
                    exists: false,
                    path: dbPath,
                    message: 'Database not found'
                };
            }

        } catch (error) {
            return {
                exists: false,
                error: error.message
            };
        }
    }

    /**
     * Install voice system dependencies
     */
    async installDependencies() {
        try {
            console.log('📦 Installing voice system dependencies...');

            const requirementsPath = path.join(__dirname, '..', 'voice', 'requirements.txt');
            
            const installProcess = spawn(this.pythonPath, [
                '-m', 'pip', 'install', '-r', requirementsPath
            ], {
                stdio: 'pipe'
            });

            let stdout = '';
            let stderr = '';

            installProcess.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                console.log(`[PIP] ${output.trim()}`);
            });

            installProcess.stderr.on('data', (data) => {
                const error = data.toString();
                stderr += error;
                console.error(`[PIP ERROR] ${error.trim()}`);
            });

            const exitCode = await new Promise((resolve) => {
                installProcess.on('close', resolve);
            });

            const result = {
                success: exitCode === 0,
                exitCode,
                output: stdout,
                error: stderr
            };

            if (result.success) {
                console.log('✅ Dependencies installed successfully');
            } else {
                console.log('❌ Dependency installation failed');
            }

            return result;

        } catch (error) {
            console.error('❌ Failed to install dependencies:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Configure GSM settings
     */
    setGSMConfig(port, enabled = true) {
        this.gsmPort = port;
        this.gsmEnabled = enabled;
        
        console.log(`📡 GSM configured: Port=${port}, Enabled=${enabled}`);
        
        return {
            success: true,
            gsmPort: this.gsmPort,
            gsmEnabled: this.gsmEnabled
        };
    }

    /**
     * Get available COM ports (Windows)
     */
    async getAvailablePorts() {
        try {
            if (process.platform !== 'win32') {
                return {
                    success: false,
                    message: 'Port detection only available on Windows'
                };
            }

            // Use Python to detect COM ports
            const portDetectProcess = spawn(this.pythonPath, [
                '-c',
                `
import serial.tools.list_ports
ports = serial.tools.list_ports.comports()
for port in ports:
    print(f"{port.device}:{port.description}")
                `
            ], { stdio: 'pipe' });

            let stdout = '';
            
            portDetectProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            await new Promise((resolve) => {
                portDetectProcess.on('close', resolve);
            });

            const ports = stdout.trim().split('\n')
                .filter(line => line.includes(':'))
                .map(line => {
                    const [device, description] = line.split(':');
                    return { device: device.trim(), description: description.trim() };
                });

            return {
                success: true,
                ports
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new VoiceSystemService();
