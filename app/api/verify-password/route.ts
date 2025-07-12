import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { password, contentPassword } = await request.json();

        // Check against environment variables for global passwords
        const globalPasswords = process.env.CONTENT_PASSWORDS?.split(',') || [];

        // Verify password
        const isValid = password === contentPassword || globalPasswords.includes(password);

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