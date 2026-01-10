/**
 * VoiceContext - State management for Voice Interrogation Mode
 * Manages speech recognition, synthesis, and voice commands
 */

import React, { createContext, useCallback, useContext, useMemo, useReducer, useEffect, useRef } from 'react';
import type { VoiceState, VoiceCommand, VoiceSettings, VoiceStatus } from '@/core/types/ai';
import { DEFAULT_VOICE_SETTINGS, isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '@/core/types/ai';
import { voiceService } from '@/core/services/voice-service';
import { useAI } from './AIContext';

// ============================================================================
// Types
// ============================================================================

type VoiceAction =
  | { type: 'SET_STATUS'; status: VoiceStatus }
  | { type: 'SET_TRANSCRIPT'; transcript: string }
  | { type: 'ADD_COMMAND'; command: VoiceCommand }
  | { type: 'SET_LAST_COMMAND'; command: VoiceCommand | null }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_MUTED'; isMuted: boolean }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<VoiceSettings> }
  | { type: 'CLEAR_HISTORY' };

interface VoiceContextValue {
  state: VoiceState;
  // Control
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  toggleMute: () => void;
  // Settings
  updateSettings: (settings: Partial<VoiceSettings>) => void;
  getVoices: () => SpeechSynthesisVoice[];
  // History
  clearHistory: () => void;
  // Status
  isListening: boolean;
  isSpeaking: boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const getInitialState = (): VoiceState => ({
  status: 'idle',
  isSupported: isSpeechRecognitionSupported() || isSpeechSynthesisSupported(),
  currentTranscript: '',
  lastCommand: null,
  commandHistory: [],
  settings: DEFAULT_VOICE_SETTINGS,
  error: null,
  isMuted: false,
});

// ============================================================================
// Reducer
// ============================================================================

function voiceReducer(state: VoiceState, action: VoiceAction): VoiceState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status, error: null };

    case 'SET_TRANSCRIPT':
      return { ...state, currentTranscript: action.transcript };

    case 'ADD_COMMAND':
      return {
        ...state,
        commandHistory: [action.command, ...state.commandHistory].slice(0, 50),
        lastCommand: action.command,
        currentTranscript: '',
      };

    case 'SET_LAST_COMMAND':
      return { ...state, lastCommand: action.command };

    case 'SET_ERROR':
      return { ...state, error: action.error, status: action.error ? 'error' : state.status };

    case 'SET_MUTED':
      return { ...state, isMuted: action.isMuted };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'CLEAR_HISTORY':
      return { ...state, commandHistory: [], lastCommand: null };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const VoiceContext = createContext<VoiceContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface VoiceProviderProps {
  children: React.ReactNode;
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  const [state, dispatch] = useReducer(voiceReducer, undefined, getInitialState);
  const { sendMessage } = useAI();
  const isListeningRef = useRef(false);

  // Handle voice commands - integrate with AI
  const handleVoiceCommand = useCallback((command: VoiceCommand) => {
    dispatch({ type: 'ADD_COMMAND', command });

    // Send question/what-if to AI chat
    if (command.type === 'ask_question' || command.type === 'what_if' || command.type === 'unknown') {
      sendMessage(command.rawText);
    }

    // Handle other command types
    if (command.type === 'update_value') {
      // TODO: Integrate with DataContext to update values
      console.log('Update value command:', command);
    }

    if (command.type === 'navigate') {
      // TODO: Integrate with navigation
      console.log('Navigate command:', command);
    }

    if (command.type === 'action') {
      // TODO: Handle actions
      console.log('Action command:', command);
    }
  }, [sendMessage]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      dispatch({ type: 'SET_ERROR', error: 'Speech recognition is not supported in this browser' });
      return;
    }

    if (isListeningRef.current) return;

    dispatch({ type: 'SET_STATUS', status: 'listening' });
    dispatch({ type: 'SET_TRANSCRIPT', transcript: '' });

    voiceService.startListening({
      onTranscript: (transcript, isFinal) => {
        dispatch({ type: 'SET_TRANSCRIPT', transcript });
      },
      onCommand: handleVoiceCommand,
      onStart: () => {
        isListeningRef.current = true;
        dispatch({ type: 'SET_STATUS', status: 'listening' });
      },
      onEnd: () => {
        isListeningRef.current = false;
        dispatch({ type: 'SET_STATUS', status: 'idle' });
      },
      onError: (error) => {
        isListeningRef.current = false;
        dispatch({ type: 'SET_ERROR', error });
      },
      onSpeakStart: () => {
        dispatch({ type: 'SET_STATUS', status: 'speaking' });
      },
      onSpeakEnd: () => {
        if (!isListeningRef.current) {
          dispatch({ type: 'SET_STATUS', status: 'idle' });
        }
      },
    });
  }, [handleVoiceCommand]);

  // Stop listening
  const stopListening = useCallback(() => {
    voiceService.stopListening();
    isListeningRef.current = false;
    dispatch({ type: 'SET_STATUS', status: 'idle' });
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  // Speak text
  const speak = useCallback((text: string) => {
    if (state.isMuted) return;

    dispatch({ type: 'SET_STATUS', status: 'speaking' });
    voiceService.speak(text, () => {
      dispatch({ type: 'SET_STATUS', status: isListeningRef.current ? 'listening' : 'idle' });
    });
  }, [state.isMuted]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    voiceService.stopSpeaking();
    dispatch({ type: 'SET_STATUS', status: isListeningRef.current ? 'listening' : 'idle' });
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = !state.isMuted;
    dispatch({ type: 'SET_MUTED', isMuted: newMuted });
    if (newMuted) {
      voiceService.stopSpeaking();
    }
  }, [state.isMuted]);

  // Update settings
  const updateSettings = useCallback((settings: Partial<VoiceSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings });
    voiceService.updateSettings(settings);
  }, []);

  // Get available voices
  const getVoices = useCallback((): SpeechSynthesisVoice[] => {
    return voiceService.getVoices();
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceService.cleanup();
    };
  }, []);

  const value = useMemo(
    () => ({
      state,
      startListening,
      stopListening,
      toggleListening,
      speak,
      stopSpeaking,
      toggleMute,
      updateSettings,
      getVoices,
      clearHistory,
      isListening: isListeningRef.current || state.status === 'listening',
      isSpeaking: state.status === 'speaking',
    }),
    [
      state,
      startListening,
      stopListening,
      toggleListening,
      speak,
      stopSpeaking,
      toggleMute,
      updateSettings,
      getVoices,
      clearHistory,
    ]
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}

export default VoiceContext;
