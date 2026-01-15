import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronRightIcon, Code2Icon } from "lucide-react";

interface FragmentCardProps {
    fragmentId: string;
    isActiveFragment: boolean;
    onFragmentClick: (fragmentId: string) => void;
}

const FragmentCard = ({
    fragmentId,
    isActiveFragment,
    onFragmentClick,
}: FragmentCardProps) => {
    return (
        <button
            type="button"
            className={cn(
                "flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-2 hover:bg-secondary transition-colors",
                isActiveFragment &&
                "bg-primary text-primary-foreground border-primary hover:bg-primary"
            )}
            onClick={() => onFragmentClick(fragmentId)}
        >
            <Code2Icon className="size-4 mt-0.5" />
            <div className="flex flex-col flex-1">
                <span className="text-sm font-medium line-clamp-1">
                    Fragment Preview
                </span>
                <span className="text-sm">Open</span>
            </div>
            <ChevronRightIcon className="size-4 mt-0.5" />
        </button>
    );
};


interface UserMessageProps {
    content: string;
}

const UserMessage = ({ content }: UserMessageProps) => {
    return (
        <div className="flex justify-end pb-4 pr-2 pl-10">
            <Card className="rounded-lg bg-muted p-2 shadow-none border-none max-w-[80%] wrap-break-word">
                {content}
            </Card>
        </div>
    );
};



interface AssistantMessageProps {
    content: string;
    fragment?: string | null;
    createdAt: string | Date;
    isActiveFragment: boolean;
    onFragmentClick: (fragmentId: string) => void;
    type: string;
}

const AssistantMessage = ({
    content,
    fragment,
    createdAt,
    isActiveFragment,
    onFragmentClick,
    type,
}: AssistantMessageProps) => {
    return (
        <div
            className={cn(
                "flex flex-col group px-2 pb-4",
                type === "ASSISTANT" &&
                "text-red-700 dark:text-red-500"
            )}
        >
            <div className="flex items-center gap-2 pl-2 mb-2">
                <span className="text-sm font-medium">Agent0</span>
                <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {format(new Date(createdAt), "HH:mm 'on' MMM dd, yyyy")}
                </span>
            </div>

            <div className="pl-8.5 flex flex-col gap-y-4">
                <span>{content}</span>

                {fragment && type === "RESULT" && (
                    <FragmentCard
                        fragmentId={fragment}
                        isActiveFragment={isActiveFragment}
                        onFragmentClick={onFragmentClick}
                    />
                )}
            </div>
        </div>
    );
};

interface MessageCardProps {
    content: string;
    role: string;
    fragment?: string | null;
    createdAt: string | Date;
    isActiveFragment: boolean;
    onFragmentClick: (fragmentId: string) => void;
    type: string;
}

const MessageCard = ({
    content,
    role,
    fragment,
    createdAt,
    isActiveFragment,
    onFragmentClick,
    type,
}: MessageCardProps) => {
    if (role === "ASSISTANT") {
        return (
            <AssistantMessage
                content={content}
                fragment={fragment}
                createdAt={createdAt}
                isActiveFragment={isActiveFragment}
                onFragmentClick={onFragmentClick}
                type={type}
            />
        );
    }

    return <UserMessage content={content} />;
};

export default MessageCard;
