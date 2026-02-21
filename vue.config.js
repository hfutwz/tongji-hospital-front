module.exports = {
    // 是否为生产环境构建生成 source map？
    productionSourceMap: false,
    configureWebpack: {
        externals: {
            "AMap": "AMap"
        }
    },
    chainWebpack: config => {
        // 添加对 SVG 使用 raw-loader
        config.module
            .rule('svg-raw')
            .test(/\.svg$/)
            .use('raw-loader')
            .loader('raw-loader')
            .end()
    },
    // webpack-dev-server 相关配置
    devServer: {
        // host: "localhost",
        open: true,
        port: 8001,
        historyApiFallback: true,
        proxy: {
            '/api': {
                // 开发环境使用环境变量配置的API地址，如果没有则使用默认值
                target: process.env.VUE_APP_API_BASE_URL || 'http://localhost:9090',
                changeOrigin: true,
                // 如果后端有 context-path，可在此重写
                pathRewrite: { '^/api': '/api' },
                ws: false,
                logLevel: 'debug'
            }
        }
    }
}
