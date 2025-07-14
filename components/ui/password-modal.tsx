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
import { TbLock, TbEye, TbEyeOff } from "react-icons/tb";

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentSlug: string;
    type: 'pieces' | 'poems';
}

export function PasswordModal({ isOpen, onClose, contentSlug, type }: PasswordModalProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        if (!password.trim()) {
            setError('Please enter a password.');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            const response = await fetch('/api/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contentSlug: contentSlug,
                    password: password.trim(),
                    type
                }),
            });

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    sessionStorage.setItem(`access_${type}_${contentSlug}`, 'granted');
                    onClose();
                    // Navigate to the content page instead of reloading
                    window.location.href = `/${type}/${contentSlug}`;
                } else {
                    setError(data.message || 'Incorrect password. Please try again.');
                }
            } else {
                setError('Server error. Please try again.');
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
                                    variant="bordered"
                                    isDisabled={isVerifying}
                                    errorMessage={error}
                                    isInvalid={!!error}
                                    endContent={
                                        <button
                                            className="focus:outline-none"
                                            type="button"
                                            onClick={() => setIsVisible(!isVisible)}
                                            aria-label="toggle password visibility"
                                        >
                                            {isVisible ? (
                                                <TbEyeOff className="text-2xl text-default-400 pointer-events-none" />
                                            ) : (
                                                <TbEye className="text-2xl text-default-400 pointer-events-none" />
                                            )}
                                        </button>
                                    }
                                    autoFocus
                                />
                            </form>
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={handleClose}
                                isDisabled={isVerifying}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={() => handleSubmit()}
                                isLoading={isVerifying}
                                isDisabled={!password.trim()}
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