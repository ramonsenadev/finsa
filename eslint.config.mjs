import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Common pattern for form state sync from props (modals, editors).
      // The React Compiler handles these at runtime without issues.
      "react-hooks/set-state-in-effect": "warn",
      // Ref access during render for display-only values and anchor positioning.
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
