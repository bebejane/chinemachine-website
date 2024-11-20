const CompressionPlugin = require("compression-webpack-plugin");
const webpack = require("webpack");
const path = require("path");
//const {alias} = require('react-app-rewire-alias')

module.exports = (config, env) => {
	if (!config.plugins) {
		config.plugins = [];
	}
	config.plugins.push(
		new CompressionPlugin({
			algorithm: "gzip",
			test: /\.js$|\.css$|\.html$/,
			threshold: 10240,
			minRatio: 0.8,
		})
	);
	//config.output.hashFunction = "xxhash64";
	//config.experiments.futureDefaults = true;
	//config.resolve.alias['shared'] = path.resolve(__dirname + '../shared')
	/*
  config.resolve.modules.push('/Users/bebejane/Projects/chinemachine/shared')
  config.resolve.alias['shared'] = '/Users/bebejane/Projects/chinemachine/shared'
  console.log(config)
  */
	/*
  console.log(path.resolve(__dirname, '../common'))
  return alias({
    common: path.resolve(__dirname, '../common')
  })(config)
  */
	return config;
};
