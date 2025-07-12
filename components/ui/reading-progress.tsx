'use client';

import { useState, useEffect } from 'react';
import { Progress } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";

export function ReadingProgress() {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const calculateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;

            setProgress(Math.min(Math.max(scrollPercent, 0), 100));
            setIsVisible(scrollTop > 100);
        };

        calculateProgress();
        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress);

        return () => {
            window.removeEventListener('scroll', calculateProgress);
            window.removeEventListener('resize', calculateProgress);
        };
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-0 left-0 right-0 z-50"
                >
                    <Progress
                        value={progress}
                        color="primary"
                        size="sm"
                        className="rounded-none"
                        classNames={{
                            base: "bg-background/80 backdrop-blur-sm",
                            indicator: "bg-gradient-to-r from-primary to-secondary",
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}