import type { Package } from '@rehearsal/migration-graph-shared';
import type { Graph } from './utils/graph';

export type UniqueGraphNode = {
  key: string;
  synthetic?: boolean;
};

export type PackageNode = UniqueGraphNode & {
  pkg: Package | undefined;
  modules: Graph<ModuleNode>;
  converted?: boolean;
};

export type ModuleNode = UniqueGraphNode & {
  path: string;
  parsed?: boolean;
  meta?: unknown;
};
