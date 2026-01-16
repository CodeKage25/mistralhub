import { getMistralClient } from '@/lib/mistral';

export async function POST(request: Request) {
    try {
        const { image, prompt, model } = await request.json() as {
            image: string; // base64 encoded image
            prompt: string;
            model?: string;
        };

        if (!image) {
            return Response.json(
                { error: 'Missing required field: image' },
                { status: 400 }
            );
        }

        const client = getMistralClient();

        // Use Pixtral for vision tasks
        const visionModel = model || 'pixtral-large-latest';

        const response = await client.chat.complete({
            model: visionModel,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt || 'Describe this image in detail. What do you see?',
                        },
                        {
                            type: 'image_url',
                            imageUrl: `data:image/jpeg;base64,${image}`,
                        },
                    ],
                },
            ],
        });

        const content = response.choices?.[0]?.message?.content;

        if (!content) {
            return Response.json(
                { error: 'No response from vision model' },
                { status: 500 }
            );
        }

        return Response.json({ content });
    } catch (error) {
        console.error('Vision API error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return Response.json({ error: message }, { status: 500 });
    }
}
