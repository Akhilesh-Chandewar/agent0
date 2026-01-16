"use server";
import connectToDatabase from "@/lib/databaseConnection";
import { getCurrentUser } from "@/modules/auth/actions";
import { MessageRoleEnum } from "@/modules/messages/model/messages";
import Message from "@/modules/messages/model/messages";
import Project from "@/modules/projects/model/project";
import "@/modules/fragments/model/fragment";

function serializeDocument<T>(doc: T): T {
    if (!doc) return doc;
    return JSON.parse(JSON.stringify(doc));
}

export async function createMessage(value: string, projectId: string) {
    try {
        await connectToDatabase();

        const currentUser = await getCurrentUser();

        if (!currentUser?.user?._id) {
            throw new Error("No authenticated user found");
        }

        const project = await Project.findOne({
            _id: projectId,
            userId: currentUser.user._id,
        });

        if (!project) {
            throw new Error("Project not found");
        }

        const message = await Message.create({
            content: value,
            role: MessageRoleEnum[0], // USER
            type: "RESULT",
            projectId: project._id,
        });

        project.messages.push(message._id);
        await project.save();

        // await inngest.send({
        //     name: "code-agent/run",
        //     data: {
        //         value: value,
        //         projectId: project._id
        //     },
        // });

        return serializeDocument(message);
    } catch (error: unknown) {
        console.error("Failed to create message:", error);
        throw error;
    }
}

export async function getMessages(projectId: string) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();

        if (!user?.user?._id) {
            throw new Error("No authenticated user found");
        }

        const messages = await Message.find({
            projectId: projectId,
        })
            .populate("fragment")
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return messages.map(serializeDocument);
    } catch (error) {
        console.error("getMessages error:", error);
        throw error;
    }
}

export async function deleteMessage(messageId: string) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();

        if (!user?.user?._id) {
            throw new Error("No authenticated user found");
        }

        const message = await Message.findByIdAndDelete(messageId);

        return serializeDocument(message);
    } catch (error) {
        console.error("deleteMessage error:", error);
        throw error;
    }
}
