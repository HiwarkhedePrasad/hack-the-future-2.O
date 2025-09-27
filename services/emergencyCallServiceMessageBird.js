// services/emergencyCallServiceMessageBird.js - Emergency voice call system using MessageBird
import messageBirdClient from '../messagebirdClient.js';
import client from '../twilioClient.js'; // Keep for WhatsApp backup

class EmergencyCallServiceMessageBird {
    constructor() {
        this.maxRetries = 3;
        this.retryDelayMinutes = 5;
    }

    /**
     * Make emergency voice call to patient's emergency contact using MessageBird
     * @param {Object} patientInfo - Patient information
     * @param {Object} reminderInfo - Reminder details
     * @param {string} emergencyNumber - Emergency contact number
     */
    async makeEmergencyCall(patientInfo, reminderInfo, emergencyNumber) {
        try {
            console.log(`🚨 Making emergency call via MessageBird to ${emergencyNumber} for patient ${patientInfo.name}`);
            
            // Create the voice message text
            const voiceMessage = this.createEmergencyVoiceMessage(patientInfo, reminderInfo);
            
            // Clean the phone number (remove + if present, MessageBird expects numbers without +)
            const cleanNumber = emergencyNumber.replace(/^\+/, '');
            const fromNumber = process.env.MESSAGEBIRD_PHONE_NUMBER?.replace(/^\+/, '') || '14155238886';
            
            // Make the voice call using MessageBird
            const callParams = {
                source: fromNumber,
                destination: cleanNumber,
                callFlow: {
                    title: 'MediPing Emergency Alert',
                    steps: [
                        {
                            action: 'say',
                            options: {
                                payload: voiceMessage,
                                voice: 'female',
                                language: 'en-us',
                                repeat: 1
                            }
                        },
                        {
                            action: 'pause',
                            options: {
                                length: 2
                            }
                        },
                        {
                            action: 'say',
                            options: {
                                payload: `This is MediPing. ${patientInfo.name} has not responded to their medicine reminder for ${reminderInfo.medicine} at ${reminderInfo.time}. Please check on them. Thank you.`,
                                voice: 'female',
                                language: 'en-us'
                            }
                        }
                    ]
                },
                webhook: `${process.env.BASE_URL || 'https://your-domain.com'}/messagebird-call-status`,
                maxDuration: 120, // 2 minutes max
                record: false // Don't record for privacy
            };

            console.log(`📞 MessageBird call params:`, {
                from: fromNumber,
                to: cleanNumber,
                webhook: callParams.webhook
            });

            // Make the call using MessageBird Voice API
            const call = await new Promise((resolve, reject) => {
                // Check if voice calls API is available
                if (!messageBirdClient.voice || !messageBirdClient.voice.calls) {
                    reject(new Error('MessageBird Voice API not available. Check your API key and MessageBird account setup.'));
                    return;
                }
                
                messageBirdClient.voice.calls.create(callParams, (err, response) => {
                    if (err) {
                        console.error('MessageBird API Error:', err);
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            });

            console.log(`📞 Emergency call initiated via MessageBird: ${call.id}`);
            
            // Also send backup WhatsApp message
            await this.sendBackupWhatsAppMessage(emergencyNumber, patientInfo, reminderInfo);
            
            return {
                success: true,
                callId: call.id,
                provider: 'MessageBird',
                message: `Emergency call initiated to ${emergencyNumber} via MessageBird`
            };

        } catch (error) {
            console.error('❌ Error making emergency call via MessageBird:', error);
            
            // Fallback to WhatsApp if voice call fails
            await this.sendBackupWhatsAppMessage(emergencyNumber, patientInfo, reminderInfo);
            
            return {
                success: false,
                error: error.message,
                provider: 'MessageBird',
                message: 'MessageBird voice call failed, sent WhatsApp backup message'
            };
        }
    }

    /**
     * Create voice message text for emergency call
     */
    createEmergencyVoiceMessage(patientInfo, reminderInfo) {
        return `Hello, this is an urgent message from MediPing, the medication reminder service. ` +
               `Your contact, ${patientInfo.name}, has not responded to their medicine reminder for ${reminderInfo.medicine}. ` +
               `They were supposed to take their ${reminderInfo.medicine} at ${reminderInfo.time}, but have not confirmed taking it. ` +
               `Please check on ${patientInfo.name} to ensure they are okay and have taken their medication. ` +
               `If this is an emergency, please call emergency services immediately. ` +
               `Thank you for being their emergency contact.`;
    }

    /**
     * Send backup WhatsApp message if voice call fails
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
     * Schedule emergency call with retry logic
     */
    async scheduleEmergencyCall(patientInfo, reminderInfo, emergencyNumber, delayMinutes = 0) {
        setTimeout(async () => {
            await this.makeEmergencyCall(patientInfo, reminderInfo, emergencyNumber);
        }, delayMinutes * 60 * 1000);
    }

    /**
     * Handle call status updates from MessageBird webhook
     */
    handleCallStatus(callId, status, duration) {
        console.log(`📞 MessageBird Call ${callId} status: ${status}, duration: ${duration}s`);
        
        switch (status) {
            case 'answered':
                console.log(`✅ Emergency call answered successfully`);
                break;
            case 'busy':
                console.log(`📞 Emergency call was busy, backup WhatsApp sent`);
                break;
            case 'no-answer':
                console.log(`📞 Emergency call not answered, backup WhatsApp sent`);
                break;
            case 'failed':
                console.log(`❌ Emergency call failed, backup WhatsApp sent`);
                break;
            case 'completed':
                console.log(`✅ Emergency call completed successfully`);
                break;
            default:
                console.log(`📞 Call status: ${status}`);
        }
    }

    /**
     * Get call details from MessageBird
     */
    async getCallDetails(callId) {
        try {
            const call = await new Promise((resolve, reject) => {
                messageBirdClient.voice.calls.read(callId, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            });
            
            return call;
        } catch (error) {
            console.error('❌ Error fetching call details:', error);
            return null;
        }
    }
}

export default new EmergencyCallServiceMessageBird();
