import { dirname, resolve } from 'node:path';
import {
  DiagnosticFixPlugin,
  DiagnosticCommentPlugin,
  LintPlugin,
  PrettierPlugin,
  ReRehearsePlugin,
  DiagnosticReportPlugin,
  isPrettierUsedForFormatting,
} from '@rehearsal/plugins';
import { Reporter } from '@rehearsal/reporter';
import { PluginsRunner, RehearsalService } from '@rehearsal/service';
import ts from 'typescript';
import debug from 'debug';
import type { Logger } from 'winston';

const { findConfigFile, parseJsonConfigFileContent, readConfigFile, sys } = ts;

export type UpgradeInput = {
  basePath: string;
  entrypoint: string;
  configName?: string;
  reporter: Reporter;
  logger?: Logger;
};

export type UpgradeOutput = {
  basePath: string;
  configFile: string;
  sourceFiles: string[];
};

const DEBUG_CALLBACK = debug('rehearsal:upgrade');

/**
 * Provides semantic diagnostic information in @ts-expect-error comments and in a JSON report
 */
export async function upgrade(input: UpgradeInput): Promise<UpgradeOutput> {
  const basePath = resolve(input.basePath);
  const configName = input.configName || 'tsconfig.json';
  const reporter = input.reporter;
  const logger = input.logger;

  DEBUG_CALLBACK('Upgrade started at Base path: %O', basePath);

  const configFile = findConfigFile(basePath, (filepath) => sys.fileExists(filepath), configName);

  if (!configFile) {
    const message = `Config file '${configName}' not found in '${basePath}'`;
    logger?.error(message);
    throw Error(message);
  }

  DEBUG_CALLBACK('Config file found: %O', configFile);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { config } = readConfigFile(configFile, (filepath: string, encoding?: string) =>
    sys.readFile(filepath, encoding)
  );
  const { options, fileNames } = parseJsonConfigFileContent(
    config,
    sys,
    dirname(configFile),
    {},
    configFile
  );

  DEBUG_CALLBACK('Config file content: %O', { options, fileNames });

  const commentTag = '@rehearsal';

  const service = new RehearsalService(options, fileNames);

  const runner = new PluginsRunner({ basePath, service, reporter, logger })
    .queue(ReRehearsePlugin, {
      commentTag,
    })
    .queue(DiagnosticFixPlugin, {
      safeFixes: true,
      strictTyping: true,
    })
    .queue(PrettierPlugin, (fileName: string) => isPrettierUsedForFormatting(fileName))
    .queue(
      LintPlugin,
      {
        eslintOptions: { cwd: basePath, useEslintrc: true, fix: true },
        reportErrors: false,
      },
      (fileName: string) => !isPrettierUsedForFormatting(fileName)
    )
    .queue(DiagnosticCommentPlugin, {
      commentTag,
      addHints: true,
    })
    .queue(PrettierPlugin, (fileName: string) => isPrettierUsedForFormatting(fileName))
    .queue(
      LintPlugin,
      {
        eslintOptions: { cwd: basePath, useEslintrc: true, fix: true },
        reportErrors: false,
      },
      (fileName: string) => !isPrettierUsedForFormatting(fileName)
    )
    .queue(DiagnosticReportPlugin, {
      commentTag,
    })
    .queue(LintPlugin, {
      eslintOptions: { cwd: basePath, useEslintrc: true, fix: false },
      reportErrors: true,
    });

  for await (const _ of runner.run(fileNames)) {
    // no ops for yield
  }

  reporter.saveCurrentRunToReport(basePath, input.entrypoint);

  return {
    basePath,
    configFile,
    sourceFiles: fileNames,
  };
}
