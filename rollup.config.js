import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.ts",
  external: ["react"],
  output: {
    file: pkg.main,
    format: "cjs",
    sourcemap: true,
  },
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      preventAssignment: true,
    }),
    resolve(),
    commonjs(),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),
    typescript(),
    terser(),
  ],
};
