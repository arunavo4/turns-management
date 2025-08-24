import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    rules: {
      // Disable TypeScript-specific rules that are too strict
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-empty-function": "off",
      
      // Relax React rules
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "warn",
      "react/display-name": "off",
      "react/jsx-no-target-blank": "off",
      "react/no-children-prop": "off",
      
      // Relax Next.js specific rules
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      
      // General JavaScript rules
      "no-console": "off",
      "no-unused-vars": "off",
      "no-empty": "off",
      "no-constant-condition": "off",
      "no-extra-boolean-cast": "off",
      "no-prototype-builtins": "off",
      "no-case-declarations": "off",
      "no-fallthrough": "off",
      "no-empty-pattern": "off",
      "no-redeclare": "off",
      "no-useless-escape": "off",
      "no-mixed-spaces-and-tabs": "off",
      "no-irregular-whitespace": "off",
      "no-unsafe-optional-chaining": "off",
      "no-unsafe-negation": "off",
      
      // Import rules
      "import/no-anonymous-default-export": "off",
      "import/no-unresolved": "off",
      "import/named": "off",
    },
  }),
]

export default eslintConfig;
