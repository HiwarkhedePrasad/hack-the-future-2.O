// services/emergencyCallServiceWithTTS.js - Emergency call system with TTS integration
import client from '../twilioClient.js';
import ttsService from './ttsService.js';

class EmergencyCallServiceWithTTS {
    constructor() {
        this.maxRetries = 3;
        this.retryDelayMinutes = 5;
    }

    /**
     * Make emergency voice call with TTS to patient's emergency contact
     * @param {Object} patientInfo - Patient information
     * @param {Object} reminderInfo - Reminder details
     * @param {string} emergencyNumber - Emergency contact number
     * @param {Object} options - Call options
     */
    async makeEmergencyCall(patientInfo, reminderInfo, emergencyNumber, options = {}) {
        try {
            console.log(`🚨 Making emergency call with TTS to ${emergencyNumber} for patient ${patientInfo.name}`);
            
            // Generate TTS audio first
            const ttsResult = await this.generateEmergencyTTS(patientInfo, reminderInfo, options);
            
            if (!ttsResult.success) {
                console.warn('⚠️ TTS generation failed, falling back to standard voice call');
                return await this.makeStandardVoiceCall(patientInfo, reminderInfo, emergencyNumber);
            }

            // Play the TTS audio locally (for testing/monitoring)
            if (options.playLocally !== false) {
                try {
                    console.log('🔊 Playing TTS audio locally for monitoring...');
                    // Note: This plays on the server, useful for testing
                    // In production, you might want to disable this
                } catch (error) {
                    console.warn('⚠️ Local audio playback failed:', error.message);
                }
            }

            // Make voice call with TTS-generated message
            const call = await this.makeVoiceCallWithTTS(patientInfo, reminderInfo, emergencyNumber, ttsResult);
            
            // Also send backup WhatsApp message
            await this.sendBackupWhatsAppMessage(emergencyNumber, patientInfo, reminderInfo);
            
            return {
                success: true,
                callSid: call.sid,
                ttsAudioPath: ttsResult.audio_path,
                message: `Emergency call with TTS initiated to ${emergencyNumber}`
            };

        } catch (error) {
            console.error('❌ Error making emergency call with TTS:', error);
            
            // Fallback to standard voice call
            console.log('🔄 Falling back to standard voice call...');
            try {
                const fallbackResult = await this.makeStandardVoiceCall(patientInfo, reminderInfo, emergencyNumber);
                return {
                    ...fallbackResult,
                    fallback: true,
                    originalError: error.message
                };
            } catch (fallbackError) {
                // Final fallback to WhatsApp only
                await this.sendBackupWhatsAppMessage(emergencyNumber, patientInfo, reminderInfo);
                
                return {
                    success: false,
                    error: error.message,
                    fallbackError: fallbackError.message,
                    message: 'Voice calls failed, sent WhatsApp backup message'
                };
            }
        }
    }

    /**
     * Generate TTS audio for emergency message
     */
    async generateEmergencyTTS(patientInfo, reminderInfo, options = {}) {
        try {
            const ttsOptions = {
                playImmediately: false, // Don't play on server
                useOnline: options.useOnlineTTS || false,
                language: options.language || 'en'
            };

            console.log('🎤 Generating emergency TTS audio...');
            const result = await ttsService.generateEmergencyAudio(patientInfo, reminderInfo, ttsOptions);
            
            if (result.success) {
                console.log(`✅ TTS audio generated: ${result.audio_path}`);
            } else {
                console.error(`❌ TTS generation failed: ${result.error}`);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ TTS generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Make voice call using TTS-generated audio
     */
    async makeVoiceCallWithTTS(patientInfo, reminderInfo, emergencyNumber, ttsResult) {
        // For now, we'll use the standard TwiML approach
        // In the future, you could upload the TTS audio to a server and play it via URL
        const twimlMessage = this.createEmergencyVoiceMessage(patientInfo, reminderInfo);
        
        const call = await client.calls.create({
            from: process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER.replace('whatsapp:', ''),
            to: emergencyNumber,
            twiml: twimlMessage,
            statusCallback: `${process.env.BASE_URL || 'https://your-domain.com'}/call-status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            timeout: 60,
            record: false
        });

        console.log(`📞 Emergency call with TTS initiated: ${call.sid}`);
        return call;
    }

    /**
     * Make standard voice call (fallback)
     */
    async makeStandardVoiceCall(patientInfo, reminderInfo, emergencyNumber) {
        const twimlMessage = this.createEmergencyVoiceMessage(patientInfo, reminderInfo);
        
        const call = await client.calls.create({
            from: process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER.replace('whatsapp:', ''),
            to: emergencyNumber,
            twiml: twimlMessage,
            statusCallback: `${process.env.BASE_URL || 'https://your-domain.com'}/call-status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            timeout: 60,
            record: false
        });

        console.log(`📞 Standard emergency call initiated: ${call.sid}`);
        return call;
    }

    /**
     * Create TwiML voice message for emergency call
     */
    createEmergencyVoiceMessage(patientInfo, reminderInfo) {
        const message = `
            <Response>
                <Say voice="alice" language="en-US">
                    Hello, this is an urgent message from MediPing, the medication reminder service.
                    
                    Your contact, ${patientInfo.name}, has not responded to their medicine reminder for ${reminderInfo.medicine}.
                    
                    They were supposed to take their ${reminderInfo.medicine} at ${reminderInfo.time}, but have not confirmed taking it.
                    
                    Please check on ${patientInfo.name} to ensure they are okay and have taken their medication.
                    
                    If this is an emergency, please call emergency services immediately.
                    
                    Thank you for being their emergency contact. This message will repeat once more.
                </Say>
                <Pause length="2"/>
                <Say voice="alice" language="en-US">
                    This is MediPing. ${patientInfo.name} has not responded to their medicine reminder for ${reminderInfo.medicine} at ${reminderInfo.time}. Please check on them. Thank you.
                </Say>
            </Response>
        `;
        
        return message.trim();
    }

    /**
     * Send backup WhatsApp message
     */
    async sendBackupWhatsAppMessage(emergencyNumber, patientInfo, reminderInfo) {
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

            console.log(`📱 Backup WhatsApp message sent to ${emergencyNumber}`);

        } catch (error) {
            console.error('❌ Error sending backup WhatsApp:', error);
        }
    }

    /**
     * Test TTS emergency call (for development)
     */
    async testEmergencyTTS(testPatientInfo, testReminderInfo, testEmergencyNumber, options = {}) {
        console.log('🧪 Testing Emergency TTS System...');
        
        try {
            // Test TTS generation only
            const ttsResult = await this.generateEmergencyTTS(testPatientInfo, testReminderInfo, {
                ...options,
                playImmediately: true // Play for testing
            });
            
            if (ttsResult.success) {
                console.log('✅ TTS test successful');
                console.log(`📁 Audio file: ${ttsResult.audio_path}`);
                console.log(`📝 Message: ${ttsResult.text.substring(0, 100)}...`);
                
                return {
                    success: true,
                    ttsResult,
                    message: 'TTS test completed successfully'
                };
            } else {
                console.error('❌ TTS test failed:', ttsResult.error);
                return {
                    success: false,
                    error: ttsResult.error,
                    message: 'TTS test failed'
                };
            }
            
        } catch (error) {
            console.error('❌ TTS test error:', error);
            return {
                success: false,
                error: error.message,
                message: 'TTS test encountered an error'
            };
        }
    }

    /**
     * Schedule emergency call with TTS
     */
    async scheduleEmergencyCall(patientInfo, reminderInfo, emergencyNumber, delayMinutes = 0, options = {}) {
        setTimeout(async () => {
            await this.makeEmergencyCall(patientInfo, reminderInfo, emergencyNumber, options);
        }, delayMinutes * 60 * 1000);
    }

    /**
     * Handle call status updates
     */
    handleCallStatus(callSid, status, duration) {
        console.log(`📞 Call ${callSid} status: ${status}, duration: ${duration}s`);
        
        switch (status) {
            case 'completed':
                console.log(`✅ Emergency call completed successfully`);
                break;
            case 'busy':
            case 'no-answer':
            case 'failed':
                console.log(`❌ Emergency call ${status}, may need retry`);
                break;
            default:
                console.log(`📞 Call status: ${status}`);
        }
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
}

export default new EmergencyCallServiceWithTTS();
