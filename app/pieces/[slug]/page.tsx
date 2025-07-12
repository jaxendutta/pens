import { notFound } from 'next/navigation';
import { getContent, getContentList } from '@/lib/content-server';
import { ContentReader } from '@/components/ui/content-reader';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const pieces = await getContentList('pieces');
    return pieces.map((piece) => ({
        slug: piece.slug,
    }));
}

export default async function StoryPage({ params }: PageProps) {
    const { slug } = await params;
    const content = await getContent('pieces', slug);

    if (!content) {
        notFound();
    }

    return <ContentReader content={content} type="pieces" />;
}