'use server';

import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { ContentMeta, ContentWithBody, ContentType } from '@/types/content';

const contentDirectory = (type: ContentType) => path.join(process.cwd(), 'content', type);

// Calculate reading time (200 words per minute)
function calculateReadingTime(wordCount: number): number {
    return Math.ceil(wordCount / 200);
}

// Get word count from content
function getWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Get all content items of a specific type
export async function getContentList(type: ContentType): Promise<ContentMeta[]> {
    const dir = contentDirectory(type);

    if (!existsSync(dir)) {
        return [];
    }

    const fileNames = readdirSync(dir);
    const contentItems: ContentMeta[] = [];

    for (const fileName of fileNames) {
        if (!fileName.endsWith('.md')) continue;

        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(dir, fileName);
        const fileContents = readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        const wordCount = getWordCount(content);
        const readingTime = calculateReadingTime(wordCount);

        contentItems.push({
            slug,
            title: data.title || '',
            author: data.author || '',
            location: data.location || '',
            date: data.date || '',
            lastRevision: data.lastRevision || data.date || '',
            excerpt: data.excerpt || '',
            password: data.password || '',
            wordCount,
            readingTime,
        });
    }

    return contentItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Get specific content item with full content
export async function getContent(type: ContentType, slug: string): Promise<ContentWithBody | null> {
    try {
        const fullPath = path.join(contentDirectory(type), `${slug}.md`);

        if (!existsSync(fullPath)) {
            return null;
        }

        const fileContents = readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        const wordCount = getWordCount(content);
        const readingTime = calculateReadingTime(wordCount);

        // Process markdown to HTML
        const processedMarkdown = await remark()
            .use(html)
            .process(content);
        const contentHtml = processedMarkdown.toString();

        return {
            slug,
            title: data.title || '',
            author: data.author || '',
            location: data.location || '',
            date: data.date || '',
            lastRevision: data.lastRevision || data.date || '',
            excerpt: data.excerpt || '',
            password: data.password || '',
            wordCount,
            readingTime,
            content: contentHtml,
        };
    } catch (error) {
        console.error(`Error loading content: ${slug}`, error);
        return null;
    }
}