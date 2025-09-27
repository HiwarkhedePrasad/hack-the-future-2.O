// services/responseTracker.js - Fixed version with better error handling

import { ReminderSchedule, ReminderAttempt } from "../model/index.js";
import emergencyCallService from "./emergencyCallService.js";

class ResponseTracker {
  constructor() {
    this.activeReminders = new Map(); // reminderId -> tracking info
    this.userReminders = new Map(); // userPhone -> [reminderIds]
  }

  // Add a reminder to tracking with enhanced validation
  addReminder(reminderId, user, reminder) {
    // Fix: Validate input parameters
    if (!reminderId || !user || !reminder) {
      console.error("❌ Invalid parameters for addReminder:", {
        reminderId,
        user: !!user,
        reminder: !!reminder,
      });
      return null;
    }

    // Fix: Ensure user has required properties
    if (!user.PhoneNumber || !user.UserName) {
      console.error("❌ User missing required properties:", user);
      return null;
    }

    const trackingInfo = {
      reminderId,
      userId: user.UserID || null,
      userPhone: user.PhoneNumber,
      userName: user.UserName,
      emergencyNumber: user.EmergencyNumber || null, // Fix: Handle missing emergency number
      medicine: reminder.Medicine || "Unknown Medicine",
      time: reminder.Time || "Unknown Time",
      sentAt: new Date(),
      responded: false,
      response: null,
      respondedAt: null,
      emergencyContacted: false,
      emergencyContactedAt: null,
    };

    // Fix: Validate emergency number
    if (!trackingInfo.emergencyNumber) {
      console.warn(`⚠️ No emergency number provided for user ${user.UserName}`);
    }

    this.activeReminders.set(reminderId, trackingInfo);

    // Track user's active reminders
    if (!this.userReminders.has(user.PhoneNumber)) {
      this.userReminders.set(user.PhoneNumber, []);
    }
    this.userReminders.get(user.PhoneNumber).push(reminderId);

    console.log(
      `📊 Added reminder ${reminderId} to tracking for user ${user.UserName}`
    );
    return trackingInfo;
  }

  // Get active reminder for a user with better phone number handling
  getActiveReminder(userPhone) {
    // Fix: Normalize phone number (remove whatsapp: prefix and handle different formats)
    const normalizedPhone = this.normalizePhoneNumber(userPhone);

    // Try both original and normalized phone numbers
    const userReminderIds =
      this.userReminders.get(userPhone) ||
      this.userReminders.get(normalizedPhone) ||
      [];

    // Return the most recent active reminder
    for (let i = userReminderIds.length - 1; i >= 0; i--) {
      const reminderId = userReminderIds[i];
      const tracking = this.activeReminders.get(reminderId);

      if (tracking && !tracking.responded) {
        return tracking;
      }
    }

    return null;
  }

  // Fix: Add phone number normalization
  normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;

    return phoneNumber
      .replace(/^whatsapp:/, "") // Remove whatsapp: prefix
      .replace(/^\+91/, "") // Remove +91 prefix for Indian numbers
      .replace(/\s+/g, "") // Remove spaces
      .replace(/[()-]/g, ""); // Remove parentheses and dashes
  }

  // Handle user response to reminder with better error handling
  handleResponse(userPhone, response) {
    const activeReminder = this.getActiveReminder(userPhone);

    if (!activeReminder) {
      console.log(`⚠️ No active reminder found for user ${userPhone}`);

      // Fix: Try to find by normalized phone number
      const normalizedPhone = this.normalizePhoneNumber(userPhone);
      if (normalizedPhone !== userPhone) {
        const altActiveReminder = this.getActiveReminder(normalizedPhone);
        if (altActiveReminder) {
          return this.markAsResponded(altActiveReminder, response);
        }
      }

      return false;
    }

    return this.markAsResponded(activeReminder, response);
  }

  // Fix: Extract common response marking logic
  markAsResponded(activeReminder, response) {
    // Mark as responded
    activeReminder.responded = true;
    activeReminder.response = response;
    activeReminder.respondedAt = new Date();

    // Update tracking
    this.activeReminders.set(activeReminder.reminderId, activeReminder);

    console.log(
      `✅ User ${activeReminder.userPhone} responded to reminder ${activeReminder.reminderId}: ${response}`
    );
    return activeReminder;
  }

  // Check for response timeouts with better error handling
  checkTimeouts(emergencyTimeout = 7 * 60 * 1000) {
    const now = new Date();
    const timeouts = [];

    try {
      for (const [reminderId, tracking] of this.activeReminders.entries()) {
        // Fix: Validate tracking object
        if (!tracking || !tracking.sentAt) {
          console.warn(`⚠️ Invalid tracking data for reminder ${reminderId}`);
          continue;
        }

        if (tracking.responded || tracking.emergencyContacted) {
          continue;
        }

        const timeSinceSent = now - tracking.sentAt;

        if (timeSinceSent >= emergencyTimeout) {
          // Fix: Only add to timeouts if emergency number exists
          if (tracking.emergencyNumber) {
            timeouts.push(tracking);
          } else {
            console.warn(
              `⚠️ No emergency number for timeout reminder ${reminderId}`
            );
            // Still mark as processed to avoid repeated warnings
            this.markEmergencyContacted(reminderId);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error checking timeouts:", error);
    }

    return timeouts;
  }

  // Mark emergency as contacted with better validation
  markEmergencyContacted(reminderId) {
    const tracking = this.activeReminders.get(reminderId);

    if (tracking) {
      tracking.emergencyContacted = true;
      tracking.emergencyContactedAt = new Date();
      this.activeReminders.set(reminderId, tracking);

      console.log(`🚨 Emergency contacted for reminder ${reminderId}`);
      return true;
    }

    console.warn(`⚠️ No tracking found for reminder ${reminderId}`);
    return false;
  }

  // Get tracking statistics with error handling
  getStats() {
    try {
      const total = this.activeReminders.size;
      const reminders = Array.from(this.activeReminders.values());

      const responded = reminders.filter((t) => t && t.responded).length;
      const pending = reminders.filter(
        (t) => t && !t.responded && !t.emergencyContacted
      ).length;
      const emergencyContacted = reminders.filter(
        (t) => t && t.emergencyContacted
      ).length;

      return {
        total,
        responded,
        pending,
        emergencyContacted,
        responseRate: total > 0 ? ((responded / total) * 100).toFixed(1) : 0,
      };
    } catch (error) {
      console.error("❌ Error getting stats:", error);
      return {
        total: 0,
        responded: 0,
        pending: 0,
        emergencyContacted: 0,
        responseRate: 0,
      };
    }
  }

  // Get all active reminders with filtering
  getAllActive() {
    try {
      return Array.from(this.activeReminders.values()).filter(
        (tracking) => tracking !== null
      );
    } catch (error) {
      console.error("❌ Error getting all active reminders:", error);
      return [];
    }
  }

  // Get reminders for a specific user with better phone number handling
  getUserReminders(userPhone) {
    const normalizedPhone = this.normalizePhoneNumber(userPhone);

    // Try both original and normalized phone numbers
    let userReminderIds = this.userReminders.get(userPhone) || [];

    if (userReminderIds.length === 0 && normalizedPhone !== userPhone) {
      userReminderIds = this.userReminders.get(normalizedPhone) || [];
    }

    return userReminderIds
      .map((id) => this.activeReminders.get(id))
      .filter((tracking) => tracking !== undefined && tracking !== null);
  }

  // Enhanced cleanup with better error handling
  cleanup() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const toRemove = [];

      for (const [reminderId, tracking] of this.activeReminders.entries()) {
        if (!tracking || !tracking.sentAt || tracking.sentAt < oneDayAgo) {
          toRemove.push(reminderId);
        }
      }

      // Remove old reminders
      for (const reminderId of toRemove) {
        this.activeReminders.delete(reminderId);
      }

      // Clean up user reminders
      for (const [userPhone, reminderIds] of this.userReminders.entries()) {
        const validIds = reminderIds.filter((id) =>
          this.activeReminders.has(id)
        );

        if (validIds.length > 0) {
          this.userReminders.set(userPhone, validIds);
        } else {
          this.userReminders.delete(userPhone);
        }
      }

      console.log(`🧹 Cleaned up ${toRemove.length} old tracking entries`);
      return toRemove.length;
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
      return 0;
    }
  }

  // Get reminder details for debugging with validation
  getReminderDetails(reminderId) {
    if (!reminderId) {
      console.warn("⚠️ No reminderId provided to getReminderDetails");
      return null;
    }

    return this.activeReminders.get(reminderId) || null;
  }

  // Force mark reminder as responded with validation
  forceMarkResponded(reminderId, response = "admin_override") {
    const tracking = this.activeReminders.get(reminderId);

    if (tracking) {
      tracking.responded = true;
      tracking.response = response;
      tracking.respondedAt = new Date();
      this.activeReminders.set(reminderId, tracking);

      console.log(
        `🔧 Admin override: Reminder ${reminderId} marked as responded`
      );
      return true;
    }

    console.warn(
      `⚠️ No tracking found for reminder ${reminderId} to force mark as responded`
    );
    return false;
  }

  // Fix: Add method to get tracking by phone number
  getTrackingByPhone(userPhone) {
    const normalizedPhone = this.normalizePhoneNumber(userPhone);

    // Check both original and normalized phone numbers
    const phones = [userPhone];
    if (normalizedPhone !== userPhone) {
      phones.push(normalizedPhone);
    }

    for (const phone of phones) {
      const reminderIds = this.userReminders.get(phone) || [];
      for (const id of reminderIds) {
        const tracking = this.activeReminders.get(id);
        if (tracking && !tracking.responded) {
          return tracking;
        }
      }
    }

    return null;
  }

  // Fix: Add validation method
  validateTracking(reminderId) {
    const tracking = this.activeReminders.get(reminderId);

    if (!tracking) {
      return { valid: false, error: "Tracking not found" };
    }

    const required = ["userPhone", "userName", "medicine", "time", "sentAt"];
    const missing = required.filter((field) => !tracking[field]);

    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missing.join(", ")}`,
      };
    }

    return { valid: true };
  }
}

// Create singleton instance
const responseTracker = new ResponseTracker();

export default responseTracker;
