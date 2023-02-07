import { join, relative } from 'path';
import fs from 'fs-extra';

import { GraphNode, ModuleNode, PackageNode } from '@rehearsal/migration-graph-shared';
import { buildMigrationGraph, type MigrationGraphOptions } from './migration-graph';

import { type SourceType } from './source-type';

export class SourceFile {
  #packageName: string;
  #path: string;
  #relativePath: string;

  constructor(path: string, relativePath: string, packageName: string) {
    this.#path = path;
    this.#relativePath = relativePath;
    this.#packageName = packageName;
  }

  get path(): string {
    return this.#path;
  }

  get relativePath(): string {
    return this.#relativePath;
  }

  get packageName(): string {
    return this.#packageName;
  }

  toString(): string {
    return `[${this.#packageName}] ${this.path} `;
  }
}

export class MigrationStrategy {
  #rootDir: string;
  #sourceType: SourceType;
  #files: Array<SourceFile> = [];

  constructor(rootDir: string, sourceType: SourceType) {
    this.#rootDir = rootDir;
    this.#sourceType = sourceType;
  }

  get rootDir(): string {
    return this.#rootDir;
  }

  addFile(file: SourceFile): void {
    this.#files.push(file);
  }

  get files(): Array<SourceFile> {
    return this.#files;
  }

  get sourceType(): SourceType {
    return this.#sourceType;
  }

  getMigrationOrder(): Array<SourceFile> {
    return this.#files;
  }

  toString(): string {
    const files = this.#files.reduce((f, result) => result + '\n' + f, '');
    return `Suggsted Migration Strategy\n${files}`;
  }
}

export type MigrationStrategyOptions = MigrationGraphOptions;

// TODO make rootDir default to process.cwd()
// TODO remove other process.cwd() default values elsewhere in code.
export function getMigrationStrategy(
  rootDir: string,
  options?: MigrationStrategyOptions
): MigrationStrategy {
  rootDir = fs.realpathSync(rootDir);
  const { projectGraph, sourceType } = buildMigrationGraph(rootDir, options);

  const strategy = new MigrationStrategy(rootDir, sourceType);

  projectGraph.graph
    .topSort()
    // Iterate through each package
    .forEach((packageNode: GraphNode<PackageNode>) => {
      const packagePath = packageNode.content?.pkg?.path;

      if (!packagePath) {
        return;
      }

      if (!packageNode.content.pkg) {
        throw new Error('WTF');
      }

      const moduleGraph = packageNode.content.pkg?.getModuleGraph();

      // For this package, get a list of modules (files)
      const ordered: Array<ModuleNode> = moduleGraph
        .topSort()
        .filter((node) => !node.content?.synthetic) // Remove synthetic nodes
        .map((node) => node.content);

      // Iterate through each module (file) node
      ordered.forEach((moduleNode) => {
        const fullPath = join(packagePath, moduleNode.path);
        const relativePath = relative(rootDir, fs.realpathSync(fullPath));
        const f = new SourceFile(fullPath, relativePath, packagePath);
        strategy.addFile(f);
      });
    });

  return strategy;
}
