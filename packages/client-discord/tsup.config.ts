import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,
    format: ["esm"],
    bundle: true,
    splitting: false,
    dts: true,
    external: [
        "dotenv",
        "fs",
        "path",
        "http",
        "https",
        "crypto",
        "events",
        "stream",
        "util",
        "url",
        "os",
        "buffer",
        "zlib",
        "tty",
        "net",
        "child_process",
        "@reflink/reflink",
        "@node-llama-cpp",
        "agentkeepalive",
        "fluent-ffmpeg",
        "discord.js",
        "@discordjs/opus",
        "@discordjs/rest",
        "@discordjs/voice",
        "prism-media",
        "libsodium-wrappers",
        "@ai16z/eliza"
    ],
    esbuildOptions: (options) => {
        options.bundle = true;
        options.platform = 'node';
    }
});
