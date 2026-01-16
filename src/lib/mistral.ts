import { Mistral } from '@mistralai/mistralai';

// Initialize Mistral client
export function getMistralClient(): Mistral {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
        throw new Error('MISTRAL_API_KEY environment variable is not set');
    }

    return new Mistral({ apiKey });
}

// Supported image MIME types
export const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

// Supported document MIME types
export const SUPPORTED_DOCUMENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
];

// Check if file is an image
export function isImageFile(mimeType: string): boolean {
    return SUPPORTED_IMAGE_TYPES.includes(mimeType);
}

// Check if file is a document
export function isDocumentFile(mimeType: string): boolean {
    return SUPPORTED_DOCUMENT_TYPES.includes(mimeType);
}

// Convert file to base64
export async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Return just the base64 part without the data URL prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Format file size
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
