"use server";

import { inngest } from "@/inngest/client";

export async function testAgent(content?: string) {
    const res = await inngest.send({
        name: "agent/hello",
        data: {
            email: "akhil@example.com",
            prompt: content,
        },
    });

    return {
        success: true,
        message: "Agent triggered successfully" + res.ids[0],
    };
}
