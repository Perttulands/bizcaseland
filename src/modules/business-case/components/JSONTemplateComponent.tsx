import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { copyTextToClipboard } from '@/core/engine';

// Import the JSON template string
import { JSONTemplate as JSONTemplateString } from './JSONTemplate';

export function JSONTemplateComponent() {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      const result = await copyTextToClipboard(JSONTemplateString);
      
      if (result.success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        
        toast({
          title: "🚀 Template Copied Successfully!",
          description: "Business case template is ready! Use it with AI to create compelling financial analysis.",
          variant: "default",
          duration: 4000,
        });
      } else {
        // Handle manual fallback case
        toast({
          title: "Manual Copy Required",
          description: result.error || "Please manually select and copy the text below.",
          variant: "default",
          duration: 6000,
        });
      }
    } catch (err) {
      console.error('Failed to copy template:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy template to clipboard. Please manually select and copy the text.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copyToClipboard}
      className={`flex items-center gap-2 transition-all duration-300 ${
        copied 
          ? 'bg-green-50 border-green-300 text-green-700 shadow-md scale-105' 
          : 'hover:bg-blue-50 hover:border-blue-300'
      }`}
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600 animate-pulse" />
          🎉 Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy Template
        </>
      )}
    </Button>
  );
}

// Also export a function to get the template string for download
export const downloadTemplate = () => {
  const blob = new Blob([JSONTemplateString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'business-case-template.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getTemplateString = () => JSONTemplateString;
