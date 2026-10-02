/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
import type { ScratchCommentBubble } from '../scratch_comment_bubble';
export declare class BlockCommentBase extends Blockly.Events.Abstract {
    isBlank: boolean;
    commentId: string;
    blockId: string;
    workspaceId: string;
    constructor(opt_blockComment?: ScratchCommentBubble);
    toJson(): BlockCommentBaseJson;
    static fromJson(json: BlockCommentBaseJson, workspace: Blockly.Workspace, event?: Blockly.Events.Abstract): BlockCommentBase;
}
export interface BlockCommentBaseJson extends Blockly.Events.AbstractEventJson {
    commentId: string;
    blockId: string;
}
//# sourceMappingURL=events_block_comment_base.d.ts.map