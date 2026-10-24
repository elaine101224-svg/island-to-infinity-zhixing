import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Keep the new performance recommendation visible while preserving the
    // existing mount-time async loaders and hydration-safe date initialization.
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "coverage/**",
    "tests/**",
  ]),
]);

export default eslintConfig;
