// Message types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  isStreaming?: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document';
  name: string;
  url: string;
  mimeType: string;
  base64?: string;
}

// Conversation types
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: MistralModel;
  createdAt: number;
  updatedAt: number;
}

// Available Mistral models
export type MistralModel = 
  | 'mistral-large-latest'
  | 'mistral-medium-latest'
  | 'mistral-small-latest'
  | 'pixtral-large-latest'
  | 'codestral-latest';

export interface ModelInfo {
  id: MistralModel;
  name: string;
  description: string;
  supportsVision: boolean;
  supportsDocuments: boolean;
}

export const MODELS: ModelInfo[] = [
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    description: 'Most capable model for complex reasoning',
    supportsVision: false,
    supportsDocuments: true,
  },
  {
    id: 'mistral-medium-latest',
    name: 'Mistral Medium',
    description: 'Balanced performance and speed',
    supportsVision: false,
    supportsDocuments: true,
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small',
    description: 'Fast responses for simpler tasks',
    supportsVision: false,
    supportsDocuments: false,
  },
  {
    id: 'pixtral-large-latest',
    name: 'Pixtral Large',
    description: 'Vision-enabled for image analysis',
    supportsVision: true,
    supportsDocuments: true,
  },
  {
    id: 'codestral-latest',
    name: 'Codestral',
    description: 'Specialized for code generation',
    supportsVision: false,
    supportsDocuments: false,
  },
];

// API request/response types
export interface ChatRequest {
  messages: { role: string; content: string | ContentPart[] }[];
  model: MistralModel;
  stream?: boolean;
}

export interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

// Storage keys
export const STORAGE_KEYS = {
  CONVERSATIONS: 'mistralhub_conversations',
  CURRENT_CONVERSATION: 'mistralhub_current_conversation',
  SETTINGS: 'mistralhub_settings',
} as const;
