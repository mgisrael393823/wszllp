import * as fs from 'fs/promises';
import * as path from 'path';
import { FileEdit, RollbackData } from '../types';

export class ChangeTracker {
  private changeHistory: Map<string, string[]> = new Map();

  async prepareRollback(edits: FileEdit[]): Promise<RollbackData> {
    const originalContents = new Map<string, string>();
    const deletedFiles: string[] = [];

    for (const edit of edits) {
      if (edit.isNewFile) {
        // Track new files for deletion on rollback
        deletedFiles.push(edit.filePath);
      } else {
        try {
          // Save original content
          const content = await fs.readFile(edit.filePath, 'utf-8');
          originalContents.set(edit.filePath, content);
          
          // Track change history
          this.addToHistory(edit.filePath, content);
        } catch (error) {
          console.error(`Failed to read ${edit.filePath} for rollback:`, error);
        }
      }
    }

    return { originalContents, deletedFiles };
  }

  async rollback(rollbackData: RollbackData): Promise<void> {
    // Restore original file contents
    for (const [filePath, content] of rollbackData.originalContents) {
      try {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`Restored: ${filePath}`);
      } catch (error) {
        console.error(`Failed to restore ${filePath}:`, error);
      }
    }

    // Delete newly created files
    for (const filePath of rollbackData.deletedFiles) {
      try {
        await fs.unlink(filePath);
        console.log(`Deleted: ${filePath}`);
      } catch (error) {
        console.error(`Failed to delete ${filePath}:`, error);
      }
    }
  }

  private addToHistory(filePath: string, content: string): void {
    if (!this.changeHistory.has(filePath)) {
      this.changeHistory.set(filePath, []);
    }

    const history = this.changeHistory.get(filePath)!;
    history.push(content);

    // Keep only last 10 versions
    if (history.length > 10) {
      history.shift();
    }
  }

  async saveHistory(outputDir: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const historyDir = path.join(outputDir, 'change-history', timestamp);

    await fs.mkdir(historyDir, { recursive: true });

    for (const [filePath, versions] of this.changeHistory) {
      const fileName = filePath.replace(/[/\\]/g, '_');
      
      for (let i = 0; i < versions.length; i++) {
        const versionPath = path.join(historyDir, `${fileName}.v${i}`);
        await fs.writeFile(versionPath, versions[i], 'utf-8');
      }
    }

    // Save metadata
    const metadata = {
      timestamp,
      files: Array.from(this.changeHistory.keys()),
      versionCounts: Object.fromEntries(
        Array.from(this.changeHistory.entries()).map(([k, v]) => [k, v.length])
      ),
    };

    await fs.writeFile(
      path.join(historyDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
  }

  getHistory(filePath: string): string[] | undefined {
    return this.changeHistory.get(filePath);
  }

  clearHistory(): void {
    this.changeHistory.clear();
  }
}