export type Command = {
    name: string;
    type: 'bool' | 'enum' | 'number';
    values?: readonly string[];
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
};
export declare const setupCommands: Array<Command | undefined>;
export declare const inputOutputCommands: Command[];
export declare const equalizerCommands: Command[];
export declare const outputCommands: Command[];
//# sourceMappingURL=commands.d.ts.map