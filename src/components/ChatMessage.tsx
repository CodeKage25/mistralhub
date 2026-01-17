'use client';

import { Message } from '@/types';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    return (
        <div
            className={`message-animate flex gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-xl ${isUser
                    ? 'bg-[var(--background-secondary)]'
                    : 'bg-transparent'
                }`}
        >
            {/* Avatar */}
            <div
                className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${isUser
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white'
                    }`}
            >
                {isUser ? (
                    <User size={16} className="sm:hidden" />
                ) : (
                    <Bot size={16} className="sm:hidden" />
                )}
                {isUser ? (
                    <User size={18} className="hidden sm:block" />
                ) : (
                    <Bot size={18} className="hidden sm:block" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                        {isUser ? 'You' : 'Mistral'}
                    </span>
                    <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                        {formatTime(message.timestamp)}
                    </span>
                </div>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {message.attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="relative rounded-lg overflow-hidden border border-[var(--border)]"
                            >
                                {attachment.type === 'image' ? (
                                    <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="max-w-[150px] sm:max-w-[200px] max-h-[100px] sm:max-h-[150px] object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-[var(--background-tertiary)]">
                                        <span className="text-xs sm:text-sm truncate max-w-[100px]">{attachment.name}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Message content */}
                {message.isStreaming && !message.content ? (
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--primary)] typing-dot" />
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--primary)] typing-dot" />
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--primary)] typing-dot" />
                        </div>
                    </div>
                ) : (
                    <div className="markdown-content text-sm sm:text-base text-[var(--foreground)] leading-relaxed break-words">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                        {message.isStreaming && (
                            <span className="inline-block w-1.5 h-3 sm:w-2 sm:h-4 bg-[var(--primary)] animate-pulse ml-1" />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
