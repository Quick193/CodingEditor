import { Button } from "@/components/ui/button";
import { Play, Save, FileCode, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Toolbar({ 
  onRun, 
  onSave,
  fileName,
  onFileNameChange,
  isRunning,
  isSaving,
  hasUnsavedChanges,
  extraActions
}) {
  return (
    <div className="h-14 bg-[#1e1e1e] border-b border-[#2d2d2d] flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#569cd6] flex-shrink-0" />
          <input
            type="text"
            value={fileName}
            onChange={(e) => onFileNameChange(e.target.value)}
            className="bg-[#2d2d2d] text-white px-3 py-1.5 rounded text-sm border border-[#3d3d3d] focus:border-[#569cd6] focus:outline-none w-48 transition-colors"
            placeholder="Untitled"
          />
          {hasUnsavedChanges && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-xs">
              Unsaved
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {extraActions}
        
        <Button
          onClick={onRun}
          disabled={isRunning || isSaving}
          className="bg-[#0e639c] hover:bg-[#1177bb] text-white gap-2 transition-colors"
          size="sm"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Code
            </>
          )}
        </Button>

        <Button
          onClick={onSave}
          disabled={isRunning || isSaving || !hasUnsavedChanges}
          variant="outline"
          className="border-[#3d3d3d] bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] gap-2 transition-colors"
          size="sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}