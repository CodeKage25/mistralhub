'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, X, Image, FileText } from 'lucide-react';
import { Attachment, ModelInfo, MODELS } from '@/types';
import { fileToBase64, isImageFile, isDocumentFile, formatFileSize } from '@/lib/mistral';
import { generateId } from '@/lib/storage';
import ModelSelector from './ModelSelector';

interface ChatInputProps {
    onSend: (content: string, attachments: Attachment[]) => void;
    selectedModel: ModelInfo;
    onModelChange: (model: ModelInfo) => void;
    isLoading: boolean;
}

export default function ChatInput({
    onSend,
    selectedModel,
    onModelChange,
    isLoading,
}: ChatInputProps) {
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = () => {
        if ((!input.trim() && attachments.length === 0) || isLoading) return;

        onSend(input.trim(), attachments);
        setInput('');
        setAttachments([]);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
            if (file.size > 10 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Max size is 10MB.`);
                continue;
            }

            const isImage = isImageFile(file.type);
            const isDocument = isDocumentFile(file.type);

            if (!isImage && !isDocument) {
                alert(`File type ${file.type} is not supported.`);
                continue;
            }

            const base64 = await fileToBase64(file);
            const url = URL.createObjectURL(file);

            const attachment: Attachment = {
                id: generateId(),
                type: isImage ? 'image' : 'document',
                name: file.name,
                url,
                mimeType: file.type,
                base64,
            };

            setAttachments((prev) => [...prev, attachment]);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments((prev) => {
            const attachment = prev.find((a) => a.id === id);
            if (attachment) {
                URL.revokeObjectURL(attachment.url);
            }
            return prev.filter((a) => a.id !== id);
        });
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);

        // Auto-resize textarea
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    };

    return (
        <div className="border-t border-[var(--border)] bg-[var(--background-secondary)] p-4">
            {/* Attachments preview */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="relative group rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--background-tertiary)]"
                        >
                            {attachment.type === 'image' ? (
                                <div className="relative">
                                    <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="w-20 h-20 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Image size={20} className="text-white" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-2">
                                    <FileText size={16} className="text-[var(--primary)]" />
                                    <span className="text-xs text-[var(--foreground-muted)] max-w-[100px] truncate">
                                        {attachment.name}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--error)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-3">
                {/* Model selector */}
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                    models={MODELS}
                />

                {/* File upload button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 p-3 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors btn-hover"
                    title="Attach file"
                >
                    <Paperclip size={20} />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    multiple
                    onChange={handleFileSelect}
                />

                {/* Text input */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask MistralHub anything..."
                        rows={1}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] resize-none focus-ring transition-colors"
                        style={{ minHeight: '48px', maxHeight: '200px' }}
                    />
                </div>

                {/* Send button */}
                <button
                    onClick={handleSubmit}
                    disabled={(!input.trim() && attachments.length === 0) || isLoading}
                    className={`flex-shrink-0 p-3 rounded-xl transition-all btn-hover ${(!input.trim() && attachments.length === 0) || isLoading
                            ? 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] cursor-not-allowed'
                            : 'bg-[var(--primary)] text-white glow-primary hover:bg-[var(--primary-hover)]'
                        }`}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
}
