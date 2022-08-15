import * as path from 'path';
import * as webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';

const isProduction = process.env.NODE_ENV === "production";

const config: webpack.Configuration = {
    mode: isProduction ? "production" : "development",
    target: 'electron-main',
    externals: [nodeExternals()],
    entry: {
        main: "./src/index.ts"
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
    },
    module: {
        rules: [
            {
                test: [/\.ts$/, /\.tsx$/],
                loader: "ts-loader",
                options: { compilerOptions: { module: "ES2022", moduleResolution: "node" } },
            }
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    devtool: "source-map"
}

module.exports = config