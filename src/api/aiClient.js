// AI Client - Supports OpenAI, Anthropic, and other AI providers
// Configure your API provider in .env file

const STORAGE_KEY = 'code_files';

// Configuration - Load from environment variables
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'openai'; // 'openai', 'anthropic', 'google', 'custom'
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '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';
const OPENAI_BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o'; // or 'gpt-4-turbo' or 'gpt-3.5-turbo'

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const ANTHROPIC_MODEL = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GOOGLE_MODEL = import.meta.env.VITE_GOOGLE_MODEL || 'gemini-pro';

// Helper functions for localStorage (file management)
const getFiles = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading files from localStorage:', error);
    return [];
  }
};

const saveFiles = (files) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('Error saving files to localStorage:', error);
  }
};

// Check if any AI provider is configured
const isAIConfigured = () => {
  return !!(OPENAI_API_KEY || ANTHROPIC_API_KEY || GOOGLE_API_KEY);
};

// OpenAI API integration
const callOpenAI = async (prompt, response_json_schema = null, systemPrompt = null) => {
  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  let finalPrompt = prompt;
  
  // Add JSON schema if provided
  if (response_json_schema) {
    // OpenAI requires explicit JSON instruction in the prompt when using json_object format
    finalPrompt = `${prompt}\n\nIMPORTANT: You must respond with a valid JSON object only. Do not include any markdown formatting or explanation outside the JSON. The JSON must match this schema: ${JSON.stringify(response_json_schema)}`;
  }
  
  messages.push({ role: 'user', content: finalPrompt });

  const requestBody = {
    model: OPENAI_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 4000,
  };

  // Add JSON format if schema is provided
  if (response_json_schema) {
    requestBody.response_format = { type: 'json_object' };
  }

  console.log('OpenAI Request:', {
    model: OPENAI_MODEL,
    messagesCount: messages.length,
    hasSchema: !!response_json_schema,
    url: `${OPENAI_BASE_URL}/chat/completions`,
  });

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    console.error('OpenAI API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(`OpenAI API Error: ${errorMessage}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  
  console.log('OpenAI Response:', {
    hasContent: !!content,
    contentLength: content.length,
    model: data.model,
  });
  
  if (response_json_schema) {
    try {
      // Try parsing directly first
      return JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      // Try to find JSON object in the response
      const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        return JSON.parse(jsonObjectMatch[0]);
      }
      console.error('Failed to parse JSON response:', content.substring(0, 200));
      throw new Error(`Failed to parse JSON response: ${e.message}`);
    }
  }
  
  return content;
};

// Anthropic API integration
const callAnthropic = async (prompt, response_json_schema = null, systemPrompt = null) => {
  const messages = [{ role: 'user', content: prompt }];
  
  const requestBody = {
    model: ANTHROPIC_MODEL,
    max_tokens: 4000,
    messages,
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  // Add JSON schema instruction
  if (response_json_schema) {
    prompt = `${prompt}\n\nPlease respond with a valid JSON object matching this schema: ${JSON.stringify(response_json_schema)}`;
    messages[0].content = prompt;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.error?.message || error.message || 'Anthropic API request failed');
  }

  const data = await response.json();
  const content = data.content[0]?.text || '';
  
  if (response_json_schema) {
    try {
      return JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Failed to parse JSON response');
    }
  }
  
  return content;
};

// Google Gemini API integration
const callGoogle = async (prompt, response_json_schema = null, systemPrompt = null) => {
  let fullPrompt = prompt;
  if (systemPrompt) {
    fullPrompt = `${systemPrompt}\n\n${prompt}`;
  }

  const requestBody = {
    contents: [{
      parts: [{ text: fullPrompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4000,
    }
  };

  if (response_json_schema) {
    requestBody.generationConfig.responseMimeType = 'application/json';
    fullPrompt = `${fullPrompt}\n\nPlease respond with a valid JSON object matching this schema: ${JSON.stringify(response_json_schema)}`;
    requestBody.contents[0].parts[0].text = fullPrompt;
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent?key=${GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.error?.message || error.message || 'Google API request failed');
  }

  const data = await response.json();
  const content = data.candidates[0]?.content?.parts[0]?.text || '';
  
  if (response_json_schema) {
    try {
      return JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Failed to parse JSON response');
    }
  }
  
  return content;
};

// Main AI call function - routes to appropriate provider
const callAI = async (prompt, response_json_schema = null, systemPrompt = null) => {
  const isConfigured = isAIConfigured();
  const provider = AI_PROVIDER.toLowerCase();
  
  console.log('AI Call Debug:', {
    isConfigured,
    provider,
    hasOpenAIKey: !!OPENAI_API_KEY,
    hasAnthropicKey: !!ANTHROPIC_API_KEY,
    hasGoogleKey: !!GOOGLE_API_KEY,
  });

  if (!isConfigured) {
    console.warn('No AI provider configured. Using mock responses.');
    return await generateMockAIResponse(prompt, response_json_schema);
  }

  try {
    let result;
    switch (provider) {
      case 'openai':
        if (!OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }
        console.log('Calling OpenAI API...');
        result = await callOpenAI(prompt, response_json_schema, systemPrompt);
        console.log('OpenAI API response received');
        return result;
      
      case 'anthropic':
        if (!ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured');
        }
        console.log('Calling Anthropic API...');
        result = await callAnthropic(prompt, response_json_schema, systemPrompt);
        console.log('Anthropic API response received');
        return result;
      
      case 'google':
        if (!GOOGLE_API_KEY) {
          throw new Error('Google API key not configured');
        }
        console.log('Calling Google API...');
        result = await callGoogle(prompt, response_json_schema, systemPrompt);
        console.log('Google API response received');
        return result;
      
      default:
        throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
    }
  } catch (error) {
    console.error('AI API request failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    
    // Show error in console and throw it, but also provide helpful message
    console.error('Full error details:', error);
    
    // For better UX, we could fallback, but for debugging let's throw
    // Uncomment next line to enable fallback:
    // return await generateMockAIResponse(prompt, response_json_schema);
    
    throw error;
  }
};

// Mock AI response generator (fallback)
const generateMockAIResponse = async (prompt, response_json_schema = null) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (response_json_schema) {
    if (response_json_schema.properties?.suggestions) {
      return {
        suggestions: [
          '// AI generated code suggestion 1\n' + prompt.substring(0, 100),
          '// AI generated code suggestion 2\n' + prompt.substring(0, 100),
          '// AI generated code suggestion 3\n' + prompt.substring(0, 100)
        ]
      };
    }
    if (response_json_schema.properties?.refactorings) {
      return {
        refactorings: [
          {
            title: 'Simplify Code Structure',
            category: 'simplification',
            explanation: 'This refactoring improves code readability by simplifying the structure.',
            impact: 'Reduces complexity by 20%',
            refactoredCode: '// Refactored code will appear here'
          }
        ]
      };
    }
    if (response_json_schema.properties?.rootCause) {
      return {
        rootCause: 'The error occurs due to an undefined variable or missing import.',
        lineNumber: 1,
        suggestion: 'Ensure all variables are properly declared before use.',
        fixedCode: '// Fixed code will appear here'
      };
    }
  }
  
  if (prompt.includes('execute') || prompt.includes('Execute')) {
    return 'Code executed successfully.\nOutput: Hello, World!';
  }
  
  return 'AI response: Please configure your AI provider API key in .env file for actual AI functionality.';
};

// Export client with same interface as before (for compatibility)
export const base44 = {
  entities: {
    CodeFile: {
      list: async (sort = '-updated_date') => {
        const files = getFiles();
        if (sort === '-updated_date') {
          return files.sort((a, b) => {
            const aDate = new Date(a.updated_date || a.created_date || 0);
            const bDate = new Date(b.updated_date || b.created_date || 0);
            return bDate - aDate;
          });
        }
        return files;
      },
      create: async (fileData) => {
        const files = getFiles();
        const newFile = {
          ...fileData,
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        };
        files.push(newFile);
        saveFiles(files);
        return newFile;
      },
      update: async (id, data) => {
        const files = getFiles();
        const index = files.findIndex(f => f.id === id);
        if (index !== -1) {
          files[index] = {
            ...files[index],
            ...data,
            updated_date: new Date().toISOString(),
          };
          saveFiles(files);
          return files[index];
        }
        throw new Error('File not found');
      },
      delete: async (id) => {
        const files = getFiles();
        const filtered = files.filter(f => f.id !== id);
        saveFiles(filtered);
        return { id };
      }
    }
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt, response_json_schema = null }) => {
        console.log('Invoking LLM with prompt:', prompt.substring(0, 100) + '...');
        try {
          const result = await callAI(prompt, response_json_schema);
          console.log('LLM Invocation successful');
          return result;
        } catch (error) {
          console.error('LLM Invocation failed:', error);
          // Re-throw the error so it can be handled by the caller
          throw error;
        }
      }
    }
  },
  agents: {
    createConversation: async ({ agent_name, metadata }) => {
      const conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agent_name,
        metadata,
        messages: [
          {
            role: 'assistant',
            content: 'Hello! I\'m your AI coding assistant. How can I help you today?'
          }
        ],
        created_at: new Date().toISOString()
      };
      
      const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
      conversations.push(conversation);
      localStorage.setItem('conversations', JSON.stringify(conversations));
      
      return conversation;
    },
    subscribeToConversation: (conversationId, callback) => {
      let lastMessageCount = 0;
      
      const interval = setInterval(() => {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const conv = conversations.find(c => c.id === conversationId);
        if (conv && callback) {
          const currentMessageCount = conv.messages?.length || 0;
          if (currentMessageCount !== lastMessageCount) {
            lastMessageCount = currentMessageCount;
            callback(conv);
          }
        }
      }, 1000);
      
      return () => clearInterval(interval);
    },
    addMessage: async (conversation, message) => {
      const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
      const convIndex = conversations.findIndex(c => c.id === conversation.id);
      
      if (convIndex !== -1) {
        conversations[convIndex].messages.push(message);
        
        // Generate AI response using the configured provider
        setTimeout(async () => {
          let aiResponse;
          try {
            const llmResponse = await callAI(
              message.content,
              null,
              'You are a helpful coding assistant. Provide clear, concise, and accurate answers about code and programming.'
            );
            aiResponse = {
              role: 'assistant',
              content: typeof llmResponse === 'string' ? llmResponse : JSON.stringify(llmResponse)
            };
          } catch (error) {
            console.error('Failed to generate AI response:', error);
            aiResponse = {
              role: 'assistant',
              content: 'I apologize, but I encountered an error processing your message. Please try again.'
            };
          }
          
          conversations[convIndex].messages.push(aiResponse);
          localStorage.setItem('conversations', JSON.stringify(conversations));
        }, 500);
        
        localStorage.setItem('conversations', JSON.stringify(conversations));
      }
      
      return conversation;
    }
  }
};

