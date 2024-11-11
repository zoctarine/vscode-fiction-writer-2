import {IProcessor} from '../processors';
import path from 'path';
import {IFwFile} from './IFwFile';
import {log} from '../logging';
import {IBuilder} from '../lib/IBuilder';

export class FwFile {
    public static fixedGap = 10000;
    public static maxPad = 20;
    public static pad = 8;
    public static radix = 10;
    public static nameRegExp = /^([a-zA-Z0-9]+)(?:__)(.*)$/i;

    public static orderNameRegExp = /^((?:\[[a-zA-Z0-9]+\])+)(?: )(.*)$/i;
    public static orderRegExp = /\[([a-zA-Z0-9]+)\]/gi;
    public static cleanExtRegExp = /(\.[^.]+)$/i;

    public static toOrderString(order: number, pad: number = FwFile.pad) {
        return `[${order.toString(FwFile.radix).toLowerCase().padStart(pad, '0')}]`;
    }

    public static cleanOrderString(name: string) {
        const match = name.match(FwFile.orderNameRegExp);
        return match ? match[1] : name;
    }

    public static toOriginalExtension(ext: string) {
        if (!ext) return ext;
        const match = ext.match(FwFile.cleanExtRegExp);
        return match ? match[0] : ext;
    }

}

export interface IFileOrder {
    namePart: string | undefined;
    orderPart: string | undefined;
    mainOrder: number | undefined;
    otherOrders: number[] | undefined;
}

export interface IFileNameOrderParser extends IProcessor<string, IOrderOptions, IFileOrder>,
    IBuilder<IFileOrder, string> {
}

export interface IOrderOptions {
    radix: number;
    pad: number;
    separator: string;
}

const defaultOrderOptions: IOrderOptions = {
    radix: 10,
    pad: 5,
    separator: '.'
};

export class DefaultOrderParser implements IFileNameOrderParser {
    orderRegex = /^(\d+\.)*(\d*) /i;

    process(source: string, options: Partial<IOrderOptions> = {}): IFileOrder {
        const opt = {...defaultOrderOptions, ...options};
        let namePart = source;
        let orderPart = '';
        let orderList: number[] = [];
        let order: number | undefined;
        const matches = source.match(this.orderRegex);
        if (matches) {
            orderPart = matches[0];
            orderList = orderPart.trim().split(opt.separator).map(o => {
                const order = parseInt(o.trim(), 10);
                return Number.isNaN(order) ? 0 : order;
            });
            if (orderList.length > 0) {
                order = orderList.pop()!;
            }
            namePart = source.substring(orderPart.length - 1);
        }

        return {
            namePart,
            orderPart,
            mainOrder: order,
            otherOrders: orderList
        };
    }

    build(input: IFileOrder): string {
        throw new Error('Method not implemented.');
    }
}


export class SimpleSuffixOrderParser implements IFileNameOrderParser {
    orderRegex = /(?<name>.*?)(?<number>[0-9]+)$/;

    process(name: string, options: any = {}): IFileOrder {
        const matches = name.match(this.orderRegex);
        log.tmp(matches);
        if (matches?.groups) {
            return {
                namePart: matches.groups.name,
                orderPart: matches.groups.order,
                mainOrder: parseInt(matches.groups.number),
                otherOrders: undefined
            };
        } else {
            return {
                namePart: name,
                orderPart: undefined,
                mainOrder: undefined,
                otherOrders: undefined,
            };
        }
    }

    build(input: IFileOrder): string {
        log.tmp(input);
        return `${input.namePart}${input.mainOrder ?? ''}`;
    }
}

export interface IFileNameParser extends IProcessor<string, IFileNameOptions, IFwFile> {

}

export interface IFileNameOptions {
    projectTag: string;
}

const defaultFileNameOptions: IFileNameOptions = {
    projectTag: 'fw',
};


export class FwFileNameProcessor implements IFileNameParser {
    constructor(private _orderProcessor: IFileNameOrderParser) {

    }

    process(fsPath: string, options: Partial<IFileNameOptions> = {}): IFwFile {
        options = {...defaultFileNameOptions, ...options};

        const parsed = path.posix.parse(fsPath);

        const parsedName = this._parse(parsed.base);
        const parsedOrder = this._orderProcessor.process(parsedName.name);
        return {
            order: [...parsedOrder.otherOrders?? [], parsedOrder.mainOrder].filter(f => f !== undefined),
            orderString: parsedOrder.orderPart,
            orderedName: parsedName.name ?? '',
            name: parsedOrder.namePart ?? '',
            projectTag: parsedName?.projectTag,
            data: parsedName?.data ?? [],
            ext: parsedName?.ext,
            fsExt: parsed.ext,
            fsName: parsed.base,
            fsDir: parsed.dir,
            fsPath: fsPath,
            fsExists: true
        };
    }

    private _parse(base: string) {
        const fileNameRegex = /(\.(?<projectTag>fw)?(\.(?<data1>[a-z]))?(\.(?<data2>[a-z]))?(\.(?<data3>[a-z]))?)?\.(?<ext>\w*)$/i;
        const matches = base.match(fileNameRegex);
        if (matches) {
            const groups = matches.groups as any;
            const {projectTag, data1, data2, data3, ext} = groups;

            return {
                name: base.substring(0, base.length - matches[0].length),
                ext: matches[0],
                projectTag: projectTag ?? '',
                data: [data1, data2, data3].filter(v => v)
            };
        } else {
            return {
                name: base,
                fwExt: '',
                ext: '',
                projectTag: '',
                data: []
            };
        }
    }
}
