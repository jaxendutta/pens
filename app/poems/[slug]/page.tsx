'use client';

import { notFound } from 'next/navigation';
import { getContent, getContentList } from '@/lib/content';
import { ContentReader } from '@/components/ContentReader';

interface PageProps {
    params: { slug: string };
}

export async function generateStaticParams() {
    const poems = await getContentList('poems');
    return poems.map((poem) => ({
        slug: poem.slug,
    }));
}

export default async function PoemPage({ params }: PageProps) {
    const content = await getContent('poems', params.slug);

    if (!content) {
        notFound();
    }

    return <ContentReader content={content} type="poems" />;
}