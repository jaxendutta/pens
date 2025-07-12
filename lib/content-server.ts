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

    let htmlContent = processedMarkdown.toString();

    // Replace HTML headings with Tailwind-styled versions
    htmlContent = htmlContent
        .replace(/<h1([^>]*)>(.*?)<\/h1>/g, '<h1 class="text-3xl lg:text-4xl font-bold text-foreground mb-6 mt-8 pb-3 border-b-2 border-divider scroll-mt-24"$1>$2</h1>')
        .replace(/<h2([^>]*)>(.*?)<\/h2>/g, '<h2 class="text-2xl lg:text-3xl font-bold text-foreground mb-4 mt-6 pb-2 border-b border-divider scroll-mt-24"$1>$2</h2>')
        .replace(/<h3([^>]*)>(.*?)<\/h3>/g, '<h3 class="text-xl lg:text-2xl font-semibold text-foreground mb-3 mt-5 scroll-mt-24"$1>$2</h3>')
        .replace(/<h4([^>]*)>(.*?)<\/h4>/g, '<h4 class="text-lg lg:text-xl font-semibold text-foreground mb-3 mt-4 scroll-mt-24"$1>$2</h4>')
        .replace(/<h5([^>]*)>(.*?)<\/h5>/g, '<h5 class="text-base lg:text-lg font-semibold text-foreground mb-2 mt-3 scroll-mt-24"$1>$2</h5>')
        .replace(/<h6([^>]*)>(.*?)<\/h6>/g, '<h6 class="text-sm lg:text-base font-semibold text-foreground mb-2 mt-3 scroll-mt-24"$1>$2</h6>')
        // Also style paragraphs and other elements
        .replace(/<p>/g, '<p class="mb-4 leading-relaxed text-foreground">')
        .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-primary pl-6 py-4 my-6 italic bg-default-50 rounded-r-lg">')
        .replace(/<ul>/g, '<ul class="list-disc list-inside mb-4 space-y-2">')
        .replace(/<ol>/g, '<ol class="list-decimal list-inside mb-4 space-y-2">')
        .replace(/<li>/g, '<li class="leading-relaxed text-foreground">')
        .replace(/<code>/g, '<code class="bg-default-100 text-primary px-1.5 py-0.5 rounded text-sm font-mono">')
        .replace(/<pre>/g, '<pre class="bg-default-100 p-4 rounded-lg overflow-x-auto my-4">')
        .replace(/<a\s+([^>]*href="[^"]*")([^>]*)>/g, '<a class="text-primary hover:text-primary-600 underline underline-offset-2 transition-colors" $1$2>');

    return htmlContent;
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