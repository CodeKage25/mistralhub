'use client';

import { Conversation } from '@/types';
import {
    MessageSquare,
    Plus,
    Trash2,
    Settings,
    Github,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
    conversations: Conversation[];
    currentConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onNewConversation: () => void;
    onDeleteConversation: (id: string) => void;
}

export default function Sidebar({
    conversations,
    currentConversationId,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
}: SidebarProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const SidebarContent = () => (
        <>
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
                        <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg gradient-text">MistralHub</h1>
                        <p className="text-xs text-[var(--foreground-muted)]">
                            Multi-Modal AI Assistant
                        </p>
                    </div>
                </div>
            </div>

            {/* New chat button */}
            <div className="p-3">
                <button
                    onClick={() => {
                        onNewConversation();
                        setIsMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition-colors btn-hover glow-primary"
                >
                    <Plus size={18} />
                    <span>New Chat</span>
                </button>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto px-3 pb-3">
                {conversations.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare
                            size={40}
                            className="mx-auto text-[var(--foreground-muted)] opacity-50 mb-2"
                        />
                        <p className="text-sm text-[var(--foreground-muted)]">
                            No conversations yet
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)] opacity-50 mt-1">
                            Start a new chat to begin
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {conversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                className={`group relative rounded-xl cursor-pointer sidebar-item ${currentConversationId === conversation.id ? 'active' : ''
                                    }`}
                            >
                                <button
                                    onClick={() => {
                                        onSelectConversation(conversation.id);
                                        setIsMobileOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-3 pr-10"
                                >
                                    <div className="flex items-center gap-2">
                                        <MessageSquare
                                            size={14}
                                            className="text-[var(--foreground-muted)] flex-shrink-0"
                                        />
                                        <span className="text-sm text-[var(--foreground)] truncate">
                                            {conversation.title}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--foreground-muted)] mt-1 ml-5">
                                        {formatDate(conversation.updatedAt)}
                                    </p>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteConversation(conversation.id);
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--error)]/20 text-[var(--foreground-muted)] hover:text-[var(--error)] transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[var(--border)]">
                <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors text-sm"
                >
                    <Github size={16} />
                    <span>View on GitHub</span>
                </a>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] md:hidden"
            >
                <Menu size={20} />
            </button>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex md:w-72 h-full bg-[var(--background-secondary)] border-r border-[var(--border)] flex-col">
                <SidebarContent />
            </aside>

            {/* Sidebar - Mobile */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-[var(--background-secondary)] border-r border-[var(--border)] flex flex-col transform transition-transform md:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                >
                    <X size={20} />
                </button>
                <SidebarContent />
            </aside>
        </>
    );
}
