import { useState } from "react";
import { Sparkles, X, Loader2, CheckCircle2, Code, Lightbulb, Wand2, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function AISuggestionsModal({ 
  title,
  subtitle,
  suggestions,
  isLoading,
  originalCode,
  onClose, 
  onApply,
  singleSuggestion = false
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedSuggestion = suggestions[selectedIndex];

  const getIcon = () => {
    return <Sparkles className="w-5 h-5 text-[#569cd6]" />;
  };

  return (
    <div className="absolute inset-0 bg-[#1e1e1e]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border-2 border-[#569cd6] rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#252526] border-b border-[#3d3d3d] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="text-xs text-[#858585]">{subtitle}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-[#858585] hover:text-white hover:bg-[#3d3d3d]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Suggestions List */}
          {!singleSuggestion && (
            <div className="w-2/5 border-r border-[#3d3d3d] flex flex-col">
              <div className="px-4 py-3 border-b border-[#3d3d3d] bg-[#252526]">
                <h3 className="text-sm font-semibold text-white">
                  {isLoading ? "Generating..." : `${suggestions.length} ${suggestions.length === 1 ? 'Suggestion' : 'Suggestions'}`}
                </h3>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {isLoading ? (
                    <Card className="bg-[#252526] border-[#3d3d3d] p-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-[#569cd6] animate-spin" />
                        <div>
                          <p className="text-sm text-white font-medium">Processing...</p>
                          <p className="text-xs text-[#858585]">AI is working on your request</p>
                        </div>
                      </div>
                    </Card>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <Lightbulb className="w-12 h-12 mx-auto mb-3 text-[#858585] opacity-50" />
                      <p className="text-[#858585] text-sm">No suggestions available</p>
                    </div>
                  ) : (
                    suggestions.map((suggestion, index) => (
                      <Card
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedIndex === index
                            ? 'bg-[#0e639c]/20 border-[#569cd6] border-2'
                            : 'bg-[#252526] border-[#3d3d3d] hover:border-[#569cd6]/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Code className="w-4 h-4 text-[#569cd6] flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="border-[#569cd6] text-[#569cd6] text-xs">
                                Option #{index + 1}
                              </Badge>
                            </div>
                            <div className="max-h-32 overflow-hidden">
                              <pre className="text-xs text-[#d4d4d4] font-mono whitespace-pre-wrap break-words line-clamp-6">
                                {typeof suggestion === 'string' ? suggestion.substring(0, 150) + (suggestion.length > 150 ? '...' : '') : suggestion}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Preview Panel */}
          <div className={`${singleSuggestion ? 'w-full' : 'flex-1'} flex flex-col`}>
            {!isLoading && suggestions.length > 0 && selectedSuggestion ? (
              <>
                <div className="px-6 py-4 border-b border-[#3d3d3d] bg-[#252526]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white">
                      {singleSuggestion ? 'Result' : `Preview - Option #${selectedIndex + 1}`}
                    </h3>
                    <Button
                      onClick={() => {
                        onApply(selectedSuggestion);
                        onClose();
                      }}
                      className="bg-[#0e639c] hover:bg-[#1177bb] text-white gap-2"
                      size="sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Apply to Editor
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {/* Code Comparison or Single Result */}
                    {originalCode ? (
                      <div className="space-y-4">
                        <div>
                          <div className="bg-[#252526] px-3 py-2 border border-[#3d3d3d] rounded-t-lg">
                            <span className="text-xs text-[#858585]">Original Code</span>
                          </div>
                          <div className="bg-[#1e1e1e] border border-[#3d3d3d] border-t-0 rounded-b-lg overflow-auto max-h-64">
                            <pre className="p-4 text-xs text-[#d4d4d4] font-mono whitespace-pre-wrap break-words">
                              {originalCode}
                            </pre>
                          </div>
                        </div>

                        <div className="flex items-center justify-center">
                          <ArrowRight className="w-6 h-6 text-[#569cd6]" />
                        </div>

                        <div>
                          <div className="bg-[#0e639c]/20 px-3 py-2 border border-[#0e639c]/50 rounded-t-lg">
                            <span className="text-xs text-[#569cd6]">Generated Code</span>
                          </div>
                          <div className="bg-[#1e1e1e] border border-[#0e639c]/50 border-t-0 rounded-b-lg overflow-auto max-h-96">
                            <pre className="p-4 text-xs text-[#d4d4d4] font-mono whitespace-pre-wrap break-words">
                              {selectedSuggestion}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-[#0e639c]/20 px-3 py-2 border border-[#0e639c]/50 rounded-t-lg">
                          <span className="text-xs text-[#569cd6]">Generated Result</span>
                        </div>
                        <div className="bg-[#1e1e1e] border border-[#0e639c]/50 border-t-0 rounded-b-lg overflow-auto max-h-[600px]">
                          <pre className="p-4 text-sm text-[#d4d4d4] font-mono whitespace-pre-wrap break-words leading-relaxed">
                            {selectedSuggestion}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#569cd6] animate-spin" />
                  <p className="text-white text-sm mb-2">AI is Processing...</p>
                  <p className="text-[#858585] text-xs">This may take a few seconds</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#569cd6] opacity-30" />
                  <p className="text-[#858585] text-sm mb-2">
                    {singleSuggestion ? 'No result available' : 'Select a suggestion'}
                  </p>
                  <p className="text-[#858585] text-xs">
                    {singleSuggestion ? 'Try again' : 'Choose from the list to preview'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}