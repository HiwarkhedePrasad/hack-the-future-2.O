#!/usr/bin/env python3
"""
GSM Module Integration for MediPing Voice System
Supports SMS and voice calls through GSM module for offline village use
"""

import serial
import time
import threading
import json
import re
from datetime import datetime

class GSMModule:
    def __init__(self, port='COM3', baudrate=9600, timeout=10):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial_connection = None
        self.is_connected = False
        self.network_registered = False
        self.signal_strength = 0
        
        # Initialize connection
        self.connect()
    
    def connect(self):
        """Connect to GSM module"""
        try:
            self.serial_connection = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=self.timeout
            )
            
            print(f"[GSM] Connecting to GSM module on {self.port}...")
            time.sleep(2)  # Wait for module to initialize
            
            # Test connection
            if self.send_at_command("AT"):
                print("[GSM] GSM module connected successfully")
                self.is_connected = True
                
                # Initialize module
                self.initialize_module()
                
                return True
            else:
                print("[GSM] Failed to connect to GSM module")
                return False
                
        except Exception as e:
            print(f"[GSM ERROR] Connection failed: {e}")
            return False
    
    def initialize_module(self):
        """Initialize GSM module settings"""
        try:
            # Set text mode for SMS
            self.send_at_command("AT+CMGF=1")
            
            # Set character set
            self.send_at_command("AT+CSCS=\"GSM\"")
            
            # Enable caller ID
            self.send_at_command("AT+CLIP=1")
            
            # Check network registration
            self.check_network_registration()
            
            # Check signal strength
            self.check_signal_strength()
            
            print("[GSM] Module initialized successfully")
            
        except Exception as e:
            print(f"[GSM ERROR] Initialization failed: {e}")
    
    def send_at_command(self, command, wait_time=2):
        """Send AT command to GSM module"""
        if not self.is_connected:
            return False
        
        try:
            # Clear input buffer
            self.serial_connection.flushInput()
            
            # Send command
            self.serial_connection.write((command + '\r\n').encode())
            time.sleep(wait_time)
            
            # Read response
            response = self.serial_connection.read_all().decode('utf-8', errors='ignore')
            
            print(f"[GSM CMD] {command} -> {response.strip()}")
            
            # Check if command was successful
            if 'OK' in response:
                return response
            else:
                return False
                
        except Exception as e:
            print(f"[GSM ERROR] Command failed: {e}")
            return False
    
    def check_network_registration(self):
        """Check if module is registered on network"""
        response = self.send_at_command("AT+CREG?")
        if response:
            # Parse response for registration status
            if '+CREG: 0,1' in response or '+CREG: 0,5' in response:
                self.network_registered = True
                print("[GSM] Network registered successfully")
            else:
                self.network_registered = False
                print("[GSM] Network not registered")
        
        return self.network_registered
    
    def check_signal_strength(self):
        """Check GSM signal strength"""
        response = self.send_at_command("AT+CSQ")
        if response:
            # Parse signal strength
            match = re.search(r'\+CSQ: (\d+),', response)
            if match:
                self.signal_strength = int(match.group(1))
                signal_percent = min((self.signal_strength / 31) * 100, 100)
                print(f"[GSM] Signal strength: {self.signal_strength}/31 ({signal_percent:.0f}%)")
            
        return self.signal_strength
    
    def send_sms(self, phone_number, message):
        """Send SMS through GSM module"""
        if not self.is_connected or not self.network_registered:
            print("[GSM ERROR] Module not ready for SMS")
            return False
        
        try:
            print(f"[GSM] Sending SMS to {phone_number}")
            
            # Set SMS destination
            cmd = f'AT+CMGS="{phone_number}"'
            self.serial_connection.write((cmd + '\r\n').encode())
            time.sleep(1)
            
            # Send message content
            self.serial_connection.write((message + chr(26)).encode())  # chr(26) is Ctrl+Z
            time.sleep(5)  # Wait for SMS to be sent
            
            # Read response
            response = self.serial_connection.read_all().decode('utf-8', errors='ignore')
            
            if 'OK' in response:
                print(f"[GSM] SMS sent successfully to {phone_number}")
                return True
            else:
                print(f"[GSM ERROR] SMS failed: {response}")
                return False
                
        except Exception as e:
            print(f"[GSM ERROR] SMS sending failed: {e}")
            return False
    
    def make_voice_call(self, phone_number):
        """Make voice call through GSM module"""
        if not self.is_connected or not self.network_registered:
            print("[GSM ERROR] Module not ready for voice call")
            return False
        
        try:
            print(f"[GSM] Making voice call to {phone_number}")
            
            # Initiate call
            cmd = f'ATD{phone_number};'
            response = self.send_at_command(cmd, wait_time=5)
            
            if response:
                print(f"[GSM] Voice call initiated to {phone_number}")
                return True
            else:
                print(f"[GSM ERROR] Voice call failed")
                return False
                
        except Exception as e:
            print(f"[GSM ERROR] Voice call failed: {e}")
            return False
    
    def hang_up_call(self):
        """Hang up current call"""
        try:
            response = self.send_at_command("ATH")
            if response:
                print("[GSM] Call hung up")
                return True
            else:
                print("[GSM ERROR] Failed to hang up call")
                return False
                
        except Exception as e:
            print(f"[GSM ERROR] Hang up failed: {e}")
            return False
    
    def read_sms(self):
        """Read incoming SMS messages"""
        try:
            # List all SMS messages
            response = self.send_at_command("AT+CMGL=\"ALL\"", wait_time=3)
            
            if response and '+CMGL:' in response:
                # Parse SMS messages
                messages = []
                lines = response.split('\n')
                
                for i, line in enumerate(lines):
                    if '+CMGL:' in line:
                        # Parse SMS header
                        parts = line.split(',')
                        if len(parts) >= 3:
                            index = parts[0].split(':')[1].strip()
                            sender = parts[2].strip('"')
                            
                            # Get message content from next line
                            if i + 1 < len(lines):
                                content = lines[i + 1].strip()
                                
                                messages.append({
                                    'index': index,
                                    'sender': sender,
                                    'content': content,
                                    'timestamp': datetime.now().isoformat()
                                })
                
                return messages
            else:
                return []
                
        except Exception as e:
            print(f"[GSM ERROR] SMS reading failed: {e}")
            return []
    
    def delete_sms(self, index):
        """Delete SMS message by index"""
        try:
            cmd = f'AT+CMGD={index}'
            response = self.send_at_command(cmd)
            
            if response:
                print(f"[GSM] SMS {index} deleted")
                return True
            else:
                print(f"[GSM ERROR] Failed to delete SMS {index}")
                return False
                
        except Exception as e:
            print(f"[GSM ERROR] SMS deletion failed: {e}")
            return False
    
    def get_module_info(self):
        """Get GSM module information"""
        info = {}
        
        # Get manufacturer
        response = self.send_at_command("AT+CGMI")
        if response:
            info['manufacturer'] = response.replace('OK', '').strip()
        
        # Get model
        response = self.send_at_command("AT+CGMM")
        if response:
            info['model'] = response.replace('OK', '').strip()
        
        # Get IMEI
        response = self.send_at_command("AT+CGSN")
        if response:
            info['imei'] = response.replace('OK', '').strip()
        
        # Get SIM card status
        response = self.send_at_command("AT+CPIN?")
        if response:
            info['sim_status'] = response.replace('OK', '').strip()
        
        return info
    
    def get_status(self):
        """Get comprehensive GSM module status"""
        status = {
            'connected': self.is_connected,
            'network_registered': self.network_registered,
            'signal_strength': self.signal_strength,
            'signal_percent': min((self.signal_strength / 31) * 100, 100) if self.signal_strength > 0 else 0,
            'port': self.port,
            'baudrate': self.baudrate
        }
        
        if self.is_connected:
            # Update network status
            self.check_network_registration()
            self.check_signal_strength()
            
            # Get module info
            status.update(self.get_module_info())
        
        return status
    
    def send_emergency_sms(self, emergency_contact, patient_name, medicine, time):
        """Send emergency SMS for missed medication"""
        message = f"""URGENT - MediPing Alert

Patient: {patient_name}
Medicine: {medicine}
Scheduled Time: {time}
Status: MISSED MEDICATION

Please check on {patient_name} immediately.

If emergency, call 108.

- MediPing System"""
        
        return self.send_sms(emergency_contact, message)
    
    def disconnect(self):
        """Disconnect from GSM module"""
        try:
            if self.serial_connection and self.serial_connection.is_open:
                self.serial_connection.close()
                print("[GSM] Disconnected from GSM module")
            
            self.is_connected = False
            
        except Exception as e:
            print(f"[GSM ERROR] Disconnection failed: {e}")

class GSMVoiceIntegration:
    """Integration class for GSM with Voice System"""
    
    def __init__(self, gsm_port='COM3'):
        self.gsm = GSMModule(port=gsm_port)
        self.voice_system = None
        
    def set_voice_system(self, voice_system):
        """Set reference to voice system"""
        self.voice_system = voice_system
    
    def handle_incoming_sms(self):
        """Handle incoming SMS messages"""
        messages = self.gsm.read_sms()
        
        for msg in messages:
            print(f"[GSM] Incoming SMS from {msg['sender']}: {msg['content']}")
            
            # Process medication-related SMS
            content = msg['content'].lower()
            
            if 'taken' in content or 'took' in content:
                # Patient confirmed medication via SMS
                if self.voice_system:
                    self.voice_system.speak(f"SMS received: Patient confirmed medication taken")
                
            elif 'help' in content or 'emergency' in content:
                # Emergency SMS received
                if self.voice_system:
                    self.voice_system.speak(f"Emergency SMS received from {msg['sender']}")
            
            # Delete processed SMS
            self.gsm.delete_sms(msg['index'])
    
    def send_medication_reminder_sms(self, phone_number, patient_name, medicine, time):
        """Send medication reminder via SMS"""
        message = f"""MediPing Reminder

Hello {patient_name},

Time to take your {medicine} at {time}.

Reply 'TAKEN' when you take it.

Stay healthy!"""
        
        return self.gsm.send_sms(phone_number, message)
    
    def make_emergency_call(self, emergency_contact, patient_name, medicine):
        """Make emergency voice call"""
        print(f"[GSM] Making emergency call for {patient_name}")
        
        if self.gsm.make_voice_call(emergency_contact):
            # Call initiated successfully
            if self.voice_system:
                self.voice_system.speak(f"Emergency call made to {emergency_contact} for {patient_name}")
            
            # Wait for call duration (could be enhanced with call status monitoring)
            time.sleep(30)  # 30 second call
            
            # Hang up
            self.gsm.hang_up_call()
            
            return True
        else:
            return False
    
    def get_gsm_status(self):
        """Get GSM module status for voice system"""
        return self.gsm.get_status()

def test_gsm_module():
    """Test GSM module functionality"""
    print("Testing GSM Module...")
    
    # Initialize GSM
    gsm = GSMModule()
    
    if gsm.is_connected:
        print("GSM Module Tests:")
        
        # Test 1: Get module info
        info = gsm.get_module_info()
        print(f"Module Info: {json.dumps(info, indent=2)}")
        
        # Test 2: Check status
        status = gsm.get_status()
        print(f"Status: {json.dumps(status, indent=2)}")
        
        # Test 3: Send test SMS (uncomment to test with real number)
        # gsm.send_sms("+919876543210", "Test SMS from MediPing GSM Module")
        
        # Test 4: Read SMS
        messages = gsm.read_sms()
        print(f"SMS Messages: {len(messages)} found")
        
        # Test 5: Make test call (uncomment to test with real number)
        # gsm.make_voice_call("+919876543210")
        # time.sleep(10)
        # gsm.hang_up_call()
        
    else:
        print("GSM Module not connected. Check:")
        print("1. GSM module is connected to correct COM port")
        print("2. SIM card is inserted and active")
        print("3. Power supply is adequate")
        print("4. Antenna is connected")
    
    # Cleanup
    gsm.disconnect()

if __name__ == "__main__":
    test_gsm_module()
