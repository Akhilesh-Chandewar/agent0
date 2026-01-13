import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFragment extends Document {
    messageId: mongoose.Types.ObjectId;
    sandboxUrl: string;
    title: string;
    files: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const FragmentSchema = new Schema<IFragment>(
    {
        messageId: {
            type: Schema.Types.ObjectId,
            ref: "Message",
            required: true,
            unique: true, 
            index: true,
        },
        sandboxUrl: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        files: {
            type: Schema.Types.Mixed, 
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Fragment: Model<IFragment> =
    mongoose.models.Fragment || mongoose.model<IFragment>("Fragment", FragmentSchema);

export default Fragment;
