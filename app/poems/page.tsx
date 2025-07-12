import { getContentList } from '@/lib/content-server';
import { ContentGrid } from '@/components/ui/content-grid';

export default async function PoemsPage() {
    const poems = await getContentList('poems');

    return (
        <ContentGrid
            items={poems}
            type="poems"
            title="Poems"
            description="Sometimes stories are too short to be stories. Sometimes they end up here."
        />
    );
}