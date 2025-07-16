// components/ui/table-of-contents.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardBody, Button, Progress, Divider, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from 'next-themes';
import {
    TbList,
    TbListDetails,
    TbX,
    TbAccessible,
    TbArrowUp,
    TbShare,
    TbPrinter,
    TbCopy,
    TbFileText,
    TbFileExport,
} from "react-icons/tb";

interface TocItem {
    id: string;
    title: string;
    level: number;
    number?: string;
}

interface TableOfContentsProps {
    content: string;
    className?: string;
    onAccessibilityClick?: () => void;
    contentTitle?: string;
    useChapterCards?: boolean;
}

// Custom hooks for shared logic
function useResponsive() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
}

function useScrollProgress() {
    const [readingProgress, setReadingProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

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

    return { readingProgress, isVisible };
}

function useHeadings(content: string, useChapterCards: boolean) {
    const [tocItems, setTocItems] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [isScrolling, setIsScrolling] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const generateId = (text: string): string => {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
    };

    const extractHeadings = useCallback((): TocItem[] => {
        const contentContainer = document.querySelector('.content-area');
        if (!contentContainer) return [];

        const headingElements = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let chapterCount = 0;
        const sectionCounts: { [key: number]: number } = {};

        return Array.from(headingElements).map((heading) => {
            const text = heading.textContent || '';
            const level = parseInt(heading.tagName.charAt(1));
            const id = heading.id || generateId(text);

            if (!heading.id) {
                heading.id = id;
            }

            let number = '';
            if (level === 1) {
                chapterCount++;
                sectionCounts[1] = chapterCount;
                for (let i = 2; i <= 6; i++) sectionCounts[i] = 0;
                number = `${chapterCount}`;
            } else if (level === 2 && sectionCounts[1]) {
                sectionCounts[2] = (sectionCounts[2] || 0) + 1;
                for (let i = 3; i <= 6; i++) sectionCounts[i] = 0;
                number = `${sectionCounts[1]}.${sectionCounts[2]}`;
            } else if (level === 3 && sectionCounts[2]) {
                sectionCounts[3] = (sectionCounts[3] || 0) + 1;
                number = `${sectionCounts[1]}.${sectionCounts[2]}.${sectionCounts[3]}`;
            }

            return {
                id,
                title: text.replace(/^\d+\.?\s*/, ''),
                level,
                number
            };
        }).filter(item => item.title.length > 0);
    }, []);

    // Extract headings when content changes
    useEffect(() => {
        const headings = extractHeadings();
        setTocItems(headings);
        setActiveId(''); // Reset active ID
    }, [content, extractHeadings]);

    // Setup intersection observer
    useEffect(() => {
        if (tocItems.length === 0) return;

        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                // Don't update active heading while manually scrolling
                if (isScrolling) return;

                const intersectingEntries = entries.filter(entry => entry.isIntersecting);

                if (intersectingEntries.length > 0) {
                    intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                    setActiveId(intersectingEntries[0].target.id);
                } else {
                    const allEntries = entries.filter(entry => entry.boundingClientRect.top < 0);
                    if (allEntries.length > 0) {
                        allEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                        setActiveId(allEntries[allEntries.length - 1].target.id);
                    }
                }
            },
            {
                rootMargin: '-20% 0px -70% 0px',
                threshold: [0, 0.25, 0.5, 0.75, 1]
            }
        );

        // Observe elements with a simple retry mechanism
        const observeElements = () => {
            tocItems.forEach(({ id }) => {
                const element = document.getElementById(id);
                if (element && observerRef.current) {
                    observerRef.current.observe(element);
                }
            });
        };

        // Small delay to ensure DOM is ready after mode switches
        const timer = setTimeout(observeElements, 100);

        return () => {
            clearTimeout(timer);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [tocItems, useChapterCards, isScrolling]);

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            // Set scrolling flag to prevent intersection observer interference
            setIsScrolling(true);

            // Use the built-in scroll-margin that's already set in CSS (scroll-mt-32 = 128px)
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Clear scrolling flag after scroll animation completes
            setTimeout(() => {
                setIsScrolling(false);
                setActiveId(id); // Manually set the active heading
            }, 1000);
        }
    };

    return { tocItems, activeId, scrollToHeading };
}

// Shared components
interface TocNavigationProps {
    tocItems: TocItem[];
    activeId: string;
    onItemClick: (id: string) => void;
    compact?: boolean;
}

const TocNavigation = ({ tocItems, activeId, onItemClick, compact = false }: TocNavigationProps) => (
    <nav className={`${compact ? 'max-h-60' : 'flex-1'} overflow-y-auto`}>
        <ul className={`space-y-1 ${!compact && 'pr-2'}`}>
            {tocItems.map((item) => (
                <li key={item.id}>
                    <button
                        onClick={() => onItemClick(item.id)}
                        className={`
                            w-full text-left ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} rounded-lg text-sm transition-all duration-200
                            hover:bg-primary-100 hover:text-primary hover:scale-[1.02]
                            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                            ${activeId === item.id
                                ? 'bg-primary-100 text-primary font-medium border-l-3 border-primary shadow-sm'
                                : 'text-foreground hover:shadow-sm'
                            }
                            ${item.level === 1 ? 'font-semibold' : ''}
                            ${item.level === 2 ? `ml-${compact ? '3' : '4'} text-sm` : ''}
                            ${item.level === 3 ? `ml-${compact ? '6' : '8'} text-xs` : ''}
                            ${item.level > 3 ? `ml-${compact ? '9' : '12'} text-xs text-default-600` : ''}
                        `}
                        title={item.title}
                    >
                        <span className="flex items-center gap-2">
                            {item.number && (
                                <span className="text-default-500 font-medium min-w-fit">
                                    {item.number}
                                </span>
                            )}
                            <span className={compact ? "line-clamp-2" : ""}>{item.title}</span>
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    </nav>
);

interface ShareMenuProps {
    contentTitle?: string;
    isMobile: boolean;
}

const ShareMenu = ({ contentTitle, isMobile }: ShareMenuProps) => {
    const { setTheme, theme } = useTheme();

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
            try {
                await navigator.clipboard.writeText(window.location.href);
            } catch (error) {
                console.error('Failed to copy URL');
            }
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
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
            }
        } catch (error) {
            console.error('Failed to copy content');
        }
    };

    const handlePrint = () => {
        document.body.classList.add('print-mode');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('print-mode');
        }, 100);
    };

    return (
        <Popover placement={isMobile ? "bottom" : "bottom-end"} offset={10} shouldCloseOnBlur>
            <PopoverTrigger>
                <Button isIconOnly size="sm" variant="flat" aria-label="Export options">
                    <TbFileExport size={16} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-3">
                <div className="space-y-3">
                    <div className="text-sm font-semibold mb-2">Export Options</div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="flat" onPress={handleShare} startContent={<TbShare size={16} />}>
                            Share
                        </Button>
                        <Button size="sm" variant="flat" onPress={handleCopyLink} startContent={<TbCopy size={16} />}>
                            Copy Link
                        </Button>
                        <Button size="sm" variant="flat" onPress={handleCopyText} startContent={<TbFileText size={16} />}>
                            Copy Text
                        </Button>
                        <Button size="sm" variant="flat" onPress={handlePrint} startContent={<TbPrinter size={16} />}>
                            Print
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

// Main component
export function TableOfContents({
    content,
    className = "",
    onAccessibilityClick,
    contentTitle,
    useChapterCards = false
}: TableOfContentsProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isMobile = useResponsive();
    const { readingProgress, isVisible } = useScrollProgress();
    const { tocItems, activeId, scrollToHeading } = useHeadings(content, useChapterCards);

    useEffect(() => {
        setIsExpanded(!isMobile);
    }, [isMobile]);

    const handleTocClick = (id: string) => {
        scrollToHeading(id);

        // For mobile, delay collapse to allow scroll to complete
        if (isMobile) {
            setTimeout(() => setIsExpanded(false), 1200); // Slightly longer than scroll animation
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (tocItems.length === 0) return null;

    // Mobile version
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
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TbList size={18} className="text-primary" />
                                        <span className="text-sm font-medium">{tocItems.length} chapters</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {onAccessibilityClick && (
                                            <Button
                                                isIconOnly size="sm" variant="flat"
                                                onPress={onAccessibilityClick}
                                                aria-label="Open accessibility settings"
                                            >
                                                <TbAccessible size={16} />
                                            </Button>
                                        )}
                                        <Button
                                            isIconOnly size="sm" variant="flat"
                                            onPress={scrollToTop}
                                            aria-label="Scroll to top"
                                        >
                                            <TbArrowUp size={16} />
                                        </Button>
                                        <ShareMenu
                                            contentTitle={contentTitle}
                                            isMobile={true}
                                        />
                                        <Button
                                            isIconOnly size="sm" variant="flat"
                                            onPress={() => setIsExpanded(!isExpanded)}
                                            aria-label={isExpanded ? "Close chapters" : "Show chapters"}
                                        >
                                            {isExpanded ? <TbX size={16} /> : <TbListDetails size={16} />}
                                        </Button>
                                    </div>
                                </div>

                                <Progress value={readingProgress} color="primary" size="sm" className="mt-2" />

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
                                            <TocNavigation
                                                tocItems={tocItems}
                                                activeId={activeId}
                                                onItemClick={handleTocClick}
                                                compact={true}
                                            />
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

    // Desktop version
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className={`table-of-contents fixed left-6 top-24 bottom-6 w-80 z-30 ${className}`}
                >
                    <Card className="h-full bg-background/95 backdrop-blur-md border border-divider shadow-lg flex flex-col">
                        <CardBody className="p-4 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-1">
                                    <TbList size={16} className="text-primary" />
                                    <span className="text-sm font-medium">Chapters</span>
                                </div>

                                <div className="flex items-center gap-1">
                                    {onAccessibilityClick && (
                                        <Button
                                            isIconOnly size="sm" variant="flat"
                                            onPress={onAccessibilityClick}
                                            aria-label="Open accessibility settings"
                                        >
                                            <TbAccessible size={16} />
                                        </Button>
                                    )}
                                    <Button
                                        isIconOnly size="sm" variant="flat"
                                        onPress={scrollToTop}
                                        aria-label="Scroll to top"
                                    >
                                        <TbArrowUp size={16} />
                                    </Button>
                                    <ShareMenu
                                        contentTitle={contentTitle}
                                        isMobile={false}
                                    />
                                    <Button
                                        isIconOnly size="sm" variant="flat"
                                        onPress={() => setIsCollapsed(!isCollapsed)}
                                        aria-label={isCollapsed ? "Show chapters" : "Hide chapters"}
                                    >
                                        {isCollapsed ? <TbListDetails size={16} /> : <TbX size={16} />}
                                    </Button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-default-600 mb-1">
                                    <span>Reading Progress</span>
                                    <span>{Math.round(readingProgress)}%</span>
                                </div>
                                <Progress value={readingProgress} color="primary" size="sm" />
                            </div>

                            <Divider className="mb-4" />

                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-1 overflow-hidden"
                                    >
                                        <TocNavigation
                                            tocItems={tocItems}
                                            activeId={activeId}
                                            onItemClick={handleTocClick}
                                            compact={false}
                                        />
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