const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        main: ['webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000', './src/index.jsx'],
        register: ['webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000', './src/register.jsx'],
        login: ['webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000', './src/login.jsx'],
        profile: ['webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000', './src/profile.jsx'],
        collab: ['webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000', './src/collab.jsx']
    },
    output: {
        path: path.join(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].js'
    },
    mode: 'development',
    target: 'web',
    devtool: '#source-map',
    module: {
        rules: [{
                enforce: "pre",
                test: /\.jsx?$/,
                exclude: /(node_modules|lib\/)/,
                loader: "eslint-loader",
                options: {
                    emitWarning: true,
                    failOnError: false,
                    failOnWarning: false
                }
            },
            {
                test: /\.worklet\.js$/,
                exclude: /node_modules/,
                loader: 'worklet-loader'
            },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: "babel-loader",
            },
            {
                // Loads the javacript into html template provided.
                // Entry point is set below in HtmlWebPackPlugin in Plugins 
                test: /\.html$/,
                use: [{
                    loader: "html-loader",
                    //options: { minimize: true }
                }]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|svg|jpg|gif|ico)$/,
                use: ['file-loader']
                    //loader: 'file?name=[name].[ext]'
            }
        ]
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: "./src/html/index.html",
            filename: "./index.html",
            favicon: './src/img/favicon.ico',
            chunks: ['main']
        }),
        new HtmlWebPackPlugin({
            template: "./src/html/register.html",
            filename: "./register.html",
            favicon: './src/img/favicon.ico',
            chunks: ['register']
        }),
        new HtmlWebPackPlugin({
            template: "./src/html/login.html",
            filename: "./login.html",
            favicon: './src/img/favicon.ico',
            chunks: ['login']
        }),
        new HtmlWebPackPlugin({
            template: "./src/html/profile.html",
            filename: "./profile.html",
            favicon: './src/img/favicon.ico',
            chunks: ['profile']
        }),
        new HtmlWebPackPlugin({
            template: "./src/html/collab.html",
            filename: "./collab.html",
            favicon: './src/img/favicon.ico',
            chunks: ['collab']
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ]
}