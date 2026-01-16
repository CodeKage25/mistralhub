import { getMistralClient } from '@/lib/mistral';

export async function POST(request: Request) {
    try {
        const { document, prompt, model } = await request.json() as {
            document: string; // base64 encoded document
            prompt: string;
            model?: string;
        };

        if (!document) {
            return Response.json(
                { error: 'Missing required field: document' },
                { status: 400 }
            );
        }

        const client = getMistralClient();

        // Use a capable model for document understanding
        const docModel = model || 'mistral-large-latest';

        // First, perform OCR using Pixtral for images/PDFs
        const ocrResponse = await client.chat.complete({
            model: 'pixtral-large-latest',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Extract all the text content from this document. Preserve the structure and formatting as much as possible.',
                        },
                        {
                            type: 'image_url',
                            imageUrl: `data:application/pdf;base64,${document}`,
                        },
                    ],
                },
            ],
        });

        const extractedText = ocrResponse.choices?.[0]?.message?.content;

        if (!extractedText) {
            return Response.json(
                { error: 'Failed to extract text from document' },
                { status: 500 }
            );
        }

        // If user provided a prompt, answer their question about the document
        if (prompt && prompt.trim()) {
            const qaResponse = await client.chat.complete({
                model: docModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant analyzing a document. Answer questions based on the document content provided.',
                    },
                    {
                        role: 'user',
                        content: `Document content:\n\n${extractedText}\n\n---\n\nQuestion: ${prompt}`,
                    },
                ],
            });

            const answer = qaResponse.choices?.[0]?.message?.content;

            return Response.json({
                extractedText,
                answer,
            });
        }

        // Just return the extracted text if no prompt
        return Response.json({
            extractedText,
            answer: null,
        });
    } catch (error) {
        console.error('Document API error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return Response.json({ error: message }, { status: 500 });
    }
}
