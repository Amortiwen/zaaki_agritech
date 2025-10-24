'use client';

import React, { useState, Fragment, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    MessageCircle, 
    Send, 
    Bot, 
    User, 
    Sparkles, 
    Copy, 
    RefreshCw,
    Globe,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    Leaf,
    Droplets,
    Thermometer
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIChatbotProps {
    predictionData?: any;
    className?: string;
}

export function AIChatbot({ predictionData, className }: AIChatbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [webSearch, setWebSearch] = useState(false);
    const [showReasoning, setShowReasoning] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    
    // Fetch CSRF token on component mount
    useEffect(() => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            setCsrfToken(token);
            console.log('CSRF Token from meta:', token);
        } else {
            // Fallback: fetch token from API
            fetch('/api/csrf-token')
                .then(response => response.json())
                .then(data => {
                    setCsrfToken(data.csrf_token);
                    console.log('CSRF Token from API:', data.csrf_token);
                })
                .catch(console.error);
        }
    }, []);
    
    const { messages, sendMessage, status, regenerate } = useChat({
        api: '/api/chat',
        headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: {
            predictionData,
            webSearch
        },
        onFinish: (message) => {
            console.log('Chat finished:', message);
        },
        onError: (error) => {
            console.error('Chat error:', error);
        }
    });

    const testCSRF = async () => {
        try {
            const response = await fetch('/api/debug-csrf', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            console.log('CSRF Debug:', data);
        } catch (error) {
            console.error('CSRF Test Error:', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !csrfToken) return;
        
        sendMessage({
            text: input,
            files: []
        });
        setInput('');
    };

    const suggestions = [
        "Explain the yield prediction",
        "What are the main risks?",
        "How can I improve soil health?",
        "What's the market outlook?",
        "Explain the weather impact"
    ];

    return (
        <div className={cn("fixed bottom-4 right-4 z-50", className)}>
            {/* Chat Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>
            )}

            {/* Chat Interface */}
            {isOpen && (
                <Card className="w-96 h-[600px] shadow-2xl border-0 bg-gradient-to-br from-white to-slate-50">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Bot className="h-5 w-5" />
                                AgriSense AI Assistant
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/20"
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI Powered
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setWebSearch(!webSearch)}
                                className={cn(
                                    "text-white hover:bg-white/20",
                                    webSearch && "bg-white/20"
                                )}
                            >
                                <Globe className="h-3 w-3 mr-1" />
                                Web Search
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={testCSRF}
                                className="text-white hover:bg-white/20"
                            >
                                Test CSRF
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex flex-col h-[520px]">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <Bot className="h-12 w-12 text-purple-500 mx-auto mb-4 animate-pulse" />
                                    <h3 className="font-semibold text-slate-700 mb-2">
                                        Ask me anything about your crop prediction!
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        I can explain your data, provide insights, and answer questions.
                                    </p>
                                    
                                    {/* Suggestions */}
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-400 font-medium">Try asking:</p>
                                        {suggestions.map((suggestion, index) => (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setInput(suggestion)}
                                                className="w-full text-left justify-start text-xs h-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
                                            >
                                                {suggestion}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((message) => (
                                <div key={message.id} className="space-y-2">
                                    {message.role === 'user' && (
                                        <div className="flex justify-end">
                                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg p-3 max-w-[80%] shadow-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="h-4 w-4" />
                                                    <span className="text-xs font-medium">You</span>
                                                </div>
                                                <p className="text-sm">{(message as any).content}</p>
                                            </div>
                                        </div>
                                    )}

                                    {message.role === 'assistant' && (
                                        <div className="flex justify-start">
                                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 max-w-[80%] shadow-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Bot className="h-4 w-4 text-purple-600" />
                                                    <span className="text-xs font-medium text-purple-700">AgriSense AI</span>
                                                    <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                                                        <Sparkles className="h-3 w-3 mr-1" />
                                                        AI
                                                    </Badge>
                                                    {webSearch && (
                                                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                                            <Globe className="h-3 w-3 mr-1" />
                                                            Web
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                {/* Enhanced Response with AI Elements */}
                                                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                                                    {(message as any).content}
                                                </div>

                                                {/* Chain of Thought Reasoning */}
                                                {(message as any).reasoning && (
                                                    <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                                            <span className="text-xs font-medium text-amber-700">AI Reasoning</span>
                                                        </div>
                                                        <p className="text-xs text-amber-700">{(message as any).reasoning}</p>
                                                    </div>
                                                )}

                                                {/* Inline Citations */}
                                                {(message as any).sources && (message as any).sources.length > 0 && (
                                                    <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            <span className="text-xs font-medium text-green-700">Sources</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {(message as any).sources.map((source: any, index: number) => (
                                                                <div key={index} className="text-xs text-green-700">
                                                                    <a 
                                                                        href={source.url} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="hover:underline"
                                                                    >
                                                                        {source.title}
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Actions */}
                                                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-purple-200">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigator.clipboard.writeText((message as any).content)}
                                                        className="h-6 px-2 text-xs text-purple-600 hover:bg-purple-100"
                                                    >
                                                        <Copy className="h-3 w-3 mr-1" />
                                                        Copy
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => regenerate()}
                                                        className="h-6 px-2 text-xs text-purple-600 hover:bg-purple-100"
                                                    >
                                                        <RefreshCw className="h-3 w-3 mr-1" />
                                                        Regenerate
                                                    </Button>
                                                    {(message as any).reasoning && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setShowReasoning(!showReasoning)}
                                                            className="h-6 px-2 text-xs text-amber-600 hover:bg-amber-100"
                                                        >
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            {showReasoning ? 'Hide' : 'Show'} Reasoning
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {status === 'submitted' && (
                                <div className="flex justify-start">
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 max-w-[80%]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Bot className="h-4 w-4 text-purple-600 animate-pulse" />
                                            <span className="text-xs font-medium text-purple-700">AgriSense AI</span>
                                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                                                <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                                                Thinking...
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex space-x-1">
                                                <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce"></div>
                                                <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            </div>
                                            <span className="text-xs text-purple-600">Analyzing your data...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Suggestions */}
                        {messages.length > 0 && (messages[messages.length - 1] as any)?.suggestions && (
                            <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-700">Suggested Questions</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(messages[messages.length - 1] as any).suggestions.map((suggestion: string, index: number) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setInput(suggestion)}
                                            className="text-xs h-7 bg-white border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300"
                                        >
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Form */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about your crop prediction..."
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    disabled={status === 'submitted'}
                                />
                                <Button
                                    type="submit"
                                    disabled={!input.trim() || status === 'submitted' || !csrfToken}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
