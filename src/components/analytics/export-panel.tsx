'use client';

import { Download, FileJson, FileText, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportPanelProps {
  onExport: (format: 'json' | 'csv' | 'markdown') => void;
  isLoading?: boolean;
}

export function ExportPanel({ onExport, isLoading }: ExportPanelProps) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onExport('json')} disabled={isLoading}>
            <FileJson className="w-4 h-4 mr-2" />
            <div>
              <p className="font-medium">JSON</p>
              <p className="text-xs text-muted-foreground">Machine-readable format</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('csv')} disabled={isLoading}>
            <Table2 className="w-4 h-4 mr-2" />
            <div>
              <p className="font-medium">CSV</p>
              <p className="text-xs text-muted-foreground">Spreadsheet format</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('markdown')} disabled={isLoading}>
            <FileText className="w-4 h-4 mr-2" />
            <div>
              <p className="font-medium">Markdown</p>
              <p className="text-xs text-muted-foreground">Report format</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}