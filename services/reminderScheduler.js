// services/reminderScheduler.js - Optimized exact-time reminder scheduler

import client from "../twilioClient.js";
import responseTracker from "./responseTracker.js";
import emergencyCallService from "./emergencyCallServiceMessageBirdREST.js"; // Using MessageBird REST API for voice calls
import { ReminderSchedule, Patient, Profile } from "../model/index.js";
import dotenv from "dotenv";

dotenv.config();
class ReminderScheduler {
  constructor() {
    this.isRunning = false;
    this.emergencyTimeout = 7 * 60 * 1000; // 7 minutes in milliseconds
    this.activeTimeouts = new Map(); // reminderId -> timeoutId
  }

  // Start the reminder scheduler
  async start() {
    if (this.isRunning) {
      console.log("⚠️ Reminder scheduler is already running");
      return;
    }

    console.log("🚀 Starting Reminder Scheduler...");
    await this.scheduleAllReminders();
    this.isRunning = true;
    console.log("✅ Reminder Scheduler started successfully");
  }

  // Stop the reminder scheduler
  stop() {
    if (!this.isRunning) {
      console.log("⚠️ Reminder scheduler is not running");
      return;
    }

    console.log("🛑 Stopping Reminder Scheduler...");
    for (const timeoutId of this.activeTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.activeTimeouts.clear();
    this.isRunning = false;
    console.log("✅ Reminder Scheduler stopped");
  }

  // Schedule all active reminders
  async scheduleAllReminders() {
    try {
      // Get all pending reminders from Supabase
      const reminders = await ReminderSchedule.findPending();

      console.log(`📅 Found ${reminders.length} active reminders to schedule`);

      for (const reminder of reminders) {
        const nextDue = new Date(reminder.scheduled_time);
        if (nextDue > new Date()) {
          this.scheduleSingleReminder(reminder, nextDue);
        }
      }
    } catch (error) {
      console.error("❌ Error scheduling all reminders:", error);
    }
  }


  // Schedule a single reminder at exact time
  scheduleSingleReminder(reminder, dueTime) {
    const now = new Date();
    const delay = dueTime.getTime() - now.getTime();

    if (delay <= 0) return; // Skip if already due

    const timeoutId = setTimeout(async () => {
      try {
        // Re-fetch to ensure it's still valid
        const freshReminder = await ReminderSchedule.findById(reminder.id);

        if (!freshReminder || freshReminder.status !== 'pending') {
          console.log(
            `🗑️ Skipping deleted/inactive reminder ${reminder.id}`
          );
          return;
        }

        await this.processReminder(freshReminder);

        // For recurring reminders, you would create new reminder schedules
        // This depends on your business logic for recurring prescriptions
        
      } catch (error) {
        console.error(
          `❌ Error in scheduled reminder ${reminder.id}:`,
          error
        );
      } finally {
        this.activeTimeouts.delete(reminder.id);
      }
    }, delay);

    this.activeTimeouts.set(reminder.id, timeoutId);
    console.log(
      `⏰ Scheduled reminder ${reminder.id} for ${dueTime.toLocaleString()}`
    );
  }

  // Process individual reminder
  async processReminder(reminder) {
    try {
      const reminderId = reminder.id;
      const patient = reminder.prescription_drugs?.prescription_records?.patients;
      const profile = patient?.profiles;
      const drug = reminder.prescription_drugs?.drugs;

      if (!profile) {
        console.error(`❌ No user data found for reminder ${reminderId}`);
        return;
      }

      if (!profile.mobile_number) {
        console.error(`❌ No phone number for user ${profile.name}`);
        return;
      }

      console.log(`💊 Processing reminder ${reminderId} for ${profile.name}`);
      
      // Create user object in legacy format for compatibility
      const user = {
        UserName: profile.name,
        PhoneNumber: profile.mobile_number,
        EmergencyNumber: patient.emergency_contact,
        Language: 'English' // Default, could be stored in profile
      };

      // Create reminder object in legacy format
      const reminderLegacy = {
        ReminderID: reminderId,
        Medicine: drug?.name || 'Unknown Medicine',
        Time: new Date(reminder.scheduled_time).toTimeString().slice(0, 5),
        Notes: reminder.prescription_drugs?.drug_notes
      };

      const messageSent = await this.sendReminderMessage(user, reminderLegacy);

      if (messageSent) {
        this.trackReminder(reminderId, user, reminderLegacy);
        console.log(`✅ Reminder ${reminderId} sent to ${profile.name}`);
      }
    } catch (error) {
      console.error(
        `❌ Error processing reminder ${reminder.id}:`,
        error
      );
    }
  }

  // Send reminder message via WhatsApp
  async sendReminderMessage(user, reminder) {
    try {
      const message = this.generateReminderMessage(user, reminder);
      const phoneNumber = user.PhoneNumber.startsWith("+")
        ? `whatsapp:${user.PhoneNumber}`
        : `whatsapp:+91${user.PhoneNumber}`;

      if (process.env.NODE_ENV === "development") {
        console.log(
          `📱 [DEV] Would send WhatsApp message to ${user.PhoneNumber}:`
        );
        console.log(`   ${message}`);
        return true;
      }

      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: phoneNumber,
        body: message,
      });

      return true;
    } catch (error) {
      console.error(
        `❌ Error sending reminder message to ${user.UserName}:`,
        error
      );
      if (error.code === 21211) {
        console.error(`❌ Invalid phone number format: ${user.PhoneNumber}`);
      }
      return false;
    }
  }

  // Generate personalized reminder message
  generateReminderMessage(user, reminder) {
    const time = reminder.Time;
    const medicine = reminder.Medicine;
    const notes = reminder.Notes;

    let message = `⏰ **Medicine Reminder** ⏰\n\n`;
    message += `Hello ${user.UserName}! 👋\n\n`;
    message += `It's time to take your medicine:\n`;
    message += `💊 **${medicine}** at **${time}**\n\n`;
    if (notes) {
      message += `📝 **Notes:** ${notes}\n\n`;
    }
    message += `Please reply with:\n`;
    message += `✅ "Taken" - if you've taken the medicine\n`;
    message += `⚠️ **Important:** If you don't respond within 7 minutes, we'll contact your emergency contact.`;

    return message;
  }

  // Track reminder for response monitoring
  trackReminder(reminderId, user, reminder) {
    const trackingInfo = responseTracker.addReminder(
      reminderId,
      user,
      reminder
    );

    const timeoutId = setTimeout(async () => {
      try {
        const currentTracking = responseTracker.getReminderDetails(reminderId);
        if (
          currentTracking &&
          !currentTracking.responded &&
          !currentTracking.emergencyContacted
        ) {
          await this.contactEmergency(reminderId, currentTracking);
        }
      } catch (error) {
        console.error(`❌ Timeout error for reminder ${reminderId}:`, error);
      }
    }, this.emergencyTimeout);
    trackingInfo.timeoutId = timeoutId;
    console.log(`📊 Tracking reminder ${reminderId} for user ${user.UserName}`);
  }

  // Contact emergency number with voice call + WhatsApp
  async contactEmergency(reminderId, tracking) {
    try {
      if (!tracking || tracking.emergencyContacted) {
        return;
      }

      if (!tracking.emergencyNumber) {
        console.error(
          `❌ No emergency number found for reminder ${reminderId}`
        );
        return;
      }

      console.log(`🚨 Emergency escalation for reminder ${reminderId}`);
      
      // Prepare patient and reminder info for emergency call
      const patientInfo = {
        name: tracking.userName || 'Patient',
        phone: tracking.userPhone || 'Unknown'
      };
      
      const reminderInfo = {
        medicine: tracking.medicine || 'medication',
        time: tracking.time || 'scheduled time'
      };

      if (process.env.NODE_ENV === "development") {
        console.log(`📞 [DEV] Would make emergency VOICE CALL to ${tracking.emergencyNumber}`);
        console.log(`📱 [DEV] Patient: ${patientInfo.name}, Medicine: ${reminderInfo.medicine}`);
        
        // Still send WhatsApp in dev mode for testing
        const emergencyMessage = this.generateEmergencyMessage(tracking);
        console.log(`📱 [DEV] WhatsApp backup message: ${emergencyMessage}`);
      } else {
        // PRODUCTION: Make actual voice call + WhatsApp backup
        console.log(`📞 Making emergency VOICE CALL to ${tracking.emergencyNumber}`);
        
        const callResult = await emergencyCallService.makeEmergencyCall(
          patientInfo,
          reminderInfo,
          tracking.emergencyNumber
        );
        
        if (callResult.success) {
          console.log(`✅ Emergency voice call initiated: ${callResult.callSid}`);
        } else {
          console.log(`⚠️ Voice call failed, WhatsApp backup sent: ${callResult.message}`);
        }
      }

      tracking.emergencyContacted = true;
      console.log(`✅ Emergency escalation completed for reminder ${reminderId}`);
      
    } catch (error) {
      console.error(
        `❌ Error in emergency escalation for reminder ${reminderId}:`,
        error
      );
    }
  }

  // Generate emergency message
  generateEmergencyMessage(tracking) {
    const userName = tracking.userName || "someone";
    const medicine = tracking.medicine || "their medication";
    const time = tracking.time || "the scheduled time";
    const userPhone = tracking.userPhone || "unknown";

    return (
      `🚨 **EMERGENCY ALERT** 🚨\n\n` +
      `Your emergency contact ${userName} has not responded to their medicine reminder.\n\n` +
      `📋 **Details:**\n` +
      `💊 Medicine: ${medicine}\n` +
      `⏰ Time: ${time}\n` +
      `📱 User Phone: ${userPhone}\n\n` +
      `Please check on them immediately and ensure they take their medicine.`
    );
  }

  // Handle user response to reminder
  handleUserResponse(reminderId, response, userPhone) {
    const userPhoneClean = userPhone.replace(/^whatsapp:/, "");
    const tracking = responseTracker.handleResponse(userPhoneClean, response);

    if (!tracking) {
      console.log(`⚠️ No active reminder found for user ${userPhoneClean}`);
      return false;
    }

    console.log(
      `✅ User responded to reminder ${tracking.reminderId}: ${response}`
    );
    this.sendResponseConfirmation(userPhone, response, tracking);
    return true;
  }

  // Send confirmation message for user response
  async sendResponseConfirmation(userPhone, response, tracking) {
    try {
      let confirmationMessage = "";

      switch (response.toLowerCase()) {
        case "taken":
          confirmationMessage = `✅ **Medicine Taken!**\n\nGreat job! You've taken your ${tracking.medicine}. Stay healthy! 💪`;
          break;
        case "remind later":
          confirmationMessage = `⏰ **Reminder Set!**\n\nI'll remind you again in 30 minutes to take your ${tracking.medicine}.`;
          setTimeout(() => {
            this.sendReminderMessage(
              { PhoneNumber: tracking.userPhone },
              { Medicine: tracking.medicine, Time: tracking.time }
            );
          }, 30 * 60 * 1000);
          break;
        case "skip today":
          confirmationMessage = `❌ **Dose Skipped**\n\nYou've chosen to skip today's dose of ${tracking.medicine}. Please consult your doctor if this becomes a pattern.`;
          break;
        default:
          confirmationMessage = `📝 **Response Received**\n\nThank you for responding. Please remember to take your medicine as prescribed.`;
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`📱 [DEV] Would send confirmation to ${userPhone}:`);
        console.log(`   ${confirmationMessage}`);
      } else {
        await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: userPhone,
          body: confirmationMessage,
        });
      }
    } catch (error) {
      console.error("❌ Error sending confirmation message:", error);
    }
  }

  // Public method to schedule a new reminder dynamically
  async scheduleNewReminder(reminderId) {
    if (!this.isRunning) return;

    const reminder = await ReminderSchedule.findById(reminderId);

    if (reminder && reminder.status === 'pending') {
      const nextDue = new Date(reminder.scheduled_time);
      if (nextDue > new Date()) {
        this.scheduleSingleReminder(reminder, nextDue);
      }
    }
  }

  // Get current tracking status
  getTrackingStatus() {
    return responseTracker.getStats();
  }

  // Clear old tracking data
  clearOldTracking() {
    responseTracker.cleanup();
  }
}

// Create singleton instance
const reminderScheduler = new ReminderScheduler();

export default reminderScheduler;
