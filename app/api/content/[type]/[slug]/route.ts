import { NextRequest, NextResponse } from 'next/server';
import { getContent } from '@/lib/content-server';
import { ContentType } from '@/lib/types';

interface Params {
    type: string;
    slug: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { type, slug } = params;

        // Validate content type
        if (type !== 'pieces' && type !== 'poems') {
            return NextResponse.json(
                { error: 'Invalid content type' },
                { status: 400 }
            );
        }

        const content = await getContent(type as ContentType, slug);

        if (!content) {
            return NextResponse.json(
                { error: 'Content not found' },
                { status: 404 }
            );
        }

        // Return only password for password verification
        // Don't return full content for security
        return NextResponse.json({
            title: content.title,
            password: content.password,
            isProtected: Boolean(content.password),
        });
    } catch (error) {
        console.error('Content API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}