import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/aiClient";
import { Sparkles, Loader2, Lightbulb, Code, Wand2, CheckCircle2, AlertCircle, Send, Bot, User, MessageSquare, ChevronRight, FileCode, Zap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      {!isUser && (
        <div className="h-6 w-6 rounded-lg bg-[#c586c0]/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-3 h-3 text-[#c586c0]" />
        </div>
      )}
      <div className={`max-w-[70%] ${isUser && "flex flex-col items-end"}`}>
        <div className={`rounded-lg px-2.5 py-1.5 ${
          isUser ? "bg-[#0e639c] text-white" : "bg-[#252526] border border-[#3d3d3d]"
        }`}>
          {isUser ? (
            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <ReactMarkdown 
              className="text-xs prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={{
                code: ({ inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <pre className="bg-[#1e1e1e] rounded p-1.5 overflow-x-auto my-1 text-[10px]">
                      <code className={className} {...props}>{children}</code>
                    </pre>
                  ) : (
                    <code className="px-1 py-0.5 rounded bg-[#3d3d3d] text-[#4ec9b0] text-[10px]">
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => <p className="my-0.5 leading-tight text-[#d4d4d4] break-words">{children}</p>,
                ul: ({ children }) => <ul className="my-0.5 ml-3 list-disc text-[#d4d4d4]">{children}</ul>,
                ol: ({ children }) => <ol className="my-0.5 ml-3 list-decimal text-[#d4d4d4]">{children}</ol>,
                li: ({ children }) => <li className="my-0">{children}</li>,
                h1: ({ children }) => <h1 className="text-xs font-semibold my-1 text-white">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xs font-semibold my-1 text-white">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs font-semibold my-1 text-white">{children}</h3>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
      {isUser && (
        <div className="h-6 w-6 rounded-lg bg-[#569cd6]/20 flex items-center justify-center flex-shrink-0">
          <User className="w-3 h-3 text-[#569cd6]" />
        </div>
      )}
    </div>
  );
}

export default function AIPanel({ 
  code, 
  language, 
  fileName,
  onCodeInsert, 
  isCollapsed, 
  onToggleCollapse,
  onOpenModal
}) {
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (chatScrollRef.current) {
      const scrollElement = chatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    let unsubscribe = null;
    
    const initConversation = async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: "code_assistant",
          metadata: {
            name: "Code Assistant Chat",
            description: "AI-powered code assistance"
          }
        });
        setConversation(conv);
        const initialMessages = conv.messages || [];
        messagesRef.current = initialMessages;
        setMessages(initialMessages);

        unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
          // Only update if messages actually changed
          if (data?.messages) {
            const currentMessagesStr = JSON.stringify(data.messages);
            const previousMessagesStr = JSON.stringify(messagesRef.current);
            if (currentMessagesStr !== previousMessagesStr) {
              messagesRef.current = data.messages;
              setMessages(data.messages);
              setIsChatLoading(false);
            }
          }
        });
      } catch (error) {
        console.error("Failed to initialize conversation:", error);
      }
    };
    
    initConversation();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const sendChatMessage = async (messageText = null) => {
    if (!conversation) return;
    
    const finalMessage = messageText || chatInput.trim();
    if (!finalMessage) return;
    
    setIsChatLoading(true);
    if (!messageText) {
      setChatInput('');
    }

    const contextMessage = code ? 
      `Context: I'm working on a ${language} file named "${fileName}".\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nQuestion: ${finalMessage}` 
      : finalMessage;

    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: contextMessage
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsChatLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    sendChatMessage(question);
  };

  const handleAction = (type) => {
    if (!code.trim()) {
      setError("Please write some code first");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    onOpenModal(type);
  };

  if (isCollapsed) {
    return (
      <div className="w-10 bg-[#252526] border-l border-[#2d2d2d] flex flex-col items-center py-2 flex-shrink-0">
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#858585] hover:text-white hover:bg-[#3d3d3d]"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </Button>
        <div className="mt-4 writing-mode-vertical text-[#858585] text-xs">
          AI Copilot
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#1e1e1e] border-l border-[#2d2d2d] flex flex-col flex-shrink-0 overflow-hidden">
      <div className="h-10 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between px-4 gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#c586c0]" />
          <span className="text-sm text-white font-medium">AI Copilot</span>
        </div>
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-[#858585] hover:text-white hover:bg-[#3d3d3d]"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {(successMessage || error) && (
        <div className="px-4 pt-3 flex-shrink-0">
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-xs text-green-400">{successMessage}</span>
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="copilot" className="flex-1 flex flex-col overflow-hidden min-h-0">
        <TabsList className="bg-[#252526] border-b border-[#2d2d2d] rounded-none h-10 w-full justify-start px-2 flex-shrink-0">
          <TabsTrigger 
            value="copilot" 
            className="data-[state=active]:bg-[#37373d] data-[state=active]:text-white text-[#858585] text-xs"
          >
            <Code className="w-3 h-3 mr-1" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger 
            value="actions" 
            className="data-[state=active]:bg-[#37373d] data-[state=active]:text-white text-[#858585] text-xs"
          >
            <Wand2 className="w-3 h-3 mr-1" />
            Actions
          </TabsTrigger>
          <TabsTrigger 
            value="chat" 
            className="data-[state=active]:bg-[#37373d] data-[state=active]:text-white text-[#858585] text-xs"
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="copilot" className="flex-1 mt-0 overflow-hidden min-h-0">
          <div className="h-full flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                <Button
                  onClick={() => handleAction('complete')}
                  disabled={!code}
                  className="w-full bg-[#0e639c] hover:bg-[#1177bb] text-white justify-start transition-colors"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Complete Code
                </Button>
                
                <Button
                  onClick={() => handleAction('generate')}
                  disabled={!code}
                  className="w-full bg-[#c586c0] hover:bg-[#b07aa8] text-white justify-start transition-colors"
                  size="sm"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate from Comments
                </Button>

                <div className="text-center py-8 mt-4">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-[#c586c0] opacity-30" />
                  <p className="text-[#858585] text-sm mb-1">AI-Powered Code Completion</p>
                  <p className="text-[#858585] text-xs">Click a button to get smart suggestions</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="flex-1 mt-0 overflow-hidden min-h-0">
          <div className="h-full flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                <Button
                  onClick={() => handleAction('explain')}
                  disabled={!code}
                  variant="outline"
                  className="w-full justify-start bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] transition-colors"
                  size="sm"
                >
                  <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
                  Explain Code
                </Button>

                <Button
                  onClick={() => handleAction('improve')}
                  disabled={!code}
                  variant="outline"
                  className="w-full justify-start bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] transition-colors"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
                  Improve Code
                </Button>

                <Button
                  onClick={() => handleAction('fix')}
                  disabled={!code}
                  variant="outline"
                  className="w-full justify-start bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] transition-colors"
                  size="sm"
                >
                  <Wand2 className="w-4 h-4 mr-2 text-green-400" />
                  Fix Bugs
                </Button>

                <Button
                  onClick={() => handleAction('comment')}
                  disabled={!code}
                  variant="outline"
                  className="w-full justify-start bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] transition-colors"
                  size="sm"
                >
                  <Code className="w-4 h-4 mr-2 text-purple-400" />
                  Add Comments
                </Button>

                <div className="text-center py-8 mt-4">
                  <Wand2 className="w-12 h-12 mx-auto mb-3 text-[#c586c0] opacity-30" />
                  <p className="text-[#858585] text-sm mb-1">Code Actions</p>
                  <p className="text-[#858585] text-xs">Select an action to improve your code</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 mt-0 overflow-hidden min-h-0">
          <div className="h-full flex flex-col overflow-hidden">
            {code && (
              <div className="px-2.5 pt-2.5 pb-2 border-b border-[#2d2d2d] flex-shrink-0">
                <div className="bg-[#252526] border border-[#3d3d3d] rounded-lg p-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileCode className="w-3 h-3 text-[#569cd6]" />
                    <span className="text-xs text-white font-medium">{fileName}</span>
                    <Badge variant="outline" className="border-[#569cd6] text-[#569cd6] text-[10px] h-4">
                      {language}
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] h-4 ml-auto">
                      <Zap className="w-2.5 h-2.5 mr-1" />
                      Context Active
                    </Badge>
                  </div>
                  <p className="text-[10px] text-[#858585]">AI has full access to your current code</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden min-h-0">
              <ScrollArea className="h-full" ref={chatScrollRef}>
                <div className="p-2.5">
                  {messages.length === 0 ? (
                    <div className="space-y-3">
                      <div className="text-center py-4">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[#c586c0] opacity-50" />
                        <p className="text-white text-xs mb-1">Chat with AI Assistant</p>
                        <p className="text-[#858585] text-[10px]">Ask me anything about your code!</p>
                      </div>
                      
                      {code && (
                        <div className="space-y-2">
                          <p className="text-[10px] text-[#858585] px-1">Quick Questions:</p>
                          <Button
                            onClick={() => handleQuickQuestion("What does this code do?")}
                            variant="outline"
                            disabled={isChatLoading}
                            className="w-full justify-start bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] text-[11px] h-8"
                            size="sm"
                          >
                            <Lightbulb className="w-3 h-3 mr-2 text-yellow-400" />
                            What does this code do?
                          </Button>
                          
                          <Button
                            onClick={() => handleQuickQuestion("Are there any bugs or issues in this code?")}
                            variant="outline"
                            disabled={isChatLoading}
                            className="w-full justify-start bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] text-[11px] h-8"
                            size="sm"
                          >
                            <AlertCircle className="w-3 h-3 mr-2 text-red-400" />
                            Are there any bugs or issues?
                          </Button>
                          
                          <Button
                            onClick={() => handleQuickQuestion("How can I improve this code?")}
                            variant="outline"
                            disabled={isChatLoading}
                            className="w-full justify-start bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] text-[11px] h-8"
                            size="sm"
                          >
                            <Sparkles className="w-3 h-3 mr-2 text-blue-400" />
                            How can I improve this code?
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => (
                        <ChatMessage key={index} message={message} />
                      ))}
                      {isChatLoading && (
                        <div className="flex gap-2 mb-2">
                          <div className="h-6 w-6 rounded-lg bg-[#c586c0]/20 flex items-center justify-center flex-shrink-0">
                            <Loader2 className="w-3 h-3 text-[#c586c0] animate-spin" />
                          </div>
                          <div className="bg-[#252526] border border-[#3d3d3d] rounded-lg px-2.5 py-1.5">
                            <p className="text-[#858585] text-xs">Analyzing your code...</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="p-2.5 border-t border-[#2d2d2d] flex-shrink-0">
              <div className="flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder={code ? "Ask about your code..." : "Write some code first to get AI assistance..."}
                  className="bg-[#2d2d2d] border-[#3d3d3d] text-white text-xs placeholder:text-[#858585] resize-none focus:border-[#569cd6] min-h-[40px] max-h-[80px]"
                  disabled={isChatLoading}
                />
                <Button
                  onClick={() => sendChatMessage()}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-[#0e639c] hover:bg-[#1177bb] self-end h-8 w-8"
                  size="icon"
                >
                  {isChatLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-[#858585] text-[9px] mt-1">
                {code ? "Enter to send • Shift+Enter for new line" : "AI needs code context to assist you"}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}