'use client';

import { useState } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    useDisclosure,
} from "@heroui/react";
import Link from 'next/link';
import { ContentMeta, ContentType } from '@/types/content';
import { toast } from 'sonner';

interface ContentCardProps {
    content: ContentMeta;
    type: ContentType;
}

export function ContentCard({ content, type }: ContentCardProps) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const isProtected = Boolean(content.password);

    const handlePasswordSubmit = async () => {
        if (!password.trim()) return;

        setIsVerifying(true);

        // Simple password check (in real app, this would be more secure)
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

        if (password === content.password) {
            sessionStorage.setItem(`auth_${content.slug}`, 'true');
            toast.success('Access granted!');
            onOpenChange();
            window.location.href = `/${type}/${content.slug}`;
        } else {
            toast.error('Invalid password');
            setPassword('');
        }

        setIsVerifying(false);
    };

    const handleCardClick = () => {
        if (isProtected) {
            // Check if already authenticated
            const isAuthenticated = sessionStorage.getItem(`auth_${content.slug}`);
            if (isAuthenticated) {
                window.location.href = `/${type}/${content.slug}`;
            } else {
                onOpen();
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <>
            <Card className="max-w-[400px] hover:shadow-lg transition-shadow">
                <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                    <div className="flex justify-between items-start w-full">
                        <Chip
                            color={type === 'pieces' ? 'primary' : 'secondary'}
                            variant="flat"
                            size="sm"
                        >
                            {type === 'pieces' ? 'Story' : 'Poem'}
                        </Chip>
                        {isProtected && (
                            <Chip color="warning" variant="flat" size="sm">
                                🔒 Protected
                            </Chip>
                        )}
                    </div>
                    <h4 className="font-bold text-large mt-2">{content.title}</h4>
                    <small className="text-default-500">by {content.author}</small>
                </CardHeader>

                <CardBody className="overflow-visible py-2">
                    <p className="text-small text-default-600 mb-3">
                        {content.excerpt}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                        <Chip size="sm" variant="flat">
                            📅 {formatDate(content.date)}
                        </Chip>
                        <Chip size="sm" variant="flat">
                            ⏱️ {content.readingTime}min
                        </Chip>
                        <Chip size="sm" variant="flat">
                            📝 {content.wordCount} words
                        </Chip>
                    </div>
                </CardBody>

                <CardFooter className="pt-0">
                    {isProtected ? (
                        <Button
                            color="warning"
                            variant="flat"
                            fullWidth
                            onPress={handleCardClick}
                        >
                            🔒 Enter Password
                        </Button>
                    ) : (
                        <Button
                            as={Link}
                            href={`/${type}/${content.slug}`}
                            color={type === 'pieces' ? 'primary' : 'secondary'}
                            variant="flat"
                            fullWidth
                        >
                            Read {type === 'pieces' ? 'Story' : 'Poem'}
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Password Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <div>
                                    <h3>Protected Content</h3>
                                    <p className="text-small text-default-500">
                                        Enter password for "{content.title}"
                                    </p>
                                </div>
                            </ModalHeader>

                            <ModalBody>
                                <Input
                                    autoFocus
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onValueChange={setPassword}
                                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                                />
                            </ModalBody>

                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handlePasswordSubmit}
                                    isLoading={isVerifying}
                                    isDisabled={!password.trim()}
                                >
                                    Access
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}