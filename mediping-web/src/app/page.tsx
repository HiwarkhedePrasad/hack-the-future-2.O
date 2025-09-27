'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Phone, PhoneOff, User, Calendar, Pill, Heart } from 'lucide-react';
import VapiIntegration from '@/components/VapiIntegration';

interface Patient {
  id: string;
  name: string;
  mobile_number: string;
  age: number;
  gender: string;
  medications: Medication[];
  reminders: Reminder[];
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
}

interface Reminder {
  id: string;
  medication_name: string;
  time: string;
  taken: boolean;
}

export default function MediPingHome() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('Ready to help with your medical needs');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [vapiControls, setVapiControls] = useState<any>(null);

  const handleFunctionCall = async (functionCall: any) => {
    console.log('Function call received:', functionCall);
    const { name, parameters } = functionCall;
    
    try {
      if (name === 'register_patient') {
        const response = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parameters)
        });
        
        const data = await response.json();
        
        if (data.success) {
          const newPatient: Patient = {
            ...data.patient,
            medications: data.patient.medications || [],
            reminders: data.patient.reminders || []
          };
          
          setPatients(prev => [...prev, newPatient]);
          setCurrentPatient(newPatient);
          setStatus(`✅ Welcome ${parameters.name}! You are now registered with MediPing.`);
        } else {
          setStatus(data.message || 'Registration failed');
        }
      } else if (name === 'add_medication') {
        const response = await fetch('/api/medications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parameters)
        });
        
        const data = await response.json();
        setStatus(data.message || 'Medication added');
        
        // Refresh patient data
        if (currentPatient) {
          await refreshPatientData(currentPatient.mobile_number);
        }
      } else if (name === 'check_medications') {
        const response = await fetch(`/api/medications?patient_mobile=${parameters.patient_mobile}`);
        const data = await response.json();
        setStatus(data.message || 'Medications checked');
      }
    } catch (error) {
      console.error('Function call error:', error);
      setStatus('❌ Error processing request');
    }
    
    setIsSpeaking(false);
  };

  const refreshPatientData = async (mobileNumber: string) => {
    try {
      const response = await fetch(`/api/patients?mobile_number=${mobileNumber}`);
      const data = await response.json();
      
      if (data.success && data.patient) {
        setCurrentPatient(data.patient);
      }
    } catch (error) {
      console.error('Error refreshing patient data:', error);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
  };

  const handleCallStateChange = (isActive: boolean, listening: boolean, speaking: boolean) => {
    setIsCallActive(isActive);
    setIsListening(listening);
    setIsSpeaking(speaking);
  };

  const handleVapiReady = (controls: any) => {
    setVapiControls(controls);
  };

  const toggleVoiceChat = async () => {
    if (!vapiControls) return;

    if (isCallActive) {
      vapiControls.endCall();
    } else {
      await vapiControls.startCall();
    }
  };

  const addMockMedication = () => {
    if (!currentPatient) return;
    
    const newMedication: Medication = {
      id: Date.now().toString(),
      name: 'Paracetamol 500mg',
      dosage: '1 tablet',
      frequency: 'Twice daily',
      duration_days: 7
    };

    const newReminder: Reminder = {
      id: Date.now().toString(),
      medication_name: 'Paracetamol 500mg',
      time: '09:00 AM',
      taken: false
    };

    setCurrentPatient(prev => prev ? {
      ...prev,
      medications: [...prev.medications, newMedication],
      reminders: [...prev.reminders, newReminder]
    } : null);
  };

  const markMedicationTaken = (reminderId: string) => {
    if (!currentPatient) return;
    
    setCurrentPatient(prev => prev ? {
      ...prev,
      reminders: prev.reminders.map(reminder =>
        reminder.id === reminderId ? { ...reminder, taken: true } : reminder
      )
    } : null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-12 h-12 text-red-500" />
            <h1 className="text-4xl font-bold text-gray-800">MediPing</h1>
          </div>
          <p className="text-xl text-gray-600">Voice-Powered Medical Assistant</p>
          <p className="text-sm text-gray-500 mt-2">Speak in Hindi, English, or Hinglish</p>
        </div>

        {/* Vapi Integration Component */}
        <VapiIntegration
          onFunctionCall={handleFunctionCall}
          onStatusChange={handleStatusChange}
          onCallStateChange={handleCallStateChange}
          onVapiReady={handleVapiReady}
        />

        {/* Status Display */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700 mb-4">{status}</p>
            
            {/* Voice Control Button */}
            <button
              onClick={toggleVoiceChat}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300 ${
                isCallActive
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg'
                  : 'bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl'
              } ${isListening ? 'animate-pulse' : ''}`}
              disabled={!vapiControls}
            >
              {isCallActive ? (
                <>
                  <PhoneOff className="w-6 h-6" />
                  End Voice Chat
                </>
              ) : (
                <>
                  <Phone className="w-6 h-6" />
                  Start Voice Chat
                </>
              )}
            </button>

            {/* Voice Status Indicators */}
            <div className="flex justify-center gap-4 mt-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isListening ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Mic className="w-4 h-4" />
                Listening
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isSpeaking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <MicOff className="w-4 h-4" />
                Speaking
              </div>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        {currentPatient && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-semibold text-gray-800">Patient Profile</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p><strong>Name:</strong> {currentPatient.name}</p>
                <p><strong>Mobile:</strong> {currentPatient.mobile_number}</p>
                <p><strong>Age:</strong> {currentPatient.age} years</p>
                <p><strong>Gender:</strong> {currentPatient.gender}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={addMockMedication}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Sample Medication
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Medications & Reminders */}
        {currentPatient && currentPatient.medications.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Medications */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <Pill className="w-6 h-6 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-800">Current Medications</h3>
              </div>
              
              <div className="space-y-3">
                {currentPatient.medications.map(medication => (
                  <div key={medication.id} className="border-l-4 border-green-400 pl-4 py-2">
                    <h4 className="font-semibold text-gray-800">{medication.name}</h4>
                    <p className="text-sm text-gray-600">
                      {medication.dosage} • {medication.frequency}
                    </p>
                    <p className="text-xs text-gray-500">
                      Duration: {medication.duration_days} days
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Medication Reminders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-orange-500" />
                <h3 className="text-xl font-semibold text-gray-800">Today's Reminders</h3>
              </div>
              
              <div className="space-y-3">
                {currentPatient.reminders.map(reminder => (
                  <div key={reminder.id} className={`border-l-4 pl-4 py-2 ${
                    reminder.taken ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-800">{reminder.medication_name}</h4>
                        <p className="text-sm text-gray-600">{reminder.time}</p>
                      </div>
                      {!reminder.taken && (
                        <button
                          onClick={() => markMedicationTaken(reminder.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          Mark Taken
                        </button>
                      )}
                      {reminder.taken && (
                        <span className="text-green-600 font-semibold text-sm">✓ Taken</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">🗣️ How to Use MediPing:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-gray-700">• <strong>"Namaste, mera naam Rajesh hai"</strong> - Register yourself</p>
              <p className="text-gray-700">• <strong>"Meri medicines kya hain?"</strong> - Check medications</p>
              <p className="text-gray-700">• <strong>"Medicine reminder set karo"</strong> - Set reminders</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700">• <strong>"BP ki dawa add karo"</strong> - Add medications</p>
              <p className="text-gray-700">• <strong>"Doctor ka number save karo"</strong> - Save contacts</p>
              <p className="text-gray-700">• Mix Hindi-English naturally as you speak!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
