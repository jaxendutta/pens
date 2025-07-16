'use client';

import { useMemo } from 'react';
import { Card, CardBody, CardHeader, Divider, Link, Chip } from '@heroui/react';

interface ContentRendererProps {
    content: string;
    useChapterCards?: boolean;
}

export function ContentRenderer({ content, useChapterCards = false }: ContentRendererProps) {
    const processedContent = useMemo(() => {
        try {
            return parseMarkdownContent(content, useChapterCards);
        } catch (error) {
            console.error('Error processing content:', error);
            return <div className="text-red-500">Error rendering content</div>;
        }
    }, [content, useChapterCards]);

    return (
        <div className="content-area max-w-none">
            {processedContent}
        </div>
    );
}

function parseMarkdownContent(content: string, useChapterCards: boolean): React.ReactNode[] {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentChapterContent: React.ReactNode[] = [];
    let currentChapterTitle = '';
    let currentChapterId = '';
    let chapterCount = 0;
    let sectionCounts: { [key: number]: number } = {};
    let elementIndex = 0;

    const finishCurrentChapter = () => {
        if (useChapterCards && currentChapterContent.length > 0) {
            elements.push(
                <Card key={currentChapterId || `chapter-${elements.length}`} className="mb-8 lg:p-6 md:p-5 p-4">
                    {currentChapterTitle && (
                        <CardHeader>
                            <h1
                                id={currentChapterId}
                                className="text-3xl lg:text-4xl font-bold text-foreground scroll-mt-32"
                            >
                                {currentChapterTitle}
                            </h1>
                        </CardHeader>
                    )}
                    <CardBody className="space-y-6">
                        {currentChapterContent}
                    </CardBody>
                </Card>
            );
            currentChapterContent = [];
        }
    };

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) {
            i++;
            continue;
        }

        // Headings
        if (trimmedLine.startsWith('#')) {
            const level = (trimmedLine.match(/^#+/) || [''])[0].length;
            const text = trimmedLine.replace(/^#+\s*/, '').trim();
            const cleanText = text.replace(/^\d+\.?\s*/, '');
            const id = generateId(cleanText);

            // Generate numbering
            let number = '';
            if (level === 1) {
                chapterCount++;
                sectionCounts[1] = chapterCount;
                for (let j = 2; j <= 6; j++) {
                    sectionCounts[j] = 0;
                }
                number = `${chapterCount}`;
            } else if (level === 2 && sectionCounts[1]) {
                sectionCounts[2] = (sectionCounts[2] || 0) + 1;
                for (let j = 3; j <= 6; j++) {
                    sectionCounts[j] = 0;
                }
                number = `${sectionCounts[1]}.${sectionCounts[2]}`;
            } else if (level === 3 && sectionCounts[2]) {
                sectionCounts[3] = (sectionCounts[3] || 0) + 1;
                number = `${sectionCounts[1]}.${sectionCounts[2]}.${sectionCounts[3]}`;
            }

            if (level === 1 && useChapterCards) {
                finishCurrentChapter();
                currentChapterTitle = `${number} ${cleanText}`;
                currentChapterId = id;
            } else {
                const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
                const element = (
                    <HeadingTag
                        key={elementIndex++}
                        id={id}
                        className={getHeadingClass(level)}
                    >
                        {number && <span className="text-default-500">{number}</span>} {cleanText}
                    </HeadingTag>
                );

                if (useChapterCards && chapterCount > 0) {
                    currentChapterContent.push(element);
                } else {
                    elements.push(element);
                }
            }
        }
        // Blockquotes
        else if (trimmedLine.startsWith('>')) {
            const blockquoteLines = [trimmedLine.replace(/^>\s*/, '')];
            i++;
            while (i < lines.length && lines[i].trim().startsWith('>')) {
                blockquoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
                i++;
            }
            i--; // Back up one

            const blockquoteText = blockquoteLines.join('<br>');
            const element = (
                <Card key={elementIndex++} className="my-8 border-l-4 border-primary bg-default-50">
                    <CardBody className="px-6 py-4 italic">
                        <div className="mb-0 leading-relaxed text-foreground">
                            {parseInlineMarkdown(blockquoteText)}
                        </div>
                    </CardBody>
                </Card>
            );

            if (useChapterCards && chapterCount > 0) {
                currentChapterContent.push(element);
            } else {
                elements.push(element);
            }
        }
        // Horizontal rules
        else if (trimmedLine === '---' || trimmedLine === '***') {
            const element = <Divider key={elementIndex++} className="my-12 w-1/2 mx-auto" />;

            if (useChapterCards && chapterCount > 0) {
                currentChapterContent.push(element);
            } else {
                elements.push(element);
            }
        }
        // Paragraphs - collect all consecutive non-empty lines
        else if (trimmedLine && !trimmedLine.startsWith('```')) {
            const paragraphLines = [line];
            i++;

            // Collect all consecutive lines until we hit an empty line or special syntax
            while (i < lines.length) {
                const nextLine = lines[i];
                const nextTrimmed = nextLine.trim();

                // Stop if we hit an empty line, heading, blockquote, or horizontal rule
                if (!nextTrimmed ||
                    nextTrimmed.startsWith('#') ||
                    nextTrimmed.startsWith('>') ||
                    nextTrimmed === '---' ||
                    nextTrimmed === '***' ||
                    nextTrimmed.startsWith('```')) {
                    break;
                }

                paragraphLines.push(nextLine);
                i++;
            }
            i--; // Back up one since we'll increment at the end of the loop

            // Join lines with <br> to preserve line breaks within paragraphs
            const paragraphText = paragraphLines
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .join('<br>');

            if (paragraphText) {
                const element = (
                    <p key={elementIndex++} className="mb-6 leading-relaxed text-foreground text-justify">
                        {parseInlineMarkdown(paragraphText)}
                    </p>
                );

                if (useChapterCards && chapterCount > 0) {
                    currentChapterContent.push(element);
                } else {
                    elements.push(element);
                }
            }
        }

        i++;
    }

    // Finish the last chapter if using cards
    if (useChapterCards) {
        finishCurrentChapter();
    }

    return elements;
}

function parseInlineMarkdown(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Check for HTML line breaks first
        const brMatch = remaining.match(/<br\s*\/?>/i);
        if (brMatch && brMatch.index !== undefined) {
            if (brMatch.index > 0) {
                parts.push(remaining.substring(0, brMatch.index));
            }
            parts.push(<br key={`br-${key++}`} />);
            remaining = remaining.substring(brMatch.index + brMatch[0].length);
            continue;
        }

        // Check for bold text
        const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
        if (boldMatch && boldMatch.index !== undefined) {
            if (boldMatch.index > 0) {
                parts.push(remaining.substring(0, boldMatch.index));
            }
            parts.push(<strong key={`bold-${key++}`}>{boldMatch[1]}</strong>);
            remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
            continue;
        }

        // Check for italic text
        const italicMatch = remaining.match(/\*(.*?)\*/);
        if (italicMatch && italicMatch.index !== undefined) {
            if (italicMatch.index > 0) {
                parts.push(remaining.substring(0, italicMatch.index));
            }
            parts.push(<em key={`italic-${key++}`}>{italicMatch[1]}</em>);
            remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
            continue;
        }

        // Check for links
        const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch && linkMatch.index !== undefined) {
            if (linkMatch.index > 0) {
                parts.push(remaining.substring(0, linkMatch.index));
            }
            parts.push(
                <Link
                    key={`link-${key++}`}
                    href={linkMatch[2]}
                    className="text-primary hover:text-primary-600 underline underline-offset-2 transition-colors duration-200 font-medium"
                    isExternal={linkMatch[2].startsWith('http')}
                >
                    {linkMatch[1]}
                </Link>
            );
            remaining = remaining.substring(linkMatch.index + linkMatch[0].length);
            continue;
        }

        // Check for inline code
        const codeMatch = remaining.match(/`([^`]+)`/);
        if (codeMatch && codeMatch.index !== undefined) {
            if (codeMatch.index > 0) {
                parts.push(remaining.substring(0, codeMatch.index));
            }
            parts.push(
                <Chip
                    key={`code-${key++}`}
                    variant="flat"
                    size="sm"
                    className="bg-default-100 text-primary px-2 py-1 font-mono text-sm"
                >
                    {codeMatch[1]}
                </Chip>
            );
            remaining = remaining.substring(codeMatch.index + codeMatch[0].length);
            continue;
        }

        // No more matches, add the remaining text
        parts.push(remaining);
        break;
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function getHeadingClass(level: number): string {
    const classes = {
        1: "text-3xl lg:text-4xl font-bold text-foreground mb-6 mt-12 pb-3 border-b-2 border-divider scroll-mt-32 first:mt-0",
        2: "text-2xl lg:text-3xl font-bold text-foreground mb-4 mt-10 pb-2 border-b border-divider scroll-mt-32",
        3: "text-xl lg:text-2xl font-semibold text-foreground mb-3 mt-8 scroll-mt-32",
        4: "text-lg lg:text-xl font-semibold text-foreground mb-3 mt-6 scroll-mt-32",
        5: "text-base lg:text-lg font-semibold text-foreground mb-2 mt-5 scroll-mt-32",
        6: "text-sm lg:text-base font-semibold text-foreground mb-2 mt-4 scroll-mt-32"
    };

    return classes[level as keyof typeof classes] || classes[6];
}

function generateId(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
}