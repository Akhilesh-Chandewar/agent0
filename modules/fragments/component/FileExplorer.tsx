"use client";

import { useState } from "react";
import { FileIcon, FolderIcon, FolderOpenIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileNode {
    name: string;
    path: string;
    type: "file" | "folder";
    // During construction this is a Record, after conversion it's an array
    children?: Record<string, FileNode> | FileNode[];
}

interface FileExplorerProps {
    files: Record<string, string>;
    selectedFile: string | null;
    onFileSelect: (path: string) => void;
}

// Build a tree structure from flat file paths
function buildFileTree(files: Record<string, string>): FileNode[] {
    const root: Record<string, FileNode> = {};

    Object.keys(files).forEach((filePath) => {
        const parts = filePath.split("/").filter(Boolean);
        let current = root;

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            const currentPath = parts.slice(0, index + 1).join("/");

            if (!current[part]) {
                current[part] = {
                    name: part,
                    path: currentPath,
                    type: isFile ? "file" : "folder",
                    children: isFile ? undefined : {},
                };
            }

            if (!isFile && current[part].children) {
                current = current[part].children as Record<string, FileNode>;
            }
        });
    });

    // Convert to array and sort (folders first, then files)
    const convertToArray = (nodes: Record<string, FileNode>): FileNode[] => {
        return Object.values(nodes)
            .sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === "folder" ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            })
            .map((node) => ({
                ...node,
                children: node.children
                    ? Array.isArray(node.children)
                        ? node.children
                        : convertToArray(node.children)
                    : undefined,
            }));
    };

    return convertToArray(root);
}

function FileTreeNode({
    node,
    selectedFile,
    onFileSelect,
    level = 0,
}: {
    node: FileNode;
    selectedFile: string | null;
    onFileSelect: (path: string) => void;
    level?: number;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const isSelected = selectedFile === node.path;

    if (node.type === "file") {
        return (
            <button
                onClick={() => onFileSelect(node.path)}
                className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-md transition-colors text-left",
                    isSelected && "bg-accent text-accent-foreground"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{node.name}</span>
            </button>
        );
    }

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-accent rounded-md transition-colors text-left"
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {isOpen ? (
                    <ChevronDownIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                {isOpen ? (
                    <FolderOpenIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                    <FolderIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{node.name}</span>
            </button>
            {isOpen && node.children && (
                <div>
                    {(Array.isArray(node.children) ? node.children : Object.values(node.children)).map((child) => (
                        <FileTreeNode
                            key={child.path}
                            node={child}
                            selectedFile={selectedFile}
                            onFileSelect={onFileSelect}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FileExplorer({ files, selectedFile, onFileSelect }: FileExplorerProps) {
    const fileTree = buildFileTree(files);

    if (Object.keys(files).length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No files available
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-2 space-y-0.5">
                {fileTree.map((node) => (
                    <FileTreeNode
                        key={node.path}
                        node={node}
                        selectedFile={selectedFile}
                        onFileSelect={onFileSelect}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}
