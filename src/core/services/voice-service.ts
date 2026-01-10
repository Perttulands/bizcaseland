/**
 * Voice Service - Speech recognition and synthesis using Web Speech API
 * Provides voice input and text-to-speech for the Voice Interrogation Mode
 */

import type { VoiceCommand, VoiceCommandType, VoiceSettings } from '@/core/types/ai';
import {
  generateVoiceCommandId,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  DEFAULT_VOICE_SETTINGS,
} from '@/core/types/ai';

// ============================================================================
// Types
// ============================================================================

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export interface VoiceServiceCallbacks {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onCommand: (command: VoiceCommand) => void;
  onStart: () => void;
  onEnd: () => void;
  onError: (error: string) => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
}

// ============================================================================
// Command Parsing
// ============================================================================

/**
 * Parse voice command from transcribed text
 */
function parseVoiceCommand(text: string, confidence: number): VoiceCommand {
  const lowerText = text.toLowerCase().trim();

  // What-if patterns
  const whatIfPatterns = [
    /what if (?:we |i )?(.*)/i,
    /what would happen if (.*)/i,
    /how about if (.*)/i,
    /suppose (?:we |i )?(.*)/i,
  ];

  for (const pattern of whatIfPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      return {
        type: 'what_if',
        rawText: text,
        intent: `Explore scenario: ${match[1]}`,
        parameters: {
          change: match[1],
        },
        confidence,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Update value patterns
  const updatePatterns = [
    /set (?:the )?(.+?) to (.+)/i,
    /change (?:the )?(.+?) to (.+)/i,
    /update (?:the )?(.+?) to (.+)/i,
    /make (?:the )?(.+?) (.+)/i,
  ];

  for (const pattern of updatePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const value = parseValue(match[2]);
      return {
        type: 'update_value',
        rawText: text,
        intent: `Update ${match[1]} to ${match[2]}`,
        parameters: {
          field: match[1],
          value,
        },
        confidence,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Navigation patterns
  const navPatterns = [
    /(?:show|go to|open|navigate to) (?:the )?(.+)/i,
    /take me to (?:the )?(.+)/i,
  ];

  for (const pattern of navPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      return {
        type: 'navigate',
        rawText: text,
        intent: `Navigate to ${match[1]}`,
        parameters: {
          field: match[1],
        },
        confidence,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Action patterns
  const actionPatterns = [
    /(?:read|tell me|explain|summarize) (?:the )?(.+)/i,
    /(?:export|download|save) (?:to |as )?(.+)/i,
  ];

  for (const pattern of actionPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      return {
        type: 'action',
        rawText: text,
        intent: `Action: ${text}`,
        parameters: {
          field: match[1],
        },
        confidence,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Default to question
  const isQuestion = lowerText.includes('?') ||
    lowerText.startsWith('what') ||
    lowerText.startsWith('how') ||
    lowerText.startsWith('why') ||
    lowerText.startsWith('when') ||
    lowerText.startsWith('where') ||
    lowerText.startsWith('who') ||
    lowerText.startsWith('can') ||
    lowerText.startsWith('could') ||
    lowerText.startsWith('should') ||
    lowerText.startsWith('would') ||
    lowerText.startsWith('is') ||
    lowerText.startsWith('are');

  return {
    type: isQuestion ? 'ask_question' : 'unknown',
    rawText: text,
    intent: isQuestion ? `Question: ${text}` : text,
    confidence,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Parse a value from text (number or string)
 */
function parseValue(text: string): string | number {
  const cleanText = text.trim();

  // Try to parse as number with units
  const numMatch = cleanText.match(/^([\d,]+(?:\.\d+)?)\s*(million|billion|thousand|k|m|b)?$/i);
  if (numMatch) {
    let num = parseFloat(numMatch[1].replace(/,/g, ''));
    const unit = (numMatch[2] || '').toLowerCase();

    switch (unit) {
      case 'billion':
      case 'b':
        num *= 1e9;
        break;
      case 'million':
      case 'm':
        num *= 1e6;
        break;
      case 'thousand':
      case 'k':
        num *= 1e3;
        break;
    }

    return num;
  }

  // Try to parse percentage
  const percentMatch = cleanText.match(/^([\d.]+)\s*%$/);
  if (percentMatch) {
    return parseFloat(percentMatch[1]) / 100;
  }

  // Return as string
  return cleanText;
}

// ============================================================================
// Voice Service Class
// ============================================================================

class VoiceService {
  private recognition: SpeechRecognitionInstance | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private callbacks: VoiceServiceCallbacks | null = null;
  private settings: VoiceSettings = DEFAULT_VOICE_SETTINGS;
  private isListening = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    // Initialize synthesis
    if (isSpeechSynthesisSupported()) {
      this.synthesis = window.speechSynthesis;
    }
  }

  /**
   * Check if voice features are supported
   */
  get isSupported(): boolean {
    return isSpeechRecognitionSupported() || isSpeechSynthesisSupported();
  }

  /**
   * Check if recognition is supported
   */
  get isRecognitionSupported(): boolean {
    return isSpeechRecognitionSupported();
  }

  /**
   * Check if synthesis is supported
   */
  get isSynthesisSupported(): boolean {
    return isSpeechSynthesisSupported();
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  /**
   * Update voice settings
   */
  updateSettings(settings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Initialize speech recognition
   */
  private initRecognition(): void {
    if (!isSpeechRecognitionSupported()) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
          const command = parseVoiceCommand(transcript, result[0].confidence);
          this.callbacks?.onCommand(command);
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        this.callbacks?.onTranscript(interimTranscript, false);
      }
      if (finalTranscript) {
        this.callbacks?.onTranscript(finalTranscript, true);
      }
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks?.onStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks?.onEnd();
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      this.callbacks?.onError(event.error);
    };
  }

  /**
   * Start listening for voice input
   */
  startListening(callbacks: VoiceServiceCallbacks): void {
    if (this.isListening) {
      return;
    }

    this.callbacks = callbacks;

    try {
      this.initRecognition();
      this.recognition?.start();
    } catch (error) {
      callbacks.onError(error instanceof Error ? error.message : 'Failed to start recognition');
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Speak text using TTS
   */
  speak(text: string, onEnd?: () => void): void {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      onEnd?.();
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;

    // Set voice if specified
    if (this.settings.voice) {
      const voices = this.getVoices();
      const voice = voices.find(v => v.name === this.settings.voice || v.voiceURI === this.settings.voice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onstart = () => {
      this.currentUtterance = utterance;
      this.callbacks?.onSpeakStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.callbacks?.onSpeakEnd?.();
      onEnd?.();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    this.synthesis.speak(utterance);
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Check if currently speaking
   */
  get isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopListening();
    this.stopSpeaking();
    this.recognition = null;
    this.callbacks = null;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const voiceService = new VoiceService();
export default voiceService;
