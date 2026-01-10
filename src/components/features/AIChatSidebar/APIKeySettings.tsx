/**
 * APIKeySettings - Component for managing LiteLLM API key (BYOK)
 * Allows users to enter, view status, and clear their API key
 */

import React, { useState } from 'react';
import { Key, Check, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAI } from '@/core/contexts/AIContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// Types
// ============================================================================

interface APIKeySettingsProps {
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function APIKeySettings({ className }: APIKeySettingsProps) {
  const { hasApiKey, setApiKey, clearApiKey } = useAI();
  const [isOpen, setIsOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmedKey = keyInput.trim();

    // Validate key format
    if (!trimmedKey) {
      setError('Please enter an API key');
      return;
    }

    if (!trimmedKey.startsWith('sk-')) {
      setError('API key should start with "sk-"');
      return;
    }

    if (trimmedKey.length < 10) {
      setError('API key is too short');
      return;
    }

    setApiKey(trimmedKey);
    setKeyInput('');
    setError('');
    setIsOpen(false);
  };

  const handleClear = () => {
    clearApiKey();
    setKeyInput('');
    setError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setKeyInput('');
    setError('');
    setShowKey(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  hasApiKey ? 'text-green-600' : 'text-amber-500',
                  className
                )}
              >
                <Key className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasApiKey ? 'API Key configured' : 'Set API Key'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            LiteLLM API Key
          </DialogTitle>
          <DialogDescription>
            Enter your LiteLLM API key to use AI features. Your key is stored locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            {hasApiKey ? (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                Configured
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-500">
                <X className="h-4 w-4" />
                Not configured
              </span>
            )}
          </div>

          {/* API Key input */}
          <div className="space-y-2">
            <Label htmlFor="api-key">
              {hasApiKey ? 'Update API Key' : 'API Key'}
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setError('');
                }}
                placeholder="sk-..."
                className={cn(
                  'pr-10',
                  error && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Info text */}
          <p className="text-xs text-muted-foreground">
            Get your API key from the LiteLLM gateway. Keys start with "sk-".
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {hasApiKey && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear Key
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!keyInput.trim()}>
              {hasApiKey ? 'Update' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default APIKeySettings;
