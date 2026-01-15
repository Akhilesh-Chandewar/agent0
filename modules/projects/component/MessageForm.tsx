"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { useCreateMessages } from "@/modules/messages/hook/message";


const formSchema = z.object({
    content: z
        .string()
        .min(1, "Message is required")
        .max(1000, "Message is too long"),
});

type FormValues = z.infer<typeof formSchema>;


const MessageForm = ({ projectId }: { projectId: string }) => {
    const [isFocused, setIsFocused] = useState(false);

    const { mutateAsync, isPending } = useCreateMessages(projectId);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: "",
        },
        mode: "onChange",
    });

    const onSubmit = async (values: FormValues) => {
        try {
            await mutateAsync(values.content);
            form.reset();
            toast.success("Message sent successfully");
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Failed to send message");
            }
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn(
                    "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                    isFocused && "shadow-xs"
                )}
            >
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <TextAreaAutosize
                            {...field}
                            disabled={isPending}
                            placeholder="What would you like to build?"
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            minRows={2}
                            maxRows={8}
                            className={cn(
                                "pt-4 resize-none border-none w-full outline-none bg-transparent",
                                isPending && "opacity-50"
                            )}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    form.handleSubmit(onSubmit)(e);
                                }
                            }}
                        />
                    )}
                />

                <div className="flex gap-x-2 items-end justify-between pt-2">
                    <div className="text-[10px] text-muted-foreground font-mono">
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            <span>&#8984;</span>Enter
                        </kbd>
                        &nbsp;to submit
                    </div>

                    <Button
                        type="submit"
                        disabled={isPending}
                        className={cn(
                            "size-8 rounded-full",
                            isPending && "bg-muted-foreground border"
                        )}
                    >
                        {isPending ? (
                            <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                            <ArrowUpIcon className="size-4" />
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default MessageForm;
