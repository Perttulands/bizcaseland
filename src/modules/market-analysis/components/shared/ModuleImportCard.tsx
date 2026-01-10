import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as Icons from 'lucide-react';
import { MarketData } from '@/core/types';

export interface ModuleImportCardProps {
  moduleId: string;
  moduleName: string;
  icon?: string;
  description?: string;
  onDataUpload: (data: MarketData) => void;
}

export function ModuleImportCard({ moduleId, moduleName, icon, description, onDataUpload }: ModuleImportCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const Icon = (Icons as any)[icon || 'UploadCloud'] || Icons.UploadCloud;

  const onChooseFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        onDataUpload(parsed as MarketData);
      } catch (err) {
        // Minimal UI feedback — project has a toast hook but avoid coupling here
        // so we use a simple alert for now.
        // eslint-disable-next-line no-console
        console.error('Failed to parse uploaded JSON', err);
        alert('Uploaded file is not valid JSON. Please upload a valid market-data JSON file.');
      }
    };
    reader.readAsText(file);
    // reset input so same file can be re-uploaded if needed
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Card className="border-dashed border-2 border-muted p-6 text-center">
      <CardHeader>
        <div className="flex items-center justify-center gap-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
          <CardTitle>{moduleName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description || 'Import or upload data to get started with this module.'}</p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onChooseFile}
            className="inline-flex items-center px-4 py-2 border rounded-md bg-primary text-white hover:opacity-95"
          >
            Upload JSON
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-label={`Upload data for ${moduleName}`}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-3">You can upload a market-data JSON file exported from other modules or sample data.</p>
      </CardContent>
    </Card>
  );
}

export default ModuleImportCard;
