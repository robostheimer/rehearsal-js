import fs from 'fs';
import { afterEach, describe, expect, test } from 'vitest';
import { parse, resolve } from 'path';

import { upgrade } from '../src';

describe('Test transform', function () {
  const basePath = resolve(__dirname, 'fixtures', 'transforms');
  const transformsPath = resolve(__dirname, '..', 'src', 'transforms');
  const transforms = fs
    .readdirSync(transformsPath, { withFileTypes: true })
    .filter((file) => file.isDirectory())
    .map((file) => file.name);
  const originalFixturesFiles = ['tsconfig.json']; // Can be done with readdirSync

  afterEach(() => {
    cleanupTsFiles(basePath, originalFixturesFiles);
  });

  test.each(transforms)('%i', async (code) => {
    const transformPath = resolve(transformsPath, code, 'fixtures');
    const transformFiles = prepareListOfTestFiles(transformPath);

    createTsFilesFromInputs(transformFiles, basePath);

    await runAutofixOnTestApp(basePath);

    // Compare each updated .ts file with expected .ts.output
    const files = getListOfProcessedFileNames(basePath, originalFixturesFiles);
    for (const file of files) {
      const input = fs.readFileSync(resolve(basePath, file)).toString();
      const output = fs.readFileSync(resolve(transformPath, `${file}.output`)).toString();

      expect(input).toEqual(output);
    }
  });
});

/**
 * Prepare ts files in the folder by using sources from .input
 */
function prepareListOfTestFiles(path: string): string[] {
  return fs
    .readdirSync(path) // Takes all files from fixtures/upgrade
    .filter((file) => file.endsWith('.input')) // Filter only .input ones
    .map((file) => file.slice(0, -6)) // Remove .input suffix from filenames
    .map((file) => resolve(path, file)); //  Append basePath to file names
}

/**
 * Compiles the project with LanguageService and apply autofix
 * on corresponding diagnostic messages
 */
async function runAutofixOnTestApp(basePath: string): Promise<void> {
  // TODO: https://github.com/rehearsal-js/rehearsal-js/issues/294
  await upgrade({ basePath });
}

/**
 * Creates .ts files from .ts.input files
 */
function createTsFilesFromInputs(files: string[], basePath: string): void {
  files.forEach((file) => {
    fs.copyFileSync(`${file}.input`, resolve(basePath, parse(file).base));
  });
}

/**
 * Returns a list of files in the path, excluding the files mentioned in exceptFiles list
 */
function getListOfProcessedFileNames(path: string, exceptFiles: string[]): string[] {
  // All files in the folder, except the mention in the exceptFiles
  return fs.readdirSync(path).filter((file) => !exceptFiles.includes(file));
}

/**
 * Removes .ts files after test is completed
 */
function cleanupTsFiles(path: string, exceptFiles: string[]): void {
  const files = getListOfProcessedFileNames(path, exceptFiles);
  for (const file of files) {
    fs.rmSync(resolve(path, file));
  }
}
