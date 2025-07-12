'use client';

import { useState, useMemo } from 'react';
import {
    Input,
    Select,
    SelectItem,
    Button,
    Chip,
    Card,
    CardBody,
} from "@heroui/react";
import { BiSearch, BiSort, BiFilter, BiX } from "react-icons/bi";
import { TbSortAscending, TbSortDescending } from "react-icons/tb";
import { ContentMeta, SearchFilters } from '@/lib/types';

interface SearchFilterProps {
    items: ContentMeta[];
    onFilter: (filteredItems: ContentMeta[]) => void;
    type: 'pieces' | 'poems';
}

export function SearchFilter({ items, onFilter, type }: SearchFilterProps) {
    const [filters, setFilters] = useState<SearchFilters>({
        query: '',
        sortBy: 'date',
        sortOrder: 'desc',
        tags: [],
    });

    const [showFilters, setShowFilters] = useState(false);

    // Get all unique tags from items
    const availableTags = useMemo(() => {
        const allTags = items.flatMap(item => item.tags || []);
        return Array.from(new Set(allTags)).sort();
    }, [items]);

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let result = [...items];

        // Text search
        if (filters.query) {
            const query = filters.query.toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.author.toLowerCase().includes(query) ||
                item.excerpt.toLowerCase().includes(query) ||
                (item.location && item.location.toLowerCase().includes(query)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }

        // Tag filter
        if (filters.tags && filters.tags.length > 0) {
            result = result.filter(item =>
                item.tags && filters.tags!.some(tag => item.tags!.includes(tag))
            );
        }

        // Sort
        result.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (filters.sortBy) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'wordCount':
                    aValue = a.wordCount;
                    bValue = b.wordCount;
                    break;
                case 'readingTime':
                    aValue = a.readingTime;
                    bValue = b.readingTime;
                    break;
                case 'date':
                default:
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
                    break;
            }

            if (filters.sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return result;
    }, [items, filters]);

    // Update parent component when filters change
    useMemo(() => {
        onFilter(filteredItems);
    }, [filteredItems, onFilter]);

    const handleSearchChange = (value: string) => {
        setFilters(prev => ({ ...prev, query: value }));
    };

    const handleSortChange = (value: string) => {
        setFilters(prev => ({ ...prev, sortBy: value as any }));
    };

    const handleSortOrderToggle = () => {
        setFilters(prev => ({
            ...prev,
            sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleTagToggle = (tag: string) => {
        setFilters(prev => ({
            ...prev,
            tags: prev.tags?.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...(prev.tags || []), tag]
        }));
    };

    const clearFilters = () => {
        setFilters({
            query: '',
            sortBy: 'date',
            sortOrder: 'desc',
            tags: [],
        });
    };

    const hasActiveFilters = filters.query || (filters.tags && filters.tags.length > 0);

    return (
        <div className="space-y-4">
            {/* Main search and controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Input
                    placeholder={`Search ${type}...`}
                    value={filters.query}
                    onValueChange={handleSearchChange}
                    startContent={<BiSearch className="text-default-400" />}
                    className="flex-1"
                    size="lg"
                />

                <div className="flex gap-2">
                    <Select
                        selectedKeys={[filters.sortBy]}
                        onSelectionChange={(keys) => handleSortChange(Array.from(keys)[0] as string)}
                        className="min-w-40"
                        size="lg"
                        startContent={<BiSort className="text-default-400" />}
                    >
                        <SelectItem key="date">Date</SelectItem>
                        <SelectItem key="title">Title</SelectItem>
                        <SelectItem key="wordCount">Word Count</SelectItem>
                        <SelectItem key="readingTime">Reading Time</SelectItem>
                    </Select>

                    <Button
                        isIconOnly
                        variant="flat"
                        onPress={handleSortOrderToggle}
                        size="lg"
                        aria-label={`Sort ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                    >
                        {filters.sortOrder === 'asc' ? <TbSortAscending size={20} /> : <TbSortDescending size={20} />}
                    </Button>

                    <Button
                        isIconOnly
                        variant="flat"
                        onPress={() => setShowFilters(!showFilters)}
                        size="lg"
                        color={hasActiveFilters ? 'primary' : 'default'}
                        aria-label="Toggle filters"
                    >
                        <BiFilter size={20} />
                    </Button>
                </div>
            </div>

            {/* Advanced filters */}
            {showFilters && (
                <Card>
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Filters</h3>
                            {hasActiveFilters && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={clearFilters}
                                    startContent={<BiX size={16} />}
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>

                        {availableTags.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-3">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {availableTags.map(tag => (
                                        <Chip
                                            key={tag}
                                            variant={filters.tags?.includes(tag) ? "solid" : "bordered"}
                                            color={filters.tags?.includes(tag) ? "primary" : "default"}
                                            className="cursor-pointer"
                                            onClick={() => handleTagToggle(tag)}
                                        >
                                            {tag}
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Results summary */}
            <div className="flex items-center justify-between text-sm text-default-600">
                <span>
                    {filteredItems.length} {type} {filteredItems.length === 1 ? 'found' : 'found'}
                </span>

                {hasActiveFilters && (
                    <div className="flex items-center gap-2">
                        <span>Active filters:</span>
                        {filters.query && (
                            <Chip size="sm" variant="flat" onClose={() => handleSearchChange('')}>
                                "{filters.query}"
                            </Chip>
                        )}
                        {filters.tags?.map(tag => (
                            <Chip
                                key={tag}
                                size="sm"
                                variant="flat"
                                onClose={() => handleTagToggle(tag)}
                            >
                                {tag}
                            </Chip>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}