"use client";

import {
    useGetMessages,
    prefetchMessages,
} from "@/modules/messages/hook/message";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef } from "react";

import MessageLoading from "./MessageLoading";
import MessageCard from "./MessageCard";
import MessageForm from "./MessageForm";

interface MessageContainerProps {
    projectId: string;
    activeFragment: string | null;
    setActiveFragment: (fragment: string | null) => void;
}

function MessageContainer({
    projectId,
    activeFragment,
    setActiveFragment,
}: MessageContainerProps) {
    const queryClient = useQueryClient();

    const bottomRef = useRef<HTMLDivElement>(null);

    const {
        data: messages,
        isPending,
        isError,
        error,
    } = useGetMessages(projectId);

    useEffect(() => {
        if (projectId) {
            prefetchMessages(queryClient, projectId);
        }
    }, [projectId, queryClient]);

    if (isPending) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2Icon className="animate-spin size-4 text-emerald-400" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                Error: {error instanceof Error ? error.message : "Failed to load messages"}
            </div>
        );
    }

    if (!messages || messages.length === 0) {
        return (
            <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    No messages yet. Start a conversation!
                </div>
                <div className="relative p-3 pt-1">
                    <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
                </div>
            </div>
        );
    }

    const lastMessage = messages[messages.length - 1];
    const isLastMessageUser =
        lastMessage.role === "USER" && lastMessage.type === "RESULT";

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="pt-2 pr-1">
                    {messages.map((message) => {
                        const messageId = message._id?.toString();

                        const fragmentId =
                            message.fragment?.toString?.() ?? null;

                        return (
                            <MessageCard
                                key={messageId}
                                content={message.content}
                                role={message.role}
                                fragment={fragmentId}
                                createdAt={message.createdAt}
                                isActiveFragment={activeFragment === fragmentId}
                                onFragmentClick={(fragmentId) =>
                                    setActiveFragment(fragmentId)
                                }
                                type={message.type}
                            />
                        );
                    })}

                    {isLastMessageUser && <MessageLoading />}

                    <div ref={bottomRef} />
                </div>
            </div>

            <div className="relative p-3 pt-1">
                <div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background pointer-events-none" />
                <MessageForm projectId={projectId} />
            </div>
        </div>
    );
}

export default MessageContainer;
