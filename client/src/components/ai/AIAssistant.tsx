import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello, how can I help you with HR tasks today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    // Reset minimized state when closing
    if (isOpen) {
      setIsMinimized(false);
    }
  };

  const minimize = () => {
    setIsMinimized(true);
  };
  
  const expand = () => {
    setIsMinimized(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Get AI response
      const response = await apiRequest('POST', '/api/ai-assistant/chat', {
        message: inputMessage,
        context: {
          conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        }
      });
      
      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || 'Sorry, I could not generate a response.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-96 bg-white rounded-lg shadow-lg overflow-hidden border border-neutral-200 transition-all duration-300">
          <div className="bg-blue-600 px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-white rounded-full p-1">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6 0-.07.03-.13.04-.2l4.16 4.16c.39.39 1.02.39 1.41 0l4.16-4.16c.01.07.04.13.04.2 0 3.31-2.69 6-6 6zm6-8c0 .07-.03.13-.04.2l-4.16-4.16c-.39-.39-1.02-.39-1.41 0L8.04 10.2c-.01-.07-.04-.13-.04-.2 0-3.31 2.69-6 6-6s6 2.69 6 6z"/>
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold">AI HR Assistant</h3>
                  <p className="text-xs text-white opacity-90">
                    {isMinimized ? 'Minimized | Click to expand' : 'Expert mode | Online'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                {isMinimized ? (
                  <button 
                    type="button" 
                    className="text-white hover:bg-blue-700 p-1 rounded transition-colors"
                    onClick={expand}
                    aria-label="Expand"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke="white">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="text-white hover:bg-blue-700 p-1 rounded transition-colors"
                    onClick={minimize}
                    aria-label="Minimize"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke="white">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                <button 
                  type="button" 
                  className="text-white hover:bg-blue-700 p-1 rounded transition-colors"
                  onClick={toggleAssistant}
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {!isMinimized ? (
            <>
              <div className="h-80 overflow-y-auto p-4 bg-white">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex items-start mb-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center 
                      ${message.role === 'assistant' ? 'bg-blue-600' : 'bg-neutral-200'}`}
                    >
                      <span className={`text-xs font-medium ${message.role === 'assistant' ? 'text-white' : 'text-neutral-700'}`}>
                        {message.role === 'assistant' ? 'AI' : 'You'}
                      </span>
                    </div>
                    <div className={`${message.role === 'user' ? 'mr-3 bg-blue-600 text-white' : 'ml-3 bg-neutral-100 text-neutral-800'} rounded-lg py-2 px-3 shadow-sm max-w-[80%]`}>
                      <div className="text-sm whitespace-pre-line" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">AI</span>
                    </div>
                    <div className="ml-3 bg-neutral-100 rounded-lg py-2 px-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-3 border-t border-neutral-200 bg-white">
                <form onSubmit={handleSubmit} className="flex items-center bg-neutral-50 rounded overflow-hidden px-3">
                  <Input
                    type="text"
                    className="flex-1 border-0 focus-visible:ring-0 text-sm text-neutral-800 bg-transparent py-2 h-10"
                    placeholder="Ask your AI assistant..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="ml-2 inline-flex items-center justify-center rounded-full h-8 w-8 bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Button>
                </form>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-14 w-14 shadow-lg flex items-center justify-center transition-all duration-300 border-4 border-white"
          onClick={toggleAssistant}
        >
          <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6 0-.07.03-.13.04-.2l4.16 4.16c.39.39 1.02.39 1.41 0l4.16-4.16c.01.07.04.13.04.2 0 3.31-2.69 6-6 6zm6-8c0 .07-.03.13-.04.2l-4.16-4.16c-.39-.39-1.02-.39-1.41 0L8.04 10.2c-.01-.07-.04-.13-.04-.2 0-3.31 2.69-6 6-6s6 2.69 6 6z"/>
          </svg>
        </Button>
      )}
    </div>
  );
};

export default AIAssistant;
