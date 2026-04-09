'use client';

import { useState, useRef, useEffect } from 'react';
import { Heart, Send, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME_MESSAGE = `Hello! I'm your compassionate assistant for Island to Infinity Zhixing.

I can help you with:
• Communication advice for supporting families
• Emotional support strategies
• Activity suggestions for companionship
• Ways to help children integrate into communities

How can I help you today? Feel free to describe any situation you're facing.`;

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME_MESSAGE }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.filter(m => m.role === 'user').map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-rose-100 to-purple-100 p-4 rounded-full">
            <Heart className="h-8 w-8 text-rose-500" />
          </div>
        </div>
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-3 tracking-wide">
          AI Compassionate Assistant
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Get warm, ethical guidance on supporting families and individuals in your community.
          This tool provides communication advice, emotional support strategies, and activity suggestions.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-slate-700">
          <strong>Important:</strong> This is not professional counseling or medical advice.
          If you or someone you know is in crisis, please seek help from a qualified professional.
          This tool offers general emotional support and communication guidance.
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-rose-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                {message.role === 'assistant' && index > 0 && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                    <Sparkles className="h-3 w-3" />
                    <span>AI Assistant</span>
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe a situation you're facing..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-800"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>

      {/* Example Prompts */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Example situations you could ask about:</h3>
        <div className="flex flex-wrap gap-2">
          {[
            "An elderly person in my neighborhood seems lonely",
            "A child at school is being left out by others",
            "A single mother is stressed about her children's education",
            "A family recently moved to our area and has no friends"
          ].map((example) => (
            <button
              key={example}
              onClick={() => setInput(example)}
              className="text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors text-left"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
