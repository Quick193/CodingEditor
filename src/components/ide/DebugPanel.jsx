import React from "react";
import { AlertTriangle, Lightbulb, Wand2, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function DebugPanel({ 
  error, 
  code, 
  language, 
  onClose, 
  onApplyFix,
  isAnalyzing,
  debugInfo
}) {
  if (!error && !debugInfo) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#1e1e1e] border-t-2 border-red-500/50 shadow-2xl z-50 max-h-[50vh] flex flex-col">
      <div className="bg-[#252526] border-b border-[#3d3d3d] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-white font-medium">AI Debugger</span>
          <Badge variant="outline" className="border-red-500 text-red-500 text-xs">
            Error Detected
          </Badge>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-[#858585] hover:text-white hover:bg-[#3d3d3d]"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Error Summary */}
          <Card className="bg-red-500/10 border-red-500/30 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-400 mb-1">Error Output</h3>
                <pre className="text-xs text-red-300 whitespace-pre-wrap break-words font-mono">
                  {error}
                </pre>
              </div>
            </div>
          </Card>

          {/* AI Analysis */}
          {isAnalyzing ? (
            <Card className="bg-[#252526] border-[#3d3d3d] p-4">
              <div className="flex items-center gap-2 text-[#569cd6]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is analyzing the error...</span>
              </div>
            </Card>
          ) : debugInfo ? (
            <>
              {/* Root Cause */}
              <Card className="bg-[#252526] border-[#569cd6]/30 p-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-2">Root Cause</h3>
                    <p className="text-xs text-[#d4d4d4] leading-relaxed">{debugInfo.rootCause}</p>
                  </div>
                </div>
              </Card>

              {/* Line Number */}
              {debugInfo.lineNumber && (
                <Card className="bg-[#252526] border-[#3d3d3d] p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#858585]">Error at:</span>
                    <Badge variant="outline" className="border-[#569cd6] text-[#569cd6] text-xs">
                      Line {debugInfo.lineNumber}
                    </Badge>
                  </div>
                </Card>
              )}

              {/* Suggested Fix */}
              <Card className="bg-[#252526] border-green-500/30 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-2">Suggested Fix</h3>
                    <p className="text-xs text-[#d4d4d4] leading-relaxed mb-3">{debugInfo.suggestion}</p>
                    <Button
                      onClick={() => onApplyFix(debugInfo.fixedCode)}
                      className="bg-green-600 hover:bg-green-700 text-white gap-2 h-8 text-xs"
                      size="sm"
                    >
                      <Wand2 className="w-3 h-3" />
                      Apply Fix Automatically
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Fixed Code Preview */}
              {debugInfo.fixedCode && (
                <Card className="bg-[#252526] border-[#3d3d3d] overflow-hidden">
                  <div className="bg-[#2d2d2d] px-3 py-2 border-b border-[#3d3d3d]">
                    <span className="text-xs text-[#858585]">Corrected Code</span>
                  </div>
                  <div className="max-h-64 overflow-auto">
                    <pre className="p-3 text-xs text-[#d4d4d4] font-mono whitespace-pre-wrap break-words">
                      {debugInfo.fixedCode}
                    </pre>
                  </div>
                </Card>
              )}
            </>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}