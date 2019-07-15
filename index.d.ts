export type Range = SimpleRange | JoinedRange;

export interface SimpleRange {
    minInclusive: boolean;
    min: Number | number;
    max: Number | number;
    maxInclusive: boolean;
}

export interface JoinedRange {
    or: SimpleRange[];
}

export declare function textToRange(input: string): Range;
export declare function rangeToEquation(range: Range): string;
export declare function rangeToInterval(range: Range): string;
export default textToRange;
