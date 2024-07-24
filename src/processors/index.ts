import {InputFileProcessor} from './inputFileProcessor';

export const processInputFile = (text: string): string =>{
    return InputFileProcessor.multiplyBreaks(text);
};