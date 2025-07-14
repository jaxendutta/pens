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
    TbCopy,
    TbFileText,
    TbPlus,
    TbMinus,
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
    useChapterCards?: boolean; // Add this to trigger re-initialization when rendering mode changes
}

// Shared ToC Navigation Component
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

// Shared Actions Menu Component
interface ActionsMenuProps {
    contentTitle?: string;
    onShare: () => void;
    onCopyLink: () => void;
    onCopyText: () => void;
    onPrint: () => void;
    fontSize: number;
    onIncreaseFontSize: () => void;
    onDecreaseFontSize: () => void;
    onToggleTheme: () => void;
    isMobile: boolean;
}

const ActionsMenu = ({
    onShare, onCopyLink, onCopyText, onPrint,
    fontSize, onIncreaseFontSize, onDecreaseFontSize, onToggleTheme,
    isMobile
}: ActionsMenuProps) => (
    <Popover placement={isMobile ? "bottom" : "bottom-end"} offset={10} shouldCloseOnBlur>
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
        <PopoverContent className="p-3">
            <div className="space-y-3">
                {/* Font Size Controls */}
                <div>
                    <div className="text-sm font-semibold mb-2">Font Size</div>
                    <div className="flex items-center gap-2">
                        <Button
                            isIconOnly
                            variant="flat"
                            size="sm"
                            onPress={onDecreaseFontSize}
                            isDisabled={fontSize <= 12}
                        >
                            <TbMinus size={16} />
                        </Button>
                        <span className="text-sm min-w-[3rem] text-center">{fontSize}px</span>
                        <Button
                            isIconOnly
                            variant="flat"
                            size="sm"
                            onPress={onIncreaseFontSize}
                            isDisabled={fontSize >= 24}
                        >
                            <TbPlus size={16} />
                        </Button>
                    </div>
                </div>

                <Divider />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        size="sm"
                        variant="flat"
                        onPress={onShare}
                        startContent={<TbShare size={16} />}
                    >
                        Share
                    </Button>
                    <Button
                        size="sm"
                        variant="flat"
                        onPress={onCopyLink}
                        startContent={<TbCopy size={16} />}
                    >
                        Copy Link
                    </Button>
                    <Button
                        size="sm"
                        variant="flat"
                        onPress={onCopyText}
                        startContent={<TbFileText size={16} />}
                    >
                        Copy Text
                    </Button>
                    <Button
                        size="sm"
                        variant="flat"
                        onPress={onPrint}
                        startContent={<TbPrinter size={16} />}
                    >
                        Print
                    </Button>
                </div>
            </div>
        </PopoverContent>
    </Popover>
);

export function TableOfContents({
    content,
    className = "",
    onAccessibilityClick,
    contentTitle,
    useChapterCards = false
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

    // Apply font size changes to content and headings
    useEffect(() => {
        const contentElements = document.querySelectorAll('.content-area');
        contentElements.forEach(el => {
            const element = el as HTMLElement;
            element.style.fontSize = `${fontSize}px`;

            // Also update heading sizes proportionally
            const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(heading => {
                const headingEl = heading as HTMLElement;
                const level = parseInt(heading.tagName.charAt(1));

                // Scale headings proportionally to base font size
                const scaleFactor = fontSize / 16; // 16px is base
                const baseSizes = {
                    1: 32, // 2rem at 16px base
                    2: 24, // 1.5rem
                    3: 20, // 1.25rem
                    4: 18, // 1.125rem
                    5: 16, // 1rem
                    6: 14  // 0.875rem
                };

                headingEl.style.fontSize = `${baseSizes[level as keyof typeof baseSizes] * scaleFactor}px`;
            });
        });

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

    // Extract and setup headings with proper numbering - need to re-run when content rendering changes
    useEffect(() => {
        const headings = extractHeadings(content);
        setTocItems(headings);
    }, [content]);

    // Separate effect for intersection observer that depends on both content and DOM structure
    useEffect(() => {
        if (tocItems.length === 0) return;

        // Clean up previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        // Reset active ID when switching modes
        setActiveId('');

        observerRef.current = new IntersectionObserver(
            (entries) => {
                // Get all currently intersecting headings
                const intersectingEntries = entries.filter(entry => entry.isIntersecting);

                if (intersectingEntries.length > 0) {
                    // Sort by their position on screen (top to bottom)
                    intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                    // Use the first (topmost) intersecting heading
                    setActiveId(intersectingEntries[0].target.id);
                } else {
                    // If no headings are intersecting, find the one just above the viewport
                    const allEntries = entries.filter(entry => entry.boundingClientRect.top < 0);
                    if (allEntries.length > 0) {
                        // Sort by position and take the last one (closest to viewport)
                        allEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                        setActiveId(allEntries[allEntries.length - 1].target.id);
                    }
                }
            },
            {
                rootMargin: '-20% 0px -70% 0px', // Trigger when heading is 20% from top
                threshold: [0, 0.25, 0.5, 0.75, 1]
            }
        );

        // Use a longer timeout to ensure DOM has updated after mode switch
        const timer = setTimeout(() => {
            let foundElements = 0;
            const maxRetries = 10;
            let retryCount = 0;

            const tryObserveElements = () => {
                foundElements = 0;
                tocItems.forEach(({ id }) => {
                    const element = document.getElementById(id);
                    if (element && observerRef.current) {
                        observerRef.current.observe(element);
                        foundElements++;
                    }
                });

                // If we didn't find all elements and haven't hit max retries, try again
                if (foundElements < tocItems.length && retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(tryObserveElements, 100);
                }
            };

            tryObserveElements();
        }, 200); // Increased timeout for mode switches

        return () => {
            clearTimeout(timer);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [tocItems, useChapterCards]); // Re-run when tocItems change or when switching between modes

    const extractHeadings = useCallback((htmlContent: string): TocItem[] => {
        if (typeof window !== 'undefined') {
            const contentContainer = document.querySelector('.content-area');
            if (contentContainer) {
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

                    // Generate chapter numbers - format: "X (title)" with space but no period
                    let number = '';
                    if (level === 1) {
                        chapterCount++;
                        sectionCounts[1] = chapterCount;
                        // Reset subsection counts
                        for (let i = 2; i <= 6; i++) {
                            sectionCounts[i] = 0;
                        }
                        number = `${chapterCount}`;
                    } else if (level === 2 && sectionCounts[1]) {
                        sectionCounts[2] = (sectionCounts[2] || 0) + 1;
                        // Reset deeper subsection counts
                        for (let i = 3; i <= 6; i++) {
                            sectionCounts[i] = 0;
                        }
                        number = `${sectionCounts[1]}.${sectionCounts[2]}`;
                    } else if (level === 3 && sectionCounts[2]) {
                        sectionCounts[3] = (sectionCounts[3] || 0) + 1;
                        number = `${sectionCounts[1]}.${sectionCounts[2]}.${sectionCounts[3]}`;
                    }

                    return {
                        id,
                        title: text.replace(/^\d+\.?\s*/, ''), // Remove existing numbering
                        level,
                        number
                    };
                }).filter(item => item.title.length > 0);
            }
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

        if (isMobile) {
            setIsExpanded(false);
        }
    };

    // Action handlers
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            try {
                await navigator.clipboard.writeText(window.location.href);
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
        document.body.classList.add('print-mode');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('print-mode');
        }, 100);
    };

    if (tocItems.length === 0) {
        return null;
    }

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
                                {/* Header */}
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
                                        <ActionsMenu
                                            contentTitle={contentTitle}
                                            onShare={handleShare}
                                            onCopyLink={handleCopyLink}
                                            onCopyText={handleCopyText}
                                            onPrint={handlePrint}
                                            fontSize={fontSize}
                                            onIncreaseFontSize={increaseFontSize}
                                            onDecreaseFontSize={decreaseFontSize}
                                            onToggleTheme={toggleTheme}
                                            isMobile={true}
                                        />
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="flat"
                                            onPress={() => setIsExpanded(!isExpanded)}
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

    // Desktop sticky sidebar
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
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-1">
                                    <TbList size={16} className="text-primary" />
                                    <span className="text-sm font-medium">Chapters</span>
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
                                    <ActionsMenu
                                        contentTitle={contentTitle}
                                        onShare={handleShare}
                                        onCopyLink={handleCopyLink}
                                        onCopyText={handleCopyText}
                                        onPrint={handlePrint}
                                        fontSize={fontSize}
                                        onIncreaseFontSize={increaseFontSize}
                                        onDecreaseFontSize={decreaseFontSize}
                                        onToggleTheme={toggleTheme}
                                        isMobile={false}
                                    />
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="flat"
                                        onPress={() => setIsCollapsed(!isCollapsed)}
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