'use client';

import { useEffect, useState } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Chip,
    Divider,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Link,
    Progress,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    useDisclosure,
} from "@heroui/react";
import NextLink from 'next/link';
import { ContentWithBody, ContentType } from '@/types/content';
import { AccessibilityPanel } from './AccessibilityPanel';
import { toast } from 'sonner';

interface ContentReaderProps {
    content: ContentWithBody;
    type: ContentType;
}

export function ContentReader({ content, type }: ContentReaderProps) {
    const [readingProgress, setReadingProgress] = useState(0);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const isProtected = Boolean(content.password);

    // Check authentication on mount
    useEffect(() => {
        if (isProtected) {
            const authKey = `auth_${content.slug}`;
            const isAuth = sessionStorage.getItem(authKey) === 'true';
            if (isAuth) {
                setIsAuthenticated(true);
            } else {
                onOpen();
            }
        } else {
            setIsAuthenticated(true);
        }
    }, [content.slug, isProtected, onOpen]);

    // Track reading progress
    useEffect(() => {
        const handleScroll = () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            setReadingProgress(scrolled || 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handlePasswordSubmit = async () => {
        if (!password.trim()) return;

        setIsVerifying(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        if (password === content.password) {
            sessionStorage.setItem(`auth_${content.slug}`, 'true');
            setIsAuthenticated(true);
            toast.success('Access granted!');
            onOpenChange();
        } else {
            toast.error('Invalid password');
            setPassword('');
        }

        setIsVerifying(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Show password modal if not authenticated
    if (isProtected && !isAuthenticated) {
        return (
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <div>
                                    <h3>🔒 Protected Content</h3>
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
                                <Button
                                    as={NextLink}
                                    href={`/${type}`}
                                    color="danger"
                                    variant="light"
                                >
                                    Back to {type === 'pieces' ? 'Stories' : 'Poems'}
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handlePasswordSubmit}
                                    isLoading={isVerifying}
                                    isDisabled={!password.trim()}
                                >
                                    Access Content
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Reading Progress */}
            <div className="fixed top-0 left-0 right-0 z-50">
                <Progress
                    value={readingProgress}
                    color="primary"
                    size="sm"
                    className="rounded-none"
                />
            </div>

            {/* Navigation */}
            <Navbar>
                <NavbarBrand>
                    <Link as={NextLink} href="/" color="foreground">
                        <p className="font-bold text-inherit">Literary Pens</p>
                    </Link>
                </NavbarBrand>
                <NavbarContent className="hidden sm:flex gap-4" justify="center">
                    <NavbarItem>
                        <Link as={NextLink} href="/" color="foreground">Home</Link>
                    </NavbarItem>
                    <NavbarItem isActive={type === 'pieces'}>
                        <Link as={NextLink} href="/pieces" color={type === 'pieces' ? 'primary' : 'foreground'}>
                            Stories
                        </Link>
                    </NavbarItem>
                    <NavbarItem isActive={type === 'poems'}>
                        <Link as={NextLink} href="/poems" color={type === 'poems' ? 'primary' : 'foreground'}>
                            Poems
                        </Link>
                    </NavbarItem>
                </NavbarContent>
                <NavbarContent justify="end">
                    <NavbarItem>
                        <AccessibilityPanel />
                    </NavbarItem>
                </NavbarContent>
            </Navbar>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Content Header */}
                <Card className="mb-8">
                    <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                        <div className="flex gap-2 mb-4">
                            <Chip
                                color={type === 'pieces' ? 'primary' : 'secondary'}
                                variant="flat"
                            >
                                {type === 'pieces' ? '📚 Story' : '📝 Poem'}
                            </Chip>
                            {isProtected && (
                                <Chip color="success" variant="flat">
                                    🔓 Authenticated
                                </Chip>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold mb-4">
                            {content.title}
                        </h1>

                        <div className="flex flex-wrap gap-4 text-small text-default-600">
                            <span>✍️ {content.author}</span>
                            <span>📅 {formatDate(content.date)}</span>
                            {content.location && <span>📍 {content.location}</span>}
                            <span>⏱️ {content.readingTime} min read</span>
                            <span>📝 {content.wordCount} words</span>
                        </div>
                    </CardHeader>

                    {content.excerpt && (
                        <CardBody className="pt-4">
                            <p className="text-default-600 text-lg leading-relaxed">
                                {content.excerpt}
                            </p>
                        </CardBody>
                    )}
                </Card>

                {/* Main Content */}
                <Card>
                    <CardBody className="p-8">
                        <div
                            className="prose prose-lg dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: content.content }}
                        />
                    </CardBody>

                    <Divider />

                    <CardFooter className="p-6">
                        <div className="flex justify-between items-center w-full">
                            <div className="text-small text-default-500">
                                {content.lastRevision !== content.date ? (
                                    <span>Last updated: {formatDate(content.lastRevision)}</span>
                                ) : (
                                    <span>Published: {formatDate(content.date)}</span>
                                )}
                            </div>

                            <Button
                                as={NextLink}
                                href={`/${type}`}
                                color={type === 'pieces' ? 'primary' : 'secondary'}
                                variant="flat"
                            >
                                ← Back to {type === 'pieces' ? 'Stories' : 'Poems'}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}