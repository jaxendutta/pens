import { getContentList } from '@/lib/content-server';
import { ContentGrid } from '@/components/ui/content-grid';

export default async function PiecesPage() {
    const pieces = await getContentList('pieces');

    return (
        <ContentGrid
            items={pieces}
            type="pieces"
            title="Pieces"
            description="Some have chapters, others don't. Isn't that so funny?"
        />
    );
}