"use server";

import { inngest } from "@/inngest/client";
import connectToDatabase from "@/lib/databaseConnection";
import { getCurrentUser } from "@/modules/auth/actions";
import { MessageRoleEnum, MessageTypeEnum } from "@/modules/messages/model/messages";
import Project from "@/modules/projects/model/project";
import Message from "@/modules/messages/model/messages";
import User from "@/modules/auth/model/user";
import { generateSlug } from "random-word-slugs";

// Helper function to serialize Mongoose documents/ObjectIds to plain objects
function serializeDocument<T>(doc: T): T {
    if (!doc) return doc;
    return JSON.parse(JSON.stringify(doc));
}

export async function createProject(value: string) {
    try {
        await connectToDatabase();

        const currentUser = await getCurrentUser();

        if (!currentUser?.user?._id) {
            return {
                success: false,
                message: "No authenticated user found",
            };
        }

        const project = await Project.create({
            name: generateSlug(2, { format: "kebab" }),
            userId: currentUser.user._id,
            messages: [],
        });

        const userMessage = await Message.create({
            content: value,
            role: MessageRoleEnum[0], // USER
            type: MessageTypeEnum[0], // RESULT
            projectId: project._id,
        });

        project.messages.push(userMessage._id);
        await project.save();

        await User.findByIdAndUpdate(
            currentUser.user._id,
            { $push: { projects: project._id } },
            { new: true }
        );

        await inngest.send({
            name: "code-agent/run",
            data: {
                value,
                projectId: project._id.toString(),
            },
        });

        return {
            success: true,
            project: serializeDocument(project),
        };
    } catch (error) {
        console.error("createProject error:", error);

        return {
            success: false,
            message: "Failed to create project",
        };
    }
}

export async function getProjects() {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();

        if (!user?.user?._id) {
            return {
                success: false,
                message: "No authenticated user found",
            };
        }

        const projects = await Project.find({
            userId: user.user._id,
        })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return {
            success: true,
            projects: projects.map(serializeDocument),
        };
    } catch (error) {
        console.error("getProjects error:", error);

        return {
            success: false,
            message: "Failed to fetch projects",
        };
    }
}

export async function getProjectById(projectId: string) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();

        if (!user?.user?._id) {
            return {
                success: false,
                message: "No authenticated user found",
            };
        }

        if (!projectId) {
            return {
                success: false,
                message: "No project id found",
            };
        }

        const project = await Project.findById(projectId).lean().exec();

        if (!project) {
            return {
                success: false,
                message: "Project not found",
            };
        }

        return {
            success: true,
            project: serializeDocument(project),
        };
    } catch (error) {
        console.error("getProjectById error:", error);

        return {
            success: false,
            message: "Failed to fetch project",
        };
    }
}
