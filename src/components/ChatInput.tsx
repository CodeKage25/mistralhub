'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, X, Image, FileText, ChevronUp } from 'lucide-react';
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
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    };

    return (
        <div className="border-t border-[var(--border)] bg-[var(--background-secondary)] p-3 sm:p-4">
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
                                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2">
                                    <FileText size={14} className="text-[var(--primary)]" />
                                    <span className="text-xs text-[var(--foreground-muted)] max-w-[60px] sm:max-w-[100px] truncate">
                                        {attachment.name}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--error)] text-white flex items-center justify-center"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Model picker (mobile) */}
            {showModelPicker && (
                <div className="mb-3 p-2 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {MODELS.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onModelChange(model);
                                    setShowModelPicker(false);
                                }}
                                className={`p-2 rounded-lg text-left transition-colors ${selectedModel.id === model.id
                                        ? 'bg-[var(--primary)]/20 border border-[var(--primary)]/50'
                                        : 'bg-[var(--background-secondary)] hover:bg-[var(--border)]'
                                    }`}
                            >
                                <span className="text-xs font-medium text-[var(--foreground)] block truncate">
                                    {model.name}
                                </span>
                                {model.supportsVision && (
                                    <span className="text-[10px] text-[var(--accent)]">Vision</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main input row */}
            <div className="flex items-end gap-2">
                {/* Model selector button (compact) */}
                <button
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    className="flex-shrink-0 p-2.5 sm:p-3 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    title={selectedModel.name}
                >
                    <ChevronUp
                        size={18}
                        className={`transition-transform ${showModelPicker ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* File upload button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 p-2.5 sm:p-3 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    title="Attach file"
                >
                    <Paperclip size={18} />
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
                        placeholder="Message..."
                        rows={1}
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] resize-none focus-ring transition-colors text-sm sm:text-base"
                        style={{ minHeight: '44px', maxHeight: '150px' }}
                    />
                </div>

                {/* Send button */}
                <button
                    onClick={handleSubmit}
                    disabled={(!input.trim() && attachments.length === 0) || isLoading}
                    className={`flex-shrink-0 p-2.5 sm:p-3 rounded-xl transition-all ${(!input.trim() && attachments.length === 0) || isLoading
                            ? 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] cursor-not-allowed'
                            : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                        }`}
                >
                    <Send size={18} />
                </button>
            </div>

            {/* Current model indicator */}
            <div className="mt-2 flex items-center justify-center">
                <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                    Using {selectedModel.name}
                </span>
            </div>
        </div>
    );
}
