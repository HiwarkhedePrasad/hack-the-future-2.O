#!/usr/bin/env python3
"""
Demo Voice System for Laptop Testing
Simulates GSM functionality locally, ready to switch to real GSM module
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

class DemoGSMSimulator:
    """Simulates GSM module functionality for demo purposes"""
    
    def __init__(self):
        self.is_connected = True
        self.network_registered = True
        self.signal_strength = 25  # Simulated signal strength
        self.demo_mode = True
        
        print("[DEMO GSM] GSM Simulator initialized - Demo Mode")
    
    def send_sms(self, phone_number, message):
        """Simulate SMS sending"""
        print(f"\n📱 [DEMO SMS] Sending to {phone_number}:")
        print(f"📄 Message: {message}")
        print("✅ [DEMO SMS] SMS sent successfully (simulated)")
        return True
    
    def make_voice_call(self, phone_number):
        """Simulate voice call"""
        print(f"\n📞 [DEMO CALL] Making voice call to {phone_number}")
        print("🔊 [DEMO CALL] Phone ringing... (simulated)")
        print("✅ [DEMO CALL] Call connected (simulated)")
        return True
    
    def hang_up_call(self):
        """Simulate hanging up call"""
        print("📞 [DEMO CALL] Call ended (simulated)")
        return True
    
    def send_emergency_sms(self, emergency_contact, patient_name, medicine, time):
        """Simulate emergency SMS"""
        message = f"""🚨 DEMO EMERGENCY ALERT 🚨

Patient: {patient_name}
Medicine: {medicine}
Scheduled Time: {time}
Status: MISSED MEDICATION

This is a DEMO alert. In real deployment, emergency contact would be notified.

- MediPing Demo System"""
        
        return self.send_sms(emergency_contact, message)
    
    def get_status(self):
        """Get demo GSM status"""
        return {
            'connected': True,
            'network_registered': True,
            'signal_strength': self.signal_strength,
            'signal_percent': 80,  # Good signal for demo
            'demo_mode': True,
            'manufacturer': 'Demo Simulator',
            'model': 'Virtual GSM',
            'port': 'DEMO'
        }

class DemoVoiceIntegration:
    """Demo integration class for simulated GSM"""
    
    def __init__(self):
        self.gsm = DemoGSMSimulator()
        self.voice_system = None
        
    def set_voice_system(self, voice_system):
        """Set reference to voice system"""
        self.voice_system = voice_system
    
    def handle_incoming_sms(self):
        """Simulate handling incoming SMS"""
        # In demo mode, we can simulate some responses
        demo_responses = [
            {"sender": "+919876543210", "content": "TAKEN", "type": "medication_confirm"},
            {"sender": "+919111111111", "content": "HELP", "type": "emergency"}
        ]
        
        # Randomly simulate an incoming SMS (10% chance each check)
        import random
        if random.random() < 0.1:  # 10% chance
            response = random.choice(demo_responses)
            print(f"\n📨 [DEMO SMS] Simulated incoming SMS from {response['sender']}: {response['content']}")
            
            if 'taken' in response['content'].lower():
                if self.voice_system:
                    self.voice_system.speak("Demo SMS received: Patient confirmed medication taken")
    
    def send_medication_reminder_sms(self, phone_number, patient_name, medicine, time):
        """Send demo medication reminder SMS"""
        message = f"""🔔 MediPing Demo Reminder

Hello {patient_name},

Time to take your {medicine} at {time}.

This is a DEMO reminder.
In real deployment, reply 'TAKEN' when you take it.

Stay healthy! 💊"""
        
        return self.gsm.send_sms(phone_number, message)
    
    def make_emergency_call(self, emergency_contact, patient_name, medicine):
        """Make demo emergency call"""
        print(f"\n🚨 [DEMO EMERGENCY] Making emergency call for {patient_name}")
        
        if self.gsm.make_voice_call(emergency_contact):
            if self.voice_system:
                self.voice_system.speak(f"Demo emergency call made to {emergency_contact} for {patient_name}")
            
            # Simulate call duration
            time.sleep(3)
            self.gsm.hang_up_call()
            return True
        return False
    
    def get_gsm_status(self):
        """Get demo GSM status"""
        return self.gsm.get_status()

class DemoVoiceSystem(VoiceInteractionSystem):
    """Demo Voice System with simulated GSM"""
    
    def __init__(self):
        # Initialize parent voice system
        super().__init__()
        
        # Demo GSM Integration
        self.gsm_enabled = True
        self.gsm_integration = DemoVoiceIntegration()
        self.gsm_integration.set_voice_system(self)
        
        # Demo settings
        self.demo_mode = True
        self.auto_reminders_enabled = True
        
        print("[DEMO SYSTEM] Demo Voice System initialized with simulated GSM")
        
        # Start demo background services
        self.start_demo_services()
    
    def start_demo_services(self):
        """Start demo background services"""
        try:
            # Start demo reminder service
            if self.auto_reminders_enabled:
                self.reminder_thread = threading.Thread(target=self.demo_reminder_service, daemon=True)
                self.reminder_thread.start()
                print("[DEMO] Demo reminder service started")
            
            # Start demo SMS monitoring
            self.sms_monitor_thread = threading.Thread(target=self.demo_sms_monitor, daemon=True)
            self.sms_monitor_thread.start()
            print("[DEMO] Demo SMS monitoring started")
                
        except Exception as e:
            print(f"[ERROR] Demo services failed to start: {e}")
    
    def demo_reminder_service(self):
        """Demo reminder service with faster checking for demo"""
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
                    
                    print(f"\n🔔 [DEMO REMINDER] Due: {name} - {medicine} at {time_str}")
                    
                    # Send demo reminder
                    self.send_demo_medication_reminder(name, phone, medicine, time_str, emergency_contact)
                
                # Sleep for 30 seconds in demo mode (faster than production)
                time.sleep(30)
                
            except Exception as e:
                print(f"[ERROR] Demo reminder service error: {e}")
                time.sleep(30)
    
    def demo_sms_monitor(self):
        """Demo SMS monitoring service"""
        while True:
            try:
                # Check for demo incoming SMS
                self.gsm_integration.handle_incoming_sms()
                
                # Sleep for 15 seconds in demo mode
                time.sleep(15)
                
            except Exception as e:
                print(f"[ERROR] Demo SMS monitor error: {e}")
                time.sleep(15)
    
    def send_demo_medication_reminder(self, patient_name, phone, medicine, time_str, emergency_contact):
        """Send demo medication reminder"""
        try:
            # Voice announcement
            reminder_text = f"Demo medication reminder for {patient_name}. Time to take {medicine} at {time_str}."
            self.speak(reminder_text)
            
            # Demo SMS
            success = self.gsm_integration.send_medication_reminder_sms(
                phone, patient_name, medicine, time_str
            )
            
            if success:
                print(f"📱 [DEMO] Reminder SMS sent to {phone}")
            
            # Schedule demo emergency check (2 minutes for demo instead of 7)
            emergency_timer = threading.Timer(
                120,  # 2 minutes for demo
                self.demo_emergency_check,
                args=[patient_name, phone, medicine, time_str, emergency_contact]
            )
            emergency_timer.start()
            print(f"⏰ [DEMO] Emergency check scheduled in 2 minutes")
            
        except Exception as e:
            print(f"[ERROR] Demo reminder failed: {e}")
    
    def demo_emergency_check(self, patient_name, phone, medicine, time_str, emergency_contact):
        """Demo emergency check with faster timeout"""
        try:
            # Check if medication was taken
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
                # Check if taken in last 5 minutes (demo timing)
                last_taken = datetime.fromisoformat(result[0])
                if (datetime.now() - last_taken).seconds < 300:  # 5 minutes
                    print(f"✅ [DEMO] {patient_name} took {medicine} - No emergency needed")
                    return
            
            # Trigger demo emergency
            print(f"\n🚨 [DEMO EMERGENCY] {patient_name} missed {medicine} at {time_str}")
            self.trigger_demo_emergency(patient_name, phone, medicine, time_str, emergency_contact)
            
        except Exception as e:
            print(f"[ERROR] Demo emergency check failed: {e}")
    
    def trigger_demo_emergency(self, patient_name, phone, medicine, time_str, emergency_contact):
        """Trigger demo emergency alert"""
        try:
            # Voice alert
            emergency_text = f"DEMO EMERGENCY ALERT! {patient_name} has missed their {medicine} medication scheduled for {time_str}. This is a demonstration of the emergency system."
            self.speak(emergency_text)
            
            # Demo emergency SMS
            sms_success = self.gsm_integration.gsm.send_emergency_sms(
                emergency_contact, patient_name, medicine, time_str
            )
            
            if sms_success:
                print(f"📱 [DEMO EMERGENCY SMS] Sent to {emergency_contact}")
            
            # Demo emergency call
            call_success = self.gsm_integration.make_emergency_call(
                emergency_contact, patient_name, medicine
            )
            
            if call_success:
                print(f"📞 [DEMO EMERGENCY CALL] Made to {emergency_contact}")
            
            # Log demo emergency
            self.log_interaction(
                f"Demo Emergency: {patient_name} missed {medicine}",
                f"Demo emergency alert sent to {emergency_contact}",
                "demo_emergency"
            )
            
            # Show demo summary
            self.show_demo_emergency_summary(patient_name, medicine, emergency_contact)
            
        except Exception as e:
            print(f"[ERROR] Demo emergency failed: {e}")
    
    def show_demo_emergency_summary(self, patient_name, medicine, emergency_contact):
        """Show demo emergency summary"""
        summary = f"""
╔══════════════════════════════════════════════════════════════╗
║                🚨 DEMO EMERGENCY SUMMARY 🚨                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Patient: {patient_name.ljust(48)} ║
║  Medicine: {medicine.ljust(47)} ║
║  Emergency Contact: {emergency_contact.ljust(35)} ║
║                                                              ║
║  📱 SMS Alert: SENT (Demo)                                   ║
║  📞 Voice Call: MADE (Demo)                                  ║
║  🔊 Local Alert: PLAYED                                      ║
║                                                              ║
║  In real deployment with GSM module:                        ║
║  • Actual SMS would be sent to emergency contact            ║
║  • Real voice call would be made                            ║
║  • Emergency contact would receive immediate notification   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        """
        print(summary)
    
    def demo_main_menu_voice(self):
        """Demo main menu with GSM simulation info"""
        menu_text = f"""
        Welcome to MediPing DEMO Voice System. 
        
        🎭 DEMO MODE: GSM functionality is simulated on this laptop.
        📡 Signal: 80% (Simulated)
        
        Say one of the following options:
        1. 'register' - Register as new user
        2. 'login' - Login with phone number
        3. 'add medicine' - Add new medicine
        4. 'check reminders' - View your reminders
        5. 'took medicine' - Mark medicine as taken
        6. 'demo emergency' - Trigger demo emergency
        7. 'gsm status' - Check demo GSM status
        8. 'demo sms' - Send demo SMS
        9. 'system status' - Check system status
        10. 'switch to real gsm' - Switch to real GSM mode
        11. 'help' - More options
        12. 'exit' - Quit system
        
        What would you like to do?
        """
        
        self.speak(menu_text)
        
        user_input = self.listen(timeout=25)
        
        if not user_input:
            self.speak("I didn't hear anything. Please try again.")
            return "main_menu"
        
        # Process demo commands
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
        
        elif 'demo emergency' in user_input:
            self.test_demo_emergency()
            return "main_menu"
        
        elif 'gsm status' in user_input:
            self.check_demo_gsm_status()
            return "main_menu"
        
        elif 'demo sms' in user_input:
            self.send_demo_sms()
            return "main_menu"
        
        elif 'system status' in user_input:
            self.check_demo_system_status()
            return "main_menu"
        
        elif 'switch to real' in user_input or 'real gsm' in user_input:
            self.explain_gsm_switch()
            return "main_menu"
        
        elif 'help' in user_input:
            return self.help_menu_voice()
        
        elif 'exit' in user_input or 'quit' in user_input:
            self.speak("Thank you for using MediPing Demo Voice System. Goodbye!")
            return "exit"
        
        else:
            self.speak("I didn't understand that option. Please try again.")
            return "main_menu"
    
    def test_demo_emergency(self):
        """Test demo emergency system"""
        if not self.current_user:
            self.speak("Please login first to test demo emergency system.")
            return
        
        self.speak("Testing demo emergency system. This will simulate a missed medication alert.")
        
        # Trigger demo emergency
        self.trigger_demo_emergency(
            self.current_user['name'],
            self.current_user['phone'],
            "Demo Medicine",
            "12:00",
            self.current_user.get('emergency_contact', '+919999999999')
        )
        
        self.speak("Demo emergency system test completed.")
    
    def check_demo_gsm_status(self):
        """Check demo GSM status"""
        status = self.gsm_integration.get_gsm_status()
        
        status_text = f"""Demo GSM Status: Connected and ready. 
        Signal strength: {status['signal_percent']} percent. 
        This is demo mode. When real GSM module is connected, 
        actual SMS and voice calls will be made."""
        
        self.speak(status_text)
    
    def send_demo_sms(self):
        """Send demo SMS"""
        self.speak("Demo SMS feature. Please tell me a phone number.")
        phone_input = self.listen(timeout=20)
        
        if not phone_input:
            self.speak("I didn't hear the phone number.")
            return
        
        phone = self.extract_phone_number(phone_input)
        if not phone:
            self.speak("I couldn't understand the phone number.")
            return
        
        # Send demo SMS
        message = "Demo SMS from MediPing Voice System. This is a simulation. When real GSM module is connected, actual SMS will be sent."
        
        success = self.gsm_integration.gsm.send_sms(phone, message)
        
        if success:
            self.speak(f"Demo SMS sent successfully to {phone}")
        else:
            self.speak("Demo SMS sending failed.")
    
    def check_demo_system_status(self):
        """Check demo system status"""
        # Get database stats
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM medicines")
        medicine_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM reminders WHERE status = 'active'")
        reminder_count = cursor.fetchone()[0]
        
        conn.close()
        
        status_text = f"""
        Demo System Status Report:
        
        Mode: DEMO MODE with simulated GSM.
        
        Database: {user_count} users, {medicine_count} medicines, {reminder_count} active reminders.
        
        Voice System: Text to speech working. Speech recognition working.
        
        GSM Module: Demo mode - simulated SMS and voice calls.
        
        Background Services: Demo reminder service and SMS monitoring running.
        
        Ready to switch to real GSM module when available.
        """
        
        self.speak(status_text)
    
    def explain_gsm_switch(self):
        """Explain how to switch to real GSM"""
        explanation = """
        To switch from demo mode to real GSM module:
        
        Step 1: Connect your GSM module to COM port, for example COM3.
        
        Step 2: Insert active SIM card with SMS and voice plan.
        
        Step 3: Connect antenna to GSM module.
        
        Step 4: Start system with real GSM by running: python integrated underscore voice underscore system dot py dash dash gsm dash port COM3.
        
        The system will automatically detect real GSM module and switch from demo mode to live mode.
        
        All voice commands and database will remain the same. Only SMS and voice calls will become real.
        """
        
        self.speak(explanation)
    
    def run_demo_system(self):
        """Run the demo voice system"""
        self.speak("MediPing Demo Voice System starting up...")
        self.speak("Demo mode enabled. GSM functionality is simulated on this laptop.")
        self.speak("When real GSM module is connected, system will switch to live mode automatically.")
        
        # Check system components
        if not self.tts_engine:
            self.speak("Warning: Text to speech not available.")
        
        if not self.speech_recognizer:
            self.speak("Warning: Speech recognition not available.")
        
        self.speak("Demo GSM module connected with 80 percent signal strength.")
        self.speak("System ready. Voice interaction enabled with demo automatic reminders.")
        
        # Main demo loop
        state = "main_menu"
        
        while state != "exit":
            try:
                if state == "main_menu":
                    state = self.demo_main_menu_voice()
                else:
                    state = "main_menu"
                
                # Small pause between interactions
                time.sleep(1)
                
            except KeyboardInterrupt:
                self.speak("Demo system shutting down. Goodbye!")
                break
            except Exception as e:
                print(f"[ERROR] Demo system error: {e}")
                self.speak("Sorry, there was a system error. Let me restart.")
                state = "main_menu"
        
        print("[DEMO] Demo voice system shutdown complete")

def main():
    """Main function for demo system"""
    parser = argparse.ArgumentParser(description='MediPing Demo Voice System')
    parser.add_argument('--real-gsm', action='store_true', help='Use real GSM module instead of demo')
    parser.add_argument('--gsm-port', default='COM3', help='GSM module COM port')
    
    args = parser.parse_args()
    
    print("MediPing Demo Voice System")
    print("=" * 40)
    
    if args.real_gsm:
        print("🔄 Switching to real GSM mode...")
        # Import and use the real integrated system
        from integrated_voice_system import IntegratedVoiceSystem
        
        real_system = IntegratedVoiceSystem(
            gsm_port=args.gsm_port,
            enable_gsm=True
        )
        real_system.run_integrated_system()
    else:
        print("🎭 Running in DEMO mode with simulated GSM")
        
        # Initialize demo system
        demo_system = DemoVoiceSystem()
        
        # Run demo system
        demo_system.run_demo_system()

if __name__ == "__main__":
    main()
