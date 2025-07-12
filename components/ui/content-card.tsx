'use client';

import { useState } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Chip,
    Divider,
} from "@heroui/react";
import { Link } from "@heroui/link";
import { motion } from "framer-motion";
import {
    TbLock,
    TbBook,
    TbSparkles,
    TbClock,
    TbFileText,
    TbCalendar,
    TbMapPin,
    TbTag,
    TbEye,
} from "react-icons/tb";
import { ContentMeta } from '@/lib/types';
import { formatDate } from '@/lib/content';
import { PasswordModal } from './password-modal';

interface ContentCardProps {
    content: ContentMeta;
    type: 'pieces' | 'poems';
}

export function ContentCard({ content, type }: ContentCardProps) {
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    const handleCardClick = () => {
        if (content.isProtected) {
            setShowPasswordModal(true);
        }
    };

    const contentUrl = `/${type}/${content.slug}`;
    const isPiece = type === 'pieces';

    return (
        <>
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="h-full"
            >
                <Card className="h-full group cursor-pointer hover:shadow-xl transition-all duration-300 border-1 hover:border-primary/20">
                    <CardHeader className="pb-3 pt-6 px-6 flex-col items-start">
                        {/* Status badges */}
                        <div className="flex gap-2 mb-3 flex-wrap">
                            <Chip
                                color={isPiece ? 'primary' : 'secondary'}
                                variant="flat"
                                size="sm"
                                startContent={isPiece ? <TbBook size={14} /> : <TbSparkles size={14} />}
                            >
                                {isPiece ? 'Story' : 'Poem'}
                            </Chip>

                            {content.isProtected && (
                                <Chip
                                    color="warning"
                                    variant="flat"
                                    size="sm"
                                    startContent={<TbLock size={14} />}
                                >
                                    Protected
                                </Chip>
                            )}

                            {content.tags && content.tags.length > 0 && (
                                <Chip
                                    color="default"
                                    variant="bordered"
                                    size="sm"
                                    startContent={<TbTag size={14} />}
                                >
                                    {content.tags[0]}
                                    {content.tags.length > 1 && ` +${content.tags.length - 1}`}
                                </Chip>
                            )}
                        </div>

                        {/* Title and author */}
                        <h4 className="font-bold text-xl leading-tight mb-2 group-hover:text-primary transition-colors">
                            {content.title}
                        </h4>
                        <p className="text-sm text-default-600 mb-1">by {content.author}</p>

                        {content.location && (
                            <div className="flex items-center gap-1 text-xs text-default-500">
                                <TbMapPin size={12} />
                                {content.location}
                            </div>
                        )}
                    </CardHeader>

                    <CardBody className="px-6 py-3">
                        <p className="text-sm text-default-700 leading-relaxed mb-4 line-clamp-3">
                            {content.excerpt}
                        </p>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-2 text-default-600">
                                <TbCalendar size={14} />
                                <span>{formatDate(content.date)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-default-600">
                                <TbClock size={14} />
                                <span>{content.readingTime} min read</span>
                            </div>

                            <div className="flex items-center gap-2 text-default-600">
                                <TbFileText size={14} />
                                <span>{content.wordCount.toLocaleString()} words</span>
                            </div>

                            {content.chapters && content.chapters > 0 && (
                                <div className="flex items-center gap-2 text-default-600">
                                    <TbBook size={14} />
                                    <span>{content.chapters} chapters</span>
                                </div>
                            )}
                        </div>
                    </CardBody>

                    <Divider />

                    <CardFooter className="px-6 py-4">
                        {content.isProtected ? (
                            <Button
                                color="warning"
                                variant="flat"
                                fullWidth
                                onPress={handleCardClick}
                                startContent={<TbLock size={16} />}
                                className="font-medium"
                            >
                                Enter Password
                            </Button>
                        ) : (
                            <Button
                                as={Link}
                                href={contentUrl}
                                color={isPiece ? 'primary' : 'secondary'}
                                variant="flat"
                                fullWidth
                                startContent={<TbEye size={16} />}
                                className="font-medium group-hover:shadow-md transition-shadow"
                            >
                                Read {isPiece ? 'Story' : 'Poem'}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </motion.div>

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