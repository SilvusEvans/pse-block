/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
export declare class BlockDragEnd extends Blockly.Events.BlockBase {
    isOutside: boolean;
    xml: Element | DocumentFragment;
    constructor(block?: Blockly.Block, isOutside?: boolean);
    toJson(): BlockDragEndJson;
    static fromJson(json: BlockDragEndJson, workspace: Blockly.Workspace, event?: Blockly.Events.Abstract): BlockDragEnd;
}
interface BlockDragEndJson extends Blockly.Events.BlockBaseJson {
    isOutside: boolean;
    xml: string;
}
export {};
//# sourceMappingURL=events_block_drag_end.d.ts.map