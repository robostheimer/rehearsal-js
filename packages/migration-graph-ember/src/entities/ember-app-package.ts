import {
  type PackageOptions,
  Package,
  Graph,
  ModuleNode,
  IPackage,
} from '@rehearsal/migration-graph-shared';
import { getEmberAddonPaths } from '../utils/ember.js';
import { EmberAppPackageGraph, EmberAppPackageGraphOptions } from './ember-app-package-graph.js';

export type EmberPackageOptions = PackageOptions;

export class EmberAppPackage extends Package implements IPackage {
  constructor(pathToPackage: string, options: EmberPackageOptions = {}) {
    super(pathToPackage, { ...options });

    this.excludePatterns = new Set([
      // files
      '.ember-cli.js',
      'ember-cli-build.js',
      'ember-config.js',
      'index.js',
      'testem.js',
      // Directories
      'dist',
      'config',
      'ember-config',
      '@ember/*',
      'public',
      ...this.addonPaths,
    ]);

    this.includePatterns = new Set(['.', '**/*.gjs']); // No longer isolate this to the app directory, include all files in dir.
  }

  get addonPaths(): Array<string> {
    return getEmberAddonPaths(this.packageJson);
  }

  override getModuleGraph(options: EmberAppPackageGraphOptions = {}): Graph<ModuleNode> {
    if (this.graph) {
      return this.graph;
    }

    this.graph = new EmberAppPackageGraph(this, options).discover();

    return this.graph;
  }
}
