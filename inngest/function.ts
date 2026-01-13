import { inngest } from "./client";
import { gemini, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import Sandbox from "@e2b/code-interpreter";
import z from "zod";

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
- What agent was created
- Key features and capabilities
- Files created/modified
- Next steps for the user

Available tools:
- terminal: Run shell commands in the sandbox
- createOrUpdateFiles: Create or modify Python agent files
- readFiles: Read existing files
- installPackages: Install Python packages`;

const TITLE_GENERATOR_PROMPT = `Generate a concise, descriptive title (max 50 chars) for an AI agent project.
Focus on the agent's main purpose or capability.
Return only the title, nothing else.`;

const RESPONSE_GENERATOR_PROMPT = `Generate a friendly, informative response to the user about their agent.
Explain what was built and how they can use it.
Keep it concise (2-3 sentences) and helpful.`;

const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const codeAgentFunction = inngest.createFunction(
    { id: "code-agent" },
    { event: "code-agent/run" },
    async ({ event, step }) => {
        try {
            const cacheKey = JSON.stringify(event.data.value);
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
                            await step?.sleep("terminal-rate-limit", 300);

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
                            if (files.length > 2) {
                                await step?.sleep("batch-rate-limit", 500);
                            }

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
                            await step?.sleep("read-rate-limit", 200);

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
                            await step?.sleep("install-rate-limit", 500);

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

                        return result;
                    },
                },
            });

            const network = createNetwork({
                name: "agent-builder-network",
                agents: [agentBuilder],
                maxIter: 8, 
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

            const result = await network.run(event.data.value);

            if (!result.state.data.summary) {
                return {
                    title: "Error",
                    message: "Failed to generate agent. Please try again.",
                    success: false,
                };
            }

            const titleGenerator = createAgent({
                name: "title-generator",
                description: "Generate a title for the agent project",
                system: TITLE_GENERATOR_PROMPT,
                model: gemini({ model: "gemini-2.5-flash" }),
            });

            const responseGenerator = createAgent({
                name: "response-generator",
                description: "Generate a user-friendly response",
                system: RESPONSE_GENERATOR_PROMPT,
                model: gemini({ model: "gemini-2.5-flash" }),
            });

            const { output: titleOutput } = await titleGenerator.run(
                result.state.data.summary
            );

            const { output: responseOutput } = await responseGenerator.run(
                result.state.data.summary
            );

            const generateTitle = () => {
                if (titleOutput[0].type !== "text") {
                    return "Google ADK Agent";
                }

                if (Array.isArray(titleOutput[0].content)) {
                    return titleOutput[0].content.join("").trim();
                } else {
                    return titleOutput[0].content.trim();
                }
            };

            const generateResponse = () => {
                if (responseOutput[0].type !== "text") {
                    return "Your agent has been created successfully!";
                }

                if (Array.isArray(responseOutput[0].content)) {
                    return responseOutput[0].content.join("");
                } else {
                    return responseOutput[0].content;
                }
            };

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

            const finalResult = {
                url: sandboxUrl,
                title: generateTitle(),
                files: result.state.data.files,
                summary: result.state.data.summary,
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
        } catch (error) {
            console.error(error);
            return {
                title: "Error",
                message: "An unexpected error occurred. Please try again.",
                success: false,
            };
        }
    }
);