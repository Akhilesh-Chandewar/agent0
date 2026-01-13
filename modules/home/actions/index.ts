"use server";

import { inngest } from "@/inngest/client";

export async function testAgent(content = "code a hello world agent") {
    const res = await inngest.send({
        name: "code-agent/run",
        data: {
            content: content || "",
        },
    });

    return {
        success: true,
        message: `Agent triggered successfully ${res}`,
    };
}
