import { getMistralClient } from '@/lib/mistral';
import { MistralModel } from '@/types';

export async function POST(request: Request) {
    try {
        const { messages, model } = await request.json() as {
            messages: { role: string; content: string }[];
            model: MistralModel;
        };

        if (!messages || !model) {
            return Response.json(
                { error: 'Missing required fields: messages, model' },
                { status: 400 }
            );
        }

        const client = getMistralClient();

        // Create streaming response
        const stream = await client.chat.stream({
            model,
            messages: messages.map(m => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content as string,
            })),
        });

        // Create a ReadableStream for SSE
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.data.choices[0]?.delta?.content;
                        if (content) {
                            // Send as SSE format
                            const data = JSON.stringify({ content });
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        }
                    }
                    // Send done signal
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Stream error';
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
                    );
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Chat API error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return Response.json({ error: message }, { status: 500 });
    }
}
