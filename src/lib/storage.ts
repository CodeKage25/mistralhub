import { Conversation, STORAGE_KEYS } from '@/types';

// Check if we're in browser
const isBrowser = typeof window !== 'undefined';

// Get all conversations
export function getConversations(): Conversation[] {
    if (!isBrowser) return [];

    try {
        const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// Save conversations
export function saveConversations(conversations: Conversation[]): void {
    if (!isBrowser) return;

    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
}

// Get single conversation
export function getConversation(id: string): Conversation | null {
    const conversations = getConversations();
    return conversations.find(c => c.id === id) || null;
}

// Save single conversation
export function saveConversation(conversation: Conversation): void {
    const conversations = getConversations();
    const index = conversations.findIndex(c => c.id === conversation.id);

    if (index >= 0) {
        conversations[index] = conversation;
    } else {
        conversations.unshift(conversation);
    }

    saveConversations(conversations);
}

// Delete conversation
export function deleteConversation(id: string): void {
    const conversations = getConversations();
    const filtered = conversations.filter(c => c.id !== id);
    saveConversations(filtered);
}

// Get current conversation ID
export function getCurrentConversationId(): string | null {
    if (!isBrowser) return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION);
}

// Set current conversation ID
export function setCurrentConversationId(id: string | null): void {
    if (!isBrowser) return;

    if (id) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, id);
    } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION);
    }
}

// Generate unique ID
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create new conversation
export function createConversation(model: Conversation['model']): Conversation {
    const id = generateId();
    const now = Date.now();

    return {
        id,
        title: 'New Chat',
        messages: [],
        model,
        createdAt: now,
        updatedAt: now,
    };
}

// Generate title from first message
export function generateTitle(content: string): string {
    const cleaned = content.replace(/[#*`\n]/g, ' ').trim();
    const words = cleaned.split(/\s+/).slice(0, 6);
    const title = words.join(' ');
    return title.length > 40 ? title.substring(0, 40) + '...' : title;
}
