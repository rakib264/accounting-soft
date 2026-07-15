import mongoose, { HydratedDocument, Schema } from "mongoose";

type Settings = {
  singletonKey: string;
  vatPercent: number;
  currency: string;
  invoiceLabels: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type SettingsDocument = HydratedDocument<Settings>;

const settingsSchema = new Schema<Settings>(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: "global",
    },
    vatPercent: {
      type: Number,
      required: true,
      default: 15,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      required: true,
      default: "SAR",
      trim: true,
      uppercase: true,
    },
    invoiceLabels: {
      type: [String],
      default: ["Materials Received Amount", "Advance Payment"],
    },
  },
  { timestamps: true },
);

export const SettingsModel =
  (mongoose.models.Settings as mongoose.Model<Settings>) || mongoose.model<Settings>("Settings", settingsSchema);
