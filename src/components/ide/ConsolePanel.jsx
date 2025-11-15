import { useEffect, useRef } from "react";
import { Terminal, Loader2, CheckCircle2, XCircle, Trash2, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function ConsolePanel({ output, isRunning, hasError, onClear, isCollapsed, onToggleCollapse }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && output) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [output]);

  if (isCollapsed) {
    return (
      <div className="h-10 bg-[#252526] border-t border-[#2d2d2d] flex items-center justify-between px-4 flex-shrink-0 cursor-pointer" onClick={onToggleCollapse}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#4ec9b0]" />
          <span className="text-sm text-white font-medium">Console Output</span>
          {output && !hasError && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          {hasError && <XCircle className="w-4 h-4 text-red-500" />}
        </div>
        <ChevronDown className="w-4 h-4 text-[#858585] rotate-180" />
      </div>
    );
  }

  return (
    <div className="h-full bg-[#1e1e1e] border-t border-[#2d2d2d] flex flex-col">
      <div className="h-10 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between px-4 cursor-pointer" onClick={onToggleCollapse}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#4ec9b0]" />
          <span className="text-sm text-white font-medium">Console Output</span>
          {isRunning && <Loader2 className="w-4 h-4 text-[#569cd6] animate-spin" />}
          {!isRunning && output && !hasError && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          {!isRunning && hasError && <XCircle className="w-4 h-4 text-red-500" />}
        </div>
        <div className="flex items-center gap-1">
          {output && !isRunning && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="h-6 w-6 text-[#858585] hover:text-white hover:bg-[#3d3d3d]"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
          <ChevronDown className="w-4 h-4 text-[#858585]" />
        </div>
      </div>
      
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 font-mono text-sm">
          {isRunning ? (
            <div className="flex items-center gap-2 text-[#569cd6]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Running code...</span>
            </div>
          ) : output ? (
            <pre className={`whitespace-pre-wrap break-words ${hasError ? 'text-red-400' : 'text-[#d4d4d4]'}`}>
              {output}
            </pre>
          ) : (
            <div className="text-[#858585] italic flex flex-col items-center justify-center py-8">
              <Terminal className="w-8 h-8 mb-2 opacity-50" />
              <p>Click "Run Code" to execute your program</p>
              <p className="text-xs mt-1">Output will appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}