import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ThemeColor, ThemeIcon } from 'vscode';

export class MetadataTreeDataProvider implements vscode.TreeDataProvider<MetadataTreeItem> {
  constructor() {}

  getTreeItem(element: MetadataTreeItem): vscode.TreeItem {
    return element;
  }
 
  getChildren(element?: MetadataTreeItem): Thenable<MetadataTreeItem[]> {

    if (element) {
      return Promise.resolve(this.getChildItems());
    } else {
        return Promise.resolve(this.getChildItems());
      }
    }
  
  
  private getChildItems(): MetadataTreeItem[] {
      
      return [
        new MetadataTreeItem(
        "moduleName1",
        "version",
        vscode.TreeItemCollapsibleState.Collapsed
      ),
      new MetadataTreeItem(
        "moduleName2",
        "version",
        vscode.TreeItemCollapsibleState.Collapsed
      ),
    ];
  }
}

class MetadataTreeItem extends vscode.TreeItem {
  constructor(
    public readonly title: string,
    private subtitle: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(title, collapsibleState);
    this.tooltip = `${this.title}-${this.subtitle}`;
    this.description = this.subtitle;
    this.iconPath = new ThemeIcon('zap', new ThemeColor('editor.selectionBackground'));
  }

}
