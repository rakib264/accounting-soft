import mongoose, { HydratedDocument, Model, Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

type ExpenseEntry = {
  label: string;
  amount: number;
  details: string;
  date: Date;
  attachments: string[];
};

type Expense = {
  projectId: Types.ObjectId;
  entries: ExpenseEntry[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type ExpenseDocument = HydratedDocument<Expense>;

type ExpenseModel = Model<Expense> & {
  paginate: (query?: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>;
};

const expenseEntrySchema = new Schema<ExpenseEntry>(
  {
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    details: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    attachments: { type: [String], default: [] },
  },
  { _id: false },
);

const expenseSchema = new Schema<Expense, ExpenseModel>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    entries: {
      type: [expenseEntrySchema],
      required: true,
      validate: {
        validator: (value: ExpenseEntry[]) => value.length > 0,
        message: "At least one expense entry is required.",
      },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

expenseSchema.plugin(mongoosePaginate);

export const ExpenseModel =
  (mongoose.models.Expense as ExpenseModel) || mongoose.model<Expense, ExpenseModel>("Expense", expenseSchema);
