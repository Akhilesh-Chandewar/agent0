"use server";

import { currentUser } from "@clerk/nextjs/server";
import User from "@/modules/auth/model/user";
import connectToDatabase from "@/lib/databaseConnection";

export async function onBoardUser() {
    try {
        await connectToDatabase();
        const user = await currentUser();

        if (!user) {
            return {
                success: false,
                message: "No authenticated user found",
            };
        }

        const {
            id: clerkId,
            firstName,
            lastName,
            imageUrl,
            emailAddresses,
        } = user;

        const email = emailAddresses?.[0]?.emailAddress;

        if (!email) {
            return {
                success: false,
                message: "No email found for user",
            };
        }

        const dbUser = await User.findOneAndUpdate(
            { clerkId },
            {
                clerkId,
                email,
                name: `${firstName ?? ""} ${lastName ?? ""}`.trim() || null,
                image: imageUrl,
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return {
            success: true,
            user: dbUser,
        };
    } catch (err) {
        console.error("Onboarding error:", err);
        return {
            success: false,
            message: "Failed to onboard user",
        };
    }
}

export async function getCurrentUser() {
    try {
        await connectToDatabase();
        const clerkUser = await currentUser();

        if (!clerkUser) {
            return {
                success: false,
                message: "No authenticated user",
            };
        }
        const dbUser = await User.findOne({
            clerkId: clerkUser.id,
        });

        if (!dbUser) {
            return {
                success: false,
                message: "User not found in database",
            };
        }
        return {
            success: true,
            user: dbUser,
        };
    } catch (err) {
        console.error("Get current user error:", err);
        return {
            success: false,
            message: "Failed to get current user",
        };
    }
}