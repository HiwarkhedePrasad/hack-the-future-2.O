// services/emergencyCallService.js - Emergency voice call system
import client from '../twilioClient.js';

class EmergencyCallService {
    constructor() {
        this.maxRetries = 3;
        this.retryDelayMinutes = 5;
    }

    /**
     * Make emergency voice call to patient's emergency contact
     * @param {Object} patientInfo - Patient information
     * @param {Object} reminderInfo - Reminder details
     * @param {string} emergencyNumber - Emergency contact number
     */
    async makeEmergencyCall(patientInfo, reminderInfo, emergencyNumber) {
        try {
            console.log(`🚨 Making emergency call to ${emergencyNumber} for patient ${patientInfo.name}`);
            
            // Create TwiML for voice message
            const twimlMessage = this.createEmergencyVoiceMessage(patientInfo, reminderInfo);
            
            // Make the voice call
            const call = await client.calls.create({
                from: process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER.replace('whatsapp:', ''),
                to: emergencyNumber,
                twiml: twimlMessage,
                statusCallback: `${process.env.BASE_URL || 'https://your-domain.com'}/call-status`,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                timeout: 60, // Ring for 60 seconds
                record: false // Don't record the call for privacy
            });

            console.log(`📞 Emergency call initiated: ${call.sid}`);
            
            // Also send backup WhatsApp message
            await this.sendBackupWhatsAppMessage(emergencyNumber, patientInfo, reminderInfo);
            
            return {
                success: true,
                callSid: call.sid,
                message: `Emergency call initiated to ${emergencyNumber}`
            };

        } catch (error) {
            console.error('❌ Error making emergency call:', error);
            
            // Fallback to WhatsApp if voice call fails
            await this.sendBackupWhatsAppMessage(emergencyNumber, patientInfo, reminderInfo);
            
            return {
                success: false,
                error: error.message,
                message: 'Voice call failed, sent WhatsApp backup message'
            };
        }
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
}

export default new EmergencyCallService();
