'use client';

import { useState, useEffect } from 'react';
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

    // Debug logging
    useEffect(() => {
        if (isOpen) {
            console.log('Password modal opened for:', { contentSlug, type });
            setPassword(''); // Clear any existing password
            setError(''); // Clear any existing error
        }
    }, [isOpen, contentSlug, type]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!password.trim()) {
            setError('Please enter a password');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            console.log('Submitting password for verification:', { contentSlug, type });

            // Send directly to our API with the correct format
            const verifyResponse = await fetch('/api/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: password.trim(),
                    contentSlug,
                    type,
                }),
            });

            if (!verifyResponse.ok) {
                console.error('Verify response not ok:', verifyResponse.status);
                const errorText = await verifyResponse.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${verifyResponse.status}`);
            }

            const result = await verifyResponse.json();
            console.log('Password verification result:', result);

            if (result.success) {
                // Store access token
                sessionStorage.setItem(`access_${type}_${contentSlug}`, 'granted');
                console.log('Access granted, navigating to content');

                // Clear form and close modal
                setPassword('');
                setError('');
                onClose();

                // Navigate to content
                router.push(`/${type}/${contentSlug}`);
            } else {
                setError(result.message || 'Invalid password. Please try again.');
            }
        } catch (error) {
            console.error('Password verification error:', error);
            setError('Connection error. Please check your internet and try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
        }
    };

    const handleClose = () => {
        if (isVerifying) return; // Prevent closing while verifying
        console.log('Password modal closing');
        setPassword('');
        setError('');
        setIsVisible(false);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            placement="center"
            backdrop="blur"
            isDismissable={!isVerifying}
            isKeyboardDismissDisabled={isVerifying}
            hideCloseButton={isVerifying}
            portalContainer={typeof document !== 'undefined' ? document.body : undefined}
        >
            <ModalContent key={`password-modal-${contentSlug}`}>
                {(onModalClose) => (
                    <>
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
                            <form onSubmit={handleSubmit} id={`password-form-${contentSlug}`}>
                                <Input
                                    label="Password"
                                    placeholder="Enter the password"
                                    value={password}
                                    onValueChange={setPassword}
                                    onKeyDown={handleKeyDown}
                                    type={isVisible ? "text" : "password"}
                                    autoComplete="new-password"
                                    autoFocus
                                    data-form-type="password"
                                    data-modal-input="true"
                                    id={`password-input-${contentSlug}`}
                                    name={`password-${contentSlug}`}
                                    endContent={
                                        <button
                                            className="focus:outline-none"
                                            type="button"
                                            onClick={() => setIsVisible(!isVisible)}
                                            tabIndex={-1}
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
                                />
                                {/* Hidden submit button for form submission */}
                                <button type="submit" style={{ display: 'none' }} />
                            </form>
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                color="danger"
                                variant="light"
                                onPress={handleClose}
                                isDisabled={isVerifying}
                                type="button"
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={() => {
                                    handleSubmit();
                                }}
                                isLoading={isVerifying}
                                isDisabled={!password.trim()}
                                type="button"
                            >
                                {isVerifying ? 'Verifying...' : 'Access Content'}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}