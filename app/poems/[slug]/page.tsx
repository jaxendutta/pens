import { notFound } from 'next/navigation';
import { getContent, getContentList } from '@/lib/content-server';
import { ContentReader } from '@/components/ui/content-reader';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const poems = await getContentList('poems');
    return poems.map((poem) => ({
        slug: poem.slug,
    }));
}

export default async function PoemPage({ params }: PageProps) {
    const { slug } = await params;
    const content = await getContent('poems', slug);

    if (!content) {
        notFound();
    }

    return <ContentReader content={content} type="poems" />;
}