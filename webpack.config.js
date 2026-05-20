const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const devCerts = require("office-addin-dev-certs");

module.exports = async (env, argv) => {
  const dev = argv.mode !== "production";
  return {
    mode: dev ? "development" : "production",
    devtool: dev ? "eval-source-map" : "source-map",
    entry: { app: "./src/index.tsx" },
    output: {
      filename: "[name].[contenthash].js",
      path: path.resolve(__dirname, "dist"),
      publicPath: dev ? "/" : "/larmorapp/",
      clean: true,
    },
    resolve: { extensions: [".ts", ".tsx", ".js"] },
    module: {
      rules: [
        { test: /\.tsx?$/, loader: "ts-loader", exclude: /node_modules/ },
        { test: /\.css$/, use: ["style-loader", "css-loader"] },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        filename: "index.html",
        chunks: ["app"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "manifest.xml", to: "manifest.xml" },
          { from: "assets", to: "assets", noErrorOnMissing: true },
        ],
      }),
    ],
    devServer: {
      static: { directory: path.join(__dirname, "dist") },
      server: process.env.HTTPS_DEV
        ? { type: "https", options: await devCerts.getHttpsServerOptions() }
        : "http",
      port: 3001,
      hot: true,
      headers: { "Access-Control-Allow-Origin": "*" },
    },
  };
};
