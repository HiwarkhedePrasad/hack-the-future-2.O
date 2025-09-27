#!/usr/bin/env python3
"""
Integrated Voice System with GSM Support
Complete offline voice-to-voice system for villages
Supports registration, medicine management, reminders, and GSM communication
"""

import os
import sys
import json
import sqlite3
import time
import threading
import platform
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# Import our modules
from voice_interaction_system import VoiceInteractionSystem
from gsm_module import GSMVoiceIntegration

class IntegratedVoiceSystem(VoiceInteractionSystem):
    def __init__(self, gsm_port=None, enable_gsm=True):
        # Initialize parent voice system
        super().__init__()
        
        # GSM Integration
        self.gsm_enabled = enable_gsm and gsm_port
        self.gsm_integration = None
        
        if self.gsm_enabled:
            try:
                self.gsm_integration = GSMVoiceIntegration(gsm_port)
                self.gsm_integration.set_voice_system(self)
                print("[SYSTEM] GSM integration enabled")
            except Exception as e:
                print(f"[WARNING] GSM initialization failed: {e}")
                self.gsm_enabled = False
        
        # Enhanced features
        self.reminder_thread = None
        self.sms_monitor_thread = None
        self.auto_reminders_enabled = True
        
        # Start background services
        self.start_background_services()
    
    def start_background_services(self):
        """Start background services for reminders and SMS monitoring"""
        try:
            # Start reminder checking thread
            if self.auto_reminders_enabled:
                self.reminder_thread = threading.Thread(target=self.reminder_service, daemon=True)
                self.reminder_thread.start()
                print("[SYSTEM] Reminder service started")
            
            # Start SMS monitoring if GSM enabled
            if self.gsm_enabled:
                self.sms_monitor_thread = threading.Thread(target=self.sms_monitor_service, daemon=True)
                self.sms_monitor_thread.start()
                print("[SYSTEM] SMS monitoring service started")
                
        except Exception as e:
            print(f"[ERROR] Background services failed to start: {e}")
    
    def reminder_service(self):
        """Background service to check and send reminders"""
        while True:
            try:
                current_time = datetime.now().strftime("%H:%M")
                
                # Check for due reminders
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT r.id, u.name, u.phone, u.emergency_contact, 
                           m.medicine_name, r.reminder_time, r.last_taken
                    FROM reminders r
                    JOIN users u ON r.user_id = u.id
                    JOIN medicines m ON r.medicine_id = m.id
                    WHERE r.status = 'active' 
                    AND r.reminder_time = ?
                    AND (r.last_taken IS NULL OR date(r.last_taken) < date('now'))
                ''', (current_time,))
                
                due_reminders = cursor.fetchall()
                conn.close()
                
                for reminder in due_reminders:
                    reminder_id, name, phone, emergency_contact, medicine, time_str, last_taken = reminder
                    
                    print(f"[REMINDER] Due: {name} - {medicine} at {time_str}")
                    
                    # Send reminder via available channels
                    self.send_medication_reminder(name, phone, medicine, time_str, emergency_contact)
                
                # Sleep for 1 minute before next check
                time.sleep(60)
                
            except Exception as e:
                print(f"[ERROR] Reminder service error: {e}")
                time.sleep(60)
    
    def sms_monitor_service(self):
        """Background service to monitor incoming SMS"""
        if not self.gsm_enabled:
            return
        
        while True:
            try:
                # Check for incoming SMS
                self.gsm_integration.handle_incoming_sms()
                
                # Sleep for 30 seconds before next check
                time.sleep(30)
                
            except Exception as e:
                print(f"[ERROR] SMS monitor error: {e}")
                time.sleep(30)
    
    def send_medication_reminder(self, patient_name, phone, medicine, time_str, emergency_contact):
        """Send medication reminder through available channels"""
        try:
            # Method 1: Voice announcement (if system is active)
            reminder_text = f"Medication reminder for {patient_name}. Time to take {medicine} at {time_str}."
            self.speak(reminder_text)
            
            # Method 2: SMS via GSM (if available)
            if self.gsm_enabled:
                success = self.gsm_integration.send_medication_reminder_sms(
                    phone, patient_name, medicine, time_str
                )
                if success:
                    print(f"[SMS] Reminder sent to {phone}")
                else:
                    print(f"[SMS ERROR] Failed to send reminder to {phone}")
            
            # Schedule emergency check (7 minutes later)
            emergency_timer = threading.Timer(
                420,  # 7 minutes
                self.check_medication_taken,
                args=[patient_name, phone, medicine, time_str, emergency_contact]
            )
            emergency_timer.start()
            
        except Exception as e:
            print(f"[ERROR] Reminder sending failed: {e}")
    
    def check_medication_taken(self, patient_name, phone, medicine, time_str, emergency_contact):
        """Check if medication was taken, trigger emergency if not"""
        try:
            # Check database for recent medication confirmation
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT last_taken FROM reminders r
                JOIN users u ON r.user_id = u.id
                JOIN medicines m ON r.medicine_id = m.id
                WHERE u.phone = ? AND m.medicine_name = ?
                AND r.reminder_time = ?
            ''', (phone, medicine, time_str))
            
            result = cursor.fetchone()
            conn.close()
            
            if result and result[0]:
                # Check if taken in last 10 minutes
                last_taken = datetime.fromisoformat(result[0])
                if (datetime.now() - last_taken).seconds < 600:  # 10 minutes
                    print(f"[CHECK] {patient_name} took {medicine} - No emergency needed")
                    return
            
            # Medication not taken - trigger emergency
            print(f"[EMERGENCY] {patient_name} missed {medicine} at {time_str}")
            self.trigger_emergency_alert(patient_name, phone, medicine, time_str, emergency_contact)
            
        except Exception as e:
            print(f"[ERROR] Medication check failed: {e}")
    
    def trigger_emergency_alert(self, patient_name, phone, medicine, time_str, emergency_contact):
        """Trigger emergency alert for missed medication"""
        try:
            # Voice alert
            emergency_text = f"EMERGENCY ALERT! {patient_name} has missed their {medicine} medication scheduled for {time_str}. Contacting emergency contact immediately."
            self.speak(emergency_text)
            
            # GSM emergency actions
            if self.gsm_enabled and emergency_contact:
                # Send emergency SMS
                sms_success = self.gsm_integration.gsm.send_emergency_sms(
                    emergency_contact, patient_name, medicine, time_str
                )
                
                if sms_success:
                    print(f"[EMERGENCY SMS] Sent to {emergency_contact}")
                
                # Make emergency call
                call_success = self.gsm_integration.make_emergency_call(
                    emergency_contact, patient_name, medicine
                )
                
                if call_success:
                    print(f"[EMERGENCY CALL] Made to {emergency_contact}")
            
            # Log emergency
            self.log_interaction(
                f"Emergency: {patient_name} missed {medicine}",
                f"Emergency alert sent to {emergency_contact}",
                "emergency"
            )
            
        except Exception as e:
            print(f"[ERROR] Emergency alert failed: {e}")
    
    def enhanced_main_menu_voice(self):
        """Enhanced main menu with GSM features"""
        gsm_status = ""
        if self.gsm_enabled:
            status = self.gsm_integration.get_gsm_status()
            signal = status.get('signal_percent', 0)
            gsm_status = f"GSM signal: {signal:.0f}%. "
        
        menu_text = f"""
        Welcome to MediPing Advanced Voice System. {gsm_status}
        
        Say one of the following options:
        1. 'register' - Register as new user
        2. 'login' - Login with phone number
        3. 'add medicine' - Add new medicine
        4. 'check reminders' - View your reminders
        5. 'took medicine' - Mark medicine as taken
        6. 'emergency test' - Test emergency system
        7. 'gsm status' - Check GSM module status
        8. 'send sms' - Send test SMS
        9. 'system status' - Check system status
        10. 'help' - More options
        11. 'exit' - Quit system
        
        What would you like to do?
        """
        
        self.speak(menu_text)
        
        user_input = self.listen(timeout=25)
        
        if not user_input:
            self.speak("I didn't hear anything. Please try again.")
            return "main_menu"
        
        # Process enhanced commands
        if 'register' in user_input:
            if self.register_user_voice():
                return "main_menu"
            else:
                return "main_menu"
        
        elif 'login' in user_input:
            return self.login_user_voice()
        
        elif 'add medicine' in user_input or 'medicine' in user_input:
            if self.add_medicine_voice():
                return "main_menu"
            else:
                return "main_menu"
        
        elif 'check' in user_input or 'reminder' in user_input:
            self.check_reminders_voice()
            return "main_menu"
        
        elif 'took' in user_input or 'taken' in user_input:
            self.mark_medicine_taken_voice()
            return "main_menu"
        
        elif 'emergency test' in user_input:
            self.test_emergency_system_voice()
            return "main_menu"
        
        elif 'gsm status' in user_input:
            self.check_gsm_status_voice()
            return "main_menu"
        
        elif 'send sms' in user_input:
            self.send_test_sms_voice()
            return "main_menu"
        
        elif 'system status' in user_input:
            self.check_system_status_voice()
            return "main_menu"
        
        elif 'help' in user_input:
            return self.help_menu_voice()
        
        elif 'exit' in user_input or 'quit' in user_input:
            self.speak("Thank you for using MediPing Advanced Voice System. Goodbye!")
            return "exit"
        
        else:
            self.speak("I didn't understand that option. Please try again.")
            return "main_menu"
    
    def test_emergency_system_voice(self):
        """Voice-based emergency system test"""
        if not self.current_user:
            self.speak("Please login first to test emergency system.")
            return
        
        self.speak("Testing emergency system. This will simulate a missed medication alert.")
        
        # Simulate emergency
        self.trigger_emergency_alert(
            self.current_user['name'],
            self.current_user['phone'],
            "Test Medicine",
            "12:00",
            self.current_user.get('emergency_contact', 'No emergency contact')
        )
        
        self.speak("Emergency system test completed.")
    
    def check_gsm_status_voice(self):
        """Voice-based GSM status check"""
        if not self.gsm_enabled:
            self.speak("GSM module is not enabled or not connected.")
            return
        
        status = self.gsm_integration.get_gsm_status()
        
        connected = "connected" if status.get('connected') else "not connected"
        registered = "registered" if status.get('network_registered') else "not registered"
        signal = status.get('signal_percent', 0)
        
        status_text = f"GSM module is {connected}. Network is {registered}. Signal strength is {signal:.0f} percent."
        
        self.speak(status_text)
    
    def send_test_sms_voice(self):
        """Voice-based test SMS sending"""
        if not self.gsm_enabled:
            self.speak("GSM module is not available for SMS.")
            return
        
        self.speak("Please tell me the phone number to send test SMS.")
        phone_input = self.listen(timeout=20)
        
        if not phone_input:
            self.speak("I didn't hear the phone number.")
            return
        
        phone = self.extract_phone_number(phone_input)
        if not phone:
            self.speak("I couldn't understand the phone number.")
            return
        
        # Send test SMS
        message = "Test SMS from MediPing Advanced Voice System. System is working correctly."
        
        success = self.gsm_integration.gsm.send_sms(phone, message)
        
        if success:
            self.speak(f"Test SMS sent successfully to {phone}")
        else:
            self.speak("Test SMS sending failed. Please check GSM module.")
    
    def check_system_status_voice(self):
        """Voice-based system status check"""
        # Count users
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM medicines")
        medicine_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM reminders WHERE status = 'active'")
        reminder_count = cursor.fetchone()[0]
        
        conn.close()
        
        # System status
        tts_status = "working" if self.tts_engine else "not available"
        speech_status = "working" if self.speech_recognizer else "not available"
        gsm_status = "enabled" if self.gsm_enabled else "disabled"
        
        status_text = f"""
        System Status Report:
        
        Database: {user_count} users, {medicine_count} medicines, {reminder_count} active reminders.
        
        Voice System: Text to speech is {tts_status}. Speech recognition is {speech_status}.
        
        GSM Module: {gsm_status}.
        
        Background Services: Reminder service and SMS monitoring are running.
        """
        
        self.speak(status_text)
    
    def run_integrated_system(self):
        """Run the integrated voice system with GSM support"""
        self.speak("MediPing Advanced Voice System with GSM support starting up...")
        
        # Check system components
        if not self.tts_engine:
            self.speak("Warning: Text to speech not available.")
        
        if not self.speech_recognizer:
            self.speak("Warning: Speech recognition not available.")
        
        if self.gsm_enabled:
            gsm_status = self.gsm_integration.get_gsm_status()
            if gsm_status.get('connected'):
                signal = gsm_status.get('signal_percent', 0)
                self.speak(f"GSM module connected with {signal:.0f} percent signal strength.")
            else:
                self.speak("GSM module not connected. SMS and voice calls not available.")
        else:
            self.speak("GSM module disabled. Running in local mode only.")
        
        self.speak("System ready. Voice interaction enabled with automatic reminders.")
        
        # Main system loop
        state = "main_menu"
        
        while state != "exit":
            try:
                if state == "main_menu":
                    state = self.enhanced_main_menu_voice()
                else:
                    state = "main_menu"
                
                # Small pause between interactions
                time.sleep(1)
                
            except KeyboardInterrupt:
                self.speak("System shutting down. Goodbye!")
                break
            except Exception as e:
                print(f"[ERROR] System error: {e}")
                self.speak("Sorry, there was a system error. Let me restart.")
                state = "main_menu"
        
        # Cleanup
        if self.gsm_enabled:
            self.gsm_integration.gsm.disconnect()
        
        print("[SYSTEM] Integrated voice system shutdown complete")

def main():
    """Main function with command line arguments"""
    parser = argparse.ArgumentParser(description='MediPing Integrated Voice System')
    parser.add_argument('--gsm-port', default=None, help='GSM module COM port (e.g., COM3)')
    parser.add_argument('--no-gsm', action='store_true', help='Disable GSM module')
    parser.add_argument('--test-gsm', action='store_true', help='Test GSM module only')
    
    args = parser.parse_args()
    
    if args.test_gsm:
        # Test GSM module only
        from gsm_module import test_gsm_module
        test_gsm_module()
        return
    
    print("MediPing Integrated Voice System with GSM Support")
    print("=" * 60)
    
    # Initialize integrated system
    enable_gsm = not args.no_gsm
    gsm_port = args.gsm_port or 'COM3'
    
    integrated_system = IntegratedVoiceSystem(
        gsm_port=gsm_port if enable_gsm else None,
        enable_gsm=enable_gsm
    )
    
    # Run integrated system
    integrated_system.run_integrated_system()

if __name__ == "__main__":
    main()
