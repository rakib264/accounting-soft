import mongoose, { HydratedDocument, Model, Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

type BusinessType = "manpower" | "subcontract" | "trade";

type Project = {
  name: string;
  details: string;
  imageUrl?: string;
  businessType: BusinessType;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectDocument = HydratedDocument<Project>;

type ProjectModel = Model<Project> & {
  paginate: (query?: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
};

const projectSchema = new Schema<Project, ProjectModel>(
  {
    name: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    imageUrl: { type: String },
    businessType: {
      type: String,
      enum: ["manpower", "subcontract", "trade"] satisfies BusinessType[],
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

projectSchema.plugin(mongoosePaginate);

export const ProjectModel =
  (mongoose.models.Project as ProjectModel) || mongoose.model<Project, ProjectModel>("Project", projectSchema);
