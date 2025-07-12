'use client';

import { useState, useEffect } from 'react';
import {
    Button,
    Tooltip,
    Card,
    CardBody,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TbShare,
    TbPrinter,
    TbArrowUp,
    TbBookmark,
    TbMenu2,
    TbX,
    TbMinus,
    TbPlus,
    TbPalette,
} from "react-icons/tb";
import { useTheme } from 'next-themes';

interface FloatingActionBarProps {
    contentTitle?: string;
    contentUrl?: string;
    showReadingProgress?: boolean;
}

export function FloatingActionBar({
    contentTitle,
    contentUrl,
    showReadingProgress = false
}: FloatingActionBarProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [fontSize, setFontSize] = useState(16);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
                setIsExpanded(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    useEffect(() => {
        // Apply font size to content
        const contentElements = document.querySelectorAll('.prose');
        contentElements.forEach(el => {
            (el as HTMLElement).style.fontSize = `${fontSize}px`;
        });
    }, [fontSize]);

    const handleShare = async () => {
        if (navigator.share && contentTitle && contentUrl) {
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
            navigator.clipboard.writeText(window.location.href);
        }
        setIsExpanded(false);
    };

    const handlePrint = () => {
        window.print();
        setIsExpanded(false);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsExpanded(false);
    };

    const increaseFontSize = () => {
        if (fontSize < 24) setFontSize(prev => prev + 2);
    };

    const decreaseFontSize = () => {
        if (fontSize > 12) setFontSize(prev => prev - 2);
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
        setIsExpanded(false);
    };

    const actionButtons = [
        {
            icon: TbArrowUp,
            label: 'Scroll to top',
            action: scrollToTop,
            color: 'default' as const,
        },
        {
            icon: TbShare,
            label: 'Share',
            action: handleShare,
            color: 'primary' as const,
        },
        {
            icon: TbPrinter,
            label: 'Print',
            action: handlePrint,
            color: 'default' as const,
        },
        {
            icon: TbPalette,
            label: 'Toggle theme',
            action: toggleTheme,
            color: 'secondary' as const,
        },
    ];

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Desktop - Vertical on the right */}
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ duration: 0.3 }}
                        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:block"
                    >
                        <Card className="bg-background/80 backdrop-blur-md border border-divider shadow-lg">
                            <CardBody className="p-2">
                                <div className="flex flex-col gap-1">
                                    {/* Main toggle button */}
                                    <Tooltip content={isExpanded ? "Close menu" : "Open menu"} placement="left">
                                        <Button
                                            isIconOnly
                                            variant="flat"
                                            size="sm"
                                            onPress={() => setIsExpanded(!isExpanded)}
                                            className="mb-2"
                                        >
                                            {isExpanded ? <TbX size={18} /> : <TbMenu2 size={18} />}
                                        </Button>
                                    </Tooltip>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex flex-col gap-1"
                                            >
                                                {/* Font size controls */}
                                                <div className="flex flex-col gap-1 mb-2 pb-2 border-b border-divider">
                                                    <Tooltip content="Increase font size" placement="left">
                                                        <Button
                                                            isIconOnly
                                                            variant="flat"
                                                            size="sm"
                                                            onPress={increaseFontSize}
                                                            isDisabled={fontSize >= 24}
                                                        >
                                                            <TbPlus size={16} />
                                                        </Button>
                                                    </Tooltip>

                                                    <div className="text-xs text-center py-1 text-default-600">
                                                        {fontSize}px
                                                    </div>

                                                    <Tooltip content="Decrease font size" placement="left">
                                                        <Button
                                                            isIconOnly
                                                            variant="flat"
                                                            size="sm"
                                                            onPress={decreaseFontSize}
                                                            isDisabled={fontSize <= 12}
                                                        >
                                                            <TbMinus size={16} />
                                                        </Button>
                                                    </Tooltip>
                                                </div>

                                                {/* Action buttons */}
                                                {actionButtons.map((button, index) => {
                                                    const Icon = button.icon;
                                                    return (
                                                        <Tooltip key={index} content={button.label} placement="left">
                                                            <Button
                                                                isIconOnly
                                                                variant="flat"
                                                                size="sm"
                                                                color={button.color}
                                                                onPress={button.action}
                                                            >
                                                                <Icon size={18} />
                                                            </Button>
                                                        </Tooltip>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Mobile - Horizontal at the bottom */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ duration: 0.3 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden"
                    >
                        <Card className="bg-background/90 backdrop-blur-md border border-divider shadow-lg">
                            <CardBody className="p-2">
                                <div className="flex items-center gap-1">
                                    {/* Quick actions always visible on mobile */}
                                    <Button
                                        isIconOnly
                                        variant="flat"
                                        size="sm"
                                        onPress={scrollToTop}
                                    >
                                        <TbArrowUp size={18} />
                                    </Button>

                                    <Button
                                        isIconOnly
                                        variant="flat"
                                        size="sm"
                                        onPress={handleShare}
                                        color="primary"
                                    >
                                        <TbShare size={18} />
                                    </Button>

                                    {/* More options in popover */}
                                    <Popover placement="top" offset={10}>
                                        <PopoverTrigger>
                                            <Button
                                                isIconOnly
                                                variant="flat"
                                                size="sm"
                                            >
                                                <TbMenu2 size={18} />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-4">
                                            <div className="space-y-3">
                                                <div className="text-sm font-semibold">Font Size</div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        isIconOnly
                                                        variant="flat"
                                                        size="sm"
                                                        onPress={decreaseFontSize}
                                                        isDisabled={fontSize <= 12}
                                                    >
                                                        <TbMinus size={16} />
                                                    </Button>
                                                    <span className="text-sm min-w-[3rem] text-center">{fontSize}px</span>
                                                    <Button
                                                        isIconOnly
                                                        variant="flat"
                                                        size="sm"
                                                        onPress={increaseFontSize}
                                                        isDisabled={fontSize >= 24}
                                                    >
                                                        <TbPlus size={16} />
                                                    </Button>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        onPress={handlePrint}
                                                        startContent={<TbPrinter size={16} />}
                                                    >
                                                        Print
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        color="secondary"
                                                        onPress={toggleTheme}
                                                        startContent={<TbPalette size={16} />}
                                                    >
                                                        Theme
                                                    </Button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}