import {IBuilder, ObjectProps} from '../../lib';
import {FwItem} from '../FwItem';
import {FwInfo, FwVirtualFolderInfo} from '../FwInfo';
import {FwSubType} from '../FwSubType';

export class FwItemHierarchyBuilder implements IBuilder<{ items: Map<string, FwItem> }, Map<string, FwItem>> {
    constructor() {
    }

    public build(input: { items: Map<string, FwItem> }): Map<string, FwItem> {
        const result = ObjectProps.deepClone(input.items);

        const vFolders = new Map<string, string>();
        const makeVPath = (path: string, order: number[]) => `[${path}:${order.join('.')}]`;

        for (const [_, item] of result) {
            // reset parents and children
            item.children = [];
            item.parent = undefined;

            // add possible virtual folders to a separate list
            if (item.info.mainOrder.order && item.info.mainOrder.order.length > 0 &&
                item.info.subType === FwSubType.ProjectFile ||
                item.info.subType === FwSubType.VirtualFolder) {
                vFolders.set(makeVPath(item.fsRef.fsDir, item.info.mainOrder.order), item.fsRef.fsPath);
            }
        }

        for (const [_, item] of result) {
            let parent = result.get(item.fsRef.fsDir);

            if (item.info.mainOrder.order.length > 1) {
                const vPath = makeVPath(item.fsRef.fsDir, item.info.mainOrder.order.slice(0, -1));
                const vFolderPath = vFolders.get(vPath);
                if (vFolderPath) {
                    const vParent = result.get(vFolderPath);
                    if (vParent) {
                        parent = vParent;
                        FwInfo.morph(parent.info, FwVirtualFolderInfo);
                    }
                }
            }
            if (parent) {
                parent.children.push(item.fsRef.fsPath);
                item.parent = parent.fsRef.fsPath;
            }
        }

        return result;
    }
}

