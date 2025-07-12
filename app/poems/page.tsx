'use client';

import {
    Card,
    CardBody,
    Chip,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Link,
} from "@heroui/react";
import NextLink from 'next/link';
import { getContentList } from '@/lib/content';
import { ContentCard } from '@/components/ContentCard';
import { AccessibilityPanel } from '@/components/AccessibilityPanel';

export default async function PoemsPage() {
    const poems = await getContentList('poems');

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <Navbar>
                <NavbarBrand>
                    <Link as={NextLink} href="/" color="foreground">
                        <p className="font-bold text-inherit">Literary Pens</p>
                    </Link>
                </NavbarBrand>
                <NavbarContent className="hidden sm:flex gap-4" justify="center">
                    <NavbarItem>
                        <Link as={NextLink} href="/" color="foreground">Home</Link>
                    </NavbarItem>
                    <NavbarItem>
                        <Link as={NextLink} href="/pieces" color="foreground">Stories</Link>
                    </NavbarItem>
                    <NavbarItem isActive>
                        <Link href="/poems" color="secondary">Poems</Link>
                    </NavbarItem>
                </NavbarContent>
                <NavbarContent justify="end">
                    <NavbarItem>
                        <AccessibilityPanel />
                    </NavbarItem>
                </NavbarContent>
            </Navbar>

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <Chip color="secondary" variant="flat" className="mb-4">
                        📝 Poetry Collection
                    </Chip>
                    <h1 className="text-4xl font-bold mb-4">Poem Collection</h1>
                    <p className="text-xl text-default-600 max-w-2xl mx-auto">
                        Lyrical expressions capturing moments, emotions, and reflections
                        in crystalline verse that resonates with the soul.
                    </p>
                </div>

                {/* Content */}
                {poems.length === 0 ? (
                    <Card className="max-w-md mx-auto">
                        <CardBody className="text-center p-8">
                            <div className="text-6xl mb-4">🌸</div>
                            <h3 className="text-xl font-semibold mb-2">No Poems Yet</h3>
                            <p className="text-default-500">
                                Poems will appear here once they're added to the collection.
                            </p>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                        {poems.map((poem) => (
                            <ContentCard
                                key={poem.slug}
                                content={poem}
                                type="poems"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}