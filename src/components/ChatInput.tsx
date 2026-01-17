'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Paperclip, X, FileText, ChevronDown } from 'lucide-react';
import { Attachment, ModelInfo, MODELS } from '@/types';
import { fileToBase64, isImageFile, isDocumentFile } from '@/lib/mistral';
import { generateId } from '@/lib/storage';

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
    const [showModelPicker, setShowModelPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const modelPickerRef = useRef<HTMLDivElement>(null);

    // Close model picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
                setShowModelPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = () => {
        if ((!input.trim() && attachments.length === 0) || isLoading) return;
        onSend(input.trim(), attachments);
        setInput('');
        setAttachments([]);
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
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    };

    return (
        <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--background-secondary)]">
            {/* Model picker dropdown - appears above input */}
            {showModelPicker && (
                <div
                    ref={modelPickerRef}
                    className="border-b border-[var(--border)] bg-[var(--background-tertiary)] p-3"
                >
                    <p className="text-xs text-[var(--foreground-muted)] mb-2">Select Model</p>
                    <div className="grid grid-cols-1 gap-2">
                        {MODELS.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onModelChange(model);
                                    setShowModelPicker(false);
                                }}
                                className={`w-full p-3 rounded-lg text-left transition-colors flex items-center justify-between ${selectedModel.id === model.id
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'bg-[var(--background-secondary)] hover:bg-[var(--border)] text-[var(--foreground)]'
                                    }`}
                            >
                                <div>
                                    <span className="text-sm font-medium block">
                                        {model.name}
                                    </span>
                                    <span className={`text-xs ${selectedModel.id === model.id ? 'text-white/70' : 'text-[var(--foreground-muted)]'}`}>
                                        {model.description}
                                    </span>
                                </div>
                                {model.supportsVision && (
                                    <span className={`text-xs px-2 py-1 rounded ${selectedModel.id === model.id
                                            ? 'bg-white/20 text-white'
                                            : 'bg-[var(--accent)]/20 text-[var(--accent)]'
                                        }`}>
                                        Vision
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Attachments preview */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border-b border-[var(--border)]">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--background-tertiary)]"
                        >
                            {attachment.type === 'image' ? (
                                <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="w-16 h-16 object-cover"
                                />
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-2">
                                    <FileText size={14} className="text-[var(--primary)]" />
                                    <span className="text-xs text-[var(--foreground-muted)] truncate max-w-[80px]">
                                        {attachment.name}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="absolute top-0 right-0 w-5 h-5 rounded-bl-lg bg-[var(--error)] text-white flex items-center justify-center"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Main input area */}
            <div className="p-3">
                {/* Model selector - large and tappable */}
                <button
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    className="w-full mb-3 p-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[var(--primary)]/20 flex items-center justify-center">
                            <span className="text-[var(--primary)] text-sm font-bold">M</span>
                        </div>
                        <div className="text-left">
                            <span className="text-sm font-medium text-[var(--foreground)] block">
                                {selectedModel.name}
                            </span>
                            <span className="text-xs text-[var(--foreground-muted)]">
                                Tap to change model
                            </span>
                        </div>
                    </div>
                    <ChevronDown
                        size={20}
                        className={`text-[var(--foreground-muted)] transition-transform ${showModelPicker ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Input row */}
                <div className="flex items-end gap-2">
                    {/* File upload button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 w-11 h-11 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
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
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 px-4 py-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] resize-none focus-ring transition-colors text-base"
                        style={{ minHeight: '44px', maxHeight: '100px' }}
                    />

                    {/* Send button */}
                    <button
                        onClick={handleSubmit}
                        disabled={(!input.trim() && attachments.length === 0) || isLoading}
                        className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-all ${(!input.trim() && attachments.length === 0) || isLoading
                                ? 'bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground-muted)]'
                                : 'bg-[var(--primary)] text-white'
                            }`}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
