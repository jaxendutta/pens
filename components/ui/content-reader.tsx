'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Chip,
    Image,
    Divider,
    Spacer,
} from "@heroui/react";
import { Link } from "@heroui/link";
import NextLink from "next/link";
import { motion } from "framer-motion";
import {
    TbArrowLeft,
    TbBook,
    TbSparkles,
    TbClock,
    TbFileText,
    TbCalendar,
    TbMapPin,
    TbTag,
    TbLock,
    TbLockOpen,
} from "react-icons/tb";
import { ContentItem } from '@/lib/types';
import { formatDate } from '@/lib/content';
import { ReadingProgress } from './reading-progress';
import { PasswordModal } from './password-modal';
import { FloatingActionBar } from './floating-action-bar';

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

    const metadata: { icon: JSX.Element; text: string }[] = [
        { icon: <TbCalendar size={14} />, text: formatDate(content.date) },
        { icon: <TbClock size={14} />, text: `${content.readingTime} min` },
        { icon: <TbFileText size={14} />, text: `${content.wordCount.toLocaleString()} words` },
        ...(content.chapters ? [{ icon: <TbBook size={14} />, text: `${content.chapters} chapters` }] : []),
        ...(content.location ? [{ icon: <TbMapPin size={14} />, text: content.location }] : []),
    ];

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
            <FloatingActionBar
                contentTitle={content.title}
                contentUrl={typeof window !== 'undefined' ? window.location.href : ''}
                showReadingProgress={true}
            />

            <div className="container mx-auto px-6 py-12 max-w-4xl">
                {/* Back Navigation */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Button
                        as={NextLink}
                        href={`/${type}`}
                        variant="flat"
                        startContent={<TbArrowLeft size={16} />}
                        className="hover:bg-default-100"
                    >
                        Back
                    </Button>
                </motion.div>

                {/* Content Header */}
                <motion.div variants={fadeInVariants} initial="hidden" animate="visible">
                    <Card className="mb-8">
                        <CardHeader className="pb-4 pt-8 px-8 flex-col items-start">
                            {/* Status badges */}
                            <div className="flex gap-2 mb-6 flex-wrap">
                                <Chip
                                    color={isPieces ? 'primary' : 'secondary'}
                                    variant="flat"
                                    startContent={isPieces ? <TbBook size={16} /> : <TbSparkles size={16} />}
                                >
                                    {isPieces ? 'Story' : 'Poem'}
                                </Chip>

                                {isProtected && (
                                    <Chip
                                        color="success"
                                        variant="flat"
                                        startContent={<TbLockOpen size={16} />}
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

                            {/* Image */}
                            <div className="w-full mb-6">
                                <Image
                                    src={`/public/${type}/${content.slug}`}
                                    alt={`Cover image for ${content.title}`}
                                    className="w-full h-auto rounded-lg object-cover"
                                />
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                                {content.title}
                            </h1>

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-2">
                                {metadata.map(item => (
                                    <Chip
                                        key={item.text}
                                        color="primary"
                                        variant="flat"
                                        startContent={item.icon}
                                    >
                                        {item.text}
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
                        <CardBody className="p-8 sm:p-12">
                            <div
                                className="content-area max-w-none"
                                dangerouslySetInnerHTML={{ __html: content.content }}
                            />
                        </CardBody>

                        <Divider />

                        <CardFooter className="p-8">
                            <div className="text-sm text-default-600 w-full">
                                {content.lastRevision !== content.date ? (
                                    <span>Last updated: {formatDate(content.lastRevision)}</span>
                                ) : (
                                    <span>Published: {formatDate(content.date)}</span>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>

                <Spacer y={8} />
            </div>
        </div>
    );
}