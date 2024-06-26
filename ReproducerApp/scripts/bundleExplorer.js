// read a metro bundle and output:
// 1. a list of all the modules in the bundle
// 2. a call graph of the modules in the bundle

/** @typedef {Object} Module
 *  @property {string} verboseName
 *  @property {string} name - also known as the module id
 *  @property {string[]} dependencies
 *  @property {number?} depth
 **/

const {spawn} = require('child_process');

/** @type string */
const bundlePath = process.argv[2];

main().then(() => {
  console.log('Done');
});

async function main() {
  /** @type string[] */
  const moduleLines = await extractModuleLines(bundlePath);
  console.log(`${moduleLines.length} module lines found`);

  const modules = extractModules(moduleLines);
  console.log(`${modules.length} modules found`);

  const appModules = modules.filter(
    ({verboseName}) => verboseName.indexOf('node_modules') === -1,
  );
  const nodeModules = modules.filter(
    ({verboseName}) => verboseName.indexOf('node_modules') > -1,
  );
  console.log(`${appModules.length} app modules found`);
  console.log(`${nodeModules.length} node modules found`);

  console.log('app modules:');
  console.log(
    appModules
      .sort()
      .map(module => module.verboseName)
      .join('\n'),
  );

  console.log('node modules:');
  console.log(
    nodeModules
      .sort()
      .map(module => module.verboseName)
      .join('\n'),
  );

  // console.log(appModules.map(module => module.name).join('\n'));

  // const graphInfo = depthOfGraph(modules);
  // // sort by depth ascending
  // graphInfo.sort((a, b) => a.depth - b.depth);
  // console.log('module, id, dependencyCount, depth');
  // graphInfo.forEach(({name, id, dependencies, depth}, index) => {
  //   console.log(`${name},${id},${dependencies.length},${depth}`);
  // });
}

/**
 * Extracts lines from an unminified metro bundle to be processed
 * @returns {Promise<string[]>}
 */
function extractModuleLines() {
  return new Promise((resolve, reject) => {
    const grep = spawn('rg', [
      '},(\\d+),\\[(.*)\\],\\"(.+)\\"', // rg compatible moduleRegex
      bundlePath,
    ]);

    const lines = [];
    const errorLines = [];
    let carryOver = '';

    grep.stdout.on('data', data => {
      const chunk = data.toString();
      const chunkLines = chunk.split('\n');

      // if we have a carry over line, prepend it to the first line of the chunk
      if (carryOver) {
        chunkLines[0] = carryOver + chunkLines[0];
        carryOver = '';
      }
      // if the last line does not end with a semicolon, it is a partial line
      // so we carry it over to the next chunk
      if (!chunkLines.at(-1).endsWith(');')) {
        carryOver = chunkLines.pop();
      }
      lines.push(...chunkLines);
    });

    grep.stderr.on('data', data => {
      errorLines.push(data.toString());
    });

    grep.on('close', code => {
      if (code !== 0) {
        reject(errorLines.join(''));
      } else {
        resolve(lines);
      }
    });
  });
}

/**
 * Regex to extract module id, name and dependencies.
 * Note: this extraction makes no distinctions between inlined
 * and non-inlined dependencies.
 *
 * Example line:
 * '},0,[1,2,5,97,570],"App.tsx");'
 *
 * Output:
 * group1: '0' // module id
 * group2: '1,2,5,97,570' // dependencies
 * group3: 'App.tsx' // module name
 */
const moduleRegex = /},(\d+),\[(.*)\],"(.+)"/;

/**
 * @param {string[]} moduleLines
 * @returns {Module[]}
 */
function extractModules(moduleLines) {
  return moduleLines
    .map(line => {
      if (line.trim().length === 0) {
        return null;
      }
      try {
        /** @type [string, string, string, string] */
        const [, moduleNumber, dependencies, moduleName] =
          moduleRegex.exec(line);
        return {
          verboseName: moduleName,
          name: moduleNumber,
          dependencies: dependencies.split(','),
        };
      } catch (err) {
        console.log(line);
        console.log(line.length);
      }
    })
    .filter(Boolean);
}

/**
 * Returns a list of modules with their depth in the graph.
 * The depth of a module is the maximum depth of its dependencies + 1.
 *
 * @param {Module[]} modules
 * @returns
 */
function depthOfGraph(modules) {
  const graph = modules.reduce((acc, module) => {
    acc[module.name] = module.dependencies;
    return acc;
  }, {});
  const depths = modules.map(module => {
    const visited = new Set();
    const depth = depthOfModule(module.name, graph, visited);
    return {
      ...module,
      depth,
    };
  });
  return depths;
}

/**
 * Returns the depth of a module in the graph.
 * The depth of a module is the maximum depth of its dependencies + 1.
 *
 * @param {string} moduleId
 * @param {Object} graph
 * @param {Set<string>} visited
 * @returns {number}
 */
function depthOfModule(moduleId, graph, visited) {
  if (visited.has(moduleId)) {
    return 0;
  }
  visited.add(moduleId);
  const dependencies = graph[moduleId];
  if (!dependencies) {
    return 1;
  }
  const depths = dependencies.map(dep => depthOfModule(dep, graph, visited));
  return 1 + Math.max(...depths);
}
