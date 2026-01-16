"use server";

import connectToDatabase from "@/lib/databaseConnection";
import Fragment from "@/modules/fragments/model/fragment";
import { getCurrentUser } from "@/modules/auth/actions";
import Message from "@/modules/messages/model/messages";

function serializeDocument<T>(doc: T): T {
    if (!doc) return doc;
    return JSON.parse(JSON.stringify(doc));
}

export async function getFragmentById(fragmentId: string) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();

        if (!user?.user?._id) {
            return {
                success: false,
                message: "No authenticated user found",
            };
        }

        if (!fragmentId) {
            return {
                success: false,
                message: "No fragment id provided",
            };
        }

        const fragment = await Fragment.findById(fragmentId).lean().exec();

        if (!fragment) {
            return {
                success: false,
                message: "Fragment not found",
            };
        }

        // Verify the user owns this fragment via the message
        const message = await Message.findOne({
            _id: fragment.messageId,
        }).populate("projectId").lean().exec();

        if (!message) {
            return {
                success: false,
                message: "Fragment message not found",
            };
        }

        // Check if user owns the project
        const project = message.projectId as unknown as { userId: string };
        if (project.userId.toString() !== user.user._id.toString()) {
            return {
                success: false,
                message: "Unauthorized access to fragment",
            };
        }

        return {
            success: true,
            fragment: serializeDocument(fragment),
        };
    } catch (error) {
        console.error("getFragmentById error:", error);

        return {
            success: false,
            message: "Failed to fetch fragment",
        };
    }
}
