// services/emergencyCallServiceSMS.js - Emergency SMS + WhatsApp alerts (fallback for voice)
import axios from 'axios';
import client from '../twilioClient.js'; // For WhatsApp backup

class EmergencyCallServiceSMS {
    constructor() {
        this.apiKey = process.env.MESSAGEBIRD_API_KEY;
        this.maxRetries = 3;
    }

    /**
     * Send emergency SMS + WhatsApp alerts (when voice calls aren't available)
     */
    async makeEmergencyCall(patientInfo, reminderInfo, emergencyNumber) {
        try {
            console.log(`🚨 Making emergency SMS alert to ${emergencyNumber} for patient ${patientInfo.name}`);
            
            // Create urgent SMS message
            const smsMessage = this.createEmergencySMSMessage(patientInfo, reminderInfo);
            
            // Clean phone number for MessageBird (remove +)
            const cleanNumber = emergencyNumber.replace(/^\+/, '');
            
            // Send SMS via MessageBird
            const smsResult = await this.sendEmergencySMS(cleanNumber, smsMessage);
            
            // Also send WhatsApp backup via Twilio
            await this.sendBackupWhatsAppMessage(emergencyNumber, patientInfo, reminderInfo);
            
            if (smsResult.success) {
                return {
                    success: true,
                    messageId: smsResult.messageId,
                    provider: 'MessageBird SMS + Twilio WhatsApp',
                    message: `Emergency SMS sent to ${emergencyNumber} via MessageBird + WhatsApp backup`
                };
            } else {
                return {
                    success: false,
                    error: smsResult.error,
                    provider: 'MessageBird SMS',
                    message: 'MessageBird SMS failed, WhatsApp backup sent'
                };
            }

        } catch (error) {
            console.error('❌ Error in emergency SMS service:', error);
            
            // Always send WhatsApp backup
            await this.sendBackupWhatsAppMessage(emergencyNumber, patientInfo, reminderInfo);
            
            return {
                success: false,
                error: error.message,
                provider: 'Emergency SMS Service',
                message: 'Emergency SMS failed, WhatsApp backup sent'
            };
        }
    }

    /**
     * Send emergency SMS via MessageBird
     */
    async sendEmergencySMS(phoneNumber, message) {
        try {
            const smsData = {
                originator: 'MediPing',
                recipients: phoneNumber,
                body: message
            };

            console.log(`📱 Sending emergency SMS to ${phoneNumber}`);

            const response = await axios.post('https://rest.messagebird.com/messages', smsData, {
                headers: {
                    'Authorization': `AccessKey ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ Emergency SMS sent successfully: ${response.data.id}`);
            
            return {
                success: true,
                messageId: response.data.id
            };

        } catch (error) {
            console.error('❌ Error sending emergency SMS:', error.response?.data || error.message);
            
            return {
                success: false,
                error: error.response?.data?.errors?.[0]?.message || error.message
            };
        }
    }

    /**
     * Create urgent SMS message
     */
    createEmergencySMSMessage(patientInfo, reminderInfo) {
        return `🚨 URGENT - MediPing Alert 🚨\n\n` +
               `Your contact ${patientInfo.name} has not responded to their medicine reminder.\n\n` +
               `Medicine: ${reminderInfo.medicine}\n` +
               `Time: ${reminderInfo.time}\n` +
               `Patient: ${patientInfo.phone}\n\n` +
               `Please check on them immediately. If emergency, call 911.\n\n` +
               `- MediPing Medication Reminder Service`;
    }

    /**
     * Send backup WhatsApp message via Twilio
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
     * Handle message status updates
     */
    handleMessageStatus(messageId, status) {
        console.log(`📱 MessageBird SMS ${messageId} status: ${status}`);
        
        switch (status) {
            case 'delivered':
                console.log(`✅ Emergency SMS delivered successfully`);
                break;
            case 'failed':
                console.log(`❌ Emergency SMS failed to deliver`);
                break;
            case 'sent':
                console.log(`📤 Emergency SMS sent, awaiting delivery`);
                break;
            default:
                console.log(`📱 SMS status: ${status}`);
        }
    }

    /**
     * Get message details
     */
    async getMessageDetails(messageId) {
        try {
            const response = await axios.get(`https://rest.messagebird.com/messages/${messageId}`, {
                headers: {
                    'Authorization': `AccessKey ${this.apiKey}`
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching message details:', error);
            return null;
        }
    }
}

export default new EmergencyCallServiceSMS();
