import fs from 'node:fs';
import path from 'path';
import {FwItem} from './fwFiles/FwItem';
import {glob} from 'glob';

/**
 * Wrapper over path library, to make sure all operations are done using posix path
 */
export class FwPath {
    public asPosix(mixedPath: string) {
        return path.posix.normalize(mixedPath.split(path.sep).join(path.posix.sep));
    }

    public exists(path: string) {
        return fs.existsSync(path);
    };

    public toFilename(name: string, maxLength = 30): string {
        name ??= '';
        const invalidChars = /[^\w.\-_]+/g;
        let filename = name.replace(invalidChars, ' ');
        if (filename.length > maxLength) {
            filename = filename.substring(0, maxLength);
        }
        filename = filename.trim();

        return filename ? filename : 'new';
    }


    public isValidName(name?: string): boolean {
        if (!name || name.length === 0) return false;
        if (path.posix.basename(name) !== name) return false;

        return true;
    }

    // public getChildPath(parent: FwItem, name: string) {
    //     if (this.isValidName(name)) return false;
    //     let dirPath = parent.fsDir;
    //     if (parent.fsIsFolder) {
    //         dirPath = parent.fsPath;
    //     }
    //     const fullPath = path.join(dirPath, name);
    //     return fs.existsSync(fullPath);
    // };

    public parse(fsPath: string) {
        return path.posix.parse(fsPath);
    }

    public join(...paths: string[]): string {
        return path.posix.join(...paths);
    }

    public async getOneAsync(fsPath: string) {
        const parsed = this.parse(fsPath);
        const matches = await this.getAsync(fsPath, parsed.dir);
        return matches ? matches[0] : undefined;
    }

    public getChildrenAsync(fsPath: string) {
        return this.getAsync("*", fsPath);
    }

    public getAllAsync(fsPath: string) {
        return this.getAsync("**", fsPath);
    }

    public async getAsync(pattern: string, cwd: string): Promise<any> {
        return glob(pattern,
            {
                cwd: cwd,
                dot: false,
                posix: true,
                ignore: ['**/.vscode/**', '**/node_modules/**'],
                realpath: true,
                withFileTypes: true,
                stat: true,
            });
    }

}

export const fwPath = new FwPath();
