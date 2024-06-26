/**
 * Parses command line arguments into an object
 * @param {string[]} args
 * @returns {Record<string, string | boolean | string[]> & { positional: string[] }}
 */
function processArgs(args) {
  const parsed = {positional: []};

  for (let i = 0; i < args.length; i++) {
    // if starts with --, parse as flag or key-value
    // if starts with -, parse as flag or key-value
    // if contains =, parse as key-value
    // else, parse as positional argument

    const arg = args[i];

    const isNamed = arg.startsWith('-');
    if (isNamed) {
      const sanitized = arg.replace(/^-+/, '');
      // --name=value
      // -name=value
      if (arg.includes('=')) {
        const [name, value] = sanitized.split('=');
        parsed[name] = value;
        continue;
      }

      const name = sanitized;
      const nextArg = args[i + 1];
      // -name value
      // --name value
      if (nextArg && !nextArg.startsWith('-')) {
        parsed[name] = nextArg;
        i++;
        continue;
      } else {
        // -flag
        // --flag
        parsed[name] = true;
      }
    } else {
      // argument is positional
      parsed.positional.push(arg);
    }
  }

  return parsed;
}

exports.processArgs = processArgs;
