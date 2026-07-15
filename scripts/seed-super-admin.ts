import { hashPassword } from "../src/lib/auth/password";
import { connectToDatabase } from "../src/lib/db";
import { SUPERADMIN_PERMISSIONS } from "../src/lib/constants";
import { SettingsModel } from "../src/models/Settings";
import { UserModel } from "../src/models/User";

const SUPERADMIN_EMAIL = "redwan.rakib267@gmail.com";
const SUPERADMIN_PASSWORD = "Aa123456+";
const SUPERADMIN_NAME = "Super Admin";

async function seed() {
  await connectToDatabase();

  const passwordHash = await hashPassword(SUPERADMIN_PASSWORD);

  const user = await UserModel.findOneAndUpdate(
    { email: SUPERADMIN_EMAIL },
    {
      name: SUPERADMIN_NAME,
      email: SUPERADMIN_EMAIL,
      passwordHash,
      role: "superadmin",
      permissions: SUPERADMIN_PERMISSIONS,
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await SettingsModel.findOneAndUpdate(
    { singletonKey: "global" },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Super Admin seeded: ${user.email}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
