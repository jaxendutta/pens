import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getContent } from '@/lib/content-server';
import { ContentType } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const { password, contentSlug, type } = await request.json();

        console.log('Password verification request:', { contentSlug, type, hasPassword: !!password });

        if (!password || !contentSlug || !type) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get the content
        const content = await getContent(type as ContentType, contentSlug);

        if (!content) {
            return NextResponse.json(
                { success: false, message: 'Content not found' },
                { status: 404 }
            );
        }

        // Get global passwords from environment - with better parsing
        const envPasswords = process.env.CONTENT_PASSWORDS;
        console.log('Environment CONTENT_PASSWORDS:', envPasswords ? 'Found' : 'Not found');

        const globalPasswords = envPasswords
            ? envPasswords.split(',').map(p => p.trim()).filter(p => p.length > 0)
            : [];

        console.log('Global passwords count:', globalPasswords.length);

        // Check against content-specific password
        let isValid = false;

        if (content.password) {
            console.log('Checking against content password');
            // Try both plain text and bcrypt comparison for content password
            if (content.password.startsWith('$2')) {
                // It's a bcrypt hash
                isValid = await bcrypt.compare(password, content.password);
            } else {
                // Plain text comparison
                isValid = password === content.password;
            }
        }

        // If not valid yet, check against global passwords
        if (!isValid && globalPasswords.length > 0) {
            console.log('Checking against global passwords');
            for (const globalPassword of globalPasswords) {
                if (globalPassword.startsWith('$2')) {
                    // It's a bcrypt hash
                    if (await bcrypt.compare(password, globalPassword)) {
                        isValid = true;
                        break;
                    }
                } else {
                    // Plain text comparison
                    if (password === globalPassword) {
                        isValid = true;
                        break;
                    }
                }
            }
        }

        console.log('Password verification result:', isValid);

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