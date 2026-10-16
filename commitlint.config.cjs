'use strict';

const specRefsPlugin = require('./commitlint-plugin-spec-refs.cjs');

module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [specRefsPlugin],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']],
    'scope-enum': [2, 'always', ['api', 'web', 'shared', 'deps', 'ci', 'config', 'docs', 'agents', 'specs']],
    'scope-empty': [1, 'never'],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 200],
    'spec-refs': [2, 'always'],
  },
};