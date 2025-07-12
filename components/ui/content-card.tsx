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
    TbBook2,
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
    const isProtected = Boolean(content.password);

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    const handleCardClick = () => {
        if (isProtected) {
            setShowPasswordModal(true);
        }
    };

    const contentUrl = `/${type}/${content.slug}`;
    const isPiece = type === 'pieces';

    const metadata = [
        { icon: <TbCalendar size={14} />, text: formatDate(content.date) },
        { icon: <TbClock size={14} />, text: `${content.readingTime} min` },
        { icon: <TbFileText size={14} />, text: `${content.wordCount.toLocaleString()} words` },
        ...(content.chapters ? [{ icon: <TbBook2 size={14} />, text: `${content.chapters} chapters` }] : []),
        ...(content.location ? [{ icon: <TbMapPin size={14} />, text: content.location }] : []),
    ]

    return (
        <>
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="h-full"
            >
                <Card className="h-full group cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-primary/20">
                    <CardBody className="p-6">
                        {/* Status badges */}
                        <div className="flex gap-2 mb-3 flex-wrap">
                            <Chip
                                color={isPiece ? 'primary' : 'secondary'}
                                variant="flat"
                                size="sm"
                                startContent={isPiece ? <TbBook2 size={14} /> : <TbSparkles size={14} />}
                                className="pl-1.5 pr-1"
                            >
                                {isPiece ? 'Story' : 'Poem'}
                            </Chip>

                            {isProtected && (
                                <Chip
                                    color="warning"
                                    variant="flat"
                                    size="sm"
                                    startContent={<TbLock size={14} />}
                                    className="pl-1.5 pr-1"
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

                        {/* Title */}
                        <h4 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">
                            {content.title}
                        </h4>

                        {/* Excerpt */}
                        <p className="py-4 text-sm text-default-700 leading-relaxed line-clamp-3">
                            {content.excerpt}
                        </p>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-2">
                            {metadata.map((item, index) => (
                                <Chip
                                    key={index}
                                    color="primary"
                                    variant="flat"
                                    className="flex items-center pl-2 pr-1"
                                    startContent={item.icon}
                                >
                                    {item.text}
                                </Chip>
                            ))}
                        </div>
                    </CardBody>

                    <Divider />

                    <CardFooter className="px-6 py-4">
                        {isProtected ? (
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
                                Read
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