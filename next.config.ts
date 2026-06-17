import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Turbopack'in kafasının karışmaması için kök dizini sabitliyoruz (Mutlak yol olmalıdır)
    root: path.resolve("."),
  },
};

export default nextConfig;
