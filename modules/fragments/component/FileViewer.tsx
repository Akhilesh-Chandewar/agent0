"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { CopyIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FileViewerProps {
    fileName: string;
    content: string;
}

// Get language from file extension
function getLanguageFromFileName(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
        py: "python",
        js: "javascript",
        ts: "typescript",
        jsx: "javascript",
        tsx: "typescript",
        html: "html",
        css: "css",
        json: "json",
        md: "markdown",
        yaml: "yaml",
        yml: "yaml",
        sh: "bash",
        txt: "text",
        rs: "rust",
        go: "go",
        java: "java",
        cpp: "cpp",
        c: "c",
        rb: "ruby",
        php: "php",
    };
    return languageMap[ext || ""] || "text";
}

export default function FileViewer({ fileName, content }: FileViewerProps) {
    const [copied, setCopied] = useState(false);
    const language = getLanguageFromFileName(fileName);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-muted/30">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-background/50">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{fileName}</span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                        {language}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 w-8 p-0"
                >
                    {copied ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                        <CopyIcon className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-4">
                    <pre className="text-sm">
                        <code className="font-mono">{content}</code>
                    </pre>
                </div>
            </ScrollArea>
        </div>
    );
}
