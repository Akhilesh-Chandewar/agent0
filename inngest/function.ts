import { inngest } from "./client";
import { gemini, createAgent } from "@inngest/agent-kit";

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
    async ({ event }) => {
        const agent = createAgent({
            name: "hello-agent",
            description: "Simple agent that says hello",
            model,
            system: "You are a friendly assistant that greets the user by email.",
        });

        const result = await agent.run(
            `Say hello to the user with email: ${event.data.email}`
        );

        return {
            message: result.output,
        };
    }
);
