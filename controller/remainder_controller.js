// controllers/reminderController.js

import { MedicineReminder } from "../model/index.js";
import reminderScheduler from "../services/reminderScheduler.js"; // Import scheduler

export const createReminder = async (req, res) => {
  try {
    const {
      UserID,
      Time,
      Medicine,
      Duration,
      ReminderType,
      StartDate, // Added
      EndDate, // Added (optional)
    } = req.body;

    // Validation
    if (!UserID || !Time || !Medicine) {
      return res.status(400).json({
        message: "UserID, Time, and Medicine are required",
      });
    }

    // Ensure ReminderType is lowercase to match DB enum
    const normalizedReminderType = (ReminderType || "daily").toLowerCase();

    // For one_time, StartDate is required
    if (normalizedReminderType === "one_time" && !StartDate) {
      return res.status(400).json({
        message: "StartDate is required for one_time reminders",
      });
    }

    // Create reminder in DB
    const newReminder = await MedicineReminder.create({
      UserID,
      Time,
      Medicine,
      Duration: Duration || 1,
      ReminderType: normalizedReminderType,
      StartDate: StartDate || null,
      EndDate: EndDate || null,
      Notes: req.body.Notes || null,
    });

    // ✅ CRITICAL: Schedule the new reminder immediately
    await reminderScheduler.scheduleNewReminder(newReminder.ReminderID);

    res.status(201).json({
      message: "Reminder created successfully",
      reminder: newReminder,
    });
  } catch (error) {
    console.error("❌ Error creating reminder:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAllReminders = async (req, res) => {
  try {
    const reminders = await MedicineReminder.findAll();
    res.json(reminders);
  } catch (error) {
    console.error("❌ Error fetching reminders:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateReminderResponse = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { Response } = req.body;

    const reminder = await MedicineReminder.findByPk(reminderId);
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    reminder.Response = Response;
    await reminder.save();

    res.json({
      message: "Reminder response updated",
      reminder,
    });
  } catch (error) {
    console.error("❌ Error updating reminder response:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
