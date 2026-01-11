import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    email: string;
    name?: string;
    image?: string;
    clerkId: string;
    projects: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        name: {
            type: String,
            default: null,
        },
        image: {
            type: String,
            default: null,
        },
        clerkId: {
            type: String,
            required: true,
            unique: true,
        },
        projects: [
            {
                type: Schema.Types.ObjectId,
                ref: "Project",
            },
        ],
    },
    {
        timestamps: true,
    }
);


const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
