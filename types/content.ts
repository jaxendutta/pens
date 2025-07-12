export interface ContentMeta {
    slug: string;
    title: string;
    author: string;
    location: string;
    date: string;
    lastRevision: string;
    excerpt: string;
    password?: string;
    wordCount: number;
    readingTime: number;
}

export interface ContentWithBody extends ContentMeta {
    content: string;
}

export type ContentType = 'pieces' | 'poems';