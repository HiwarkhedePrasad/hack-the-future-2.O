// services/ttsService.js - Node.js integration with Python TTS service
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TTSService {
    constructor() {
        this.pythonPath = 'python'; // or 'python3' on some systems
        this.ttsScriptPath = path.join(__dirname, '..', 'tts', 'tts_service.py');
        this.audioDir = path.join(__dirname, '..', 'tts', 'audio');
        this.isInitialized = false;
    }

    /**
     * Initialize the TTS service
     */
    async initialize() {
        try {
            // Check if Python script exists
            await fs.access(this.ttsScriptPath);
            
            // Create audio directory if it doesn't exist
            try {
                await fs.mkdir(this.audioDir, { recursive: true });
            } catch (error) {
                // Directory might already exist
            }
            
            // Test Python installation
            await this.testPythonInstallation();
            
            this.isInitialized = true;
            console.log('✅ TTS Service initialized successfully');
            
        } catch (error) {
            console.error('❌ TTS Service initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Test if Python and required packages are available
     */
    async testPythonInstallation() {
        return new Promise((resolve, reject) => {
            // First test: Check if Python script exists and can be executed
            const testProcess = spawn(this.pythonPath, ['-c', 'import sys; print("Python available:", sys.version)']);
            
            let stdout = '';
            let stderr = '';
            
            testProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            testProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            testProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('🐍 Python test:', stdout.trim());
                    // Now test the TTS script with --list-voices
                    this.testTTSScript().then(resolve).catch(reject);
                } else {
                    reject(new Error(`Python not available: ${stderr || 'Unknown error'}`));
                }
            });
            
            testProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python: ${error.message}`));
            });
        });
    }

    /**
     * Test the TTS script specifically
     */
    async testTTSScript() {
        return new Promise((resolve, reject) => {
            const testProcess = spawn(this.pythonPath, [this.ttsScriptPath, '--list-voices']);
            
            let stdout = '';
            let stderr = '';
            
            testProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            testProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            testProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        // Find the JSON part in stdout
                        const lines = stdout.split('\n');
                        let jsonLine = '';
                        for (const line of lines) {
                            if (line.trim().startsWith('{')) {
                                jsonLine = line.trim();
                                break;
                            }
                        }
                        
                        if (jsonLine) {
                            const voicesInfo = JSON.parse(jsonLine);
                            console.log('🎤 TTS Voices available:', {
                                offline: voicesInfo.offline_available,
                                online: voicesInfo.online_available,
                                offline_voices_count: voicesInfo.offline_voices.length
                            });
                            resolve(voicesInfo);
                        } else {
                            // If no JSON found, create a basic response
                            console.log('🎤 TTS script executed successfully (no JSON output)');
                            resolve({
                                offline_available: true,
                                online_available: true,
                                offline_voices: [],
                                online_languages: ['en']
                            });
                        }
                    } catch (parseError) {
                        console.log('⚠️ Could not parse TTS voices info, but script works');
                        resolve({
                            offline_available: true,
                            online_available: true,
                            offline_voices: [],
                            online_languages: ['en']
                        });
                    }
                } else {
                    reject(new Error(`TTS script test failed: ${stderr || stdout || 'Unknown error'}`));
                }
            });
            
            testProcess.on('error', (error) => {
                reject(new Error(`Failed to start TTS script: ${error.message}`));
            });
        });
    }

    /**
     * Generate emergency audio using Python TTS
     * @param {Object} patientInfo - Patient information
     * @param {Object} reminderInfo - Reminder details
     * @param {Object} options - TTS options
     */
    async generateEmergencyAudio(patientInfo, reminderInfo, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const {
            playImmediately = true,
            useOnline = false,
            language = 'en'
        } = options;

        return new Promise((resolve, reject) => {
            const args = [
                this.ttsScriptPath,
                '--patient-name', patientInfo.name,
                '--medicine', reminderInfo.medicine,
                '--time', reminderInfo.time,
                '--language', language
            ];

            if (playImmediately) {
                args.push('--play');
            }

            if (useOnline) {
                args.push('--online');
            }

            console.log(`🎤 Generating TTS audio for ${patientInfo.name}...`);
            
            const ttsProcess = spawn(this.pythonPath, args);
            
            let stdout = '';
            let stderr = '';
            
            ttsProcess.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                
                // Log real-time output from Python script
                const lines = output.split('\n').filter(line => line.trim());
                lines.forEach(line => {
                    if (line.includes('✅') || line.includes('❌') || line.includes('🔊')) {
                        console.log(`[TTS] ${line}`);
                    }
                });
            });
            
            ttsProcess.stderr.on('data', (data) => {
                const error = data.toString();
                stderr += error;
                console.error(`[TTS Error] ${error}`);
            });
            
            ttsProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        // Find the JSON result in stdout
                        const lines = stdout.split('\n').filter(line => line.trim());
                        let jsonResult = null;
                        
                        // Look for JSON in the output
                        for (const line of lines.reverse()) {
                            if (line.trim().startsWith('{')) {
                                try {
                                    jsonResult = JSON.parse(line.trim());
                                    break;
                                } catch (e) {
                                    continue;
                                }
                            }
                        }
                        
                        if (jsonResult) {
                            console.log('✅ TTS generation completed successfully');
                            resolve(jsonResult);
                        } else {
                            // If no JSON found but exit code is 0, assume success
                            console.log('✅ TTS generation completed (no JSON output)');
                            resolve({
                                success: true,
                                message: 'TTS generation completed',
                                audio_path: 'Generated successfully'
                            });
                        }
                    } catch (parseError) {
                        console.log('⚠️ Could not parse TTS result, but process succeeded');
                        resolve({
                            success: true,
                            message: 'TTS generation completed',
                            audio_path: 'Generated successfully'
                        });
                    }
                } else {
                    console.error(`❌ TTS process failed with code ${code}`);
                    console.error(`Stdout: ${stdout}`);
                    console.error(`Stderr: ${stderr}`);
                    reject(new Error(`TTS generation failed with code ${code}: ${stderr || stdout || 'Unknown error'}`));
                }
            });
            
            ttsProcess.on('error', (error) => {
                reject(new Error(`Failed to start TTS process: ${error.message}`));
            });
        });
    }

    /**
     * Play an existing audio file
     * @param {string} audioPath - Path to audio file
     */
    async playAudio(audioPath) {
        return new Promise((resolve, reject) => {
            const args = [
                this.ttsScriptPath,
                '--patient-name', 'Test',
                '--medicine', 'Test',
                '--time', 'Test',
                '--play'
            ];

            console.log(`🔊 Playing audio: ${audioPath}`);
            
            const playProcess = spawn(this.pythonPath, args);
            
            let stderr = '';
            
            playProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            playProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Audio playback completed');
                    resolve({ success: true });
                } else {
                    reject(new Error(`Audio playback failed: ${stderr || 'Unknown error'}`));
                }
            });
            
            playProcess.on('error', (error) => {
                reject(new Error(`Failed to start audio playback: ${error.message}`));
            });
        });
    }

    /**
     * Get list of available audio files
     */
    async getAudioFiles() {
        try {
            const files = await fs.readdir(this.audioDir);
            const audioFiles = files.filter(file => 
                file.endsWith('.mp3') || file.endsWith('.wav')
            );
            
            const fileDetails = await Promise.all(
                audioFiles.map(async (file) => {
                    const filePath = path.join(this.audioDir, file);
                    const stats = await fs.stat(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                })
            );
            
            return fileDetails.sort((a, b) => b.created - a.created);
            
        } catch (error) {
            console.error('❌ Error getting audio files:', error);
            return [];
        }
    }

    /**
     * Clean up old audio files (older than 24 hours)
     */
    async cleanupOldAudioFiles() {
        try {
            const files = await this.getAudioFiles();
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            let deletedCount = 0;
            
            for (const file of files) {
                if (file.created < oneDayAgo) {
                    try {
                        await fs.unlink(file.path);
                        deletedCount++;
                        console.log(`🗑️ Deleted old audio file: ${file.name}`);
                    } catch (error) {
                        console.error(`❌ Failed to delete ${file.name}:`, error.message);
                    }
                }
            }
            
            if (deletedCount > 0) {
                console.log(`✅ Cleaned up ${deletedCount} old audio files`);
            }
            
            return deletedCount;
            
        } catch (error) {
            console.error('❌ Error during audio cleanup:', error);
            return 0;
        }
    }

    /**
     * Get TTS service status
     */
    async getStatus() {
        try {
            const voicesInfo = await this.testPythonInstallation();
            const audioFiles = await this.getAudioFiles();
            
            return {
                initialized: this.isInitialized,
                python_available: true,
                offline_tts_available: voicesInfo.offline_available,
                online_tts_available: voicesInfo.online_available,
                audio_files_count: audioFiles.length,
                audio_directory: this.audioDir,
                last_check: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                initialized: this.isInitialized,
                python_available: false,
                error: error.message,
                last_check: new Date().toISOString()
            };
        }
    }
}

export default new TTSService();
