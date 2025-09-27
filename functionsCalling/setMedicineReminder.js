// functionsCalling/setMedicineReminder.js
import { Type } from "@google/genai";
import { MedicineReminder, User } from "../model/index.js";
import Profile from "../model/profiles.js";
import reminderScheduler from "../services/reminderScheduler.js";
/**
 * Enhanced Gemini Function Declaration for Medicine Reminders
 */
export const setMedicineReminderDeclaration = {
  name: "set_medicine_reminder",
  description:
    "Sets a medicine reminder for a user with detailed timing options. Use this when user provides medicine name and wants to set a reminder.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      medicineName: {
        type: Type.STRING,
        description: "The name of the medicine to be reminded about.",
      },
      reminderType: {
        type: Type.STRING,
        description:
          "Type of reminder: 'one_time', 'daily', 'weekly', 'monthly', or 'custom_range'",
      },
      time: {
        type: Type.STRING,
        description:
          "Time to take medicine in HH:MM format (e.g., '08:00', '21:30')",
      },
      date: {
        type: Type.STRING,
        description:
          "Specific date for one-time reminder in YYYY-MM-DD format (optional)",
      },
      startDate: {
        type: Type.STRING,
        description:
          "Start date for range reminders in YYYY-MM-DD format (optional)",
      },
      endDate: {
        type: Type.STRING,
        description:
          "End date for range reminders in YYYY-MM-DD format (optional)",
      },
      frequency: {
        type: Type.STRING,
        description:
          "Frequency for recurring reminders (e.g., 'every 2 days', 'weekly', 'monthly')",
      },
      notes: {
        type: Type.STRING,
        description:
          "Additional notes about the medicine or reminder (optional)",
      },
    },
    required: ["medicineName", "reminderType", "time"],
  },
};

/**
 * Enhanced Medicine Reminder Implementation
 */
export async function setMedicineReminder({
  userId,
  medicineName,
  reminderType,
  time,
  date,
  startDate,
  endDate,
  frequency,
  notes,
}) {
  try {
    console.log(`🔍 Looking for user with phone number: ${userId}`);

    // Find the user by phone number using the Profile model
    let profile = await Profile.findByMobileNumber(userId);

    if (!profile) {
      console.log("❌ User not found for phone number:", userId);
      return {
        success: false,
        message: "I don't have your information yet. To set up medicine reminders, I need to register you first.\n\nPlease reply with your details in this format:\n📝 REGISTER [Your Name] | [Your Age] | [Your Gender] | [Emergency Contact]\n\nExample: REGISTER John Smith | 65 | male | +919876543210\n\nThis helps me contact your emergency contact if you don't respond to medicine reminders.",
        requiresRegistration: true,
        phoneNumber: userId
      };
    }

    console.log(`✅ Found user: ${profile.name} (ID: ${profile.id})`);

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return {
        success: false,
        message:
          "Invalid time format. Please use HH:MM format (e.g., 08:00, 21:30).",
      };
    }

    // Process reminder type and create appropriate reminder
    let reminderMessage = "";
    let reminderData = {
      UserID: profile.id,
      Medicine: medicineName,
      Time: time,
      ReminderType: reminderType,
      Duration: 1,
      Notes: notes || null,
    };

    switch (reminderType) {
      case "one_time":
        if (date) {
          reminderData.StartDate = date;
          reminderData.EndDate = date;
          reminderMessage = `One-time reminder set for ${medicineName} on ${date} at ${time}`;
        } else {
          reminderData.StartDate = new Date().toISOString().split("T")[0];
          reminderData.EndDate = new Date().toISOString().split("T")[0];
          reminderMessage = `One-time reminder set for ${medicineName} today at ${time}`;
        }
        break;

      case "daily":
        reminderData.StartDate = new Date().toISOString().split("T")[0];
        reminderData.EndDate = null; // Ongoing
        reminderMessage = `Daily reminder set for ${medicineName} at ${time}`;
        break;

      case "weekly":
        reminderData.StartDate = new Date().toISOString().split("T")[0];
        reminderData.EndDate = null; // Ongoing
        reminderMessage = `Weekly reminder set for ${medicineName} at ${time}`;
        break;

      case "monthly":
        reminderData.StartDate = new Date().toISOString().split("T")[0];
        reminderData.EndDate = null; // Ongoing
        reminderMessage = `Monthly reminder set for ${medicineName} at ${time}`;
        break;

      case "custom_range":
        if (startDate && endDate) {
          reminderData.StartDate = startDate;
          reminderData.EndDate = endDate;
          reminderMessage = `Reminder set for ${medicineName} from ${startDate} to ${endDate} at ${time}`;
        } else {
          return {
            success: false,
            message:
              "Please provide both start and end dates for custom range reminders.",
          };
        }
        break;

      default:
        return {
          success: false,
          message:
            "Invalid reminder type. Please choose: one_time, daily, weekly, monthly, or custom_range.",
        };
    }

    // Create the reminder
    const reminder = await MedicineReminder.create(reminderData);

    console.log("✅ Enhanced reminder saved:", reminder);
    // The constant 'reminder' was created on the line above.
    await reminderScheduler.scheduleNewReminder(reminder.ReminderID);
    return {
      success: true,
      message: `✅ ${reminderMessage}. ${notes ? `Notes: ${notes}` : ""}`,
    };
  } catch (err) {
    console.error("❌ Error saving enhanced reminder:", err);
    return {
      success: false,
      message: "Failed to set reminder. Please try again.",
    };
  }
}
