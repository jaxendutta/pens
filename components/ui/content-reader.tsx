'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    ButtonGroup,
    Chip,
    Divider,
    Spacer,
    Tooltip,
} from "@heroui/react";
import { Link } from "@heroui/link";
import NextLink from "next/link";
import { motion } from "framer-motion";
import {
    TbArrowLeft,
    TbCopy,
    TbClock,
    TbFileText,
    TbCalendar,
    TbLink,
    TbTag,
    TbShare,
    TbPrinter,
    TbLock,
    TbLockOpen,
} from "react-icons/tb";
import { ContentItem } from '@/lib/types';
import { formatDate } from '@/lib/content';
import { ReadingProgress } from './reading-progress';
import { PasswordModal } from './password-modal';

interface ContentReaderProps {
    content: ContentItem;
    type: 'pieces' | 'poems';
}

const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

export function ContentReader({ content, type }: ContentReaderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [estimatedReadTime, setEstimatedReadTime] = useState(0);

    const isPieces = type === 'pieces';
    const isProtected = Boolean(content.password);

    useEffect(() => {
        // Check if user has already authenticated for this content
        const hasAccess = sessionStorage.getItem(`access_${type}_${content.slug}`) === 'granted';
        setIsAuthenticated(!isProtected || hasAccess);

        if (isProtected && !hasAccess) {
            setShowPasswordModal(true);
        }

        // Calculate reading progress based on scroll
        const updateReadTime = () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            const timeElapsed = (scrollPercent / 100) * content.readingTime;
            setEstimatedReadTime(Math.round(timeElapsed));
        };

        window.addEventListener('scroll', updateReadTime);
        return () => window.removeEventListener('scroll', updateReadTime);
    }, [content.slug, content.readingTime, isProtected, type]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: content.title,
                    text: content.excerpt,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Share cancelled or failed');
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const metadata = [
        {
            icon: TbCalendar,
            text: formatDate(content.date),
        },
        {
            icon: TbClock,
            text: `${content.readingTime} min read`,
        },
        {
            icon: TbFileText,
            text: `${content.wordCount.toLocaleString()} words`,
        },
    ]

    const actionButtons = [
        {
            icon: TbLink,
            label: 'Link',
            onClick: () => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        },
        {
            icon: TbShare,
            label: 'Share',
            onClick: handleShare,
        },
        {
            icon: TbCopy,
            label: 'Copy',
            onClick: () => {
                navigator.clipboard.writeText(content.content);
                alert('Content copied to clipboard!');
            },
        },
        {
            icon: TbPrinter,
            label: 'Print',
            onClick: handlePrint,
        },

    ]

    if (!isAuthenticated) {
        return (
            <>
                <ReadingProgress />
                <div className="min-h-screen flex items-center justify-center">
                    <Card className="max-w-md">
                        <CardBody className="text-center p-8">
                            <TbLock size={48} className="text-warning mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Protected Content</h3>
                            <p className="text-default-600 mb-4">
                                This {isPieces ? 'story' : 'poem'} requires authentication to access.
                            </p>
                            <Button
                                color="primary"
                                onPress={() => setShowPasswordModal(true)}
                                startContent={<TbLockOpen size={16} />}
                            >
                                Enter Password
                            </Button>
                        </CardBody>
                    </Card>
                </div>

                {showPasswordModal && (
                    <PasswordModal
                        isOpen={showPasswordModal}
                        onClose={() => setShowPasswordModal(false)}
                        contentSlug={content.slug}
                        type={type}
                    />
                )}
            </>
        );
    }

    return (
        <div className="min-h-screen">
            <ReadingProgress />

            <div className="container mx-auto lg:px-6 px-2 py-12 max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                    {/* Back Navigation */}
                    <Tooltip content={`Back`}>
                        <Button
                            isIconOnly
                            as={NextLink}
                            href={`/${type}`}
                            variant="flat"
                            startContent={<TbArrowLeft size={16} />}
                            className="hover:bg-default-100"
                            aria-label="Back to list"
                        />
                    </Tooltip>

                    {/* Action Buttons */}
                    <ButtonGroup>
                        {actionButtons.map((btn, index) => (
                            <Tooltip key={index} content={btn.label}>
                                <Button
                                    isIconOnly
                                    variant="flat"
                                    onPress={btn.onClick}
                                    startContent={<btn.icon size={16} />}
                                    className="hover:bg-default-100"
                                    aria-label={btn.label}
                                />
                            </Tooltip>
                        ))}
                    </ButtonGroup>
                </div>

                {/* Content Header */}
                <motion.div variants={fadeInVariants} initial="hidden" animate="visible">
                    <Card className="mb-8">
                        <CardHeader className="py-8 px-8 flex-col items-start">
                            {/* Title */}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                                {content.title}
                            </h1>

                            {/* Metadata */}
                            <div className="w-full flex flex-wrap gap-2">
                                {metadata.map((item, index) => (
                                    item && (
                                        <Chip
                                            key={index}
                                            variant="flat"
                                            color="primary"
                                            size="md"
                                            startContent={<item.icon size={14} />}
                                            className="p-1.5 items-center"
                                        >
                                            {item.text}
                                        </Chip>
                                    )
                                ))}

                                {isProtected && (
                                    <Chip
                                        color="success"
                                        variant="flat"
                                        startContent={<TbLockOpen size={14} />}
                                    >
                                        Authenticated
                                    </Chip>
                                )}

                                {content.tags && content.tags.map(tag => (
                                    <Chip
                                        key={tag}
                                        color="default"
                                        variant="bordered"
                                        size="sm"
                                        startContent={<TbTag size={14} />}
                                    >
                                        {tag}
                                    </Chip>
                                ))}
                            </div>
                        </CardHeader>
                    </Card>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    variants={fadeInVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.2 }}
                >
                    <Card>
                        <CardBody className="lg:p-8 md:p-7 p-6">
                            <div
                                className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-24"
                                dangerouslySetInnerHTML={{ __html: content.content }}
                                style={{
                                    // Enhanced typography for better reading
                                    lineHeight: 1.8,
                                    fontSize: '1rem',
                                }}
                            />
                        </CardBody>

                        <Divider />

                        <CardFooter className="p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="text-sm text-default-600">
                                {content.lastRevision !== content.date ? (
                                    <span>Last updated: {formatDate(content.lastRevision)}</span>
                                ) : (
                                    <span>Published: {formatDate(content.date)}</span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={handleShare}
                                    startContent={<TbShare size={16} />}
                                >
                                    Share
                                </Button>

                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={handlePrint}
                                    startContent={<TbPrinter size={16} />}
                                >
                                    Print
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>

                <Spacer y={8} />
            </div>
        </div >
    );
}