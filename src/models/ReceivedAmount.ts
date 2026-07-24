import mongoose, { HydratedDocument, Model, Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

type ReceivedAmount = {
  projectId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  amount: number;
  receivedDate: Date | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type ReceivedAmountDocument = HydratedDocument<ReceivedAmount>;

type ReceivedAmountModel = Model<ReceivedAmount> & {
  paginate: (query?: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
};

const receivedAmountSchema = new Schema<ReceivedAmount, ReceivedAmountModel>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    receivedDate: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

receivedAmountSchema.plugin(mongoosePaginate);

export const ReceivedAmountModel =
  (mongoose.models.ReceivedAmount as ReceivedAmountModel) ||
  mongoose.model<ReceivedAmount, ReceivedAmountModel>("ReceivedAmount", receivedAmountSchema);
