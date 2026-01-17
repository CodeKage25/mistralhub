'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Paperclip, X, FileText, Cpu } from 'lucide-react';
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
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    };

    return (
        <div className="border-t border-[var(--border)] bg-[var(--background-secondary)]">
            {/* Attachments preview */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 pb-0">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--background-tertiary)]"
                        >
                            {attachment.type === 'image' ? (
                                <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="w-14 h-14 object-cover"
                                />
                            ) : (
                                <div className="flex items-center gap-1.5 px-2 py-1.5">
                                    <FileText size={12} className="text-[var(--primary)] flex-shrink-0" />
                                    <span className="text-[10px] text-[var(--foreground-muted)] truncate max-w-[50px]">
                                        {attachment.name}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--error)] text-white flex items-center justify-center"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Model picker dropdown */}
            {showModelPicker && (
                <div
                    ref={modelPickerRef}
                    className="mx-3 mt-3 p-2 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] max-h-[200px] overflow-y-auto"
                >
                    <div className="space-y-1">
                        {MODELS.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onModelChange(model);
                                    setShowModelPicker(false);
                                }}
                                className={`w-full p-2 rounded-md text-left transition-colors flex items-center gap-2 ${selectedModel.id === model.id
                                        ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                                        : 'hover:bg-[var(--background-secondary)] text-[var(--foreground)]'
                                    }`}
                            >
                                <Cpu size={14} className="flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium block truncate">
                                        {model.name}
                                    </span>
                                </div>
                                {model.supportsVision && (
                                    <span className="text-[9px] px-1 py-0.5 bg-[var(--accent)]/20 text-[var(--accent)] rounded flex-shrink-0">
                                        👁
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="p-3">
                {/* Input row with textarea */}
                <div className="flex items-end gap-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] resize-none focus-ring transition-colors text-sm"
                        style={{ minHeight: '40px', maxHeight: '120px' }}
                    />

                    {/* Send button */}
                    <button
                        onClick={handleSubmit}
                        disabled={(!input.trim() && attachments.length === 0) || isLoading}
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${(!input.trim() && attachments.length === 0) || isLoading
                                ? 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                                : 'bg-[var(--primary)] text-white'
                            }`}
                    >
                        <Send size={16} />
                    </button>
                </div>

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]">
                    {/* Left: action buttons */}
                    <div className="flex items-center gap-1">
                        {/* Model selector */}
                        <button
                            onClick={() => setShowModelPicker(!showModelPicker)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${showModelPicker
                                    ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                                    : 'text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]'
                                }`}
                        >
                            <Cpu size={12} />
                            <span className="hidden xs:inline">{selectedModel.name.split(' ')[0]}</span>
                        </button>

                        {/* File upload */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] transition-colors"
                        >
                            <Paperclip size={12} />
                            <span className="hidden xs:inline">Attach</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                            multiple
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Right: model indicator on mobile */}
                    <span className="text-[10px] text-[var(--foreground-muted)] xs:hidden">
                        {selectedModel.name}
                    </span>
                </div>
            </div>
        </div>
    );
}
