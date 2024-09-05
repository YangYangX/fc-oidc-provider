// rollup.config.js
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";

const extensions = [".js", ".jsx"];

export default {
    input: "src/index.js",
    output: [
        {
            file: "dist/index.cjs.js",
            format: "cjs",
            sourcemap: true,
        },
        {
            file: "dist/index.esm.js",
            format: "esm",
            sourcemap: true,
        },
        {
            file: "dist/index.umd.js",
            format: "umd",
            name: "fc-oidc-provider",
            globals: {
                react: "React",
                "react-dom": "ReactDOM",
            },
            sourcemap: true,
        },
    ],
    external: ["react", "react-dom"], // Don't bundle React and ReactDOM
    plugins: [
        resolve({
            extensions,
        }),
        babel({
            extensions,
            exclude: "node_modules/**",
            presets: ["@babel/preset-env", "@babel/preset-react"],
            babelHelpers: "bundled",
        }),
        commonjs(),
        terser(), // Minify the code
    ],
};
