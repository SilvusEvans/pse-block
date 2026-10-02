/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
export declare class BlockDragOutside extends Blockly.Events.BlockBase {
    isOutside: boolean;
    constructor(block?: Blockly.Block, isOutside?: boolean);
    toJson(): BlockDragOutsideJson;
    static fromJson(json: BlockDragOutsideJson, workspace: Blockly.Workspace, event?: Blockly.Events.Abstract): BlockDragOutside;
}
interface BlockDragOutsideJson extends Blockly.Events.BlockBaseJson {
    isOutside: boolean;
}
export {};
//# sourceMappingURL=events_block_drag_outside.d.ts.map