# rn-reproducer - call stack overflow in large projects

This is a minimal reproduction of a call stack overflow that occurs in projects
with a large number of modules. Specifically, the issue occurs during dev - I
haven't tried prod.

## Getting started

Start by cloning the repository and installing the dependencies:

```bash
# all commands are run from the app directory
cd ReproducerApp

# install dependencies
yarn
bundle install
pushd ios
bundle exec pod install
popd
```

## Reproducing the issue

Then generate the code to simulate a large project:

```bash
# generate 50k modules
yarn generate-modules 50000
```

Then run the app:

```bash
yarn start
```

### Expected behavior

You should see a red screen with the error: `RangeError: Maximum call stack size exceeded`

We expected to see a red screen with the error: `before module execution:
{moduleId}` which is injected before the first module is executed in the metro
config.

## Analysis

Therefore the problem appears to be that the parsing/execution of the module
declarations (`__d()` function calls in the bundle) is causing a stack overflow
before any of the modules are executed.

Could this be due to the large number of modules in the project?
Reducing the number of modules does resolve the issue.
