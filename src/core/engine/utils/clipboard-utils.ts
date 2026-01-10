/**
 * Robust clipboard utilities that work across different browser environments
 */

export interface ClipboardResult {
  success: boolean;
  method: 'clipboard-api' | 'execCommand' | 'manual';
  error?: string;
}

/**
 * Copy text to clipboard with multiple fallback methods
 */
export async function copyTextToClipboard(text: string): Promise<ClipboardResult> {
  // Method 1: Modern Clipboard API (preferred)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard-api' };
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error);
    }
  }

  // Method 2: execCommand fallback for older browsers or non-secure contexts
  try {
    const result = await execCommandCopy(text);
    if (result) {
      return { success: true, method: 'execCommand' };
    }
  } catch (error) {
    console.warn('execCommand failed:', error);
  }

  // Method 3: Manual instruction fallback
  return {
    success: false,
    method: 'manual',
    error: 'Automatic clipboard access is not available. Please manually copy the text.'
  };
}

/**
 * Fallback copy method using execCommand
 */
function execCommandCopy(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea invisible
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('tabindex', '-1');
    
    document.body.appendChild(textArea);
    
    try {
      textArea.focus();
      textArea.select();
      
      // For mobile devices
      textArea.setSelectionRange(0, 99999);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      resolve(successful);
    } catch (err) {
      document.body.removeChild(textArea);
      resolve(false);
    }
  });
}

/**
 * Check if clipboard API is available
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard && window.isSecureContext);
}

/**
 * Check if any clipboard method is likely to work
 */
export function isAnyClipboardMethodSupported(): boolean {
  return isClipboardSupported() || document.queryCommandSupported?.('copy') || false;
}