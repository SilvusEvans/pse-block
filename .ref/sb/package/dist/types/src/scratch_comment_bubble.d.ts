/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
/**
 * A Scratch-style comment bubble for block comments.
 */
export declare class ScratchCommentBubble extends Blockly.comments.CommentView implements Blockly.IBubble, Blockly.ISelectable {
    id: string;
    private sourceBlock;
    private anchor?;
    private anchorChain?;
    private dragStartLocation?;
    constructor(sourceBlock: Blockly.BlockSvg);
    setDeleteStyle(_enable: boolean): void;
    showContextMenu(): void;
    setDragging(_start: boolean): void;
    select(): void;
    unselect(): void;
    isMovable(): boolean;
    moveDuringDrag(newLocation: Blockly.utils.Coordinate): void;
    moveTo(xOrCoordinate: number, y: number): void;
    moveTo(xOrCoordinate: Blockly.utils.Coordinate): void;
    startGesture(e: PointerEvent): void;
    startDrag(_event: PointerEvent): void;
    drag(newLocation: Blockly.utils.Coordinate, _event?: PointerEvent): void;
    endDrag(): void;
    revertDrag(): void;
    setAnchorLocation(newAnchor: Blockly.utils.Coordinate): void;
    dropAnchor(): void;
    redrawAnchorChain(): void;
    getId(): string;
    getSourceBlock(): Blockly.BlockSvg | null;
    dispose(): void;
    getFocusableElement(): SVGGElement;
    getFocusableTree(): Blockly.WorkspaceSvg;
    onNodeFocus(): void;
    onNodeBlur(): void;
    canBeFocused(): boolean;
}
//# sourceMappingURL=scratch_comment_bubble.d.ts.map