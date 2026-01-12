import { inngest } from "./client";
import { gemini, createAgent } from "@inngest/agent-kit";
import Sandbox from "@e2b/code-interpreter";

const model = gemini({ model: "gemini-1.5-flash" });

export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event, step }) => {
        await step.sleep("wait-a-moment", "1s");
        return { message: `Hello ${event.data.email}!` };
    }
);

export const helloAgent = inngest.createFunction(
    { id: "hello-agent" },
    { event: "agent/hello" },
    async ({ step }) => {
        let sandboxId: string | undefined;

        try {
            // STEP 1: Create sandbox
            sandboxId = await step.run("create-sandbox", async () => {
                const sandbox = await Sandbox.create();
                return sandbox.sandboxId;
            });

            // STEP 2: Setup environment
            await step.run("setup-environment", async () => {
                const sandbox = await Sandbox.connect(sandboxId!);

                await sandbox.commands.run(`
          set -e
          pip3 install --no-cache-dir google-generativeai python-dotenv
        `);
            });

            // STEP 3: Configure credentials
            await step.run("configure-credentials", async () => {
                const sandbox = await Sandbox.connect(sandboxId!);

                await sandbox.files.write(
                    "/workspace/.env",
                    `GOOGLE_API_KEY=${process.env.GOOGLE_API_KEY}\n`
                );
            });

            // STEP 4: Execute agent
//             await step.run("execute-agent", async () => {
//                 const sandbox = await Sandbox.connect(sandboxId!);

//                 const agentScript = `
// import os
// from dotenv import load_dotenv
// import google.generativeai as genai

// load_dotenv()
// genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

// model = genai.GenerativeModel("gemini-1.5-flash")
// response = model.generate_content("Say hello from the sandbox")

// print(response.text)
// `;

//                 await sandbox.files.write("/workspace/run_agent.py", agentScript);
//                 await sandbox.commands.run("cd /workspace && python3 run_agent.py");
//             });

            // STEP 5: Return ONLY sandbox URL
            const sandboxUrl = await step.run("get-sandbox-url", async () => {
                const sandbox = await Sandbox.connect(sandboxId!);
                return sandbox
            });

            return { sandboxUrl };
        } finally {
            // Optional: remove this block if you want sandbox to stay alive
            if (sandboxId) {
                await step.run("cleanup-sandbox", async () => {
                    const sandbox = await Sandbox.connect(sandboxId!);
                    await sandbox.kill();
                });
            }
        }
    }
);
