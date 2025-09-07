module.exports = {
  presets: ['@wordpress/babel-preset-default'],
  env: {
    test: {
      presets: [
        [
          '@wordpress/babel-preset-default',
          {
            modules: 'commonjs',
          },
        ],
      ],
    },
  },
};