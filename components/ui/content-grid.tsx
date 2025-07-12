'use client';

import { useState } from 'react';
import { motion } from "framer-motion";
import { Card, CardBody } from "@heroui/react";
import { TbBook, TbSparkles } from "react-icons/tb";
import { ContentMeta } from '@/lib/types';
import { SearchFilter } from './search-filter';
import { ContentCard } from './content-card';

interface ContentGridProps {
    items: ContentMeta[];
    type: 'pieces' | 'poems';
    title: string;
    description: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.6,
            staggerChildren: 0.1
        }
    }
};

const EmptyState = ({ type }: { type: 'pieces' | 'poems' }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="col-span-full"
    >
        <Card className="max-w-md mx-auto">
            <CardBody className="text-center p-12">
                <div className="text-6xl mb-6">
                    {type === 'pieces' ? '📚' : '🌸'}
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                    No {type === 'pieces' ? 'Stories' : 'Poems'} Yet
                </h3>
                <p className="text-default-600 leading-relaxed">
                    {type === 'pieces'
                        ? 'Stories will appear here once they\'re added to the collection. Check back soon for new literary pieces to explore.'
                        : 'Poems will appear here once they\'re added to the collection. Check back soon for new verses to discover.'
                    }
                </p>
            </CardBody>
        </Card>
    </motion.div>
);

export function ContentGrid({ items, type, title, description }: ContentGridProps) {
    const [filteredItems, setFilteredItems] = useState<ContentMeta[]>(items);

    const handleFilter = (filtered: ContentMeta[]) => {
        setFilteredItems(filtered);
    };

    const isPieces = type === 'pieces';

    return (
        <div className="container mx-auto px-6 py-12">
            {/* Header */}
            <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className={`p-3 rounded-xl ${isPieces ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                        {isPieces ? (
                            <TbBook size={32} className="text-primary" />
                        ) : (
                            <TbSparkles size={32} className="text-secondary" />
                        )}
                    </div>
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-default-600 bg-clip-text text-transparent">
                    {title}
                </h1>

                <p className="text-xl text-default-600 max-w-3xl mx-auto leading-relaxed">
                    {description}
                </p>
            </motion.div>

            {/* Search and Filter */}
            {items.length > 0 && (
                <motion.div
                    className="mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <SearchFilter
                        items={items}
                        onFilter={handleFilter}
                        type={type}
                    />
                </motion.div>
            )}

            {/* Content Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
                {filteredItems.length === 0 ? (
                    items.length === 0 ? (
                        <EmptyState type={type} />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full text-center py-16"
                        >
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
                            <p className="text-default-600">
                                Try adjusting your search criteria or clearing the filters.
                            </p>
                        </motion.div>
                    )
                ) : (
                    filteredItems.map((item, index) => (
                        <ContentCard
                            key={item.slug}
                            content={item}
                            type={type}
                        />
                    ))
                )}
            </motion.div>

            {/* Loading state for when items are being filtered */}
            {items.length > 0 && filteredItems.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2">Searching...</h3>
                    <p className="text-default-600">Looking for matching content...</p>
                </motion.div>
            )}
        </div>
    );
}