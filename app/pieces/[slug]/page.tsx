'use client';

import { notFound } from 'next/navigation';
import { getContent, getContentList } from '@/lib/content';
import { ContentReader } from '@/components/ContentReader';

interface PageProps {
    params: { slug: string };
}

export async function generateStaticParams() {
    const pieces = await getContentList('pieces');
    return pieces.map((piece) => ({
        slug: piece.slug,
    }));
}

export default async function StoryPage({ params }: PageProps) {
    const content = await getContent('pieces', params.slug);

    if (!content) {
        notFound();
    }

    return <ContentReader content={content} type="pieces" />;
}