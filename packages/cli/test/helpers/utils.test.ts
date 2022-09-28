import { describe, expect, test } from 'vitest';

import execa = require('execa');

import {
  determineProjectName,
  getModuleManager,
  getModuleManagerInstaller,
  getPathToBinary,
  isPnpmManager,
  isYarnManager,
  normalizeVersionString,
  sleep,
  timestamp,
} from '../../src/utils';

describe('utils', () => {
  describe.each([
    {
      args: ['foo-web_10.2.3'] as const,
      expected: '10.2.3',
    },
    {
      args: ['foo-web_10.20.30'] as const,
      expected: '10.20.30',
    },
    {
      args: ['1.2.3'] as const,
      expected: '1.2.3',
    },
  ])('normalizeVersionString', ({ args, expected }) => {
    test('args should be converted to expected version', () => {
      expect(normalizeVersionString(args[0])).toBe(expected);
    });
  });

  test('determineProjectName()', async () => {
    const projectName = await determineProjectName();
    expect(projectName).toEqual('@rehearsal/cli');
  });

  test('timestamp(true)', async () => {
    const start = timestamp(true);
    await sleep(1000);
    const end = timestamp(true);
    expect(`${start}`.split('.').length).equal(2);
    expect(end).toBeGreaterThan(start);
  });

  test('getPathToBinary()', async () => {
    const tscPath = await getPathToBinary('tsc');
    const { stdout } = await execa(tscPath, ['--version']);

    expect(stdout).toContain(`Version`);
  });

  // @rehearsal/cli uses pnpm
  test('isYarnManager()', async () => {
    const isYarn = await isYarnManager();

    expect(isYarn).equal(false);
  });

  test('isPnpmManager()', async () => {
    const isPnpm = await isPnpmManager();

    expect(isPnpm).equal(true);
  });

  test('getModuleManager()', async () => {
    const manager = await getModuleManager();

    expect(manager).equal('pnpm');
  });

  test('getModuleManagerInstaller()', async () => {
    const { bin, args } = await getModuleManagerInstaller('pnpm', ['typescript'], true);

    expect(bin).toContain('pnpm');
    expect(args).toEqual(['add', '-D', 'typescript']);
  });
});
