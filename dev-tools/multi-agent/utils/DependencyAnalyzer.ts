import * as fs from 'fs/promises';
import * as path from 'path';

interface Dependency {
  file: string;
  imports: string[];
  exports: string[];
  dependencies: string[];
}

export class DependencyAnalyzer {
  private cache: Map<string, Dependency> = new Map();

  async analyze(files: string[]): Promise<Map<string, string[]>> {
    const dependencies = new Map<string, string[]>();

    // Analyze each file
    for (const file of files) {
      const deps = await this.analyzeFile(file);
      dependencies.set(file, deps.dependencies);
    }

    // Build dependency graph
    const graph = this.buildDependencyGraph(dependencies);

    return graph;
  }

  private async analyzeFile(filePath: string): Promise<Dependency> {
    // Check cache
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath);

      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        const dependency = this.analyzeJavaScriptFile(filePath, content);
        this.cache.set(filePath, dependency);
        return dependency;
      }

      // Default for non-JS files
      const defaultDep: Dependency = {
        file: filePath,
        imports: [],
        exports: [],
        dependencies: [],
      };
      this.cache.set(filePath, defaultDep);
      return defaultDep;
    } catch (error) {
      console.error(`Failed to analyze ${filePath}:`, error);
      const errorDep: Dependency = {
        file: filePath,
        imports: [],
        exports: [],
        dependencies: [],
      };
      return errorDep;
    }
  }

  private analyzeJavaScriptFile(filePath: string, content: string): Dependency {
    const imports: string[] = [];
    const exports: string[] = [];
    const dependencies: string[] = [];

    // Extract imports
    const importRegex = /import\s+(?:{[^}]+}|[\w]+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      imports.push(importPath);

      // Resolve relative imports to absolute paths
      if (importPath.startsWith('.')) {
        const resolvedPath = this.resolveImportPath(filePath, importPath);
        dependencies.push(resolvedPath);
      }
    }

    // Extract dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      imports.push(importPath);
      
      if (importPath.startsWith('.')) {
        const resolvedPath = this.resolveImportPath(filePath, importPath);
        dependencies.push(resolvedPath);
      }
    }

    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    // Named exports
    const namedExportRegex = /export\s+{([^}]+)}/g;
    while ((match = namedExportRegex.exec(content)) !== null) {
      const namedExports = match[1].split(',').map(e => e.trim());
      exports.push(...namedExports);
    }

    return {
      file: filePath,
      imports,
      exports,
      dependencies,
    };
  }

  private resolveImportPath(fromFile: string, importPath: string): string {
    const dir = path.dirname(fromFile);
    let resolvedPath = path.resolve(dir, importPath);

    // Try different extensions if not specified
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    
    for (const ext of extensions) {
      const testPath = resolvedPath + ext;
      // In a real implementation, we'd check if the file exists
      // For now, we'll just return the first possible match
      if (!path.extname(resolvedPath)) {
        return testPath;
      }
    }

    return resolvedPath;
  }

  private buildDependencyGraph(
    fileDependencies: Map<string, string[]>
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Initialize graph with all files
    for (const [file, deps] of fileDependencies) {
      graph.set(file, [...deps]);
    }

    // Add transitive dependencies
    let changed = true;
    while (changed) {
      changed = false;

      for (const [file, deps] of graph) {
        const currentDeps = new Set(deps);
        const initialSize = currentDeps.size;

        for (const dep of deps) {
          const transitiveDeps = graph.get(dep);
          if (transitiveDeps) {
            transitiveDeps.forEach(td => currentDeps.add(td));
          }
        }

        if (currentDeps.size > initialSize) {
          changed = true;
          graph.set(file, Array.from(currentDeps));
        }
      }
    }

    return graph;
  }

  getDependents(file: string, allFiles: string[]): string[] {
    const dependents: string[] = [];

    for (const candidateFile of allFiles) {
      const deps = this.cache.get(candidateFile);
      if (deps && deps.dependencies.includes(file)) {
        dependents.push(candidateFile);
      }
    }

    return dependents;
  }

  getCircularDependencies(dependencies: Map<string, string[]>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const findCycles = (file: string, path: string[] = []): void => {
      visited.add(file);
      recursionStack.add(file);
      path.push(file);

      const deps = dependencies.get(file) || [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          findCycles(dep, [...path]);
        } else if (recursionStack.has(dep)) {
          // Found a cycle
          const cycleStart = path.indexOf(dep);
          const cycle = path.slice(cycleStart);
          cycle.push(dep); // Complete the cycle
          cycles.push(cycle);
        }
      }

      recursionStack.delete(file);
    };

    // Check all files
    for (const file of dependencies.keys()) {
      if (!visited.has(file)) {
        findCycles(file);
      }
    }

    return cycles;
  }

  clearCache(): void {
    this.cache.clear();
  }
}