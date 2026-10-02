/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
import { ScratchCommentBubble } from './scratch_comment_bubble';
interface CommentState {
    text: string;
    height: number;
    width: number;
    x: number;
    y: number;
    collapsed: boolean;
}
/**
 * Custom comment icon that draws no icon indicator, used for block comments.
 */
export declare class ScratchCommentIcon extends Blockly.icons.Icon implements Blockly.ISerializable, Blockly.IHasBubble {
    protected sourceBlock: Blockly.BlockSvg;
    private commentBubble;
    private onTextChangedListener;
    private onSizeChangedListener;
    private onCollapseListener;
    constructor(sourceBlock: Blockly.BlockSvg);
    getType(): Blockly.icons.IconType<ScratchCommentIcon>;
    initView(_pointerDownListener: (e: PointerEvent) => void): void;
    getSize(): Blockly.utils.Size;
    getAnchorPoint(): Blockly.utils.Coordinate;
    onLocationChange(blockOrigin: Blockly.utils.Coordinate): void;
    setText(text: string): void;
    getText(): string;
    onTextChanged(oldText: string, newText: string): void;
    onCollapsed(collapsed: boolean): void;
    onSizeChanged(oldSize: Blockly.utils.Size, newSize: Blockly.utils.Size): void;
    setBubbleSize(size: Blockly.utils.Size): void;
    getBubbleSize(): Blockly.utils.Size;
    setBubbleLocation(newLocation: Blockly.utils.Coordinate): void;
    getBubbleLocation(): Blockly.utils.Coordinate;
    saveState(): CommentState | null;
    loadState(state: CommentState): void;
    bubbleIsVisible(): boolean;
    setBubbleVisible(visible: boolean): Promise<void>;
    getBubble(): ScratchCommentBubble | null;
    dispose(): void;
    canBeFocused(): boolean;
    /**
     * Fires a block comment create event corresponding to this icon's comment.
     */
    fireCreateEvent(): void;
}
export {};
//# sourceMappingURL=scratch_comment_icon.d.ts.map