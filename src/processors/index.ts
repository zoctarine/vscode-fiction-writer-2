import {InputFileProcessor} from './inputFileProcessor';

export *  from './inputFileProcessor';
export * from './metadata';

export const processInputFile = (text: string): string =>{
        return new InputFileProcessor(text).removeMeta.value;
};