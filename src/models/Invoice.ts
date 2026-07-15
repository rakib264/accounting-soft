import mongoose, { HydratedDocument, Model, Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

type InvoiceLineItem = {
  label: string;
  amount: number;
};

type Invoice = {
  projectId: Types.ObjectId;
  lineItems: InvoiceLineItem[];
  invoiceDate: Date;
  vatPercent: number;
  vatAmount: number;
  subtotal: number;
  total: number;
  attachments: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type InvoiceDocument = HydratedDocument<Invoice>;

type InvoiceModel = Model<Invoice> & {
  paginate: (query?: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
};

const lineItemSchema = new Schema<InvoiceLineItem>(
  {
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new Schema<Invoice, InvoiceModel>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    lineItems: {
      type: [lineItemSchema],
      required: true,
      validate: {
        validator: (value: InvoiceLineItem[]) => value.length > 0,
        message: "At least one line item is required.",
      },
    },
    invoiceDate: { type: Date, required: true },
    vatPercent: { type: Number, required: true, min: 0 },
    vatAmount: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    attachments: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

invoiceSchema.plugin(mongoosePaginate);

export const InvoiceModel =
  (mongoose.models.Invoice as InvoiceModel) || mongoose.model<Invoice, InvoiceModel>("Invoice", invoiceSchema);
