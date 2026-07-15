import mongoose, { HydratedDocument, Model, Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

type TradeTransaction = {
  sourceFile: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
  rawExtractedData?: Record<string, unknown>;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type TradeTransactionDocument = HydratedDocument<TradeTransaction>;

type TradeTransactionModel = Model<TradeTransaction> & {
  paginate: (query?: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
};

const tradeTransactionSchema = new Schema<TradeTransaction, TradeTransactionModel>(
  {
    sourceFile: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    description: { type: String, required: true, trim: true },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    balance: { type: Number, required: true },
    reference: { type: String, trim: true },
    rawExtractedData: { type: Schema.Types.Mixed },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

tradeTransactionSchema.plugin(mongoosePaginate);

export const TradeTransactionModel =
  (mongoose.models.TradeTransaction as TradeTransactionModel) ||
  mongoose.model<TradeTransaction, TradeTransactionModel>("TradeTransaction", tradeTransactionSchema);
