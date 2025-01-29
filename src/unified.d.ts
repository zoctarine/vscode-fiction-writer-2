import 'unified';

declare module 'unified' {

	/**
	 * Extend the Data interface with custom types
	 */
  interface Data {
    context?: {
		[key: string]: any;
		keepEmptyLinesBetweenParagraphs?: boolean;
	}
  }
}