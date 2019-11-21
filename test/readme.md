## Mocha Test Explorer and typescript
If you are using the Mocha Test Explorer extension for Visual Studio Code, and havn't configured it for typescript, you need to add the following to your settings.

Running the original (non-transpiled) sources directly by transpiling them on-the-fly using ts-node:
```
"mochaExplorer.files": "test/**/*.ts",
"mochaExplorer.require": "ts-node/register"
```

https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter
