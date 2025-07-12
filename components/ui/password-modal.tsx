'use client';

import { useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
} from "@heroui/react";
import { useRouter } from 'next/navigation';
import { TbLock, TbEye, TbEyeOff } from "react-icons/tb";

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentSlug: string;
    type: 'pieces' | 'poems';
}

export function PasswordModal({ isOpen, onClose, contentSlug, type }: PasswordModalProps) {
    const [password, setPassword] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async () => {
        if (!password.trim()) return;

        setIsVerifying(true);
        setError('');

        try {
            // First, get the content to check its password
            const contentResponse = await fetch(`/api/content/${type}/${contentSlug}`);
            if (!contentResponse.ok) {
                throw new Error('Content not found');
            }

            const content = await contentResponse.json();

            // Verify password
            const verifyResponse = await fetch('/api/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: password.trim(),
                    contentPassword: content.password,
                }),
            });

            const result = await verifyResponse.json();

            if (result.success) {
                // Store access token (you might want to use a more secure method)
                sessionStorage.setItem(`access_${type}_${contentSlug}`, 'granted');
                onClose();
                router.push(`/${type}/${contentSlug}`);
            } else {
                setError('Invalid password. Please try again.');
            }
        } catch (error) {
            console.error('Password verification error:', error);
            setError('An error occurred. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            placement="center"
            backdrop="blur"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <TbLock className="text-warning" size={24} />
                        <span>Protected Content</span>
                    </div>
                    <p className="text-sm text-default-600 font-normal">
                        This {type === 'pieces' ? 'story' : 'poem'} requires a password to access.
                    </p>
                </ModalHeader>

                <ModalBody>
                    <Input
                        label="Password"
                        placeholder="Enter the password"
                        value={password}
                        onValueChange={setPassword}
                        onKeyPress={handleKeyPress}
                        type={isVisible ? "text" : "password"}
                        endContent={
                            <button
                                className="focus:outline-none"
                                type="button"
                                onClick={() => setIsVisible(!isVisible)}
                            >
                                {isVisible ? (
                                    <TbEyeOff className="text-2xl text-default-400 pointer-events-none" />
                                ) : (
                                    <TbEye className="text-2xl text-default-400 pointer-events-none" />
                                )}
                            </button>
                        }
                        isInvalid={!!error}
                        errorMessage={error}
                        autoFocus
                    />
                </ModalBody>

                <ModalFooter>
                    <Button
                        color="danger"
                        variant="light"
                        onPress={handleClose}
                        isDisabled={isVerifying}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleSubmit}
                        isLoading={isVerifying}
                        isDisabled={!password.trim()}
                    >
                        Access Content
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}