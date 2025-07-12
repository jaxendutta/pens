// Client-side content utilities
export function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

export function getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function calculateReadingTime(wordCount: number): number {
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
}

export function extractTags(data: any): string[] {
    if (Array.isArray(data.tags)) return data.tags;
    if (typeof data.tags === 'string') return data.tags.split(',').map((t: string) => t.trim());
    return [];
}

export function generateTableOfContents(content: string): Array<{ id: string, title: string, level: number }> {
    const headings = [];
    const headerRegex = /^(#{1,3})\s+(.+)$/gm;
    let match;

    while ((match = headerRegex.exec(content)) !== null) {
        const level = match[1].length;
        const title = match[2];
        const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

        headings.push({ id, title, level });
    }

    return headings;
}

// Re-export types for convenience
export type { ContentItem, ContentMeta, ContentType } from './types';