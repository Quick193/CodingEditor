import { useEffect, useRef } from "react";

export default function CodeEditor({ code, onChange, language, onSelectionChange }) {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  useEffect(() => {
    syncScroll();
  }, [code]);

  const syncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleSelectionChange = () => {
    if (textareaRef.current && onSelectionChange) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end) {
        const selectedText = code.substring(start, end);
        onSelectionChange(selectedText, start, end);
      } else {
        onSelectionChange(null, start, end);
      }
    }
  };

  const handleKeyDown = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Tab key support
    if (e.key === 'Tab') {
      e.preventDefault();
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newCode);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
    
    // Auto-indent on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentLineStart = code.lastIndexOf('\n', start - 1) + 1;
      const currentLine = code.substring(currentLineStart, start);
      const indent = currentLine.match(/^\s*/)[0];
      
      const newCode = code.substring(0, start) + '\n' + indent + code.substring(end);
      onChange(newCode);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
      }, 0);
    }

    // Auto-close brackets
    const pairs = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'"
    };

    if (pairs[e.key] && start === end) {
      e.preventDefault();
      const newCode = code.substring(0, start) + e.key + pairs[e.key] + code.substring(end);
      onChange(newCode);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  const getLineNumbers = () => {
    const lines = code.split('\n').length;
    return Array.from({ length: Math.max(lines, 20) }, (_, i) => i + 1);
  };

  return (
    <div className="flex h-full bg-[#1e1e1e] overflow-hidden relative">
      {/* Line numbers */}
      <div 
        ref={lineNumbersRef}
        className="bg-[#1e1e1e] text-[#858585] text-right pr-3 pl-4 py-4 select-none border-r border-[#2d2d2d] font-mono text-sm leading-6 overflow-hidden"
        style={{ width: '50px', flexShrink: 0 }}
      >
        {getLineNumbers().map(num => (
          <div key={num} className="h-6">{num}</div>
        ))}
      </div>

      {/* Code editor */}
      <div className="flex-1 overflow-auto relative">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          className="w-full h-full p-4 bg-transparent text-white font-mono text-sm leading-6 resize-none focus:outline-none absolute inset-0"
          style={{
            caretColor: 'white',
            tabSize: 2,
            minHeight: '100%',
          }}
          placeholder="// Start typing your code here..."
          spellCheck="false"
        />
      </div>

      <style jsx>{`
        textarea {
          color-scheme: dark;
        }
        textarea::selection {
          background-color: #264f78;
        }
        textarea::placeholder {
          color: #858585;
        }
      `}</style>
    </div>
  );
}