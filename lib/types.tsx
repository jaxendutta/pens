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
    password?: string | null;
}

export interface ContentItem extends ContentMeta {
    content: string;
}

export type ContentType = 'pieces' | 'poems';

export interface SearchFilters {
    query: string;
    sortBy: 'date' | 'title' | 'wordCount' | 'readingTime';
    sortOrder: 'asc' | 'desc';
    tags?: string[];
}