'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    Button,
    Chip,
    Image,
    Spacer,
    useDisclosure,
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
    TbAccessible,
    TbExternalLink,
} from "react-icons/tb";
import { ContentItem, ContentType } from '@/lib/types';
import { formatDate } from '@/lib/content';
import { PasswordModal } from './password-modal';
import { TableOfContents } from './table-of-contents';
import { AccessibilityPanel } from './accessibility-panel';

interface ContentReaderProps {
    content: ContentItem;
    type: ContentType;
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
    const [imageError, setImageError] = useState(false);
    const [coverImagePath, setCoverImagePath] = useState<string>('');
    const [imageExtensionIndex, setImageExtensionIndex] = useState(0);

    const { isOpen: isAccessibilityOpen, onOpen: onAccessibilityOpen, onOpenChange: onAccessibilityOpenChange } = useDisclosure();

    const isPieces = type === 'pieces';
    const isProtected = Boolean(content.password);

    // Try different image extensions
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    // Set initial image path
    useEffect(() => {
        const initialPath = `/${type}/${content.slug}.${imageExtensions[0]}`;
        console.log(`Setting initial image path: ${initialPath}`);
        setCoverImagePath(initialPath);
        setImageExtensionIndex(0);
        setImageError(false);
    }, [content.slug, type]);

    // Handle image load failure - try next extension
    const handleImageError = () => {
        const nextIndex = imageExtensionIndex + 1;

        console.log(`Image failed to load: ${coverImagePath}`);
        console.log(`Trying next extension (${nextIndex}/${imageExtensions.length})`);

        if (nextIndex < imageExtensions.length) {
            // Try next extension
            const nextPath = `/${type}/${content.slug}.${imageExtensions[nextIndex]}`;
            console.log(`Trying: ${nextPath}`);
            setCoverImagePath(nextPath);
            setImageExtensionIndex(nextIndex);
        } else {
            // No more extensions to try
            console.log('No more image extensions to try');
            setImageError(true);
        }
    };

    // Track authentication state
    useEffect(() => {
        // Check if user has already authenticated for this content
        const hasAccess = sessionStorage.getItem(`access_${type}_${content.slug}`) === 'granted';
        setIsAuthenticated(!isProtected || hasAccess);

        if (isProtected && !hasAccess) {
            setShowPasswordModal(true);
        }
    }, [content.slug, isProtected, type]);

    const metadata: { icon: JSX.Element; text: string }[] = [
        { icon: <TbCalendar size={14} />, text: formatDate(content.date) },
        { icon: <TbClock size={14} />, text: `${content.readingTime} min` },
        { icon: <TbFileText size={14} />, text: `${content.wordCount.toLocaleString()} words` },
        ...(content.chapters && content.chapters > 0 ? [{ icon: <TbBook size={14} />, text: `${content.chapters} ${content.chapters === 1 ? 'chapter' : 'chapters'}` }] : []),
        ...(content.location ? [{ icon: <TbMapPin size={14} />, text: content.location }] : []),
    ];

    if (!isAuthenticated) {
        return (
            <>
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
            {/* Sticky ToC with all actions integrated */}
            <TableOfContents
                content={content.content}
                onAccessibilityClick={onAccessibilityOpen}
                contentTitle={content.title}
            />

            {/* Accessibility Panel */}
            <AccessibilityPanel
                isOpen={isAccessibilityOpen}
                onOpenChange={onAccessibilityOpenChange}
            />

            {/* Main content with proper spacing for sidebar */}
            <div className="lg:ml-96 transition-all duration-300">
                <div className="container mx-auto lg:px-6 md:px-4 px-0 py-12 max-w-4xl">
                    {/* Back Navigation */}
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center justify-between">
                            <Button
                                as={NextLink}
                                href={`/${type}`}
                                variant="flat"
                                startContent={<TbArrowLeft size={16} />}
                                className="hover:bg-default-100"
                            >
                                Back to list
                            </Button>

                            {/* Mobile accessibility button */}
                            <Button
                                isIconOnly
                                variant="flat"
                                onPress={onAccessibilityOpen}
                                className="lg:hidden"
                                aria-label="Open accessibility settings"
                            >
                                <TbAccessible size={16} />
                            </Button>
                        </div>
                    </motion.div>

                    {/* Content Header */}
                    <motion.div variants={fadeInVariants} initial="hidden" animate="visible">
                        <Card className="mb-8 lg:p-8 md:p-6.5 p-5 flex-col items-start">
                            {/* Status badges */}
                            <div className="flex gap-2 mb-6 flex-wrap">
                                <Chip
                                    color={isPieces ? 'primary' : 'secondary'}
                                    variant="flat"
                                    startContent={isPieces ? <TbBook size={16} /> : <TbSparkles size={16} />}
                                    className="pl-3 pr-1"
                                >
                                    {isPieces ? 'Story' : 'Poem'}
                                </Chip>

                                {isProtected && (
                                    <Chip
                                        color="success"
                                        variant="flat"
                                        startContent={<TbLockOpen size={16} />}
                                        className="pl-3 pr-1"
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
                                        className="pl-3 pr-1"
                                    >
                                        {tag}
                                    </Chip>
                                ))}
                            </div>

                            {/* Cover Image */}
                            {!imageError && coverImagePath && (
                                <div className="w-full mb-6 relative group">
                                    <img
                                        src={coverImagePath}
                                        alt={`Cover for ${content.title}`}
                                        className="w-full h-auto rounded-lg object-cover"
                                        onLoad={() => console.log(`Image loaded successfully: ${coverImagePath}`)}
                                        onError={handleImageError}
                                    />

                                    {/* Image credit overlay */}
                                    {content.imageCredit && (
                                        <div className="absolute bottom-3 right-3 z-10">
                                            <Link
                                                href={content.imageCreditUrl || '#'}
                                                className="text-xs bg-black/75 text-white px-3 py-1.5 rounded-full hover:bg-black/90 transition-all duration-200 backdrop-blur-sm flex items-center gap-1.5 shadow-lg"
                                                isExternal={!!content.imageCreditUrl}
                                            >
                                                <span>© {content.imageCredit}</span>
                                                {content.imageCreditUrl && (
                                                    <TbExternalLink size={12} className="flex-shrink-0" />
                                                )}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Title */}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                                {content.title}
                            </h1>

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-2">
                                {metadata.map((item, index) => (
                                    <Chip
                                        key={index}
                                        color="primary"
                                        variant="flat"
                                        startContent={item.icon}
                                        className="pl-3 pr-1"
                                    >
                                        {item.text}
                                    </Chip>
                                ))}
                            </div>
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
                                    className="content-area max-w-none"
                                    dangerouslySetInnerHTML={{ __html: content.content }}
                                />
                            </CardBody>
                        </Card>
                    </motion.div>

                    <Spacer y={8} />
                </div>
            </div>

            {showPasswordModal && (
                <PasswordModal
                    isOpen={showPasswordModal}
                    onClose={() => setShowPasswordModal(false)}
                    contentSlug={content.slug}
                    type={type}
                />
            )}
        </div>
    );
}