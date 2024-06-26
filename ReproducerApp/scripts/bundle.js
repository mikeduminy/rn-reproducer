const {execSync} = require('child_process');
const {processArgs} = require('./processArgs');

const args = process.argv.slice(2);
const options = processArgs(args);
options.platform = options.platform || 'ios';
options['entry-file'] = options.entryFile || 'index.js';
options.dev = options.dev || false;
options['bundle-output'] = options.bundleOutput || 'main.jsbundle';

const forwardedArgs = Object.entries(options)
  .filter(([key]) => key !== 'positional')
  .map(([key, value]) => {
    if (value === true) {
      return `--${key}`;
    }
    return `--${key} ${value}`;
  });

console.log('Forwarded arguments:', forwardedArgs.join(' '));

execSync(`yarn run react-native bundle ${forwardedArgs.join(' ')}`, {
  stdio: 'inherit',
});
