import { execSync } from "child_process";

export const FIXTURE_MIRRORLESS = "E2E Fixture Mirrorless Camera";
export const FIXTURE_DSLR = "E2E Fixture DSLR Camera";
export const FIXTURE_SONY_WIDE = "E2E Fixture Sony Wide";

export const seedCatalog = (flag: "create" | "remove") =>
  execSync(
    `node --env-file=.env.local --import tsx scripts/seed-test-catalog.ts ${flag}`,
    { stdio: "inherit" }
  );