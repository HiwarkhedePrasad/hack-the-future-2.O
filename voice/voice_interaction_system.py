#!/usr/bin/env python3
"""
MediPing Voice-to-Voice Interaction System
Offline voice system for villages without internet
Supports GSM module integration and complete voice-based operations
"""

import os
import sys
import json
import sqlite3
import time
import threading
import platform
import re
from datetime import datetime, timedelta
from pathlib import Path

# Set UTF-8 encoding for Windows
if platform.system() == "Windows":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Import speech recognition and TTS
try:
    import speech_recognition as sr
    SPEECH_RECOGNITION_AVAILABLE = True
except ImportError:
    SPEECH_RECOGNITION_AVAILABLE = False
    print("Warning: speech_recognition not available. Install with: pip install SpeechRecognition")

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False
    print("Warning: pyttsx3 not available. Install with: pip install pyttsx3")

try:
    import pygame
    PYGAME_AVAILABLE = True
except ImportError:
    PYGAME_AVAILABLE = False
    print("Warning: pygame not available. Install with: pip install pygame")

try:
    import serial
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False
    print("Warning: pyserial not available. Install with: pip install pyserial")

class VoiceInteractionSystem:
    def __init__(self):
        self.db_path = Path(__file__).parent / "mediping_offline.db"
        self.audio_dir = Path(__file__).parent / "audio"
        self.audio_dir.mkdir(exist_ok=True)
        
        # Initialize components
        self.tts_engine = None
        self.speech_recognizer = None
        self.microphone = None
        self.gsm_module = None
        
        # System state
        self.current_user = None
        self.conversation_state = "main_menu"
        self.language = "en"
        self.offline_mode = True
        
        # Initialize database
        self.init_database()
        
        # Initialize TTS
        self.init_tts()
        
        # Initialize speech recognition
        self.init_speech_recognition()
        
        print("[SYSTEM] Voice Interaction System initialized")
    
    def init_database(self):
        """Initialize offline SQLite database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT UNIQUE,
                    age INTEGER,
                    language TEXT DEFAULT 'en',
                    emergency_contact TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Medicines table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS medicines (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    medicine_name TEXT NOT NULL,
                    dosage TEXT,
                    frequency TEXT,
                    time_slots TEXT,
                    start_date DATE,
                    end_date DATE,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Reminders table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS reminders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    medicine_id INTEGER,
                    reminder_time TIME,
                    status TEXT DEFAULT 'active',
                    last_taken TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (medicine_id) REFERENCES medicines (id)
                )
            ''')
            
            # Voice interactions log
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS voice_interactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    interaction_type TEXT,
                    user_input TEXT,
                    system_response TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            conn.commit()
            conn.close()
            print("[DATABASE] Offline database initialized successfully")
            
        except Exception as e:
            print(f"[ERROR] Database initialization failed: {e}")
    
    def init_tts(self):
        """Initialize Text-to-Speech engine"""
        if PYTTSX3_AVAILABLE:
            try:
                self.tts_engine = pyttsx3.init()
                self.tts_engine.setProperty('rate', 140)  # Slower for clarity
                self.tts_engine.setProperty('volume', 0.9)
                
                # Set voice
                voices = self.tts_engine.getProperty('voices')
                if voices:
                    # Prefer female voice for better clarity
                    for voice in voices:
                        if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                            self.tts_engine.setProperty('voice', voice.id)
                            break
                
                print("[TTS] Text-to-Speech engine initialized")
                
            except Exception as e:
                print(f"[ERROR] TTS initialization failed: {e}")
                self.tts_engine = None
    
    def init_speech_recognition(self):
        """Initialize Speech Recognition"""
        if SPEECH_RECOGNITION_AVAILABLE:
            try:
                self.speech_recognizer = sr.Recognizer()
                self.microphone = sr.Microphone()
                
                # Adjust for ambient noise
                with self.microphone as source:
                    print("[SPEECH] Adjusting for ambient noise...")
                    self.speech_recognizer.adjust_for_ambient_noise(source, duration=2)
                
                print("[SPEECH] Speech recognition initialized")
                
            except Exception as e:
                print(f"[ERROR] Speech recognition initialization failed: {e}")
                self.speech_recognizer = None
    
    def speak(self, text, save_audio=False):
        """Convert text to speech and play"""
        try:
            print(f"[SYSTEM SPEAKING] {text}")
            
            if self.tts_engine:
                if save_audio:
                    # Save audio file
                    timestamp = int(time.time())
                    audio_file = self.audio_dir / f"response_{timestamp}.wav"
                    self.tts_engine.save_to_file(text, str(audio_file))
                
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
            else:
                print("[WARNING] TTS not available, text only")
                
        except Exception as e:
            print(f"[ERROR] Speech synthesis failed: {e}")
    
    def listen(self, timeout=10, phrase_time_limit=5):
        """Listen for user speech input"""
        if not self.speech_recognizer or not self.microphone:
            print("[ERROR] Speech recognition not available")
            return None
        
        try:
            print("[LISTENING] Speak now...")
            
            with self.microphone as source:
                # Listen for audio
                audio = self.speech_recognizer.listen(
                    source, 
                    timeout=timeout, 
                    phrase_time_limit=phrase_time_limit
                )
            
            print("[PROCESSING] Processing speech...")
            
            # Use offline recognition if available, otherwise online
            try:
                # Try offline recognition first (if Vosk is available)
                text = self.speech_recognizer.recognize_sphinx(audio)
                print(f"[OFFLINE RECOGNITION] User said: {text}")
            except:
                try:
                    # Fallback to Google (requires internet)
                    text = self.speech_recognizer.recognize_google(audio)
                    print(f"[ONLINE RECOGNITION] User said: {text}")
                except:
                    print("[ERROR] Could not understand speech")
                    return None
            
            return text.lower().strip()
            
        except sr.WaitTimeoutError:
            print("[TIMEOUT] No speech detected")
            return None
        except Exception as e:
            print(f"[ERROR] Speech recognition failed: {e}")
            return None
    
    def log_interaction(self, user_input, system_response, interaction_type="general"):
        """Log voice interaction to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            user_id = self.current_user['id'] if self.current_user else None
            
            cursor.execute('''
                INSERT INTO voice_interactions 
                (user_id, interaction_type, user_input, system_response)
                VALUES (?, ?, ?, ?)
            ''', (user_id, interaction_type, user_input, system_response))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"[ERROR] Failed to log interaction: {e}")
    
    def register_user_voice(self):
        """Voice-based user registration"""
        self.speak("Welcome to MediPing voice registration. I will help you register step by step.")
        
        # Get name
        self.speak("Please tell me your full name.")
        name = self.listen(timeout=15)
        if not name:
            self.speak("I didn't hear your name. Let's try again.")
            return False
        
        # Get phone number
        self.speak("Please tell me your phone number, digit by digit.")
        phone_input = self.listen(timeout=20)
        if not phone_input:
            self.speak("I didn't hear your phone number. Let's try again.")
            return False
        
        # Extract phone number from speech
        phone = self.extract_phone_number(phone_input)
        if not phone:
            self.speak("I couldn't understand your phone number. Please try again.")
            return False
        
        # Get age
        self.speak("Please tell me your age.")
        age_input = self.listen(timeout=10)
        age = self.extract_number(age_input)
        if not age:
            age = 0
        
        # Get emergency contact
        self.speak("Please tell me your emergency contact phone number, digit by digit.")
        emergency_input = self.listen(timeout=20)
        emergency_contact = self.extract_phone_number(emergency_input)
        
        # Confirm details
        confirmation = f"Let me confirm your details. Name: {name}. Phone: {phone}. Age: {age}. Emergency contact: {emergency_contact or 'not provided'}. Is this correct? Say yes or no."
        self.speak(confirmation)
        
        confirm = self.listen(timeout=10)
        if not confirm or 'yes' not in confirm:
            self.speak("Registration cancelled. Please start again.")
            return False
        
        # Save to database
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO users (name, phone, age, emergency_contact, language)
                VALUES (?, ?, ?, ?, ?)
            ''', (name, phone, age, emergency_contact, self.language))
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            # Set current user
            self.current_user = {
                'id': user_id,
                'name': name,
                'phone': phone,
                'age': age,
                'emergency_contact': emergency_contact
            }
            
            self.speak(f"Registration successful! Welcome {name}. You are now registered in MediPing.")
            self.log_interaction(f"Registration: {name}, {phone}", "User registered successfully", "registration")
            
            return True
            
        except Exception as e:
            self.speak("Sorry, there was an error saving your registration. Please try again.")
            print(f"[ERROR] Registration failed: {e}")
            return False
    
    def add_medicine_voice(self):
        """Voice-based medicine addition"""
        if not self.current_user:
            self.speak("Please register first before adding medicines.")
            return False
        
        self.speak("Let's add a new medicine to your reminders.")
        
        # Get medicine name
        self.speak("What is the name of your medicine?")
        medicine_name = self.listen(timeout=15)
        if not medicine_name:
            self.speak("I didn't hear the medicine name. Please try again.")
            return False
        
        # Get dosage
        self.speak("What is the dosage? For example, one tablet or two spoons.")
        dosage = self.listen(timeout=15)
        if not dosage:
            dosage = "as prescribed"
        
        # Get frequency
        self.speak("How many times per day should you take this medicine? Say the number.")
        frequency_input = self.listen(timeout=10)
        frequency = self.extract_number(frequency_input)
        if not frequency:
            frequency = 1
        
        # Get times
        times = []
        for i in range(frequency):
            self.speak(f"What time should you take dose number {i+1}? Say the hour and minute.")
            time_input = self.listen(timeout=15)
            time_str = self.extract_time(time_input)
            if time_str:
                times.append(time_str)
        
        if not times:
            self.speak("I couldn't understand the times. Let me set a default time of 8 AM.")
            times = ["08:00"]
        
        # Get duration
        self.speak("For how many days should you take this medicine? Say the number of days.")
        duration_input = self.listen(timeout=10)
        duration = self.extract_number(duration_input)
        
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=duration) if duration else None
        
        # Confirm details
        times_str = ", ".join(times)
        confirmation = f"Let me confirm. Medicine: {medicine_name}. Dosage: {dosage}. {frequency} times per day at {times_str}. Duration: {duration or 'ongoing'} days. Is this correct? Say yes or no."
        self.speak(confirmation)
        
        confirm = self.listen(timeout=10)
        if not confirm or 'yes' not in confirm:
            self.speak("Medicine addition cancelled.")
            return False
        
        # Save to database
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Add medicine
            cursor.execute('''
                INSERT INTO medicines 
                (user_id, medicine_name, dosage, frequency, time_slots, start_date, end_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (self.current_user['id'], medicine_name, dosage, str(frequency), 
                  json.dumps(times), start_date, end_date))
            
            medicine_id = cursor.lastrowid
            
            # Add reminders
            for time_str in times:
                cursor.execute('''
                    INSERT INTO reminders (user_id, medicine_id, reminder_time)
                    VALUES (?, ?, ?)
                ''', (self.current_user['id'], medicine_id, time_str))
            
            conn.commit()
            conn.close()
            
            self.speak(f"Medicine {medicine_name} added successfully with {len(times)} daily reminders.")
            self.log_interaction(f"Added medicine: {medicine_name}", "Medicine added successfully", "add_medicine")
            
            return True
            
        except Exception as e:
            self.speak("Sorry, there was an error saving your medicine. Please try again.")
            print(f"[ERROR] Medicine addition failed: {e}")
            return False
    
    def check_reminders_voice(self):
        """Voice-based reminder checking"""
        if not self.current_user:
            self.speak("Please register first to check reminders.")
            return
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT m.medicine_name, r.reminder_time, r.status
                FROM medicines m
                JOIN reminders r ON m.id = r.medicine_id
                WHERE m.user_id = ? AND r.status = 'active'
                ORDER BY r.reminder_time
            ''', (self.current_user['id'],))
            
            reminders = cursor.fetchall()
            conn.close()
            
            if not reminders:
                self.speak("You have no active medicine reminders.")
                return
            
            self.speak(f"You have {len(reminders)} active medicine reminders.")
            
            for medicine, time_str, status in reminders:
                self.speak(f"{medicine} at {time_str}")
            
            self.log_interaction("Check reminders", f"Listed {len(reminders)} reminders", "check_reminders")
            
        except Exception as e:
            self.speak("Sorry, I couldn't retrieve your reminders.")
            print(f"[ERROR] Reminder check failed: {e}")
    
    def mark_medicine_taken_voice(self):
        """Voice-based medicine taken confirmation"""
        if not self.current_user:
            self.speak("Please register first.")
            return
        
        self.speak("Which medicine did you just take?")
        medicine_input = self.listen(timeout=15)
        
        if not medicine_input:
            self.speak("I didn't hear the medicine name.")
            return
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Find matching medicine
            cursor.execute('''
                SELECT m.id, m.medicine_name
                FROM medicines m
                WHERE m.user_id = ? AND LOWER(m.medicine_name) LIKE ?
            ''', (self.current_user['id'], f'%{medicine_input}%'))
            
            medicine = cursor.fetchone()
            
            if not medicine:
                self.speak("I couldn't find that medicine in your list.")
                conn.close()
                return
            
            # Update reminder
            cursor.execute('''
                UPDATE reminders 
                SET last_taken = CURRENT_TIMESTAMP
                WHERE user_id = ? AND medicine_id = ?
            ''', (self.current_user['id'], medicine[0]))
            
            conn.commit()
            conn.close()
            
            self.speak(f"Great! I've recorded that you took {medicine[1]}.")
            self.log_interaction(f"Took medicine: {medicine[1]}", "Medicine taken recorded", "medicine_taken")
            
        except Exception as e:
            self.speak("Sorry, I couldn't record that you took the medicine.")
            print(f"[ERROR] Medicine taken update failed: {e}")
    
    def main_menu_voice(self):
        """Voice-based main menu"""
        menu_text = """
        Welcome to MediPing Voice System. 
        Say one of the following options:
        1. Say 'register' to register as a new user
        2. Say 'login' to login with your phone number
        3. Say 'add medicine' to add a new medicine
        4. Say 'check reminders' to see your reminders
        5. Say 'took medicine' to mark a medicine as taken
        6. Say 'help' for more options
        7. Say 'exit' to quit
        
        What would you like to do?
        """
        
        self.speak(menu_text)
        
        user_input = self.listen(timeout=20)
        
        if not user_input:
            self.speak("I didn't hear anything. Please try again.")
            return "main_menu"
        
        # Process user input
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
        
        elif 'help' in user_input:
            return self.help_menu_voice()
        
        elif 'exit' in user_input or 'quit' in user_input:
            self.speak("Thank you for using MediPing. Goodbye!")
            return "exit"
        
        else:
            self.speak("I didn't understand that option. Please try again.")
            return "main_menu"
    
    def login_user_voice(self):
        """Voice-based user login"""
        self.speak("Please tell me your phone number to login.")
        phone_input = self.listen(timeout=20)
        
        if not phone_input:
            self.speak("I didn't hear your phone number.")
            return "main_menu"
        
        phone = self.extract_phone_number(phone_input)
        if not phone:
            self.speak("I couldn't understand your phone number.")
            return "main_menu"
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, name, phone, age, emergency_contact
                FROM users WHERE phone = ?
            ''', (phone,))
            
            user = cursor.fetchone()
            conn.close()
            
            if user:
                self.current_user = {
                    'id': user[0],
                    'name': user[1],
                    'phone': user[2],
                    'age': user[3],
                    'emergency_contact': user[4]
                }
                
                self.speak(f"Welcome back, {user[1]}!")
                self.log_interaction(f"Login: {phone}", "User logged in", "login")
                return "main_menu"
            else:
                self.speak("I couldn't find a user with that phone number. Would you like to register?")
                return "main_menu"
                
        except Exception as e:
            self.speak("Sorry, there was an error during login.")
            print(f"[ERROR] Login failed: {e}")
            return "main_menu"
    
    def help_menu_voice(self):
        """Voice-based help menu"""
        help_text = """
        Here are all the things you can do with MediPing Voice System:
        
        Registration: Say 'register' to create a new account
        Login: Say 'login' to access your account
        Add Medicine: Say 'add medicine' to add new medications
        Check Reminders: Say 'check reminders' to see your schedule
        Mark Taken: Say 'took medicine' when you take your medication
        
        You can also say 'repeat' to hear the menu again, or 'main menu' to go back.
        
        What would you like to do?
        """
        
        self.speak(help_text)
        return "main_menu"
    
    def extract_phone_number(self, text):
        """Extract phone number from speech text"""
        if not text:
            return None
        
        # Convert spoken numbers to digits
        number_words = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
        }
        
        # Replace number words with digits
        for word, digit in number_words.items():
            text = text.replace(word, digit)
        
        # Extract digits
        digits = re.findall(r'\d', text)
        
        if len(digits) >= 10:
            phone = ''.join(digits[-10:])  # Take last 10 digits
            return '+91' + phone if not phone.startswith('+') else phone
        
        return None
    
    def extract_number(self, text):
        """Extract number from speech text"""
        if not text:
            return None
        
        # Convert spoken numbers to digits
        number_words = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
            'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
            'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
            'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
            'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
            'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
            'eighty': 80, 'ninety': 90, 'hundred': 100
        }
        
        for word, num in number_words.items():
            if word in text.lower():
                return num
        
        # Extract digits
        numbers = re.findall(r'\d+', text)
        if numbers:
            return int(numbers[0])
        
        return None
    
    def extract_time(self, text):
        """Extract time from speech text"""
        if not text:
            return None
        
        # Look for time patterns
        time_patterns = [
            r'(\d{1,2})\s*(?:o\'clock|am|pm)',
            r'(\d{1,2}):(\d{2})',
            r'(\d{1,2})\s*(\d{2})'
        ]
        
        for pattern in time_patterns:
            match = re.search(pattern, text.lower())
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2)) if len(match.groups()) > 1 else 0
                
                # Convert to 24-hour format
                if 'pm' in text.lower() and hour != 12:
                    hour += 12
                elif 'am' in text.lower() and hour == 12:
                    hour = 0
                
                return f"{hour:02d}:{minute:02d}"
        
        # Default times based on common words
        time_words = {
            'morning': '08:00',
            'afternoon': '14:00',
            'evening': '18:00',
            'night': '20:00'
        }
        
        for word, time_str in time_words.items():
            if word in text.lower():
                return time_str
        
        return None
    
    def run_voice_system(self):
        """Main voice system loop"""
        self.speak("MediPing Voice System starting up. Please wait...")
        
        if not SPEECH_RECOGNITION_AVAILABLE:
            self.speak("Warning: Speech recognition not available. Please install required packages.")
            return
        
        if not PYTTSX3_AVAILABLE:
            self.speak("Warning: Text to speech not available. Please install required packages.")
            return
        
        self.speak("System ready. Voice interaction enabled.")
        
        state = "main_menu"
        
        while state != "exit":
            try:
                if state == "main_menu":
                    state = self.main_menu_voice()
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
        
        print("[SYSTEM] Voice system shutdown complete")

def main():
    """Main function"""
    print("MediPing Voice-to-Voice Interaction System")
    print("=" * 50)
    
    # Initialize system
    voice_system = VoiceInteractionSystem()
    
    # Run voice system
    voice_system.run_voice_system()

if __name__ == "__main__":
    main()
