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
        }
    } as any);


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
                    className="group h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 hover:scale-110 hover:rotate-3"
                >
                    <MessageCircle className="h-7 w-7 text-white group-hover:animate-pulse" />
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse"></div>
                </Button>
            )}

            {/* Chat Interface */}
            {isOpen && (
                <Card className="w-[420px] h-[700px] shadow-2xl border-0 bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 backdrop-blur-xl">
                    <CardHeader className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-t-xl relative overflow-hidden">
                        {/* Animated background pattern */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 animate-pulse"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Bot className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold">AgriSense AI</CardTitle>
                                        <p className="text-sm text-emerald-100">Your farming assistant</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
                                    className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                                    <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                                    AI Powered
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setWebSearch(!webSearch)}
                                    className={cn(
                                        "text-white hover:bg-white/20 rounded-full transition-all",
                                        webSearch && "bg-white/20"
                                    )}
                                >
                                    <Globe className="h-4 w-4 mr-1" />
                                    {webSearch ? 'Web On' : 'Web Off'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex flex-col h-[620px]">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {messages.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="relative mb-8">
                                        <div className="h-20 w-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mx-auto flex items-center justify-center animate-pulse">
                                            <Bot className="h-10 w-10 text-white" />
                                        </div>
                                        <div className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full animate-bounce"></div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-slate-800 mb-3">
                                        🌱 Welcome to AgriSense AI!
                                    </h3>
                                    <p className="text-slate-600 mb-6 leading-relaxed">
                                        I'm here to help you understand your crop predictions, 
                                        provide farming insights, and answer any questions about your fields.
                                    </p>
                                    
                                    {/* Enhanced Suggestions */}
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-emerald-500" />
                                            Try asking me:
                                        </p>
                                        <div className="grid gap-2">
                                            {suggestions.map((suggestion, index) => (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setInput(suggestion)}
                                                    className="w-full text-left justify-start text-sm h-10 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 transition-all duration-200"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 bg-emerald-400 rounded-full"></div>
                                                        {suggestion}
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {messages.map((message) => (
                                <div key={message.id} className="space-y-4">
                                    {message.role === 'user' && (
                                        <div className="flex justify-end">
                                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl rounded-br-md p-4 max-w-[85%] shadow-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center">
                                                        <User className="h-3 w-3" />
                                                    </div>
                                                    <span className="text-xs font-semibold">You</span>
                                                </div>
                                                <p className="text-sm leading-relaxed">{(message as any).content}</p>
                                            </div>
                                        </div>
                                    )}

                                    {message.role === 'assistant' && (
                                        <div className="flex justify-start">
                                            <div className="bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-200/50 rounded-2xl rounded-bl-md p-5 max-w-[90%] shadow-lg backdrop-blur-sm">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="h-8 w-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                                                        <Bot className="h-4 w-4 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold text-emerald-800">AgriSense AI</span>
                                                            <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0">
                                                                <Sparkles className="h-3 w-3 mr-1" />
                                                                AI
                                                            </Badge>
                                                            {webSearch && (
                                                                <Badge className="text-xs bg-blue-100 text-blue-700 border-0">
                                                                    <Globe className="h-3 w-3 mr-1" />
                                                                    Web
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Enhanced Response with AI Elements */}
                                                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                    {(message as any).content}
                                                </div>

                                                {/* Chain of Thought Reasoning */}
                                                {(message as any).reasoning && (
                                                    <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="h-6 w-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                                                                <AlertTriangle className="h-3 w-3 text-white" />
                                                            </div>
                                                            <span className="text-sm font-semibold text-amber-800">AI Reasoning</span>
                                                        </div>
                                                        <p className="text-sm text-amber-700 leading-relaxed">{(message as any).reasoning}</p>
                                                    </div>
                                                )}

                                                {/* Inline Citations */}
                                                {(message as any).sources && (message as any).sources.length > 0 && (
                                                    <div className="mt-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-xl">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="h-6 w-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                                                                <CheckCircle2 className="h-3 w-3 text-white" />
                                                            </div>
                                                            <span className="text-sm font-semibold text-emerald-800">Sources</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(message as any).sources.map((source: any, index: number) => (
                                                                <div key={index} className="flex items-center gap-2 p-2 bg-white/50 rounded-lg">
                                                                    <div className="h-2 w-2 bg-emerald-400 rounded-full"></div>
                                                                    <a 
                                                                        href={source.url} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="text-sm text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
                                                                    >
                                                                        {source.title}
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Actions */}
                                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-emerald-200/50">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigator.clipboard.writeText((message as any).content)}
                                                        className="h-8 px-3 text-xs text-emerald-600 hover:bg-emerald-100 rounded-full transition-all"
                                                    >
                                                        <Copy className="h-3 w-3 mr-1" />
                                                        Copy
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => regenerate()}
                                                        className="h-8 px-3 text-xs text-emerald-600 hover:bg-emerald-100 rounded-full transition-all"
                                                    >
                                                        <RefreshCw className="h-3 w-3 mr-1" />
                                                        Regenerate
                                                    </Button>
                                                    {(message as any).reasoning && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setShowReasoning(!showReasoning)}
                                                            className="h-8 px-3 text-xs text-amber-600 hover:bg-amber-100 rounded-full transition-all"
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
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-2xl rounded-bl-md p-5 max-w-[90%] shadow-lg backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-8 w-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center animate-pulse">
                                                <Bot className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-emerald-800">AgriSense AI</span>
                                                <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0">
                                                    <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                                                    Thinking...
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex space-x-1">
                                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            </div>
                                            <span className="text-sm text-emerald-600">Analyzing your crop data...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Suggestions */}
                        {messages.length > 0 && (messages[messages.length - 1] as any)?.suggestions && (
                            <div className="p-6 border-t border-emerald-200/50 bg-gradient-to-r from-emerald-50 to-teal-50">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-6 w-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                                        <Sparkles className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-800">Suggested Questions</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(messages[messages.length - 1] as any).suggestions.map((suggestion: string, index: number) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setInput(suggestion)}
                                            className="text-sm h-9 bg-white/80 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 rounded-full transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 bg-emerald-400 rounded-full"></div>
                                                {suggestion}
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Form */}
                        <form onSubmit={handleSubmit} className="p-6 border-t border-emerald-200/50 bg-gradient-to-r from-white to-emerald-50/30">
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask about your crop prediction..."
                                        className="w-full px-4 py-3 border border-emerald-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white/80 backdrop-blur-sm transition-all"
                                        disabled={status === 'submitted' || !csrfToken}
                                    />
                                    {!csrfToken && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 rounded-2xl">
                                            <span className="text-xs text-red-600 font-medium">CSRF Token Loading...</span>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={!input.trim() || status === 'submitted' || !csrfToken}
                                    className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
