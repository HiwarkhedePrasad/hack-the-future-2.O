// services/emergencyCallServiceMessageBirdREST.js - Emergency voice calls using MessageBird REST API
import axios from 'axios';
import client from '../twilioClient.js'; // Keep for WhatsApp backup

class EmergencyCallServiceMessageBirdREST {
    constructor() {
        this.apiKey = process.env.MESSAGEBIRD_API_KEY;
        this.baseUrl = 'https://voice.messagebird.com';
        this.maxRetries = 3;
    }

    /**
     * Make emergency voice call using MessageBird REST API
     */
    async makeEmergencyCall(patientInfo, reminderInfo, emergencyNumber) {
        try {
            console.log(`🚨 Making emergency call via MessageBird REST API to ${emergencyNumber} for patient ${patientInfo.name}`);
            
            // Create the voice message
            const voiceMessage = this.createEmergencyVoiceMessage(patientInfo, reminderInfo);
            
            // Clean phone numbers (MessageBird expects numbers without +)
            const cleanNumber = emergencyNumber.replace(/^\+/, '');
            const fromNumber = process.env.MESSAGEBIRD_PHONE_NUMBER?.replace(/^\+/, '') || '14155238886';
            
            // Create call flow
            const callFlow = {
                title: 'MediPing Emergency Alert',
                steps: [
                    {
                        action: 'say',
                        options: {
                            payload: voiceMessage,
                            voice: 'female',
                            language: 'en-us'
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
            };

            // Prepare call data
            const callData = {
                source: fromNumber,
                destination: cleanNumber,
                callFlow: callFlow,
                webhook: `${process.env.BASE_URL || 'https://your-domain.com'}/messagebird-call-status`,
                maxDuration: 120,
                record: false
            };

            console.log(`📞 MessageBird REST API call data:`, {
                from: fromNumber,
                to: cleanNumber,
                webhook: callData.webhook
            });

            // Make the API call
            const response = await axios.post(`${this.baseUrl}/calls`, callData, {
                headers: {
                    'Authorization': `AccessKey ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📞 Emergency call initiated via MessageBird REST API: ${response.data.id}`);
            
            // Send backup WhatsApp message
            await this.sendBackupWhatsAppMessage(emergencyNumber, patientInfo, reminderInfo);
            
            return {
                success: true,
                callId: response.data.id,
                provider: 'MessageBird REST',
                message: `Emergency call initiated to ${emergencyNumber} via MessageBird REST API`
            };

        } catch (error) {
            console.error('❌ Error making emergency call via MessageBird REST API:', error.response?.data || error.message);
            
            // Send backup WhatsApp message
            await this.sendBackupWhatsAppMessage(emergencyNumber, patientInfo, reminderInfo);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                provider: 'MessageBird REST',
                message: 'MessageBird REST API call failed, sent WhatsApp backup message'
            };
        }
    }

    /**
     * Create voice message text
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
     * Get call details
     */
    async getCallDetails(callId) {
        try {
            const response = await axios.get(`${this.baseUrl}/calls/${callId}`, {
                headers: {
                    'Authorization': `AccessKey ${this.apiKey}`
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching call details:', error);
            return null;
        }
    }

    /**
     * Handle call status updates
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
}

export default new EmergencyCallServiceMessageBirdREST();
