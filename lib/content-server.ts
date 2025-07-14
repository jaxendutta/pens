// lib/content-server.ts
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { ContentItem, ContentType } from './types';

// Add this helper function
async function findImageFile(type: ContentType, slug: string): Promise<string | null> {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const publicDir = path.join(process.cwd(), 'public', type);

    // Check if the public directory exists
    try {
        await fs.access(publicDir);
    } catch {
        // Directory doesn't exist, no images available
        return null;
    }

    for (const ext of imageExtensions) {
        const imagePath = path.join(publicDir, `${slug}.${ext}`);
        try {
            await fs.access(imagePath);
            return `/${type}/${slug}.${ext}`;
        } catch {
            // File doesn't exist, try next extension
            continue;
        }
    }

    return null;
}

export async function getContent(
    type: ContentType,
    slug: string,
): Promise<ContentItem> {
    const contentDirectory = path.join(process.cwd(), 'content', type);
    const fullPath = path.join(contentDirectory, `${slug}.md`);

    try {
        const fileContents = await fs.readFile(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        // Calculate reading time (average 200 words per minute)
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);

        // Calculate chapters automatically by counting # headings (level 1)
        const chapters = countChapters(content);

        // Find existing image file
        const imagePath = await findImageFile(type, slug);

        return {
            slug,
            title: data.title || 'Untitled',
            author: data.author || 'Unknown',
            content: content, // Return raw markdown instead of processed HTML
            excerpt: data.excerpt || generateExcerpt(content),
            date: data.date || new Date().toISOString(),
            lastRevision: data.lastRevision || data.date || new Date().toISOString(),
            tags: data.tags || [],
            password: data.password || null,
            readingTime,
            wordCount,
            chapters: data.chapters || chapters,
            location: data.location || null,
            imagePath: imagePath || undefined,
            imageCredit: data.imageCredit || undefined,
            imageCreditUrl: data.imageCreditUrl || undefined,
        };
    } catch (error) {
        throw new Error(`Failed to load content: ${slug}`);
    }
}

export async function getContentList(type: ContentType): Promise<ContentItem[]> {
    const contentDirectory = path.join(process.cwd(), 'content', type);

    try {
        const files = await fs.readdir(contentDirectory);
        const markdownFiles = files.filter(file => file.endsWith('.md'));

        const content = await Promise.all(
            markdownFiles.map(async (file) => {
                const slug = file.replace(/\.md$/, '');
                return getContent(type, slug);
            })
        );

        // Sort by date, newest first
        return content.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error(`Error loading ${type}:`, error);
        return [];
    }
}

function countChapters(content: string): number {
    // Count level 1 headings (# heading) as chapters
    const chapterMatches = content.match(/^#\s+.+$/gm);
    return chapterMatches ? chapterMatches.length : 0;
}

export function generateTableOfContents(content: string): Array<{ id: string, title: string, level: number }> {
    const headings = [];
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headerRegex.exec(content)) !== null) {
        const level = match[1].length;
        const title = match[2];

        // Remove numbering from title for TOC display
        const cleanTitle = title.replace(/^\d+\.?\s*/, '');
        const id = generateHeadingId(cleanTitle);

        headings.push({ id, title: cleanTitle, level });
    }

    return headings;
}

function generateHeadingId(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .substring(0, 50); // Limit length
}

function generateExcerpt(content: string, maxLength: number = 160): string {
    // Remove markdown formatting
    const plainText = content
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/`([^`]+)`/g, '$1') // Remove inline code
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .trim();

    if (plainText.length <= maxLength) {
        return plainText;
    }

    // Find the last complete word within the limit
    const truncated = plainText.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > 0) {
        return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}