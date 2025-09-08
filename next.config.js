/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental 최적화 설정 제거 (SSR 런타임 오류 방지)
  experimental: {},

  // 웹팩 설정
  webpack: (config, { dev, isServer }) => {
    // Node.js 모듈들을 위한 fallback 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // 데이터베이스 관련 모듈들을 빌드 시에 제외
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push({
        'mysql2': 'commonjs mysql2',
        'sequelize': 'commonjs sequelize',
        'pg': 'commonjs pg',
        'pg-hstore': 'commonjs pg-hstore',
        'sqlite3': 'commonjs sqlite3',
        'tedious': 'commonjs tedious',
      });
    }

    // TypeScript 경로 매핑을 위한 alias 설정
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
      '@/lib': require('path').resolve(__dirname, 'lib'),
    };

    return config;
  },

  // 헤더 설정
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
