import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/aiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, FlaskConical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import Toolbar from "@/components/ide/Toolbar";
import CodeEditor from "@/components/ide/CodeEditor";
import ConsolePanel from "@/components/ide/ConsolePanel";
import AIPanel from "@/components/ide/AIPanel";
import FileTree from "@/components/ide/FileTree";
import DebugPanel from "@/components/ide/DebugPanel";
import RefactorPanel from "@/components/ide/RefactorPanel";
import AISuggestionsModal from "@/components/ide/AISuggestionsModal";

export default function IDE() {
  const [currentFile, setCurrentFile] = useState(null);
  const [code, setCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [fileName, setFileName] = useState('main.js');
  const [language, setLanguage] = useState('javascript');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const [selectedCode, setSelectedCode] = useState(null);
  
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugError, setDebugError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [isAnalyzingError, setIsAnalyzingError] = useState(false);
  
  const [showRefactorPanel, setShowRefactorPanel] = useState(false);
  
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiModalType, setAIModalType] = useState(null);
  const [aiSuggestions, setAISuggestions] = useState([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  const [leftPanelWidth, setLeftPanelWidth] = useState(256);
  const [rightPanelWidth, setRightPanelWidth] = useState(384);
  const [consolePanelHeight, setConsolePanelHeight] = useState(256);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isResizingConsole, setIsResizingConsole] = useState(false);

  const lastAnalyzedError = useRef(null);

  const queryClient = useQueryClient();

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['codeFiles'],
    queryFn: async () => {
      const result = await base44.entities.CodeFile.list('-updated_date');
      console.log('Files loaded:', result);
      return result;
    },
    staleTime: 0, // Always refetch when query is invalidated
    gcTime: 0, // Don't cache stale data (gcTime replaces cacheTime in v5)
  });

  const createFileMutation = useMutation({
    mutationFn: async (fileData) => {
      const newFile = await base44.entities.CodeFile.create(fileData);
      console.log('File created:', newFile);
      return newFile;
    },
    onSuccess: (newFile) => {
      console.log('File creation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['codeFiles'] });
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['codeFiles'] });
      setCurrentFile(newFile);
      setCode(newFile.content);
      setOriginalCode(newFile.content);
      setFileName(newFile.name);
      setLanguage(newFile.language);
    },
  });

  const updateFileMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CodeFile.update(id, data),
    onSuccess: (updatedFile) => {
      queryClient.invalidateQueries({ queryKey: ['codeFiles'] });
      setOriginalCode(updatedFile.content);
      setFileName(updatedFile.name);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id) => base44.entities.CodeFile.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['codeFiles'] });
      if (currentFile && currentFile.id === deletedId) {
        const remainingFiles = files.filter(f => f.id !== deletedId);
        if (remainingFiles.length > 0) {
          handleFileSelect(remainingFiles[0]);
        } else {
          setCurrentFile(null);
          setCode('');
          setOriginalCode('');
          setFileName('main.js');
          setLanguage('javascript');
          setConsoleOutput('');
        }
      }
    },
  });

  useEffect(() => {
    if (files.length > 0 && !currentFile) {
      const file = files[0];
      setCurrentFile(file);
      setCode(file.content);
      setOriginalCode(file.content);
      setFileName(file.name);
      setLanguage(file.language);
    }
  }, [files, currentFile]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setLeftPanelWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(300, Math.min(800, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
      if (isResizingConsole) {
        const newHeight = Math.max(100, Math.min(600, window.innerHeight - e.clientY - 56));
        setConsolePanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      setIsResizingConsole(false);
    };

    if (isResizingLeft || isResizingRight || isResizingConsole) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      if (isResizingConsole) {
        document.body.style.cursor = 'row-resize';
      } else {
        document.body.style.cursor = 'col-resize';
      }
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight, isResizingConsole]);

  const analyzeError = useCallback(async (errorOutput) => {
    if (lastAnalyzedError.current === errorOutput) {
      return;
    }
    
    lastAnalyzedError.current = errorOutput;
    setDebugError(errorOutput);
    setShowDebugPanel(true);
    setIsAnalyzingError(true);
    
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert debugger. Analyze this ${language} code error and provide detailed debugging information.

Code:
\`\`\`${language}
${code}
\`\`\`

Error Output:
${errorOutput}

Provide a JSON response with:
1. rootCause: A clear explanation of what caused the error (1-2 sentences)
2. lineNumber: The line number where the error occurs (if identifiable, otherwise null)
3. suggestion: A detailed explanation of how to fix it
4. fixedCode: The complete corrected version of the code

Be specific and actionable. Focus on the exact issue and provide working code.`,
        response_json_schema: {
          type: "object",
          properties: {
            rootCause: { type: "string" },
            lineNumber: { type: ["number", "null"] },
            suggestion: { type: "string" },
            fixedCode: { type: "string" }
          }
        }
      });

      setDebugInfo(response);
    } catch (error) {
      console.error("Failed to analyze error:", error);
    }
    
    setIsAnalyzingError(false);
  }, [code, language]);

  useEffect(() => {
    if (hasError && consoleOutput && !isRunning && !isTesting && consoleOutput !== lastAnalyzedError.current) {
      analyzeError(consoleOutput);
    }
  }, [hasError, consoleOutput, isRunning, isTesting, analyzeError]);

  const handleOpenAIModal = useCallback(async (type) => {
    setAIModalType(type);
    setShowAIModal(true);
    setIsGeneratingAI(true);
    setAISuggestions([]);
    
    try {
      let prompt = "";
      let jsonSchema = null;
      
      if (type === "complete") {
        prompt = `You are GitHub Copilot. Complete the following ${language} code. Provide 3 different completion suggestions.

Current code:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the completion suggestions as an array of code strings. Each suggestion should be complete, executable code that extends the existing code naturally.`;
        jsonSchema = {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: { type: "string" }
            }
          }
        };
      } else if (type === "generate") {
        prompt = `You are GitHub Copilot. Generate ${language} code based on these comments/requirements:

\`\`\`${language}
${code}
\`\`\`

Generate complete, working code that implements what the comments describe. Return ONLY the code.`;
      } else if (type === "explain") {
        prompt = `Briefly explain what this ${language} code does in 2-3 sentences:\n\n\`\`\`${language}\n${code}\n\`\`\``;
      } else if (type === "improve") {
        prompt = `Improve this ${language} code. Provide 2 different improved versions with better practices, performance, or readability.

Current code:
\`\`\`${language}
${code}
\`\`\`

Return suggestions as an array of improved code strings.`;
        jsonSchema = {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: { type: "string" }
            }
          }
        };
      } else if (type === "fix") {
        prompt = `Fix bugs and issues in this ${language} code. Provide the corrected version.

Current code:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the fixed code.`;
      } else if (type === "comment") {
        prompt = `Add helpful inline comments to this ${language} code explaining what each part does:

\`\`\`${language}
${code}
\`\`\`

Return the code with comments added.`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: jsonSchema
      });

      if (response.suggestions) {
        setAISuggestions(response.suggestions);
      } else {
        setAISuggestions([response]);
      }
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      setAISuggestions([`Error: ${error.message || 'Failed to generate AI response. Please check your API key and try again.'}`]);
      setIsGeneratingAI(false);
    }
    
    setIsGeneratingAI(false);
  }, [code, language]);

  const getModalConfig = () => {
    const configs = {
      complete: {
        title: "AI Code Completion",
        subtitle: "Smart suggestions to complete your code",
        showComparison: true
      },
      generate: {
        title: "Generate from Comments",
        subtitle: "Transform comments into working code",
        showComparison: true
      },
      explain: {
        title: "Code Explanation",
        subtitle: "Understanding what your code does",
        showComparison: false
      },
      improve: {
        title: "Code Improvements",
        subtitle: "Better practices and optimizations",
        showComparison: true
      },
      fix: {
        title: "Bug Fixes",
        subtitle: "Automatic error correction",
        showComparison: true
      },
      comment: {
        title: "Add Comments",
        subtitle: "Inline documentation for your code",
        showComparison: true
      }
    };
    return configs[aiModalType] || configs.complete;
  };

  const handleSelectionChange = useCallback((selected) => {
    setSelectedCode(selected);
  }, []);

  const handleFileSelect = useCallback((file) => {
    setCurrentFile(file);
    setCode(file.content);
    setOriginalCode(file.content);
    setFileName(file.name);
    setLanguage(file.language);
    setConsoleOutput('');
    setHasError(false);
    setShowDebugPanel(false);
    setDebugInfo(null);
    setSelectedCode(null);
    lastAnalyzedError.current = null;
  }, []);

  const handleNewFile = useCallback((fileData) => {
    createFileMutation.mutate({
      ...fileData,
      description: 'Code file'
    });
  }, [createFileMutation]);

  const handleSave = useCallback(() => {
    if (currentFile) {
      updateFileMutation.mutate({
        id: currentFile.id,
        data: {
          name: fileName,
          language: language,
          content: code
        }
      });
    } else {
      createFileMutation.mutate({
        name: fileName,
        language: language,
        content: code,
        description: 'Code file'
      });
    }
  }, [currentFile, fileName, language, code, updateFileMutation, createFileMutation]);

  const handleRun = useCallback(async () => {
    if (!code.trim()) {
      setConsoleOutput('Error: No code to execute');
      setHasError(true);
      return;
    }

    setIsRunning(true);
    setHasError(false);
    setConsoleOutput('');
    setShowDebugPanel(false);
    setDebugInfo(null);
    lastAnalyzedError.current = null;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a code execution simulator. Execute the following ${language} code and provide the output exactly as it would appear in a real console.

IMPORTANT: If the code requires user input (like input(), scanf(), cin, etc.), DO NOT automatically provide values. Instead, show an error message indicating that the program requires user input which cannot be provided in this simulated environment.

Code:
\`\`\`${language}
${code}
\`\`\`

Rules:
- If there are errors, show them exactly as they would appear
- If there are print/console statements, show their output
- If there are no print statements, evaluate the code and show the final result
- If the code requires user input, output: "Error: This program requires user input which cannot be provided in this simulated environment."

Provide ONLY the console output, no explanations or markdown formatting.`,
      });

      setConsoleOutput(response);
      
      const hasErrorIndicators = /error|exception|traceback|undefined|null reference|segmentation fault/i.test(response);
      setHasError(hasErrorIndicators);
    } catch (error) {
      setConsoleOutput(`Error: ${error.message}`);
      setHasError(true);
    }

    setIsRunning(false);
  }, [code, language]);

  const handleAutoTest = useCallback(async () => {
    if (!code.trim()) {
      setConsoleOutput('Error: No code to test');
      setHasError(true);
      return;
    }

    setIsTesting(true);
    setHasError(false);
    setConsoleOutput('🧪 AI is analyzing your code and generating test cases...\n\n');
    setShowDebugPanel(false);
    setDebugInfo(null);
    lastAnalyzedError.current = null;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert software tester. Analyze the following ${language} code and:
1. Identify what the code is supposed to do
2. Generate 3-5 comprehensive test cases with appropriate test data
3. Execute each test case and show the results
4. Identify any bugs, edge cases, or issues

Code to test:
\`\`\`${language}
${code}
\`\`\`

Format your response as:
📋 CODE ANALYSIS:
[Brief description of what the code does]

🧪 TEST CASES:
Test 1: [Description]
Input: [Input values]
Expected: [Expected result]
Actual: [Actual result]
Status: ✅ PASS / ❌ FAIL

[Repeat for all test cases]

🐛 ISSUES FOUND:
[List any bugs, edge cases, or improvements needed]

Provide detailed testing output.`,
      });

      setConsoleOutput(typeof response === 'string' ? response : JSON.stringify(response, null, 2));
      
      const hasFailedTests = /❌ FAIL|🐛 ISSUES FOUND/i.test(response);
      setHasError(hasFailedTests);
    } catch (error) {
      setConsoleOutput(`Error: ${error.message || 'Failed to run tests. Please check your API key.'}\n\nTo fix this:\n1. Check your OpenAI API key in .env file\n2. Make sure the key is valid and has credits\n3. Check the browser console for detailed error messages`);
      setHasError(true);
    }

    setIsTesting(false);
  }, [code, language]);

  const handleRefactor = useCallback(() => {
    setShowRefactorPanel(true);
  }, []);

  const handleApplyRefactor = useCallback((refactoredCode, refactoring) => {
    setCode(refactoredCode);
    setConsoleOutput(`✨ Refactoring applied: ${refactoring.title}\n\n${refactoring.impact}`);
    setHasError(false);
  }, []);

  const handleCodeInsert = useCallback((newCode) => {
    setCode(newCode);
  }, []);

  const handleApplyFix = useCallback((fixedCode) => {
    setCode(fixedCode);
    setShowDebugPanel(false);
    setDebugInfo(null);
    setHasError(false);
    setConsoleOutput('✅ Fix applied! Click "Run Code" to test the corrected version.');
    lastAnalyzedError.current = null;
  }, []);

  const handleClearConsole = useCallback(() => {
    setConsoleOutput('');
    setHasError(false);
    setShowDebugPanel(false);
    setDebugInfo(null);
    lastAnalyzedError.current = null;
  }, []);

  const hasUnsavedChanges = code !== originalCode || fileName !== currentFile?.name;

  const modalConfig = getModalConfig();

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] overflow-hidden">
      <Toolbar
        onRun={handleRun}
        onSave={handleSave}
        fileName={fileName}
        onFileNameChange={setFileName}
        isRunning={isRunning}
        isSaving={updateFileMutation.isPending || createFileMutation.isPending}
        hasUnsavedChanges={hasUnsavedChanges}
        extraActions={
          <>
            <Button
              onClick={handleRefactor}
              disabled={isRunning || isTesting || !code}
              variant="outline"
              className="border-[#3d3d3d] bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] gap-2 transition-colors"
              size="sm"
            >
              <Sparkles className="w-4 h-4" />
              {selectedCode ? "Refactor Selection" : "Refactor Code"}
            </Button>
            
            <Button
              onClick={handleAutoTest}
              disabled={isRunning || isTesting}
              variant="outline"
              className="border-[#3d3d3d] bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] gap-2 transition-colors"
              size="sm"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  Auto Test
                </>
              )}
            </Button>
          </>
        }
      />

      <div className="flex-1 flex overflow-hidden relative">
        <div style={{ width: isLeftCollapsed ? 'auto' : `${leftPanelWidth}px` }} className="flex-shrink-0">
          <FileTree
            files={files}
            currentFile={currentFile}
            onFileSelect={handleFileSelect}
            onNewFile={handleNewFile}
            onDeleteFile={(id) => deleteFileMutation.mutate(id)}
            isLoading={filesLoading}
            isCollapsed={isLeftCollapsed}
            onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
          />
        </div>

        {!isLeftCollapsed && (
          <div
            onMouseDown={() => setIsResizingLeft(true)}
            className="w-1 cursor-col-resize hover:bg-[#569cd6] transition-colors flex-shrink-0 bg-[#2d2d2d]"
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onSelectionChange={handleSelectionChange}
            />
          </div>

          {!isConsoleCollapsed && (
            <div
              onMouseDown={() => setIsResizingConsole(true)}
              className="h-1 cursor-row-resize hover:bg-[#569cd6] transition-colors flex-shrink-0 bg-[#2d2d2d]"
            />
          )}

          <div style={{ height: isConsoleCollapsed ? 'auto' : `${consolePanelHeight}px` }} className="flex-shrink-0">
            <ConsolePanel
              output={consoleOutput}
              isRunning={isRunning}
              hasError={hasError}
              onClear={handleClearConsole}
              isCollapsed={isConsoleCollapsed}
              onToggleCollapse={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
            />
          </div>

          {showDebugPanel && debugError && (
            <DebugPanel
              error={debugError}
              code={code}
              language={language}
              debugInfo={debugInfo}
              isAnalyzing={isAnalyzingError}
              onClose={() => {
                setShowDebugPanel(false);
                setDebugInfo(null);
                lastAnalyzedError.current = null;
              }}
              onApplyFix={handleApplyFix}
            />
          )}
        </div>

        {!isRightCollapsed && (
          <div
            onMouseDown={() => setIsResizingRight(true)}
            className="w-1 cursor-col-resize hover:bg-[#569cd6] transition-colors flex-shrink-0 bg-[#2d2d2d]"
          />
        )}

        <div style={{ width: isRightCollapsed ? 'auto' : `${rightPanelWidth}px` }} className="flex-shrink-0">
          <AIPanel
            code={code}
            language={language}
            fileName={fileName}
            onCodeInsert={handleCodeInsert}
            isCollapsed={isRightCollapsed}
            onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
            onOpenModal={handleOpenAIModal}
          />
        </div>
      </div>

      {showRefactorPanel && (
        <RefactorPanel
          code={code}
          selectedCode={selectedCode}
          language={language}
          onClose={() => setShowRefactorPanel(false)}
          onApplyRefactor={handleApplyRefactor}
        />
      )}

      {showAIModal && (
        <AISuggestionsModal
          title={modalConfig.title}
          subtitle={modalConfig.subtitle}
          suggestions={aiSuggestions}
          isLoading={isGeneratingAI}
          originalCode={modalConfig.showComparison ? code : null}
          onClose={() => setShowAIModal(false)}
          onApply={handleCodeInsert}
          singleSuggestion={aiModalType === 'explain' || aiModalType === 'fix' || aiModalType === 'comment' || aiModalType === 'generate'}
        />
      )}
    </div>
  );
}