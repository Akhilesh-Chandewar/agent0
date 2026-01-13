import { inngest } from "./client";
import { gemini, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import Sandbox from "@e2b/code-interpreter";
import { z } from "zod";
import mongoose from "mongoose";
import Message, { MessageTypeEnum } from "@/modules/messages/model/messages";
import Project from "@/modules/projects/model/project";
import Fragment from "@/modules/fragments/model/fragment";
import connectToDatabase from "@/lib/databaseConnection";

const AGENT_BUILDER_PROMPT = `You are an expert AI agent builder specializing in Google ADK (Agent Development Kit).

Your role is to help users create, configure, and deploy AI agents using Google's Generative AI platform.

When building agents:
1. Analyze the user's requirements carefully
2. Create appropriate agent configurations
3. Implement necessary tools and capabilities
4. Write clean, well-documented Python code using google-genai SDK
5. Test the agent implementation
6. Provide clear explanations of what you've built

Always structure your response with a <task_summary> section at the end containing:
- <title>Brief descriptive title (max 50 chars)</title>
- <response>Friendly 2-3 sentence explanation of what was built</response>
- What agent was created
- Key features and capabilities
- Files created/modified
- Next steps for the user

Available tools:
- terminal: Run shell commands in the sandbox
- createOrUpdateFiles: Create or modify Python agent files
- readFiles: Read existing files
- installPackages: Install Python packages`;

const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Helper function to check if error is a quota/rate limit error
function isQuotaError(error: any): boolean {
    if (!error) return false;
    const errorStr = JSON.stringify(error);
    return (
        errorStr.includes("RESOURCE_EXHAUSTED") ||
        errorStr.includes("429") ||
        errorStr.includes("quota") ||
        errorStr.includes("rate limit") ||
        errorStr.includes("rate-limit")
    );
}

// Helper function to extract retry delay from error
function getRetryDelay(error: any): number {
    try {
        if (error?.error?.details) {
            for (const detail of error.error.details) {
                if (detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo" && detail.retryDelay) {
                    // Parse delay like "42s" or "42.322503362s"
                    const delayStr = detail.retryDelay.replace("s", "");
                    const delay = parseFloat(delayStr);
                    return Math.ceil(delay * 1000); // Convert to milliseconds
                }
            }
        }
    } catch (e) {
        console.error("Error parsing retry delay:", e);
    }
    return 120000; // Default to 120 seconds (2 minutes) for rate limit errors
}

// Helper function to retry with exponential backoff
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    step: any,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            if (isQuotaError(error)) {
                const delay = attempt === 0 ? getRetryDelay(error) : baseDelay * Math.pow(2, attempt);
                console.log(`Quota error detected, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);

                if (step && delay > 0) {
                    await step.sleep(`quota-retry-${attempt}`, delay);
                } else {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } else {
                // For non-quota errors, throw immediately
                throw error;
            }
        }
    }

    throw lastError;
}

export const codeAgentFunction = inngest.createFunction(
    { id: "code-agent" },
    { event: "code-agent/run" },
    async ({ event, step }) => {
        await connectToDatabase();
        try {
            // Convert string projectId to ObjectId
            const projectId = new mongoose.Types.ObjectId(event.data.projectId);
            const cacheKey = JSON.stringify({ value: event.data.value, projectId: event.data.projectId });
            const cached = responseCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                console.log("Returning cached response");
                return cached.data;
            }
            const sandboxId = await step.run("create-sandbox", async () => {
                const sandbox = await Sandbox.create();
                return sandbox.sandboxId;
            });

            const agentBuilder = createAgent({
                name: "code-agent",
                description: "Code Agent",
                system: AGENT_BUILDER_PROMPT,
                model: gemini({ model: "gemini-2.5-flash" }),
                tools: [
                    createTool({
                        name: "terminal",
                        description: "Run shell commands in the sandbox (e.g., python scripts, pip install, ls, cat)",
                        parameters: z.object({
                            command: z.string().describe("The shell command to execute"),
                        }),
                        handler: async ({ command }, { step }) => {
                            await step?.sleep("terminal-rate-limit", 1000); // Increased from 300 to 1000ms

                            return await step?.run(`terminal-${command.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}`, async () => {
                                const buffers = { stdout: "", stderr: "" };

                                try {
                                    const sandbox = await Sandbox.connect(sandboxId);
                                    const result = await sandbox.commands.run(command, {
                                        onStdout: (data) => {
                                            buffers.stdout += data;
                                        },
                                        onStderr: (data) => {
                                            buffers.stderr += data;
                                        },
                                    });

                                    return result.stdout || buffers.stdout;
                                } catch (error) {
                                    console.error(
                                        `Command failed: ${error} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
                                    );
                                    return `Command failed: ${error} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
                                }
                            });
                        },
                    }),

                    createTool({
                        name: "createOrUpdateFiles",
                        description: "Create or update agent files (Python scripts, configs, etc.)",
                        parameters: z.object({
                            files: z.array(
                                z.object({
                                    path: z.string().describe("File path relative to /workspace"),
                                    content: z.string().describe("Complete file content"),
                                })
                            ),
                        }),
                        handler: async ({ files }, { step, network }) => {
                            // Always add delay to avoid rate limits
                            await step?.sleep("batch-rate-limit", files.length > 2 ? 1500 : 800); // Increased delays

                            const newFiles = await step?.run(
                                "createOrUpdateFiles",
                                async () => {
                                    try {
                                        const updatedFiles = network?.state?.data.files || {};
                                        const sandbox = await Sandbox.connect(sandboxId);

                                        for (const file of files) {
                                            const fullPath = file.path.startsWith("/workspace")
                                                ? file.path
                                                : `/workspace/${file.path}`;

                                            await sandbox.files.write(fullPath, file.content);
                                            updatedFiles[file.path] = file.content;
                                            console.log(`File created/updated: ${file.path}`);
                                        }

                                        return updatedFiles;
                                    } catch (error) {
                                        console.error("Error creating files:", error);
                                        return `Error: ${error}`;
                                    }
                                }
                            );

                            if (typeof newFiles === "object") {
                                network.state.data.files = newFiles;
                            }

                            return `Successfully created/updated ${files.length} file(s)`;
                        },
                    }),

                    createTool({
                        name: "readFiles",
                        description: "Read existing files from the sandbox",
                        parameters: z.object({
                            files: z.array(z.string().describe("File paths to read")),
                        }),
                        handler: async ({ files }, { step }) => {
                            await step?.sleep("read-rate-limit", 800); // Increased from 200 to 800ms

                            return await step?.run("readFiles", async () => {
                                try {
                                    const sandbox = await Sandbox.connect(sandboxId);
                                    const contents = [];

                                    for (const file of files) {
                                        const fullPath = file.startsWith("/workspace")
                                            ? file
                                            : `/workspace/${file}`;

                                        try {
                                            const content = await sandbox.files.read(fullPath);
                                            contents.push({ path: file, content });
                                        } catch (error) {
                                            contents.push({ path: file, content: `Error reading file: ${error}` });
                                        }
                                    }

                                    return JSON.stringify(contents, null, 2);
                                } catch (error) {
                                    return `Error: ${error}`;
                                }
                            });
                        },
                    }),

                    createTool({
                        name: "installPackages",
                        description: "Install Python packages via pip",
                        parameters: z.object({
                            packages: z.array(z.string().describe("Package names to install")),
                        }),
                        handler: async ({ packages }, { step }) => {
                            await step?.sleep("install-rate-limit", 1200); // Increased from 500 to 1200ms

                            return await step?.run("installPackages", async () => {
                                try {
                                    const sandbox = await Sandbox.connect(sandboxId);
                                    const command = `pip install ${packages.join(" ")}`;
                                    const result = await sandbox.commands.run(command);

                                    return `Successfully installed: ${packages.join(", ")}`;
                                } catch (error) {
                                    return `Error installing packages: ${error}`;
                                }
                            });
                        },
                    }),
                ],

                lifecycle: {
                    onResponse: async ({ result, network }) => {
                        const lastMessage = result.output[result.output.length - 1];

                        if (lastMessage && lastMessage.type === "text" && network) {
                            const content = Array.isArray(lastMessage.content)
                                ? lastMessage.content.join("")
                                : lastMessage.content;

                            if (content.includes("<task_summary>")) {
                                network.state.data.summary = content;
                            }
                        }

                        // Add delay after each agent response to avoid rate limits
                        // This helps space out API calls during network iterations
                        if (network) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }

                        return result;
                    },
                },
            });

            const network = createNetwork({
                name: "agent-builder-network",
                agents: [agentBuilder],
                maxIter: 5, // Reduced from 8 to minimize API calls
                router: async ({ network }) => {
                    const summary = network.state.data.summary;
                    const files = network.state.data.files;
                    if (summary && files && Object.keys(files).length > 0) {
                        console.log("Early exit: Summary and files complete");
                        return;
                    }

                    if (summary) {
                        console.log("Exit: Summary generated");
                        return;
                    }

                    return agentBuilder;
                },
            });

            // Add initial delay to help avoid rate limits
            await step.sleep("initial-rate-limit-delay", 5000); // Increased from 2000 to 5000ms

            // Run network with retry logic for quota errors
            // Increased retries and longer delays for better rate limit handling
            const result = await retryWithBackoff(
                () => network.run(event.data.value),
                step,
                5, // Increased from 3 to 5 retries
                15000 // Increased base delay from 10000 to 15000ms
            );

            if (!result.state.data.summary) {
                return {
                    title: "Error",
                    message: "Failed to generate agent. Please try again.",
                    success: false,
                };
            }

            // Extract title and response from summary instead of making separate API calls
            // This eliminates 2 LLM API calls per request
            const extractTitleAndResponse = (summary: string) => {
                let title = "Google ADK Agent";
                let response = "Your agent has been created successfully!";

                // Try to extract title from <title> tags
                const titleMatch = summary.match(/<title>([\s\S]*?)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                    title = titleMatch[1].trim().substring(0, 50);
                } else {
                    // Fallback: extract first line or first sentence
                    const firstLine = summary.split('\n')[0].trim();
                    if (firstLine.length > 0 && firstLine.length <= 50) {
                        title = firstLine;
                    }
                }

                // Try to extract response from <response> tags
                const responseMatch = summary.match(/<response>([\s\S]*?)<\/response>/i);
                if (responseMatch && responseMatch[1]) {
                    response = responseMatch[1].trim();
                } else {
                    // Fallback: use first 2-3 sentences from summary
                    const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
                    if (sentences.length > 0) {
                        response = sentences.slice(0, 2).join('. ').trim() + '.';
                        if (response.length > 200) {
                            response = sentences[0].trim() + '.';
                        }
                    }
                }

                return { title, response };
            };

            const { title: extractedTitle, response: extractedResponse } = extractTitleAndResponse(result.state.data.summary);

            const generateTitle = () => extractedTitle;
            const generateResponse = () => extractedResponse;

            const isError =
                !result.state.data.summary ||
                Object.keys(result.state.data.files || {}).length === 0;

            if (isError) {
                return {
                    title: "Error",
                    message: generateResponse(),
                    success: false,
                };
            }

            const sandboxUrl = await step.run("get-sandbox-url", async () => {
                try {
                    const sandbox = await Sandbox.connect(sandboxId);
                    const host = sandbox.getHost(8000);
                    return `http://${host}`;
                } catch (error) {
                    console.log("Sandbox URL not available");
                    return null;
                }
            });

            await step.run("save-result", async () => {
                if (isError) {
                    const errorMessage = await Message.create({
                        projectId: projectId,
                        content: "Something went wrong. Please try again.",
                        role: "ASSISTANT",
                        type: "ERROR",
                    });

                    // Add message to project's messages array
                    await Project.findByIdAndUpdate(
                        projectId,
                        { $push: { messages: errorMessage._id } },
                        { new: true }
                    );

                    return errorMessage;
                }

                const message = await Message.create({
                    projectId: projectId,
                    content: generateResponse(),
                    role: "ASSISTANT",
                    type: "RESULT",
                });

                // Only create fragment if sandboxUrl is available
                if (sandboxUrl) {
                    const fragment = await Fragment.create({
                        messageId: message._id,
                        sandboxUrl: sandboxUrl,
                        title: generateTitle(),
                        files: result.state.data.files || {},
                    });

                    message.fragment = fragment._id;
                    await message.save();
                }

                // Add message to project's messages array
                await Project.findByIdAndUpdate(
                    projectId,
                    { $push: { messages: message._id } },
                    { new: true }
                );

                return message;
            });


            const finalResult = {
                url: sandboxUrl,
                title: generateTitle(),
                files: result.state.data.files || {},
                summary: result.state.data.summary || "",
                sandboxId: sandboxId,
                success: !isError,
            };

            responseCache.set(cacheKey, {
                data: finalResult,
                timestamp: Date.now()
            });

            if (responseCache.size > 100) {
                const firstKey = responseCache.keys().next().value;
                responseCache.delete(firstKey);
            }

            return finalResult;
        } catch (error: any) {
            console.error("Inngest function error:", error);

            // Determine error message based on error type
            let errorMessage = "An unexpected error occurred. Please try again.";
            if (isQuotaError(error)) {
                errorMessage = "API quota limit reached. Please try again later or upgrade your plan. The free tier allows 20 requests per day.";
            }

            try {
                if (event.data?.projectId) {
                    const projectId = new mongoose.Types.ObjectId(event.data.projectId);
                    const errorMsg = await Message.create({
                        projectId: projectId,
                        content: errorMessage,
                        role: "ASSISTANT",
                        type: "ERROR",
                    });

                    // Add message to project's messages array
                    await Project.findByIdAndUpdate(
                        projectId,
                        { $push: { messages: errorMsg._id } },
                        { new: true }
                    );
                }
            } catch (dbError) {
                console.error("Failed to save error message:", dbError);
            }

            return {
                title: "Error",
                message: errorMessage,
                success: false,
            };
        }
    }
);