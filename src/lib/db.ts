import mongoose from "mongoose";

import { env } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConnection:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.__mongooseConnection ?? { conn: null, promise: null };

global.__mongooseConnection = cached;

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      dbName: "accounting",
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
