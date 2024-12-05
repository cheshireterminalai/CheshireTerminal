/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                stream: false,
                buffer: false,
                http: false,
                https: false,
                zlib: false,
                path: false,
                os: false,
            };
        }
        return config;
    },
}

export default nextConfig;
