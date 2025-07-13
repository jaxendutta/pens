'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardBody, Button, Progress, Divider, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from 'next-themes';
import {
    TbList,
    TbChevronUp,
    TbChevronDown,
    TbAccessible,
    TbArrowUp,
    TbMenu2,
    TbShare,
    TbPrinter,
    TbPalette,
    TbCopy,
    TbFileText,
    TbPlus,
    TbMinus,
    TbX,
} from "react-icons/tb";

interface TocItem {
    id: string;
    title: string;
    level: number;
}

interface TableOfContentsProps {
    content: string;
    className?: string;
    onAccessibilityClick?: () => void;
    contentTitle?: string;
}

export function TableOfContents({
    content,
    className = "",
    onAccessibilityClick,
    contentTitle
}: TableOfContentsProps) {
    const [tocItems, setTocItems] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [fontSize, setFontSize] = useState(16);

    const { theme, setTheme } = useTheme();
    const observerRef = useRef<IntersectionObserver | null>(null);
    const tocRef = useRef<HTMLDivElement>(null);

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            setIsExpanded(window.innerWidth >= 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load font size from localStorage on mount
    useEffect(() => {
        const savedFontSize = localStorage.getItem('reader-font-size');
        if (savedFontSize) {
            const size = parseInt(savedFontSize);
            if (size >= 10 && size <= 36) {
                setFontSize(size);
            }
        }
    }, []);

    useEffect(() => {
        // Apply font size to content areas
        const contentElements = document.querySelectorAll('.content-area');
        contentElements.forEach(el => {
            const element = el as HTMLElement;
            element.style.fontSize = `${fontSize}px`;
        });

        // Save font size to localStorage
        localStorage.setItem('reader-font-size', fontSize.toString());
    }, [fontSize]);

    // Calculate reading progress and visibility
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = Math.min(Math.max((scrollTop / docHeight) * 100, 0), 100);

            setReadingProgress(progress);
            setIsVisible(scrollTop > 200);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Extract and setup headings
    useEffect(() => {
        const headings = extractHeadings(content);
        setTocItems(headings);

        if (headings.length > 0) {
            // Clean up previous observer
            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            // Set up intersection observer
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    const visibleEntries = entries.filter(entry => entry.isIntersecting);
                    if (visibleEntries.length > 0) {
                        // Find the entry that's most visible
                        const mostVisible = visibleEntries.reduce((prev, current) => {
                            return current.intersectionRatio > prev.intersectionRatio ? current : prev;
                        });
                        setActiveId(mostVisible.target.id);
                    }
                },
                {
                    rootMargin: '-100px 0px -66%',
                    threshold: [0, 0.25, 0.5, 0.75, 1]
                }
            );

            // Observe headings after DOM is ready
            const timer = setTimeout(() => {
                headings.forEach(({ id }) => {
                    const element = document.getElementById(id);
                    if (element && observerRef.current) {
                        observerRef.current.observe(element);
                    }
                });
            }, 100);

            return () => {
                clearTimeout(timer);
                if (observerRef.current) {
                    observerRef.current.disconnect();
                }
            };
        }
    }, [content]);

    const extractHeadings = useCallback((htmlContent: string): TocItem[] => {
        // For server-side rendered content, extract from HTML
        if (typeof window !== 'undefined') {
            const contentContainer = document.querySelector('.content-area');
            if (contentContainer) {
                const headingElements = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
                return Array.from(headingElements).map((heading) => {
                    const text = heading.textContent || '';
                    const level = parseInt(heading.tagName.charAt(1));
                    const id = heading.id || generateId(text);

                    // Ensure heading has an ID
                    if (!heading.id) {
                        heading.id = id;
                    }

                    return {
                        id,
                        title: text.replace(/^\d+\.?\s*/, ''), // Remove numbering
                        level
                    };
                }).filter(item => item.title.length > 0);
            }
        }

        // Fallback: parse from HTML string
        const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
        if (parser) {
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

            return Array.from(headings).map((heading) => {
                const text = heading.textContent || '';
                const level = parseInt(heading.tagName.charAt(1));
                const id = generateId(text);

                return {
                    id,
                    title: text.replace(/^\d+\.?\s*/, ''),
                    level
                };
            }).filter(item => item.title.length > 0);
        }

        return [];
    }, []);

    const generateId = (text: string): string => {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
    };

    const handleTocClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }

        // Collapse on mobile after navigation
        if (isMobile) {
            setIsExpanded(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const toggleCollapsed = () => {
        setIsCollapsed(!isCollapsed);
    };

    const increaseFontSize = () => {
        if (fontSize < 24) {
            setFontSize(prev => Math.min(24, prev + 2));
        }
    };

    const decreaseFontSize = () => {
        if (fontSize > 12) {
            setFontSize(prev => Math.max(12, prev - 2));
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const handleShare = async () => {
        if (navigator.share && contentTitle) {
            try {
                await navigator.share({
                    title: contentTitle,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                // You could add a toast notification here
                console.log('URL copied to clipboard');
            } catch (error) {
                console.error('Failed to copy URL');
            }
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            console.log('URL copied to clipboard');
        } catch (error) {
            console.error('Failed to copy URL');
        }
    };

    const handleCopyText = async () => {
        try {
            const contentElement = document.querySelector('.content-area');
            if (contentElement) {
                const textContent = contentElement.textContent || '';
                await navigator.clipboard.writeText(textContent);
                console.log('Content copied to clipboard');
            }
        } catch (error) {
            console.error('Failed to copy content');
        }
    };

    const handlePrint = () => {
        // Add print-friendly styles temporarily
        document.body.classList.add('print-mode');

        // Small delay to ensure styles are applied
        setTimeout(() => {
            window.print();
            document.body.classList.remove('print-mode');
        }, 100);
    };

    if (tocItems.length === 0) {
        return null;
    }

    // Actions Menu Component
    const ActionsMenu = ({ isMobile: mobile }: { isMobile: boolean }) => (
        <Popover placement={mobile ? "bottom" : "bottom-end"} offset={10}>
            <PopoverTrigger>
                <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    aria-label="More actions"
                >
                    <TbMenu2 size={16} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 gap-2">
                <Button
                    size="sm"
                    variant="flat"
                    onPress={handleShare}
                    startContent={<TbShare size={16} />}
                    fullWidth
                >
                    Share
                </Button>
                <Button
                    size="sm"
                    variant="flat"
                    onPress={handleCopyLink}
                    startContent={<TbCopy size={16} />}
                    fullWidth
                >
                    Copy Link
                </Button>
                <Button
                    size="sm"
                    variant="flat"
                    onPress={handleCopyText}
                    startContent={<TbFileText size={16} />}
                    fullWidth
                >
                    Copy Text
                </Button>
                <Button
                    size="sm"
                    variant="flat"
                    onPress={handlePrint}
                    startContent={<TbPrinter size={16} />}
                    fullWidth
                >
                    Print
                </Button>
            </PopoverContent>
        </Popover>
    );

    // Mobile floating ToC
    if (isMobile) {
        return (
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ duration: 0.3 }}
                        className="table-of-contents fixed bottom-4 left-4 right-4 z-40"
                    >
                        <Card className="bg-background/95 backdrop-blur-md border border-divider shadow-lg">
                            <CardBody className="p-3">
                                {/* Collapsed header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TbList size={18} className="text-primary" />
                                        <span className="text-sm font-medium">{tocItems.length} chapters</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {onAccessibilityClick && (
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="flat"
                                                onPress={onAccessibilityClick}
                                                aria-label="Open accessibility settings"
                                            >
                                                <TbAccessible size={16} />
                                            </Button>
                                        )}
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="flat"
                                            onPress={scrollToTop}
                                            aria-label="Scroll to top"
                                        >
                                            <TbArrowUp size={16} />
                                        </Button>
                                        <ActionsMenu isMobile={true} />
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="flat"
                                            onPress={toggleExpanded}
                                            aria-label={isExpanded ? "Collapse menu" : "Expand menu"}
                                        >
                                            {isExpanded ? <TbChevronDown size={16} /> : <TbChevronUp size={16} />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <Progress
                                    value={readingProgress}
                                    color="primary"
                                    size="sm"
                                    className="mt-2"
                                />

                                {/* Expanded content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <Divider className="my-3" />
                                            <nav className="max-h-60 overflow-y-auto">
                                                <ul className="space-y-1">
                                                    {tocItems.map((item) => (
                                                        <li key={item.id}>
                                                            <button
                                                                onClick={() => handleTocClick(item.id)}
                                                                className={`
                                                                    w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors
                                                                    hover:bg-primary-100 hover:text-primary
                                                                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                                                                    ${activeId === item.id
                                                                        ? 'bg-primary-100 text-primary font-medium border-l-2 border-primary'
                                                                        : 'text-foreground'
                                                                    }
                                                                    ${item.level === 1 ? 'font-semibold' : ''}
                                                                    ${item.level === 2 ? 'ml-3 text-sm' : ''}
                                                                    ${item.level === 3 ? 'ml-6 text-xs' : ''}
                                                                    ${item.level > 3 ? 'ml-9 text-xs text-default-600' : ''}
                                                                `}
                                                            >
                                                                <span className="text-default-500 inline-block min-w-[24px] mr-1">
                                                                    {item.level === 1 ? `${tocItems.indexOf(item) + 1}` :
                                                                        item.level === 2 ? `.${tocItems.filter(t => t.level === 1).indexOf(tocItems.find(t => t.level === 1 && t.id <= item.id) || tocItems[0]) + 1}.${tocItems.filter(t => t.level === 2 && t.id <= item.id).length}` :
                                                                            item.level === 3 ? `.${tocItems.filter(t => t.level === 1).indexOf(tocItems.find(t => t.level === 1 && t.id <= item.id) || tocItems[0]) + 1}.${tocItems.filter(t => t.level === 2).indexOf(tocItems.find(t => t.level === 2 && t.id <= item.id) || tocItems[0]) + 1}${tocItems.filter(t => t.level === 3 && t.id <= item.id).length}` : ''}
                                                                </span>
                                                                {item.title}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </nav>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardBody>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    // Desktop sticky sidebar
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={tocRef}
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className={`table-of-contents fixed left-6 top-24 bottom-6 w-80 z-30 ${className}`}
                >
                    <Card className="h-full bg-background/95 backdrop-blur-md border border-divider shadow-lg flex flex-col">
                        <CardBody className="p-4 flex-1 flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center  gap-2">
                                    <TbList size={20} className="text-primary" />
                                </div>

                                <div className="flex items-center gap-1">
                                    {onAccessibilityClick && (
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="flat"
                                            onPress={onAccessibilityClick}
                                            aria-label="Open accessibility settings"
                                        >
                                            <TbAccessible size={16} />
                                        </Button>
                                    )}
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="flat"
                                        onPress={scrollToTop}
                                        aria-label="Scroll to top"
                                    >
                                        <TbArrowUp size={16} />
                                    </Button>
                                    <ActionsMenu isMobile={false} />
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="flat"
                                        onPress={toggleCollapsed}
                                        aria-label={isCollapsed ? "Expand" : "Collapse"}
                                    >
                                        {isCollapsed ? <TbChevronDown size={16} /> : <TbChevronUp size={16} />}
                                    </Button>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-default-600 mb-1">
                                    <span>Reading Progress</span>
                                    <span>{Math.round(readingProgress)}%</span>
                                </div>
                                <Progress
                                    value={readingProgress}
                                    color="primary"
                                    size="sm"
                                />
                            </div>

                            <Divider className="mb-4" />

                            {/* Navigation */}
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.nav
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-1 overflow-y-auto"
                                    >
                                        <ul className="space-y-1 pr-2">
                                            {tocItems.map((item) => (
                                                <li key={item.id}>
                                                    <button
                                                        onClick={() => handleTocClick(item.id)}
                                                        className={`
                                                            w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200
                                                            hover:bg-primary-100 hover:text-primary hover:scale-[1.02]
                                                            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                                                            ${activeId === item.id
                                                                ? 'bg-primary-100 text-primary font-medium border-l-3 border-primary shadow-sm'
                                                                : 'text-foreground hover:shadow-sm'
                                                            }
                                                            ${item.level === 1 ? 'font-semibold text-base' : ''}
                                                            ${item.level === 2 ? 'ml-4 text-sm' : ''}
                                                            ${item.level === 3 ? 'ml-8 text-xs' : ''}
                                                            ${item.level > 3 ? 'ml-12 text-xs text-default-600' : ''}
                                                        `}
                                                        title={item.title}
                                                    >
                                                        <span className="line-clamp-2">{item.title}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.nav>
                                )}
                            </AnimatePresence>
                        </CardBody>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}