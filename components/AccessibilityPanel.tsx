'use client';

import { useState } from 'react';
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Slider,
    Switch,
    Select,
    SelectItem,
    Card,
    CardBody,
    Divider,
} from "@heroui/react";
import { TbSettings2 } from 'react-icons/tb';
import { useTheme } from 'next-themes';

export function AccessibilityPanel() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { theme, setTheme } = useTheme();
    const [fontSize, setFontSize] = useState(16);
    const [lineHeight, setLineHeight] = useState(1.6);
    const [fontFamily, setFontFamily] = useState('system');
    const [reducedMotion, setReducedMotion] = useState(false);

    // Apply settings to document
    const applySettings = () => {
        const root = document.documentElement;
        root.style.fontSize = `${fontSize}px`;
        root.style.lineHeight = lineHeight.toString();

        if (reducedMotion) {
            root.classList.add('reduce-motion');
        } else {
            root.classList.remove('reduce-motion');
        }
    };

    return (
        <>
            <Button
                onPress={onOpen}
                variant="light"
                isIconOnly
                aria-label="Accessibility Settings"
            >
                <TbSettings2 size={20} />
            </Button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <h2>Accessibility Settings</h2>
                                <p className="text-small text-default-500">
                                    Customize your reading experience
                                </p>
                            </ModalHeader>

                            <ModalBody className="gap-6">
                                {/* Text Settings */}
                                <Card>
                                    <CardBody className="gap-4">
                                        <h3 className="text-lg font-semibold">Text Settings</h3>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">
                                                Font Size: {fontSize}px
                                            </label>
                                            <Slider
                                                size="sm"
                                                step={1}
                                                minValue={12}
                                                maxValue={24}
                                                value={fontSize}
                                                onChange={(value) => setFontSize(value as number)}
                                                onChangeEnd={applySettings}
                                                className="max-w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">
                                                Line Height: {lineHeight}
                                            </label>
                                            <Slider
                                                size="sm"
                                                step={0.1}
                                                minValue={1.2}
                                                maxValue={2.0}
                                                value={lineHeight}
                                                onChange={(value) => setLineHeight(value as number)}
                                                onChangeEnd={applySettings}
                                                className="max-w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">
                                                Font Family
                                            </label>
                                            <Select
                                                size="sm"
                                                selectedKeys={[fontFamily]}
                                                onSelectionChange={(keys) => {
                                                    const key = Array.from(keys)[0] as string;
                                                    setFontFamily(key);
                                                }}
                                            >
                                                <SelectItem key="system">System Font</SelectItem>
                                                <SelectItem key="serif">Serif</SelectItem>
                                                <SelectItem key="mono">Monospace</SelectItem>
                                            </Select>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Divider />

                                {/* Theme Settings */}
                                <Card>
                                    <CardBody className="gap-4">
                                        <h3 className="text-lg font-semibold">Theme</h3>

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant={theme === 'light' ? 'solid' : 'bordered'}
                                                onPress={() => setTheme('light')}
                                            >
                                                Light
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={theme === 'dark' ? 'solid' : 'bordered'}
                                                onPress={() => setTheme('dark')}
                                            >
                                                Dark
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={theme === 'system' ? 'solid' : 'bordered'}
                                                onPress={() => setTheme('system')}
                                            >
                                                System
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Divider />

                                {/* Motion Settings */}
                                <Card>
                                    <CardBody>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">Reduce Motion</h4>
                                                <p className="text-small text-default-500">
                                                    Minimize animations for better accessibility
                                                </p>
                                            </div>
                                            <Switch
                                                isSelected={reducedMotion}
                                                onValueChange={(value) => {
                                                    setReducedMotion(value);
                                                    applySettings();
                                                }}
                                            />
                                        </div>
                                    </CardBody>
                                </Card>
                            </ModalBody>

                            <ModalFooter>
                                <Button color="primary" onPress={onClose}>
                                    Done
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}