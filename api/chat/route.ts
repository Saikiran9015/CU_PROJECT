import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // Parse the request body
        const body = await req.json();
        const { userId, message } = body;

        // Safety Check: In Next.js App Router, 'req' is a standard Request object.
        // If you are using a middleware or wrapper that adds 'user', ensure it exists.
        // The previous crash was likely here: 'if (userId !== req.user.id)' where req.user was undefined.

        // @ts-ignore - Assuming req might have been modified by a custom wrapper/middleware
        const user = (req as any).user;

        // Fix: Explicitly check for user existence before accessing id
        if (!user || !user.id || userId !== user.id) {
            console.warn("Unauthorized access attempt for userId:", userId);
            return NextResponse.json(
                { error: 'Unauthorized' }, { status: 401 }
            );
        }

        // Chat/Bot Logic
        // This is where you'd integrate with your AI provider (e.g., OpenAI, Gemini)
        const botResponse = `I received your message: "${message}". How can I help you today?`;

        return NextResponse.json({
            success: true,
            response: botResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: 'Internal Server Error' }, { status: 500 }
        );
    }
}
