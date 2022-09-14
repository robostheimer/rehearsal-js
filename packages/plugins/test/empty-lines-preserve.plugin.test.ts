import { RehearsalService } from '@rehearsal/service';
import { Project } from 'fixturify-project';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { EmptyLinesPreservePlugin } from '../src';

describe('Test EmptyLinesPreservePlugin', function () {
  let project: Project;

  beforeEach(() => {
    project = new Project('foo', '0.0.0');
    delete project.files['index.js'];
  });

  afterEach(() => {
    project.dispose();
  });

  test('run', async () => {
    project.files['index.ts'] = await readFile(
      './test/fixtures/empty-lines-preserve.fixture',
      'utf-8'
    );

    project.write();

    const files = Object.keys(project.files).map((file) => resolve(project.baseDir, file));
    const service = new RehearsalService({ baseUrl: project.baseDir }, files);

    const plugin = new EmptyLinesPreservePlugin(service);

    for (const fileName of files) {
      const result = await plugin.run(fileName);
      const resultText = service.getFileText(fileName).trim();

      expect(result).toHaveLength(1);
      expect(resultText).toMatchSnapshot();
    }
  });
});
