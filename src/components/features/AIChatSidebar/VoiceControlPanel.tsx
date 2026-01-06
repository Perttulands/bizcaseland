/**
 * VoiceControlPanel - Voice Interrogation Mode UI
 * Provides voice input/output controls for hands-free interaction
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  X,
  Loader2,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoice } from '@/core/contexts/VoiceContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// Types
// ============================================================================

interface VoiceControlPanelProps {
  className?: string;
  compact?: boolean;
  onClose?: () => void;
}

// ============================================================================
// Status Indicator
// ============================================================================

function StatusIndicator({ status }: { status: string }) {
  const config = {
    idle: { color: 'bg-gray-400', text: 'Ready' },
    listening: { color: 'bg-green-500 animate-pulse', text: 'Listening...' },
    processing: { color: 'bg-yellow-500 animate-pulse', text: 'Processing...' },
    speaking: { color: 'bg-blue-500 animate-pulse', text: 'Speaking...' },
    error: { color: 'bg-red-500', text: 'Error' },
  }[status] || { color: 'bg-gray-400', text: status };

  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-2 h-2 rounded-full', config.color)} />
      <span className="text-xs text-muted-foreground">{config.text}</span>
    </div>
  );
}

// ============================================================================
// Waveform Animation
// ============================================================================

function WaveformAnimation({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center gap-0.5 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-primary rounded-full animate-pulse"
          style={{
            height: `${Math.random() * 16 + 8}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.5s',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Voice Settings Panel
// ============================================================================

interface VoiceSettingsPanelProps {
  onClose: () => void;
}

function VoiceSettingsPanel({ onClose }: VoiceSettingsPanelProps) {
  const { state, updateSettings, getVoices } = useVoice();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Load voices (may need a small delay for some browsers)
    const loadVoices = () => {
      const availableVoices = getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    // Some browsers load voices asynchronously
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [getVoices]);

  return (
    <div className="p-3 space-y-4 border-t">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Voice Settings</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Voice Selection */}
      {voices.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Voice</label>
          <Select
            value={state.settings.voice || ''}
            onValueChange={(value) => updateSettings({ voice: value })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Default voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-xs">
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Speed */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs text-muted-foreground">Speed</label>
          <span className="text-xs font-mono">{state.settings.rate.toFixed(1)}x</span>
        </div>
        <Slider
          value={[state.settings.rate]}
          min={0.5}
          max={2}
          step={0.1}
          onValueChange={([value]) => updateSettings({ rate: value })}
        />
      </div>

      {/* Pitch */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs text-muted-foreground">Pitch</label>
          <span className="text-xs font-mono">{state.settings.pitch.toFixed(1)}</span>
        </div>
        <Slider
          value={[state.settings.pitch]}
          min={0.5}
          max={2}
          step={0.1}
          onValueChange={([value]) => updateSettings({ pitch: value })}
        />
      </div>

      {/* Volume */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs text-muted-foreground">Volume</label>
          <span className="text-xs font-mono">{Math.round(state.settings.volume * 100)}%</span>
        </div>
        <Slider
          value={[state.settings.volume]}
          min={0}
          max={1}
          step={0.1}
          onValueChange={([value]) => updateSettings({ volume: value })}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Command History
// ============================================================================

function CommandHistory() {
  const { state, clearHistory } = useVoice();

  if (state.commandHistory.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No voice commands yet. Press the microphone to start.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-muted-foreground">Recent Commands</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={clearHistory}
        >
          Clear
        </Button>
      </div>
      <ScrollArea className="h-32">
        <div className="space-y-1">
          {state.commandHistory.slice(0, 10).map((cmd) => (
            <div
              key={cmd.timestamp}
              className="text-xs p-2 rounded bg-muted/50 flex items-start gap-2"
            >
              <MessageCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="truncate">{cmd.rawText}</p>
                <Badge variant="outline" className="text-[10px] mt-1">
                  {cmd.type.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Compact Voice Button
// ============================================================================

export function VoiceButton({ className }: { className?: string }) {
  const { state, toggleListening, isListening, toggleMute } = useVoice();

  if (!state.isSupported) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isListening ? 'default' : 'outline'}
              size="icon"
              onClick={toggleListening}
              className={cn(
                'relative',
                isListening && 'bg-green-600 hover:bg-green-700'
              )}
            >
              {isListening ? (
                <Mic className="h-4 w-4 animate-pulse" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isListening ? 'Stop listening' : 'Start voice input'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className={state.isMuted ? 'text-muted-foreground' : ''}
            >
              {state.isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{state.isMuted ? 'Unmute AI voice' : 'Mute AI voice'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function VoiceControlPanel({ className, compact, onClose }: VoiceControlPanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { state, startListening, stopListening, toggleMute, isListening, isSpeaking } = useVoice();

  // Not supported
  if (!state.isSupported) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Voice features are not supported in this browser.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Try Chrome, Edge, or Safari for voice support.
        </p>
      </div>
    );
  }

  // Compact mode - just the button
  if (compact) {
    return <VoiceButton className={className} />;
  }

  return (
    <div className={cn('bg-background', className)}>
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          <span className="font-semibold">Voice Mode</span>
        </div>
        <div className="flex items-center gap-1">
          <StatusIndicator status={state.status} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Controls */}
      <div className="p-4 space-y-4">
        {/* Big Mic Button */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            variant={isListening ? 'default' : 'outline'}
            className={cn(
              'w-20 h-20 rounded-full',
              isListening && 'bg-green-600 hover:bg-green-700'
            )}
            onClick={isListening ? stopListening : startListening}
          >
            {state.status === 'processing' ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : isListening ? (
              <Mic className="h-8 w-8" />
            ) : (
              <MicOff className="h-8 w-8" />
            )}
          </Button>

          <WaveformAnimation isActive={isListening || isSpeaking} />

          <p className="text-sm text-center text-muted-foreground">
            {isListening
              ? 'Speak your question or command...'
              : 'Press to start voice input'}
          </p>
        </div>

        {/* Live Transcript */}
        {state.currentTranscript && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Hearing:</p>
            <p className="text-sm italic">"{state.currentTranscript}"</p>
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{state.error}</p>
          </div>
        )}

        {/* Mute Toggle */}
        <div className="flex items-center justify-between px-2">
          <span className="text-sm">AI Voice Response</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className={state.isMuted ? 'text-muted-foreground' : ''}
          >
            {state.isMuted ? (
              <>
                <VolumeX className="h-4 w-4 mr-2" />
                Muted
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                On
              </>
            )}
          </Button>
        </div>

        {/* Command History */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
              Command History ({state.commandHistory.length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CommandHistory />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Settings Panel */}
      {showSettings && <VoiceSettingsPanel onClose={() => setShowSettings(false)} />}

      {/* Tips */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <strong>Tips:</strong> Try "What if we raise prices 10%?" or "Show me the market analysis"
        </p>
      </div>
    </div>
  );
}

export default VoiceControlPanel;
