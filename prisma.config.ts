import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });
console.log("DIRECT_URL loaded:", Boolean(process.env.DIRECT_URL));
console.log("DATABASE_URL loaded:", Boolean(process.env.DATABASE_URL));

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
  url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
},
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
