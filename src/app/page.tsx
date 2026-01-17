'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Conversation, ModelInfo, MODELS, Attachment } from '@/types';
import {
  getConversations,
  saveConversation,
  deleteConversation as deleteConversationFromStorage,
  getCurrentConversationId,
  setCurrentConversationId,
  createConversation,
  generateId,
  generateTitle,
} from '@/lib/storage';
import Sidebar from '@/components/Sidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { Sparkles, Zap, Image, FileText, MessageSquare } from 'lucide-react';

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelInfo>(MODELS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations from storage
  useEffect(() => {
    const loadedConversations = getConversations();
    setConversations(loadedConversations);

    const currentId = getCurrentConversationId();
    if (currentId) {
      const current = loadedConversations.find((c) => c.id === currentId);
      if (current) {
        setCurrentConversation(current);
        const model = MODELS.find((m) => m.id === current.model);
        if (model) setSelectedModel(model);
      }
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleNewConversation = useCallback(() => {
    const newConversation = createConversation(selectedModel.id);
    setCurrentConversation(newConversation);
    setCurrentConversationId(newConversation.id);
    setConversations((prev) => [newConversation, ...prev]);
    saveConversation(newConversation);
  }, [selectedModel.id]);

  const handleSelectConversation = useCallback((id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (conversation) {
      setCurrentConversation(conversation);
      setCurrentConversationId(id);
      const model = MODELS.find((m) => m.id === conversation.model);
      if (model) setSelectedModel(model);
    }
  }, [conversations]);

  const handleDeleteConversation = useCallback((id: string) => {
    deleteConversationFromStorage(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));

    if (currentConversation?.id === id) {
      setCurrentConversation(null);
      setCurrentConversationId(null);
    }
  }, [currentConversation?.id]);

  const handleModelChange = useCallback((model: ModelInfo) => {
    setSelectedModel(model);
    if (currentConversation) {
      const updated = { ...currentConversation, model: model.id };
      setCurrentConversation(updated);
      saveConversation(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    }
  }, [currentConversation]);

  const handleSendMessage = useCallback(async (content: string, attachments: Attachment[]) => {
    // Create conversation if needed
    let conversation = currentConversation;
    if (!conversation) {
      conversation = createConversation(selectedModel.id);
      setCurrentConversation(conversation);
      setCurrentConversationId(conversation.id);
      setConversations((prev) => [conversation!, ...prev]);
    }

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Update conversation with new messages
    const updatedConversation: Conversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage, assistantMessage],
      updatedAt: Date.now(),
      title:
        conversation.messages.length === 0
          ? generateTitle(content)
          : conversation.title,
    };

    setCurrentConversation(updatedConversation);
    saveConversation(updatedConversation);
    setConversations((prev) =>
      prev.map((c) => (c.id === updatedConversation.id ? updatedConversation : c))
    );
    setIsLoading(true);

    try {
      // Handle image attachments with vision API
      if (attachments.some((a) => a.type === 'image')) {
        const imageAttachment = attachments.find((a) => a.type === 'image');
        if (imageAttachment?.base64) {
          const response = await fetch('/api/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: imageAttachment.base64,
              prompt: content || 'Describe this image in detail.',
              model: selectedModel.supportsVision ? selectedModel.id : 'pixtral-large-latest',
            }),
          });

          const data = await response.json();

          if (data.error) throw new Error(data.error);

          const finalConversation: Conversation = {
            ...updatedConversation,
            messages: updatedConversation.messages.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: data.content, isStreaming: false }
                : m
            ),
          };

          setCurrentConversation(finalConversation);
          saveConversation(finalConversation);
          setConversations((prev) =>
            prev.map((c) => (c.id === finalConversation.id ? finalConversation : c))
          );
          setIsLoading(false);
          return;
        }
      }

      // Handle document attachments
      if (attachments.some((a) => a.type === 'document')) {
        const docAttachment = attachments.find((a) => a.type === 'document');
        if (docAttachment?.base64) {
          const response = await fetch('/api/document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              document: docAttachment.base64,
              prompt: content,
              model: selectedModel.id,
            }),
          });

          const data = await response.json();

          if (data.error) throw new Error(data.error);

          const responseContent = data.answer || data.extractedText;

          const finalConversation: Conversation = {
            ...updatedConversation,
            messages: updatedConversation.messages.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: responseContent, isStreaming: false }
                : m
            ),
          };

          setCurrentConversation(finalConversation);
          saveConversation(finalConversation);
          setConversations((prev) =>
            prev.map((c) => (c.id === finalConversation.id ? finalConversation : c))
          );
          setIsLoading(false);
          return;
        }
      }

      // Regular chat with streaming
      const messages = updatedConversation.messages
        .filter((m) => m.id !== assistantMessage.id)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: selectedModel.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;

                  // Update message in real-time
                  setCurrentConversation((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      messages: prev.messages.map((m) =>
                        m.id === assistantMessage.id
                          ? { ...m, content: fullContent }
                          : m
                      ),
                    };
                  });
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }

      // Finalize the message
      const finalConversation: Conversation = {
        ...updatedConversation,
        messages: updatedConversation.messages.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: fullContent, isStreaming: false }
            : m
        ),
      };

      setCurrentConversation(finalConversation);
      saveConversation(finalConversation);
      setConversations((prev) =>
        prev.map((c) => (c.id === finalConversation.id ? finalConversation : c))
      );
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';

      const errorConversation: Conversation = {
        ...updatedConversation,
        messages: updatedConversation.messages.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: `Error: ${errorMessage}`, isStreaming: false }
            : m
        ),
      };

      setCurrentConversation(errorConversation);
      saveConversation(errorConversation);
      setConversations((prev) =>
        prev.map((c) => (c.id === errorConversation.id ? errorConversation : c))
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, selectedModel]);

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversation?.id || null}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 ml-10 md:ml-0">
            <h2 className="font-semibold text-sm sm:text-base text-[var(--foreground)] truncate max-w-[180px] sm:max-w-none">
              {currentConversation?.title || 'New Chat'}
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
            <span className="px-2 py-1 rounded-md bg-[var(--background-tertiary)]">
              {selectedModel.name}
            </span>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
          {!currentConversation || currentConversation.messages.length === 0 ? (
            // Welcome screen
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-2">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mb-4 sm:mb-6 glow-accent">
                <Sparkles size={28} className="text-white sm:hidden" />
                <Sparkles size={40} className="text-white hidden sm:block" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold gradient-text mb-2">
                Welcome to MistralHub
              </h2>
              <p className="text-sm sm:text-base text-[var(--foreground-muted)] mb-6 sm:mb-8 max-w-md px-4">
                Your AI assistant powered by Mistral AI
              </p>

              {/* Feature cards - horizontal on mobile */}
              <div className="flex gap-3 sm:gap-4 w-full max-w-lg justify-center">
                <div className="glass-card p-3 sm:p-4 text-center flex-1 max-w-[120px] sm:max-w-none">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                    <MessageSquare size={16} className="text-[var(--primary)] sm:hidden" />
                    <MessageSquare size={20} className="text-[var(--primary)] hidden sm:block" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                    Chat
                  </h3>
                </div>

                <div className="glass-card p-3 sm:p-4 text-center flex-1 max-w-[120px] sm:max-w-none">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                    <Image size={16} className="text-[var(--accent)] sm:hidden" />
                    <Image size={20} className="text-[var(--accent)] hidden sm:block" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                    Vision
                  </h3>
                </div>

                <div className="glass-card p-3 sm:p-4 text-center flex-1 max-w-[120px] sm:max-w-none">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                    <FileText size={16} className="text-[var(--success)] sm:hidden" />
                    <FileText size={20} className="text-[var(--success)] hidden sm:block" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                    Docs
                  </h3>
                </div>
              </div>

              {/* Example prompts */}
              <div className="mt-6 sm:mt-8 w-full max-w-lg px-2">
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mb-2 sm:mb-3">
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                  {[
                    'Explain AI',
                    'Write code',
                    'What is Mistral?',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt, [])}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-[var(--background-tertiary)] text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Messages list
            <div className="max-w-3xl mx-auto space-y-4">
              {currentConversation.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat input */}
        <ChatInput
          onSend={handleSendMessage}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}
