/**
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @file Procedure blocks for Scratch.
 */
import * as Blockly from 'blockly/core';
/**
 * An object mapping argument IDs to blocks and shadow DOMs.
 */
type ConnectionMap = Record<string, {
    shadow: Element | undefined;
    block: Blockly.BlockSvg | null;
} | null>;
/**
 * Possible types for procedure arguments.
 */
type ArgumentDefault = string | number | boolean | null;
declare enum ArgumentType {
    STRING = "s",
    NUMBER = "n",
    BOOLEAN = "b"
}
interface ProcedureBlock extends Blockly.BlockSvg {
    procCode_: string;
    argumentIds_: string[];
    warp_: boolean;
    getProcCode: () => string;
    removeAllInputs_: () => void;
    disconnectOldBlocks_: () => ConnectionMap;
    disposeObsoleteBlocks_: (connectionMap: ConnectionMap) => void;
    createAllInputs_: (connectionMap: ConnectionMap) => void;
    updateDisplay_: () => void;
    populateArgument_: (type: ArgumentType, index: number, connectionMap: ConnectionMap, id: string, input: Blockly.Input) => void;
    addProcedureLabel_: (text: string) => void;
}
export interface ProcedureDeclarationBlock extends ProcedureBlock {
    displayNames_: string[];
    argumentDefaults_: ArgumentDefault[];
    removeFieldCallback: (field: Blockly.Field) => void;
    createArgumentEditor_: (argumentType: ArgumentType, displayName: string) => Blockly.BlockSvg;
    focusLastEditor_: () => void;
    getWarp: () => boolean;
    setWarp: (warp: boolean) => void;
    addLabelExternal: () => void;
    addBooleanExternal: () => void;
    addStringNumberExternal: () => void;
    onChangeFn: () => void;
}
export {};
//# sourceMappingURL=procedures.d.ts.map