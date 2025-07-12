'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Input,
    Select,
    SelectItem,
    Button,
    Chip,
    Divider,
} from "@heroui/react";
import { BiSearch, BiSort, BiSortUp, BiSortDown, BiX } from "react-icons/bi";
import { ContentType } from '@/lib/types';

interface FilterOptions {
    query: string;
    sortBy: 'date' | 'title' | 'wordCount' | 'readingTime';
    sortOrder: 'asc' | 'desc';
    tags?: string[];
}

interface SearchFilterProps {
    items: any[];
    onFilter: (filteredItems: any[]) => void;
    type: ContentType;
    availableTags?: string[];
}

export function SearchFilter({ items, onFilter, type, availableTags = [] }: SearchFilterProps) {
    const [filters, setFilters] = useState<FilterOptions>({
        query: '',
        sortBy: 'date',
        sortOrder: 'desc',
        tags: [],
    });

    const filteredItems = useMemo(() => {
        let result = [...items];

        // Apply search query
        if (filters.query) {
            const query = filters.query.toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.excerpt.toLowerCase().includes(query) ||
                (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(query)))
            );
        }

        // Apply tag filters
        if (filters.tags && filters.tags.length > 0) {
            result = result.filter(item =>
                item.tags && filters.tags?.some(tag => item.tags.includes(tag))
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let aValue, bValue;

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
                    aValue = new Date(a.date).getTime();
                    bValue = new Date(b.date).getTime();
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

    // Use useEffect instead of useMemo to avoid setState during render
    useEffect(() => {
        onFilter(filteredItems);
    }, [filteredItems, onFilter]);

    const handleSearchChange = (value: string) => {
        console.log('Search filter changed:', value);
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
                    placeholder={`Search`}
                    value={filters.query}
                    onValueChange={handleSearchChange}
                    startContent={<BiSearch size={20} className="text-default-400" />}
                    className="flex-1"
                    size="lg"
                    autoComplete="off"
                    data-form-type="other"
                />

                <div className="flex gap-2">
                    <Select
                        selectedKeys={[filters.sortBy]}
                        onSelectionChange={(keys) => handleSortChange(Array.from(keys)[0] as string)}
                        className="min-w-40"
                        size="lg"
                        startContent={<BiSort size={20} className="text-default-400" />}
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
                        aria-label={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                    >
                        {filters.sortOrder === 'asc' ? <BiSortUp /> : <BiSortDown />}
                    </Button>
                </div>
            </div>

            {/* Tag filters */}
            {availableTags.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-default-600">Filter by tags:</p>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <Chip
                                key={tag}
                                variant={filters.tags?.includes(tag) ? 'solid' : 'bordered'}
                                color={filters.tags?.includes(tag) ? 'primary' : 'default'}
                                onClose={filters.tags?.includes(tag) ? () => handleTagToggle(tag) : undefined}
                                onClick={() => handleTagToggle(tag)}
                                className="cursor-pointer hover:scale-105 transition-transform"
                            >
                                {tag}
                            </Chip>
                        ))}
                    </div>
                </div>
            )}

            {/* Active filters and clear button */}
            {hasActiveFilters && (
                <>
                    <Divider />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-default-600">
                                Showing {filteredItems.length} of {items.length} {type}
                            </span>
                            {filters.tags && filters.tags.length > 0 && (
                                <div className="flex gap-1">
                                    {filters.tags.map(tag => (
                                        <Chip
                                            key={tag}
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            onClose={() => handleTagToggle(tag)}
                                        >
                                            {tag}
                                        </Chip>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="light"
                            onPress={clearFilters}
                            startContent={<BiX />}
                        >
                            Clear filters
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}