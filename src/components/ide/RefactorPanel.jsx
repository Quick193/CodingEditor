import { useState, useEffect } from "react";
import { Sparkles, X, Loader2, CheckCircle2, Code, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/aiClient";

export default function RefactorPanel({ 
  code, 
  selectedCode,
  language, 
  onClose, 
  onApplyRefactor 
}) {
  const [refactorings, setRefactorings] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [selectedRefactoring, setSelectedRefactoring] = useState(null);

  useEffect(() => {
    analyzeCode();
  }, []);

  const analyzeCode = async () => {
    setIsAnalyzing(true);
    
    try {
      const codeToRefactor = selectedCode || code;
      const scope = selectedCode ? "the selected code block" : "the entire file";
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert code refactoring assistant. Analyze ${scope} and suggest specific refactoring improvements.

${language} Code:
\`\`\`${language}
${codeToRefactor}
\`\`\`

Provide 3-5 different refactoring suggestions. Each suggestion should include:
1. title: A short, clear title for the refactoring (e.g., "Simplify conditional logic")
2. category: One of: "simplification", "performance", "best-practices", "readability"
3. explanation: A detailed explanation of what will be improved and why (2-3 sentences)
4. impact: Brief description of the benefit (e.g., "15% faster execution", "Reduces code by 20%")
5. refactoredCode: The complete refactored version of the code

Focus on practical, impactful improvements. Return suggestions as a JSON array.`,
        response_json_schema: {
          type: "object",
          properties: {
            refactorings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  category: { type: "string" },
                  explanation: { type: "string" },
                  impact: { type: "string" },
                  refactoredCode: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRefactorings(response.refactorings || []);
    } catch (error) {
      console.error("Failed to analyze code:", error);
    }
    
    setIsAnalyzing(false);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "simplification":
        return <Code className="w-4 h-4 text-blue-400" />;
      case "performance":
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case "best-practices":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "readability":
        return <TrendingUp className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#c586c0]" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "simplification":
        return "border-blue-400/30 bg-blue-400/10";
      case "performance":
        return "border-yellow-400/30 bg-yellow-400/10";
      case "best-practices":
        return "border-green-400/30 bg-green-400/10";
      case "readability":
        return "border-purple-400/30 bg-purple-400/10";
      default:
        return "border-[#c586c0]/30 bg-[#c586c0]/10";
    }
  };

  const getCategoryLabel = (category) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="absolute inset-0 bg-[#1e1e1e]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border-2 border-[#569cd6] rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#252526] border-b border-[#3d3d3d] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#569cd6]" />
            <div>
              <h2 className="text-lg font-semibold text-white">AI Code Refactoring</h2>
              <p className="text-xs text-[#858585]">
                {selectedCode ? "Analyzing selected code block" : "Analyzing entire file"}
              </p>
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
          <div className="w-2/5 border-r border-[#3d3d3d] flex flex-col">
            <div className="px-4 py-3 border-b border-[#3d3d3d] bg-[#252526]">
              <h3 className="text-sm font-semibold text-white">
                {isAnalyzing ? "Analyzing..." : `${refactorings.length} Suggestions`}
              </h3>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {isAnalyzing ? (
                  <Card className="bg-[#252526] border-[#3d3d3d] p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-[#569cd6] animate-spin" />
                      <div>
                        <p className="text-sm text-white font-medium">Analyzing code...</p>
                        <p className="text-xs text-[#858585]">Finding optimization opportunities</p>
                      </div>
                    </div>
                  </Card>
                ) : refactorings.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                    <p className="text-[#858585] text-sm">No refactoring suggestions</p>
                    <p className="text-[#858585] text-xs">Your code looks great!</p>
                  </div>
                ) : (
                  refactorings.map((refactoring, index) => (
                    <Card
                      key={index}
                      onClick={() => setSelectedRefactoring(refactoring)}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedRefactoring === refactoring
                          ? `${getCategoryColor(refactoring.category)} border-2`
                          : 'bg-[#252526] border-[#3d3d3d] hover:border-[#569cd6]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getCategoryIcon(refactoring.category)}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white mb-1">
                            {refactoring.title}
                          </h4>
                          <Badge variant="outline" className="border-[#569cd6]/50 text-[#569cd6] text-xs mb-2">
                            {getCategoryLabel(refactoring.category)}
                          </Badge>
                          <p className="text-xs text-[#d4d4d4] mb-2 leading-relaxed">
                            {refactoring.explanation}
                          </p>
                          <div className="flex items-center gap-1 text-green-400">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs">{refactoring.impact}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 flex flex-col">
            {selectedRefactoring ? (
              <>
                <div className="px-6 py-4 border-b border-[#3d3d3d] bg-[#252526]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white">Preview Changes</h3>
                    <Button
                      onClick={() => {
                        onApplyRefactor(selectedRefactoring.refactoredCode, selectedRefactoring);
                        onClose();
                      }}
                      className="bg-[#0e639c] hover:bg-[#1177bb] text-white gap-2"
                      size="sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Apply Refactoring
                    </Button>
                  </div>
                  <p className="text-xs text-[#858585]">{selectedRefactoring.title}</p>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {/* Explanation Card */}
                    <Card className={`p-4 mb-4 ${getCategoryColor(selectedRefactoring.category)}`}>
                      <div className="flex items-start gap-3">
                        {getCategoryIcon(selectedRefactoring.category)}
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white mb-2">What's changing</h4>
                          <p className="text-xs text-[#d4d4d4] leading-relaxed mb-3">
                            {selectedRefactoring.explanation}
                          </p>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-green-400 font-medium">
                              {selectedRefactoring.impact}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Code Comparison */}
                    <div className="space-y-4">
                      <div>
                        <div className="bg-[#252526] px-3 py-2 border border-[#3d3d3d] rounded-t-lg">
                          <span className="text-xs text-[#858585]">Original Code</span>
                        </div>
                        <div className="bg-[#1e1e1e] border border-[#3d3d3d] border-t-0 rounded-b-lg overflow-auto max-h-64">
                          <pre className="p-4 text-xs text-[#d4d4d4] font-mono whitespace-pre-wrap break-words">
                            {selectedCode || code}
                          </pre>
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-6 h-6 text-[#569cd6]" />
                      </div>

                      <div>
                        <div className="bg-[#0e639c]/20 px-3 py-2 border border-[#0e639c]/50 rounded-t-lg">
                          <span className="text-xs text-[#569cd6]">Refactored Code</span>
                        </div>
                        <div className="bg-[#1e1e1e] border border-[#0e639c]/50 border-t-0 rounded-b-lg overflow-auto max-h-64">
                          <pre className="p-4 text-xs text-[#d4d4d4] font-mono whitespace-pre-wrap break-words">
                            {selectedRefactoring.refactoredCode}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#569cd6] opacity-30" />
                  <p className="text-[#858585] text-sm mb-2">Select a refactoring suggestion</p>
                  <p className="text-[#858585] text-xs">Choose from the list to preview changes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}