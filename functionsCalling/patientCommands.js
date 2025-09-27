// functionsCalling/patientCommands.js - Patient self-service commands
import Profile from "../model/profiles.js";
import { MedicineReminder } from "../model/index.js";

/**
 * Handle patient self-service commands
 */
export async function handlePatientCommand(from, body) {
    const message = body.trim().toUpperCase();
    const userPhone = from.replace(/^whatsapp:/, "");
    
    try {
        // Find the patient
        const profile = await Profile.findByMobileNumber(userPhone);
        if (!profile) {
            return {
                handled: false,
                message: "Please register first to use patient commands."
            };
        }

        // Handle different commands
        if (message === 'LIST' || message === 'SHOW REMINDERS' || message === 'MY REMINDERS') {
            return await handleListReminders(profile);
        }
        
        if (message.startsWith('STOP ')) {
            return await handleStopReminder(profile, message);
        }
        
        if (message === 'HELP' || message === 'COMMANDS') {
            return await handleHelp();
        }
        
        if (message.startsWith('UPLOAD') || message === 'PRESCRIPTION') {
            return await handlePrescriptionUpload();
        }

        return { handled: false };
        
    } catch (error) {
        console.error('❌ Error in handlePatientCommand:', error);
        return {
            handled: true,
            message: "Sorry, I encountered an error processing your command. Please try again."
        };
    }
}

/**
 * List all active reminders for the patient
 */
async function handleListReminders(profile) {
    try {
        // Get all active reminders for this patient
        const reminders = await MedicineReminder.findAll();
        const userReminders = reminders.filter(r => r.UserID === profile.id);
        
        if (userReminders.length === 0) {
            return {
                handled: true,
                message: `📋 **Your Medicine Reminders**\n\nYou don't have any active reminders yet.\n\n💊 To set a reminder, say:\n"Remind me to take [medicine] at [time]"\n\nExample: "Remind me to take aspirin at 8 AM daily"`
            };
        }
        
        let message = `📋 **Your Active Medicine Reminders**\n\n`;
        userReminders.forEach((reminder, index) => {
            message += `${index + 1}. **${reminder.Medicine}**\n`;
            message += `   ⏰ ${reminder.Time} (${reminder.ReminderType})\n`;
            if (reminder.Notes) {
                message += `   📝 ${reminder.Notes}\n`;
            }
            message += `\n`;
        });
        
        message += `💡 **Commands:**\n`;
        message += `• STOP [number] - Cancel a reminder\n`;
        message += `• HELP - Show all commands`;
        
        return {
            handled: true,
            message: message
        };
        
    } catch (error) {
        console.error('❌ Error listing reminders:', error);
        return {
            handled: true,
            message: "Sorry, I couldn't retrieve your reminders. Please try again."
        };
    }
}

/**
 * Stop/cancel a specific reminder
 */
async function handleStopReminder(profile, message) {
    try {
        const parts = message.split(' ');
        const reminderNumber = parseInt(parts[1]);
        
        if (isNaN(reminderNumber)) {
            return {
                handled: true,
                message: "❌ Please specify a reminder number.\n\nExample: STOP 1\n\nUse 'LIST' to see your reminders with numbers."
            };
        }
        
        // Get user's reminders
        const reminders = await MedicineReminder.findAll();
        const userReminders = reminders.filter(r => r.UserID === profile.id);
        
        if (reminderNumber < 1 || reminderNumber > userReminders.length) {
            return {
                handled: true,
                message: `❌ Invalid reminder number. You have ${userReminders.length} active reminders.\n\nUse 'LIST' to see your reminders.`
            };
        }
        
        const reminderToStop = userReminders[reminderNumber - 1];
        
        // TODO: Implement actual reminder cancellation in the database
        // For now, just confirm the action
        
        return {
            handled: true,
            message: `✅ **Reminder Cancelled**\n\n${reminderToStop.Medicine} at ${reminderToStop.Time} has been cancelled.\n\nUse 'LIST' to see your remaining reminders.`
        };
        
    } catch (error) {
        console.error('❌ Error stopping reminder:', error);
        return {
            handled: true,
            message: "Sorry, I couldn't cancel that reminder. Please try again."
        };
    }
}

/**
 * Show help and available commands
 */
async function handleHelp() {
    const helpMessage = `🆘 **MediPing Patient Commands**\n\n` +
        `**Setting Reminders:**\n` +
        `• "Remind me to take [medicine] at [time]"\n` +
        `• "Set reminder for [medicine] at [time]"\n\n` +
        
        `**Managing Reminders:**\n` +
        `• LIST - Show all your reminders\n` +
        `• STOP [number] - Cancel a reminder\n\n` +
        
        `**Prescription Upload:**\n` +
        `• UPLOAD - Upload prescription photo\n` +
        `• Send photo directly\n\n` +
        
        `**Other Commands:**\n` +
        `• HELP - Show this help message\n\n` +
        
        `**Examples:**\n` +
        `• "Remind me to take aspirin at 8 AM daily"\n` +
        `• "LIST" - See your reminders\n` +
        `• "STOP 1" - Cancel first reminder\n\n` +
        
        `**Reminder Responses:**\n` +
        `When you get a reminder, reply:\n` +
        `• TAKEN - Confirm you took the medicine\n` +
        `• LATER - Remind me in 30 minutes\n` +
        `• SKIP - Skip this dose`;
    
    return {
        handled: true,
        message: helpMessage
    };
}

/**
 * Handle prescription upload (placeholder for future implementation)
 */
async function handlePrescriptionUpload() {
    return {
        handled: true,
        message: `📸 **Prescription Upload**\n\n` +
            `To upload your prescription:\n` +
            `1. Take a clear photo of your prescription\n` +
            `2. Send the photo in this chat\n` +
            `3. I'll extract the medicines and help you set reminders\n\n` +
            `📋 **For now, you can manually set reminders by saying:**\n` +
            `"Remind me to take [medicine name] at [time]"\n\n` +
            `Example: "Remind me to take aspirin at 8 AM daily"`
    };
}

export default handlePatientCommand;
