import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { ContentItem, ContentMeta, ContentType } from './types';

const contentDirectory = path.join(process.cwd(), 'content');

export function getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function calculateReadingTime(wordCount: number): number {
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
}

export function getChapterCount(content: string): number {
    const headerMatches = content.match(/^#{1,3}\s+/gm);
    return headerMatches ? headerMatches.length : 0;
}

export function extractTags(data: any): string[] {
    if (Array.isArray(data.tags)) return data.tags;
    if (typeof data.tags === 'string') return data.tags.split(',').map((t: string) => t.trim());
    return [];
}

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

export async function getContentList(type: ContentType): Promise<ContentMeta[]> {
    try {
        const dirPath = path.join(contentDirectory, type);

        if (!fs.existsSync(dirPath)) {
            console.warn(`Content directory not found: ${dirPath}`);
            return [];
        }

        const fileNames = fs.readdirSync(dirPath).filter(name => name.endsWith('.md'));

        const contents = await Promise.all(
            fileNames.map(async (fileName) => {
                const slug = fileName.replace(/\.md$/, '');
                const fullPath = path.join(dirPath, fileName);
                const fileContents = fs.readFileSync(fullPath, 'utf8');
                const { data, content } = matter(fileContents);

                const wordCount = getWordCount(content);
                const readingTime = calculateReadingTime(wordCount);
                const chapters = getChapterCount(content);
                const tags = extractTags(data);

                return {
                    slug,
                    title: data.title || slug,
                    author: data.author || 'Anonymous',
                    location: data.location || '',
                    date: data.date || new Date().toISOString(),
                    lastRevision: data.lastRevision || data.date || new Date().toISOString(),
                    excerpt: data.excerpt || content.slice(0, 200) + '...',
                    wordCount,
                    readingTime,
                    tags,
                    chapters,
                    isProtected: Boolean(data.password),
                };
            })
        );

        return contents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error(`Error loading content list for ${type}:`, error);
        return [];
    }
}

export async function getContent(type: ContentType, slug: string): Promise<ContentItem | null> {
    try {
        const fullPath = path.join(contentDirectory, type, `${slug}.md`);

        if (!fs.existsSync(fullPath)) {
            return null;
        }

        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        const wordCount = getWordCount(content);
        const readingTime = calculateReadingTime(wordCount);
        const chapters = getChapterCount(content);
        const tags = extractTags(data);

        // Process markdown to HTML with auto-numbered headers
        const processedContent = await processMarkdownWithNumbering(content);

        return {
            slug,
            title: data.title || slug,
            author: data.author || 'Anonymous',
            location: data.location || '',
            date: data.date || new Date().toISOString(),
            lastRevision: data.lastRevision || data.date || new Date().toISOString(),
            excerpt: data.excerpt || content.slice(0, 200) + '...',
            password: data.password || '',
            wordCount,
            readingTime,
            content: processedContent,
            tags,
            chapters,
        };
    } catch (error) {
        console.error(`Error loading content: ${slug}`, error);
        return null;
    }
}

async function processMarkdownWithNumbering(content: string): Promise<string> {
    // Add auto-numbering to headers
    let headerCount = { h1: 0, h2: 0, h3: 0 };

    const numberedContent = content.replace(/^(#{1,3})\s+(.+)$/gm, (match, hashes, title) => {
        const level = hashes.length;

        if (level === 1) {
            headerCount.h1++;
            headerCount.h2 = 0;
            headerCount.h3 = 0;
            return `${hashes} ${headerCount.h1}. ${title}`;
        } else if (level === 2) {
            headerCount.h2++;
            headerCount.h3 = 0;
            return `${hashes} ${headerCount.h1}.${headerCount.h2}. ${title}`;
        } else if (level === 3) {
            headerCount.h3++;
            return `${hashes} ${headerCount.h1}.${headerCount.h2}.${headerCount.h3}. ${title}`;
        }

        return match;
    });

    // Process with remark
    const processedMarkdown = await remark()
        .use(html)
        .process(numberedContent);

    return processedMarkdown.toString();
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