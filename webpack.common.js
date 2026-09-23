import path from "node:path";
import { fileURLToPath } from "node:url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import Dotenv from "dotenv-webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: {
    app: "./src/index.js",
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  module: {
    rules: [
      // Weather icons — imported as raw SVG strings (for inline + animation)
      {
        test: /\.svg$/i,
        include: path.resolve(__dirname, "src/assets/icons"),
        type: "asset/source",
      },
      // All other images — as URL
      {
        test: /\.(png|jpg|jpeg|gif|webp)$/i,
        type: "asset/resource",
        generator: { filename: "images/[name][ext][query]" },
      },
      // Non-icon SVGs (logo, etc.) — as URL
      {
        test: /\.svg$/i,
        exclude: path.resolve(__dirname, "src/assets/icons"),
        type: "asset/resource",
        generator: { filename: "images/[name][ext][query]" },
      },
      { test: /\.(woff|woff2|eot|ttf|otf)$/i, type: "asset/resource" },
      { test: /\.css$/i, use: ["style-loader", "css-loader"] },
      { test: /\.html$/i, loader: "html-loader" },
      // Handle CSS
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      // Handle HTML
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
    ],
  },
  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({
      title: "Weather App",
      template: "./src/template.html",
    }),
  ],
};
