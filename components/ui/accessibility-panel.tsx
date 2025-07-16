// components/ui/accessibility-panel.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Slider,
    Switch,
    Select,
    SelectItem,
    Card,
    CardBody,
    Chip,
    Divider,
} from "@heroui/react";
import { useTheme } from 'next-themes';
import {
    TbAccessible,
    TbPalette,
    TbTypography,
    TbAdjustments,
    TbDeviceFloppy,
    TbRefresh,
} from 'react-icons/tb';

interface AccessibilitySettings {
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    fontFamily: string;
    reducedMotion: boolean;
    highContrast: boolean;
    focusIndicators: boolean;
}

const defaultSettings: AccessibilitySettings = {
    fontSize: 16,
    lineHeight: 1.6,
    letterSpacing: 0,
    fontFamily: 'system',
    reducedMotion: false,
    highContrast: false,
    focusIndicators: true,
};

const fontOptions = [
    { key: 'system', label: 'System Default' },
    { key: 'serif', label: 'Serif (Times)' },
    { key: 'sans', label: 'Sans-serif (Arial)' },
    { key: 'mono', label: 'Monospace (Courier)' },
    { key: 'dyslexic', label: 'Dyslexia Friendly' },
];

interface AccessibilityPanelProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function AccessibilityPanel({ isOpen, onOpenChange }: AccessibilityPanelProps) {
    const { theme, setTheme } = useTheme();
    const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('accessibility-settings');
            if (saved) {
                try {
                    const parsedSettings = JSON.parse(saved);
                    setSettings(parsedSettings);
                    applySettings(parsedSettings);
                } catch (error) {
                    console.error('Failed to load accessibility settings:', error);
                }
            }
        }
    }, []);

    const applySettings = (newSettings: AccessibilitySettings) => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;

        // Apply font settings to content areas specifically
        const contentElements = document.querySelectorAll('.content-area');
        contentElements.forEach(el => {
            const element = el as HTMLElement;
            element.style.fontSize = `${newSettings.fontSize}px`;
            element.style.lineHeight = newSettings.lineHeight.toString();
            element.style.letterSpacing = `${newSettings.letterSpacing}px`;

            // Apply font family
            const fontFamilyMap = {
                system: 'system-ui, -apple-system, sans-serif',
                serif: 'Georgia, "Times New Roman", serif',
                sans: 'Arial, Helvetica, sans-serif',
                mono: '"Courier New", Courier, monospace',
                dyslexic: '"OpenDyslexic", "Comic Sans MS", sans-serif',
            };
            element.style.fontFamily = fontFamilyMap[newSettings.fontFamily as keyof typeof fontFamilyMap];

            // Apply heading scaling
            const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(heading => {
                const headingEl = heading as HTMLElement;
                const level = parseInt(heading.tagName.charAt(1));

                // Scale headings proportionally to base font size
                const scaleFactor = newSettings.fontSize / 16; // 16px is base
                const baseSizes = {
                    1: 32, // 2rem at 16px base
                    2: 24, // 1.5rem
                    3: 20, // 1.25rem
                    4: 18, // 1.125rem
                    5: 16, // 1rem
                    6: 14  // 0.875rem
                };

                headingEl.style.fontSize = `${baseSizes[level as keyof typeof baseSizes] * scaleFactor}px`;
            });
        });

        // Apply motion settings
        if (newSettings.reducedMotion) {
            root.classList.add('reduce-motion');
        } else {
            root.classList.remove('reduce-motion');
        }

        // Apply contrast settings
        if (newSettings.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // Apply focus indicators
        if (newSettings.focusIndicators) {
            root.classList.add('enhanced-focus');
        } else {
            root.classList.remove('enhanced-focus');
        }
    };

    const updateSetting = <K extends keyof AccessibilitySettings>(
        key: K,
        value: AccessibilitySettings[K]
    ) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        setHasUnsavedChanges(true);
        applySettings(newSettings);
    };

    const saveSettings = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessibility-settings', JSON.stringify(settings));
            setHasUnsavedChanges(false);
        }
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        applySettings(defaultSettings);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessibility-settings');
        }
        setHasUnsavedChanges(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="2xl"
            scrollBehavior="inside"
            placement="center"
            isDismissable={true}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <TbAccessible size={24} className="text-primary" />
                                <span>Accessibility Settings</span>
                            </div>
                            <p className="text-sm text-default-600 font-normal">
                                Customize your reading experience for better accessibility
                            </p>
                        </ModalHeader>

                        <ModalBody>
                            <div className="space-y-6">
                                {/* Theme & Contrast Settings */}
                                <Card>
                                    <CardBody className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TbPalette size={20} className="text-primary" />
                                            <h3 className="text-lg font-semibold">Theme &amp; Contrast</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">Theme</p>
                                                    <p className="text-sm text-default-600">Switch between light and dark modes</p>
                                                </div>
                                                <Select
                                                    selectedKeys={[theme || 'system']}
                                                    onSelectionChange={(keys) => setTheme(Array.from(keys)[0] as string)}
                                                    className="max-w-32"
                                                    size="sm"
                                                >
                                                    <SelectItem key="light">Light</SelectItem>
                                                    <SelectItem key="dark">Dark</SelectItem>
                                                    <SelectItem key="system">System</SelectItem>
                                                </Select>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">High Contrast</p>
                                                    <p className="text-sm text-default-600">Increase contrast for better visibility</p>
                                                </div>
                                                <Switch
                                                    isSelected={settings.highContrast}
                                                    onValueChange={(value) => updateSetting('highContrast', value)}
                                                />
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Typography Settings */}
                                <Card>
                                    <CardBody className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TbTypography size={20} className="text-secondary" />
                                            <h3 className="text-lg font-semibold">Typography</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="font-medium">Font Size</p>
                                                    <Chip size="sm" variant="flat">{settings.fontSize}px</Chip>
                                                </div>
                                                <Slider
                                                    size="sm"
                                                    step={1}
                                                    minValue={12}
                                                    maxValue={24}
                                                    value={settings.fontSize}
                                                    onChange={(value) => updateSetting('fontSize', Array.isArray(value) ? value[0] : value)}
                                                    className="max-w-md"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="font-medium">Line Height</p>
                                                    <Chip size="sm" variant="flat">{settings.lineHeight}</Chip>
                                                </div>
                                                <Slider
                                                    size="sm"
                                                    step={0.1}
                                                    minValue={1.2}
                                                    maxValue={2.0}
                                                    value={settings.lineHeight}
                                                    onChange={(value) => updateSetting('lineHeight', Array.isArray(value) ? value[0] : value)}
                                                    className="max-w-md"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="font-medium">Letter Spacing</p>
                                                    <Chip size="sm" variant="flat">{settings.letterSpacing}px</Chip>
                                                </div>
                                                <Slider
                                                    size="sm"
                                                    step={0.5}
                                                    minValue={-1}
                                                    maxValue={3}
                                                    value={settings.letterSpacing}
                                                    onChange={(value) => updateSetting('letterSpacing', Array.isArray(value) ? value[0] : value)}
                                                    className="max-w-md"
                                                />
                                            </div>

                                            <div>
                                                <p className="font-medium mb-2">Font Family</p>
                                                <Select
                                                    selectedKeys={[settings.fontFamily]}
                                                    onSelectionChange={(keys) => updateSetting('fontFamily', Array.from(keys)[0] as string)}
                                                    className="max-w-md"
                                                >
                                                    {fontOptions.map((font) => (
                                                        <SelectItem key={font.key}>{font.label}</SelectItem>
                                                    ))}
                                                </Select>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Motion & Focus Settings */}
                                <Card>
                                    <CardBody className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TbAdjustments size={20} className="text-success" />
                                            <h3 className="text-lg font-semibold">Motion &amp; Focus</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">Reduced Motion</p>
                                                    <p className="text-sm text-default-600">Minimize animations and transitions</p>
                                                </div>
                                                <Switch
                                                    isSelected={settings.reducedMotion}
                                                    onValueChange={(value) => updateSetting('reducedMotion', value)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">Enhanced Focus Indicators</p>
                                                    <p className="text-sm text-default-600">Stronger focus outlines for keyboard navigation</p>
                                                </div>
                                                <Switch
                                                    isSelected={settings.focusIndicators}
                                                    onValueChange={(value) => updateSetting('focusIndicators', value)}
                                                />
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <Button variant="light" onPress={resetSettings}>
                                <TbRefresh size={16} />
                                Reset
                            </Button>
                            <Button
                                color="primary"
                                onPress={saveSettings}
                                isDisabled={!hasUnsavedChanges}
                            >
                                <TbDeviceFloppy size={16} />
                                Save Changes
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}