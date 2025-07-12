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

export default async function PiecesPage() {
    const pieces = await getContentList('pieces');

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
                    <NavbarItem isActive>
                        <Link href="/pieces" color="primary">Stories</Link>
                    </NavbarItem>
                    <NavbarItem>
                        <Link as={NextLink} href="/poems" color="foreground">Poems</Link>
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
                    <Chip color="primary" variant="flat" className="mb-4">
                        📚 Literary Stories
                    </Chip>
                    <h1 className="text-4xl font-bold mb-4">Story Collection</h1>
                    <p className="text-xl text-default-600 max-w-2xl mx-auto">
                        Immersive narratives exploring the depths of human experience
                        through carefully crafted prose and compelling characters.
                    </p>
                </div>

                {/* Content */}
                {pieces.length === 0 ? (
                    <Card className="max-w-md mx-auto">
                        <CardBody className="text-center p-8">
                            <div className="text-6xl mb-4">📖</div>
                            <h3 className="text-xl font-semibold mb-2">No Stories Yet</h3>
                            <p className="text-default-500">
                                Stories will appear here once they're added to the collection.
                            </p>
                        </CardBody>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                        {pieces.map((piece) => (
                            <ContentCard
                                key={piece.slug}
                                content={piece}
                                type="pieces"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}