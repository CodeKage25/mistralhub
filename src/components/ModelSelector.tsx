'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Cpu, Eye, Code, Zap } from 'lucide-react';
import { ModelInfo } from '@/types';

interface ModelSelectorProps {
    selectedModel: ModelInfo;
    onModelChange: (model: ModelInfo) => void;
    models: ModelInfo[];
}

export default function ModelSelector({
    selectedModel,
    onModelChange,
    models,
}: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getModelIcon = (modelId: string) => {
        if (modelId.includes('pixtral')) return <Eye size={16} />;
        if (modelId.includes('codestral')) return <Code size={16} />;
        if (modelId.includes('small')) return <Zap size={16} />;
        return <Cpu size={16} />;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--border-accent)] transition-colors min-w-[160px]"
            >
                <span className="text-[var(--primary)]">
                    {getModelIcon(selectedModel.id)}
                </span>
                <span className="text-sm text-[var(--foreground)] truncate flex-1 text-left">
                    {selectedModel.name}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-[var(--foreground-muted)] transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-xl overflow-hidden z-50">
                    <div className="p-2">
                        <div className="text-xs text-[var(--foreground-muted)] px-2 py-1 mb-1">
                            Select Model
                        </div>
                        {models.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onModelChange(model);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${selectedModel.id === model.id
                                        ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30'
                                        : 'hover:bg-[var(--background-tertiary)]'
                                    }`}
                            >
                                <span
                                    className={`mt-0.5 ${selectedModel.id === model.id
                                            ? 'text-[var(--primary)]'
                                            : 'text-[var(--foreground-muted)]'
                                        }`}
                                >
                                    {getModelIcon(model.id)}
                                </span>
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-sm font-medium ${selectedModel.id === model.id
                                                    ? 'text-[var(--primary)]'
                                                    : 'text-[var(--foreground)]'
                                                }`}
                                        >
                                            {model.name}
                                        </span>
                                        {model.supportsVision && (
                                            <span className="px-1.5 py-0.5 text-[10px] bg-[var(--accent)]/20 text-[var(--accent)] rounded">
                                                Vision
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                                        {model.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
