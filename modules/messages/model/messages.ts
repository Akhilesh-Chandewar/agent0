import mongoose, { Schema, Document, Model } from "mongoose";

export const MessageRoleEnum = ["USER", "ASSISTANT"] as const;
export const MessageTypeEnum = ["RESULT", "ERROR"] as const;


export interface IMessage extends Document {
    content: string;
    role: "USER" | "ASSISTANT";
    type: "RESULT" | "ERROR";
    projectId: mongoose.Types.ObjectId;
    fragment?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        content: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: MessageRoleEnum,
            required: true,
        },
        type: {
            type: String,
            enum: MessageTypeEnum,
            required: true,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },
        fragment: {
            type: Schema.Types.ObjectId,
            ref: "Fragment",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Message: Model<IMessage> =
    mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
