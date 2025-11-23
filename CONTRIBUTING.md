# Contributing Guide

Hi! I'm really excited that you are interested in contributing to this project.
Before submitting your contribution, please make sure to take a moment and read through the following guidelines:

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Issue Reporting Guidelines](#issue-reporting-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Development Setup](#development-setup)

## Issue Reporting Guidelines

- Report a new issue either through [GitHub](https://github.com/pingumask/townsquare/issues/new/choose)
- Please include with your issue the browser and operating system you're using as well as steps necessary to reproduce the bug, if any
- Be patient, I'm working on this project in my spare time :-)

## Pull Request Guidelines

- The `main` branch is what is currently deployed to the website. All development should be done in dedicated branches.

- The `develop` branch contains the changes that will be deployed to main next. In order to prepare a release, development
  branches should have their Pull Request against `develop` and only releases should be merged from `develop` into `main`.

- Work in the `src` folder and **DO NOT** checkin `dist` in the commits.

- It's OK to have multiple small commits as you work on the PR - GitHub will automatically squash it before merging.

- If adding a new feature:
  - Provide a convincing reason to add this feature. Ideally, you should open a suggestion issue first before working on it.
  - Feel free to write a test for it, but so far I didn't have time for that.

- If fixing a bug:
  - If you are resolving a special issue, add `(fix #xxxx[,#xxxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `update entities encoding/decoding (fix #3899)`.
  - Provide a detailed description of the bug in the PR. Live demo preferred.

- You'll need to update the `CHANGELOG.md` with a description of your changes before you open a pull request and your code
  should pass the lint check.

## Development Setup

You will need [Node.js](http://nodejs.org), check the requiredversion in package.json.

After cloning the repo, run:

``` bash
$ npm install
```

The development server can be started with `npm run dev`.

### Committing Changes

Commit messages should be verbose enough to allow someone else to follow your changes and should include references to issues that are being worked on.

### Commonly used NPM scripts

``` bash
# watch and auto re-build dist/
$ npm run serve

# build all dist files, including npm packages
$ npm run build

# run linting scripts
$ npm run lint
```
