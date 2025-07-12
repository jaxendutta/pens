import { NextRequest, NextResponse } from 'next/server';
import { getContent } from '@/lib/content-server';
import { ContentType } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const { password, contentSlug, type } = await request.json();

        if (!password || !contentSlug || !type) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get content to check its password
        const content = await getContent(type as ContentType, contentSlug);

        if (!content) {
            return NextResponse.json(
                { success: false, message: 'Content not found' },
                { status: 404 }
            );
        }

        // Check against environment variables for global passwords
        const globalPasswords = process.env.CONTENT_PASSWORDS?.split(',').map(p => p.trim()) || [];

        // Verify password
        const isValid = password === content.password || globalPasswords.includes(password);

        return NextResponse.json({
            success: isValid,
            message: isValid ? 'Access granted' : 'Invalid password'
        });
    } catch (error) {
        console.error('Password verification error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}