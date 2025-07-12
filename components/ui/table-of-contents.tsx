'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody } from "@heroui/react";
import { TbList } from "react-icons/tb";

interface TocItem {
    id: string;
    title: string;
    level: number;
}

interface TableOfContentsProps {
    content: string;
    className?: string;
}

export function TableOfContents({ content, className = "" }: TableOfContentsProps) {
    const [tocItems, setTocItems] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        // Extract headings from content
        const headings = extractHeadings(content);
        setTocItems(headings);

        // Set up intersection observer for active heading
        if (headings.length > 0) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setActiveId(entry.target.id);
                        }
                    });
                },
                {
                    rootMargin: '-100px 0px -66%',
                    threshold: 0
                }
            );

            // Observe all headings after a short delay to ensure DOM is ready
            setTimeout(() => {
                headings.forEach(({ id }) => {
                    const element = document.getElementById(id);
                    if (element) {
                        observer.observe(element);
                    }
                });
            }, 100);

            return () => observer.disconnect();
        }
    }, [content]);

    useEffect(() => {
        // Add IDs to headings in the DOM
        const contentContainer = document.querySelector('.content-area');
        if (contentContainer) {
            const headingElements = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headingElements.forEach((heading) => {
                const text = heading.textContent || '';
                const id = generateId(text);
                heading.id = id;
                heading.classList.add('scroll-mt-24'); // Add scroll margin for better positioning
            });
        }
    }, [content]);

    const extractHeadings = (htmlContent: string): TocItem[] => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

        return Array.from(headings).map((heading) => {
            const text = heading.textContent || '';
            const level = parseInt(heading.tagName.charAt(1));
            const id = generateId(text);

            return {
                id,
                title: text.replace(/^\d+\.?\s*/, ''), // Remove numbering from title
                level
            };
        }).filter(item => item.title.length > 0);
    };

    const generateId = (text: string): string => {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
            .substring(0, 50); // Limit length
    };

    const handleTocClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    if (tocItems.length === 0) {
        return null;
    }

    return (
        <Card className={`table-of-contents ${className}`}>
            <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TbList size={20} className="text-primary" />
                    <h3 className="text-lg font-semibold mb-0">Table of Contents</h3>
                </div>

                <nav>
                    <ul className="space-y-1">
                        {tocItems.map((item) => (
                            <li key={item.id} className={`toc-level-${item.level}`}>
                                <button
                                    onClick={() => handleTocClick(item.id)}
                                    className={`
                                        w-full text-left px-2 py-1 rounded-md text-sm transition-colors
                                        hover:bg-primary-100 hover:text-primary
                                        ${activeId === item.id
                                            ? 'bg-primary-100 text-primary font-medium'
                                            : 'text-foreground'
                                        }
                                        ${item.level === 1 ? 'font-semibold' : ''}
                                        ${item.level === 2 ? 'ml-4 text-sm' : ''}
                                        ${item.level === 3 ? 'ml-8 text-xs text-default-600' : ''}
                                        ${item.level > 3 ? 'ml-12 text-xs text-default-500' : ''}
                                    `}
                                >
                                    {item.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </CardBody>
        </Card>
    );
}