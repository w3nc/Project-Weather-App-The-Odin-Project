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
      // Weather icons — raw SVG strings
      {
        test: /\.svg$/i,
        include: path.resolve(__dirname, "src/assets/icons"),
        type: "asset/source",
      },
      // Other images — as URL
      {
        test: /\.(png|jpg|jpeg|gif|webp)$/i,
        type: "asset/resource",
        generator: { filename: "images/[name][ext][query]" },
      },
      // Non-icon SVGs — as URL
      {
        test: /\.svg$/i,
        exclude: path.resolve(__dirname, "src/assets/icons"),
        type: "asset/resource",
        generator: { filename: "images/[name][ext][query]" },
      },
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: { filename: "fonts/[name][ext][query]" },
      },
      // CSS — ONLY ONE RULE
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      // HTML
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
