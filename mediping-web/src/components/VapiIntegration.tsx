'use client';

import { useState, useEffect } from 'react';

// This declaration tells TypeScript to treat the Vapi SDK module as type 'any',
// resolving the "Cannot find module" error.
declare module '@vapi-ai/web';

// Define a general type for the Vapi SDK or our mock
interface VapiClient {
  on(event: string, callback: (...args: any[]) => void): void;
  start(assistantId: string, options?: any): Promise<void>;
  stop(): void;
}

// Real Vapi integration - will fallback to mock if Vapi SDK not available
let Vapi: any = null;

// Try to import Vapi SDK dynamically in the browser
if (typeof window !== 'undefined') {
  const loadVapi = async () => {
    try {
      const module = await import('@vapi-ai/web');
      Vapi = module.default;
      console.log('Vapi SDK loaded successfully');
    } catch (error) {
      console.log('Vapi SDK not available, using mock implementation');
    }
  };
  loadVapi();
}

// Mock Vapi for development/fallback, implementing our VapiClient interface
class MockVapi implements VapiClient {
  private listeners: { [key: string]: ((...args: any[]) => void)[] } = {};
  private isCallActive = false;

  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  private emit(event: string, data?: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  public async start(assistantId: string): Promise<void> {
    console.log('Mock Vapi call started with assistant:', assistantId);
    this.isCallActive = true;
    this.emit('call-start');
    
    // Simulate voice interaction
    setTimeout(() => {
      this.emit('speech-start');
    }, 1000);
    
    setTimeout(() => {
      this.emit('speech-end');
      this.emit('message', {
        type: 'function-call',
        functionCall: {
          name: 'register_patient',
          parameters: {
            name: 'Demo User',
            mobile_number: '9876543210',
            age: 35,
            gender: 'male',
            emergency_contact: '9876543211'
          }
        }
      });
    }, 3000);
  }

  public stop(): void {
    if (!this.isCallActive) return;
    console.log('Mock Vapi call stopped');
    this.isCallActive = false;
    this.emit('call-end');
  }
}

// Interface for the component's props
interface VapiIntegrationProps {
  onFunctionCall: (functionCall: any) => void;
  onStatusChange: (status: string) => void;
  onCallStateChange: (isActive: boolean, isListening: boolean, isSpeaking: boolean) => void;
  onVapiReady: (controls: { startCall: () => Promise<boolean>; endCall: () => void }) => void;
}

// The main component, now typed as a React Functional Component
export default function VapiIntegration({ 
  onFunctionCall, 
  onStatusChange, 
  onCallStateChange,
  onVapiReady
}: VapiIntegrationProps): null { // This component renders nothing
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Configuration - in production, these would come from environment variables
  const VAPI_PUBLIC_KEY = '2e531db5-b265-4bd5-8bd8-2ea21e83cec6'; // Your public key
  const ASSISTANT_ID = '5241b74c-0c62-47da-a5d4-d903caa795cd'; // Your assistant ID

  useEffect(() => {
    let vapiInstance: VapiClient | null = null;
    let isMounted = true; // Flag to prevent state updates if the component unmounts

    const initializeVapi = async () => {
      try {
        // Wait briefly for the dynamic import to resolve
        await new Promise(resolve => setTimeout(resolve, 100));

        if (Vapi) {
          vapiInstance = new Vapi(VAPI_PUBLIC_KEY) as VapiClient;
          console.log('Using real Vapi SDK');
        } else {
          vapiInstance = new MockVapi();
          console.log('Using mock Vapi implementation');
        }

        // Add a null check to assure TypeScript that vapiInstance is not null
        if (!vapiInstance) {
          throw new Error("Vapi instance could not be initialized.");
        }

        // Set up event listeners
        vapiInstance.on('call-start', () => {
          if (isMounted) {
            onCallStateChange(true, false, false);
            onStatusChange('🎙️ Voice chat active - Speak naturally in Hindi or English!');
          }
        });

        vapiInstance.on('call-end', () => {
          if (isMounted) {
            onCallStateChange(false, false, false);
            onStatusChange('Voice chat ended. Click to start again.');
          }
        });

        vapiInstance.on('speech-start', () => {
          if (isMounted) {
            onCallStateChange(true, true, false);
            onStatusChange('🎧 Listening... Speak now');
          }
        });

        vapiInstance.on('speech-end', () => {
          if (isMounted) {
            onCallStateChange(true, false, true);
            onStatusChange('🗣️ Processing your request...');
          }
        });

        vapiInstance.on('message', (message: any) => {
          if (isMounted) {
            console.log('Vapi message received:', message);
            if (message.type === 'function-call' || message.functionCall) {
              onFunctionCall(message.functionCall || message);
            }
          }
        });

        vapiInstance.on('error', (error: Error) => {
          if (isMounted) {
            console.error('Vapi error:', error);
            onStatusChange('❌ Voice system error. Please try again.');
            onCallStateChange(false, false, false);
          }
        });

        if (isMounted) {
          setIsInitialized(true);
          onStatusChange('✅ Ready! Click "Start Voice Chat" to begin');

          // Provide controls to parent component.
          const controls = {
            startCall: async (): Promise<boolean> => {
              if (!vapiInstance) return false;
              try {
                onStatusChange('🔄 Starting voice chat...');
                // The official Vapi SDK expects an options object, so we pass assistantId within it.
                await vapiInstance.start(ASSISTANT_ID);
                return true;
              } catch (error) {
                console.error('Failed to start voice chat:', error);
                onStatusChange('❌ Failed to start. Please try again.');
                return false;
              }
            },
            endCall: (): void => {
              if (vapiInstance) {
                vapiInstance.stop();
              }
            }
          };
          onVapiReady(controls);
        }

      } catch (error) {
        if (isMounted) {
          console.error('Failed to initialize Vapi:', error);
          onStatusChange('❌ Failed to load voice system');
        }
      }
    };

    initializeVapi();

    // Cleanup function: runs when the component unmounts
    return () => {
      isMounted = false;
      if (vapiInstance) {
        vapiInstance.stop();
      }
    };
  }, [onFunctionCall, onStatusChange, onCallStateChange, onVapiReady]);

  // This component doesn't render anything visible
  return null;
}

