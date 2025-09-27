// services/emergencyCallServiceLocalTTS.js - Emergency system with local TTS playback
import ttsService from './ttsService.js';
import client from '../twilioClient.js';

class EmergencyCallServiceLocalTTS {
    constructor() {
        this.maxRetries = 3;
        this.retryDelayMinutes = 5;
    }

    /**
     * Handle emergency by playing TTS audio locally on laptop
     * @param {Object} patientInfo - Patient information
     * @param {Object} reminderInfo - Reminder details
     * @param {string} emergencyNumber - Emergency contact number
     * @param {Object} options - Emergency options
     */
    async handleEmergency(patientInfo, reminderInfo, emergencyNumber, options = {}) {
        try {
            console.log(`🚨 EMERGENCY ALERT for ${patientInfo.name} - Playing TTS audio locally!`);
            
            // Generate and play TTS audio locally
            const ttsResult = await this.generateAndPlayLocalTTS(patientInfo, reminderInfo, options);
            
            if (ttsResult.success) {
                console.log('✅ Emergency TTS audio played successfully on laptop');
            } else {
                console.warn('⚠️ TTS playback failed, sending WhatsApp backup');
            }

            // Also send WhatsApp message as backup notification
            await this.sendWhatsAppNotification(emergencyNumber, patientInfo, reminderInfo);
            
            return {
                success: true,
                ttsPlayed: ttsResult.success,
                ttsAudioPath: ttsResult.audio_path,
                whatsappSent: true,
                message: `Emergency handled: TTS played locally, WhatsApp sent to ${emergencyNumber}`
            };

        } catch (error) {
            console.error('❌ Error handling emergency:', error);
            
            // Fallback to WhatsApp only
            await this.sendWhatsAppNotification(emergencyNumber, patientInfo, reminderInfo);
            
            return {
                success: false,
                error: error.message,
                whatsappSent: true,
                message: 'Emergency TTS failed, WhatsApp backup sent'
            };
        }
    }

    /**
     * Generate TTS audio and play it locally on laptop
     */
    async generateAndPlayLocalTTS(patientInfo, reminderInfo, options = {}) {
        try {
            const ttsOptions = {
                playImmediately: true, // Play immediately on laptop
                useOnline: options.useOnlineTTS || false,
                language: options.language || 'en'
            };

            console.log('🎤 Generating emergency TTS audio for local playback...');
            console.log(`📢 EMERGENCY: ${patientInfo.name} missed ${reminderInfo.medicine} at ${reminderInfo.time}`);
            
            const result = await ttsService.generateEmergencyAudio(patientInfo, reminderInfo, ttsOptions);
            
            if (result.success) {
                console.log(`🔊 PLAYING EMERGENCY ALERT ON LAPTOP!`);
                console.log(`📁 Audio file: ${result.audio_path}`);
                
                // Add visual alert
                this.displayVisualAlert(patientInfo, reminderInfo);
                
                return result;
            } else {
                console.error(`❌ TTS generation failed: ${result.error}`);
                return result;
            }
            
        } catch (error) {
            console.error('❌ TTS generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Display visual alert on console
     */
    displayVisualAlert(patientInfo, reminderInfo) {
        const alertBox = `
╔══════════════════════════════════════════════════════════════╗
║                    🚨 EMERGENCY ALERT 🚨                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Patient: ${patientInfo.name.padEnd(48)} ║
║  Medicine: ${reminderInfo.medicine.padEnd(47)} ║
║  Time: ${reminderInfo.time.padEnd(51)} ║
║  Status: MISSED MEDICATION REMINDER                          ║
║                                                              ║
║  🔊 AUDIO ALERT PLAYING ON LAPTOP                           ║
║  📱 WhatsApp notification sent to emergency contact         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `;
        
        console.log('\n' + alertBox + '\n');
        
        // Flash alert multiple times
        setTimeout(() => {
            console.log('🚨🚨🚨 EMERGENCY - MEDICATION MISSED 🚨🚨🚨');
        }, 2000);
        
        setTimeout(() => {
            console.log('🚨🚨🚨 CHECK ON PATIENT IMMEDIATELY 🚨🚨🚨');
        }, 4000);
    }

    /**
     * Send WhatsApp notification to emergency contact
     */
    async sendWhatsAppNotification(emergencyNumber, patientInfo, reminderInfo) {
        try {
            const whatsappNumber = emergencyNumber.startsWith('whatsapp:') 
                ? emergencyNumber 
                : `whatsapp:${emergencyNumber}`;
            
            const message = `🚨 **URGENT - MediPing Alert** 🚨\n\n` +
                `Your contact **${patientInfo.name}** has not responded to their medicine reminder.\n\n` +
                `📋 **Details:**\n` +
                `💊 Medicine: ${reminderInfo.medicine}\n` +
                `⏰ Scheduled Time: ${reminderInfo.time}\n` +
                `📱 Patient Phone: ${patientInfo.phone}\n\n` +
                `⚠️ **Action Required:**\n` +
                `Please check on ${patientInfo.name} to ensure they are okay and have taken their medication.\n\n` +
                `🆘 If this is an emergency, call emergency services immediately.\n\n` +
                `This is an automated message from MediPing medication reminder service.`;

            await client.messages.create({
                from: process.env.TWILIO_WHATSAPP_NUMBER,
                to: whatsappNumber,
                body: message
            });

            console.log(`📱 WhatsApp notification sent to ${emergencyNumber}`);
            return true;

        } catch (error) {
            console.error('❌ Error sending WhatsApp notification:', error);
            return false;
        }
    }

    /**
     * Test local TTS emergency system
     */
    async testLocalEmergency(testPatientInfo, testReminderInfo, testEmergencyNumber, options = {}) {
        console.log('🧪 Testing Local TTS Emergency System...\n');
        
        console.log('📋 Test Configuration:');
        console.log(`👤 Patient: ${testPatientInfo.name}`);
        console.log(`💊 Medicine: ${testReminderInfo.medicine}`);
        console.log(`⏰ Time: ${testReminderInfo.time}`);
        console.log(`📞 Emergency Contact: ${testEmergencyNumber}`);
        console.log(`🔊 Local Playback: YES (on laptop)`);
        console.log(`📱 WhatsApp Backup: YES\n`);
        
        try {
            const result = await this.handleEmergency(testPatientInfo, testReminderInfo, testEmergencyNumber, options);
            
            if (result.success) {
                console.log('✅ LOCAL EMERGENCY TEST SUCCESSFUL!');
                console.log(`🔊 TTS Audio Played: ${result.ttsPlayed ? 'YES' : 'NO'}`);
                console.log(`📱 WhatsApp Sent: ${result.whatsappSent ? 'YES' : 'NO'}`);
                console.log(`📁 Audio File: ${result.ttsAudioPath || 'N/A'}`);
                
                return result;
            } else {
                console.error('❌ Local emergency test failed:', result.error);
                return result;
            }
            
        } catch (error) {
            console.error('❌ Local emergency test error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Schedule local emergency alert
     */
    async scheduleLocalEmergency(patientInfo, reminderInfo, emergencyNumber, delayMinutes = 0, options = {}) {
        console.log(`⏰ Scheduling local emergency alert in ${delayMinutes} minutes...`);
        
        setTimeout(async () => {
            await this.handleEmergency(patientInfo, reminderInfo, emergencyNumber, options);
        }, delayMinutes * 60 * 1000);
    }

    /**
     * Play emergency alert immediately (for testing)
     */
    async playEmergencyAlertNow(patientInfo, reminderInfo, options = {}) {
        console.log('🚨 PLAYING EMERGENCY ALERT NOW!');
        
        const result = await this.generateAndPlayLocalTTS(patientInfo, reminderInfo, options);
        
        if (result.success) {
            console.log('✅ Emergency alert played successfully');
        } else {
            console.error('❌ Emergency alert failed:', result.error);
        }
        
        return result;
    }

    /**
     * Get TTS service status
     */
    async getTTSStatus() {
        try {
            return await ttsService.getStatus();
        } catch (error) {
            return {
                error: error.message,
                available: false
            };
        }
    }

    /**
     * Clean up old TTS audio files
     */
    async cleanupTTSFiles() {
        try {
            return await ttsService.cleanupOldAudioFiles();
        } catch (error) {
            console.error('❌ TTS cleanup error:', error);
            return 0;
        }
    }

    /**
     * List recent emergency audio files
     */
    async getEmergencyAudioFiles() {
        try {
            const files = await ttsService.getAudioFiles();
            return files.filter(file => file.name.includes('emergency'));
        } catch (error) {
            console.error('❌ Error getting audio files:', error);
            return [];
        }
    }
}

export default new EmergencyCallServiceLocalTTS();
