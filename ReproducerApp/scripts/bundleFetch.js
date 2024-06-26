/**
 * This script is used to fetch the bundle from a running metro server.
 */

const util = require('util');
const exec = require('child_process').exec;
const execa = util.promisify(exec);
const {processArgs} = require('./processArgs');

const args = process.argv.slice(2);
const options = processArgs(args);

if (!options.platform) {
  throw Error('--platform is required to fetch bundle from metro server');
}
if (!options.output) {
  throw Error('--output is required to save bundle from metro server');
}

console.log('Fetching bundle from metro server', {
  platform: options.platform,
  output: options.output,
});

// index.bundle?platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&app=org.reactjs.native.example.ReproducerApp

async function main() {
  const bundleUrl = new URL('http://localhost:8081/index.bundle');
  bundleUrl.searchParams.append('platform', options.platform);
  bundleUrl.searchParams.append('dev', 'true');
  bundleUrl.searchParams.append('lazy', 'true');
  bundleUrl.searchParams.append('minify', 'false');
  bundleUrl.searchParams.append('inlineSourceMap', 'false');
  bundleUrl.searchParams.append('modulesOnly', 'false');
  bundleUrl.searchParams.append('runModule', 'true');
  bundleUrl.searchParams.append(
    'app',
    'org.reactjs.native.example.ReproducerApp',
  );

  console.log('Fetching bundle from', bundleUrl.toString());
  try {
    await execa(`curl -o ${options.output} --silent ${bundleUrl.toString()}`, {
      stdio: 'inherit',
    });
    console.log('Bundle fetched successfully and saved to ', options.output);
  } catch (error) {
    console.log('Error fetching bundle', error);
    console.log('Make sure that metro server is running with `yarn start`');
  }
}
main().then(() => console.log('Done'));
