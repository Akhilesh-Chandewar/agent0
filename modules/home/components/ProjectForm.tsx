"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useCallback, useMemo } from "react";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { useCreateProject } from "@/modules/projects/hook/project";

const formSchema = z.object({
  content: z
    .string()
    .min(1, "Project description is required")
    .max(1000, "Description is too long"),
});

function ProjectForm() {
  const [isFocused, setIsFocused] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const { mutateAsync, isPending: isCreating } = useCreateProject();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" },
    mode: "onChange",
  });

  const handleTemplate = (prompt: string) => {
    form.setValue("content", prompt, { shouldValidate: true });
  };

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    if (isPending || isCreating) return;

    try {
      setIsPending(true);

      const result = await mutateAsync(values.content);

      if (result.success && result.project) {
        toast.success("Project created successfully");
        form.reset();
        router.push(`/projects/${result.project._id}`);
      } else {
        toast.error(result.message || "Failed to create project");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to create project");
    } finally {
      setIsPending(false);
    }
  }, [isPending, isCreating, mutateAsync, form, router]);

  const submitHandler = useMemo(() => form.handleSubmit(onSubmit), [form, onSubmit]);

  const isButtonDisabled = isCreating || !form.watch("content")?.trim();

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          onSubmit={submitHandler}
          className={cn(
            "relative border rounded-xl bg-card p-4 pt-1 transition-all",
            isFocused && "shadow-lg ring-2 ring-primary/20"
          )}
        >
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <TextAreaAutosize
                {...field}
                disabled={isPending || isCreating}
                placeholder="Describe what your agent will do..."
                minRows={3}
                maxRows={8}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                  "w-full resize-none border-none bg-transparent pt-4 outline-none",
                  (isPending || isCreating) && "opacity-50"
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submitHandler(e);
                  }
                }}
              />
            )}
          />

          <div className="flex items-end justify-between pt-2">
            <div className="text-[10px] text-muted-foreground font-mono">
              <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px]">
                <span>⌘</span>Enter
              </kbd>{" "}
              to submit
            </div>

            <Button
              type="submit"
              disabled={isButtonDisabled}
              className={cn(
                "size-8 rounded-full",
                isButtonDisabled && "bg-muted text-muted-foreground"
              )}
            >
              {isPending || isCreating ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ArrowUpIcon className="size-4" />
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default ProjectForm;