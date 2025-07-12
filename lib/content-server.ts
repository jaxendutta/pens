import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { ContentItem, ContentType } from './types';

export async function getContent(
    type: ContentType,
    slug: string,
): Promise<ContentItem> {
    const contentDirectory = path.join(process.cwd(), 'content', type);
    const fullPath = path.join(contentDirectory, `${slug}.md`);

    try {
        const fileContents = await fs.readFile(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        // Process markdown content
        const processedContent = await processMarkdownContent(content);

        // Calculate reading time (average 200 words per minute)
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);

        return {
            slug,
            title: data.title || 'Untitled',
            author: data.author || 'Unknown',
            content: processedContent,
            excerpt: data.excerpt || generateExcerpt(content),
            date: data.date || new Date().toISOString(),
            lastRevision: data.lastRevision || data.date || new Date().toISOString(),
            tags: data.tags || [],
            password: data.password || null,
            readingTime,
            wordCount,
            chapters: data.chapters || null,
            location: data.location || null,
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

async function processMarkdownContent(content: string): Promise<string> {
    // Track header numbering
    const headerCount = { h1: 0, h2: 0, h3: 0 };

    // Add numbering to headers (only for h1, h2, h3)
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

    // Replace HTML headings with better styled versions including more spacing
    htmlContent = htmlContent
        .replace(/<h1([^>]*)>(.*?)<\/h1>/g, '<h1 class="text-3xl lg:text-4xl font-bold text-foreground mb-6 mt-12 pb-3 border-b-2 border-divider scroll-mt-24 first:mt-0"$1>$2</h1>')
        .replace(/<h2([^>]*)>(.*?)<\/h2>/g, '<h2 class="text-2xl lg:text-3xl font-bold text-foreground mb-4 mt-10 pb-2 border-b border-divider scroll-mt-24"$1>$2</h2>')
        .replace(/<h3([^>]*)>(.*?)<\/h3>/g, '<h3 class="text-xl lg:text-2xl font-semibold text-foreground mb-3 mt-8 scroll-mt-24"$1>$2</h3>')
        .replace(/<h4([^>]*)>(.*?)<\/h4>/g, '<h4 class="text-lg lg:text-xl font-semibold text-foreground mb-3 mt-6 scroll-mt-24"$1>$2</h4>')
        .replace(/<h5([^>]*)>(.*?)<\/h5>/g, '<h5 class="text-base lg:text-lg font-semibold text-foreground mb-2 mt-5 scroll-mt-24"$1>$2</h5>')
        .replace(/<h6([^>]*)>(.*?)<\/h6>/g, '<h6 class="text-sm lg:text-base font-semibold text-foreground mb-2 mt-4 scroll-mt-24"$1>$2</h6>')

        // Improved paragraph styling with better spacing
        .replace(/<p>/g, '<p class="mb-6 leading-relaxed text-foreground text-justify">')

        // Enhanced blockquote styling
        .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-primary pl-6 py-4 my-8 italic bg-default-50 rounded-r-lg shadow-sm">')

        // Better list styling
        .replace(/<ul>/g, '<ul class="list-disc list-inside mb-6 space-y-3 ml-4">')
        .replace(/<ol>/g, '<ol class="list-decimal list-inside mb-6 space-y-3 ml-4">')
        .replace(/<li>/g, '<li class="leading-relaxed text-foreground pl-2">')

        // Enhanced code styling
        .replace(/<code>/g, '<code class="bg-default-100 text-primary px-2 py-1 rounded text-sm font-mono border">')
        .replace(/<pre>/g, '<pre class="bg-default-100 p-6 rounded-lg overflow-x-auto my-6 border shadow-sm">')

        // Better link styling
        .replace(/<a\s+([^>]*href="[^"]*")([^>]*)>/g, '<a class="text-primary hover:text-primary-600 underline underline-offset-2 transition-colors duration-200 font-medium" $1$2>')

        // Enhanced table styling
        .replace(/<table>/g, '<table class="w-full border-collapse my-8 bg-background rounded-lg overflow-hidden shadow-sm border border-divider">')
        .replace(/<thead>/g, '<thead class="bg-default-100">')
        .replace(/<th>/g, '<th class="border border-divider px-4 py-3 text-left font-semibold text-foreground">')
        .replace(/<td>/g, '<td class="border border-divider px-4 py-3 text-foreground">')

        // Enhanced horizontal rule
        .replace(/<hr>/g, '<hr class="border-none border-t-2 border-divider my-12 w-1/2 mx-auto">')

        // Add spacing for images
        .replace(/<img/g, '<img class="my-8 mx-auto rounded-lg shadow-md border border-divider"');

    return htmlContent;
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