export interface ContentItem {
    slug: string;
    title: string;
    author: string;
    location?: string;
    date: string;
    lastRevision: string;
    excerpt: string;
    password?: string;
    wordCount: number;
    readingTime: number;
    content: string;
    tags?: string[];
    chapters?: number;
}

export interface ContentMeta {
    slug: string;
    title: string;
    author: string;
    location?: string;
    date: string;
    lastRevision: string;
    excerpt: string;
    wordCount: number;
    readingTime: number;
    tags?: string[];
    chapters?: number;
    isProtected: boolean;
}

export type ContentType = 'pieces' | 'poems';

export interface SearchFilters {
    query: string;
    sortBy: 'date' | 'title' | 'wordCount' | 'readingTime';
    sortOrder: 'asc' | 'desc';
    tags?: string[];
}