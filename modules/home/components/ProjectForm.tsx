"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import z from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { testAgent } from "../actions";

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
    mode: "onChange",
  });

  function handleTemplate(prompt: string) {
    form.setValue("content", prompt);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsPending(true);
      console.log("Creating project:", values.content);
      toast.success("Project created successfully" + values.content);
      form.reset();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create project");
    } finally {
      setIsPending(false);
    }
  }

  const isButtonDisabled =
    isPending || !form.watch("content")?.trim();

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        disabled={isPending}
        onClick={async () => {
          try {
            setIsPending(true);

            const res = await testAgent(form.watch("content"));

            toast.success(res.message);
          } catch (err: any) {
            toast.error(err?.message || "Agent failed");
          } finally {
            setIsPending(false);
          }
        }}
      >
        {isPending ? "Running agent..." : "Test Agent"}
      </Button>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
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
                disabled={isPending}
                placeholder="Describe what your agent will do..."
                minRows={3}
                maxRows={8}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                  "w-full resize-none border-none bg-transparent pt-4 outline-none",
                  isPending && "opacity-50"
                )}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    (e.metaKey || e.ctrlKey)
                  ) {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)();
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
              {isPending ? (
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
