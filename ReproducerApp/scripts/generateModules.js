// Given a number of modules, generate a file tree of modules
// The modules are used to simulate the modules that are used in a real application

/** @typedef {{name: string, folder?: string, dependencies: Array<string>}} Module */

const fs = require('fs');
const path = require('path');
const dedent = require('dedent');

/** @type {string} */
const generatedFolder = path.join(__dirname, '../generatedModules');

// get from args
const numModules = process.argv[2] || 10;

main().then(() => console.log('Done'));

async function main() {
  // delete all files in generated folder
  if (fs.existsSync(generatedFolder)) {
    console.log(
      'Deleting generated modules folder, will regenerate it with new modules',
    );
    fs.rmSync(generatedFolder, {recursive: true});
    fs.mkdirSync(generatedFolder, {recursive: true});
  }

  console.log(`Generating ${numModules} modules`);
  const modules = generateModules(numModules);

  // group modules in folders of 50 each to avoid having too many files in a
  // single folder which slows down the bundler
  modules.forEach((module, i) => {
    const folder = Math.floor(i / 50);
    module.folder = folder.toString().padStart(2, '0');
  });

  console.log('Writing module files');
  writeModules(modules, generatedFolder);

  console.log('Writing module index files');
  writeModulesIndex(modules, generatedFolder);
}

/**
 * Generate a list of modules with random names
 * @returns {Array<Module>} modules
 */
function generateModules() {
  const modules = Array.from({length: numModules}, (_, i) => {
    return {
      name: `module${i + 1}`,
      // each module depends on the previous one
      dependencies: [`module${i}`], // currently unused
    };
  });

  return modules;
}

/**
 * Write module files
 * @param {Array<Module>} modules
 * @param {string} inPath
 */
function writeModules(modules, inPath) {
  for (const module of modules) {
    if (!fs.existsSync(path.join(inPath, module.folder))) {
      fs.mkdirSync(path.join(inPath, module.folder), {recursive: true});
    }
    const moduleContent =
      dedent`
      import React from 'react';
      import {Text} from 'react-native';

      export const ${module.name} = () => {
        return <Text>${module.name}</Text>;
      };
      ` + '\n';
    const modulePath = path.join(inPath, module.folder, `${module.name}.js`);
    fs.writeFileSync(modulePath, moduleContent);
  }
}

/**
 * Write module index files
 * @param {Array<Module>} modules
 * @param {string} inPath
 */
function writeModulesIndex(modules, inPath) {
  // group modules by folder
  const modulesByFolder = modules.reduce((acc, module) => {
    if (!acc[module.folder]) {
      acc[module.folder] = [];
    }
    acc[module.folder].push(module);
    return acc;
  }, {});

  // write index files for each folder
  for (const folder in modulesByFolder) {
    const content =
      dedent`
      ${modulesByFolder[folder]
        .map(module => `export {${module.name}} from './${module.name}';`)
        .join('\n')}
    ` + '\n';
    const modulePath = path.join(inPath, folder);
    fs.writeFileSync(path.join(modulePath, 'index.js'), content);
  }

  // write root index referencing all folder indexes
  const indexContent =
    dedent`
    export const modules = {
      ${Object.keys(modulesByFolder)
        .map(folder => `moduleGroup${folder}: require('./${folder}'),`)
        .join('\n')}
    };
    ` + '\n';
  const indexPath = path.join(inPath, 'index.js');
  fs.writeFileSync(indexPath, indexContent);
}
