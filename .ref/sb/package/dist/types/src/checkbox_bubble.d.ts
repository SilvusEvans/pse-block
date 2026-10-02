/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
/**
 * A checkbox shown next to reporter blocks in the flyout.
 */
export declare class CheckboxBubble implements Blockly.IBubble, Blockly.IRenderedElement {
    private sourceBlock;
    /**
     * Size of a checkbox next to a variable reporter.
     */
    static readonly CHECKBOX_SIZE = 25;
    /**
     * Amount of touchable padding around reporter checkboxes.
     */
    static readonly CHECKBOX_TOUCH_PADDING = 12;
    /**
     * SVG path data for checkmark in checkbox.
     */
    static readonly CHECKMARK_PATH: string;
    /**
     * Size of the checkbox corner radius.
     */
    static readonly CHECKBOX_CORNER_RADIUS = 5;
    /**
     * The margin around a checkbox.
     */
    static readonly CHECKBOX_MARGIN = 12;
    /**
     * Total additional width of a row that contains a checkbox.
     */
    static readonly CHECKBOX_SPACE_X: number;
    /**
     * Root SVG element for this bubble.
     */
    svgRoot: SVGGElement;
    /**
     * Identifier for click handler, to allow unregistering during disposal.
     */
    clickListener: Blockly.browserEvents.Data;
    /**
     * Whether or not this bubble is displayed as checked. Note that the source of
     * truth is the Scratch VM.
     */
    checked: boolean;
    /**
     * The location of this bubble in workspace coordinates.
     */
    location: Blockly.utils.Coordinate;
    /**
     * Creates a new flyout checkbox bubble.
     * @param sourceBlock The block this bubble should be associated with.
     */
    constructor(sourceBlock: Blockly.BlockSvg);
    /**
     * Sets whether or not this bubble should be displayed in the checked state.
     * @param checked True if this bubble should be checked.
     */
    setChecked(checked: boolean): void;
    /**
     * Returns whether or not the specified block has its checkbox checked.
     *
     * This method is patched by scratch-gui to query the VM state.
     * @param _blockId The ID of the block in question.
     * @returns True if the block's checkbox should be checked.
     */
    isChecked(_blockId: string): boolean;
    /**
     * Returns whether this bubble is movable by the user.
     * @returns Always returns false.
     */
    isMovable(): boolean;
    /**
     * Returns the root SVG element for this bubble.
     * @returns The root SVG element.
     */
    getSvgRoot(): SVGGElement;
    /**
     * Recalculates this bubble's location, keeping it adjacent to its block.
     */
    updateLocation(): void;
    /**
     * Moves this bubble to the specified location.
     * @param x The location on the X axis to move to.
     * @param y The location on the Y axis to move to.
     */
    moveTo(x: number, y: number): void;
    /**
     * Returns this bubble's location in workspace coordinates.
     * @returns The bubble's location.
     */
    getRelativeToSurfaceXY(): Blockly.utils.Coordinate;
    /**
     * Disposes of this checkbox bubble.
     */
    dispose(): void;
    /**
     * See IFocusableNode.getFocusableElement.
     * @returns The SVG root element of this bubble.
     */
    getFocusableElement(): HTMLElement | SVGElement;
    /**
     * See IFocusableNode.getFocusableTree.
     * @returns The workspace containing this bubble's source block.
     */
    getFocusableTree(): Blockly.IFocusableTree;
    /** See IFocusableNode.onNodeFocus. */
    onNodeFocus(): void;
    /** See IFocusableNode.onNodeBlur. */
    onNodeBlur(): void;
    /**
     * See IFocusableNode.canBeFocused.
     * @returns Always true; this bubble can always receive focus.
     */
    canBeFocused(): boolean;
    showContextMenu(): void;
    setDragging(_dragging: boolean): void;
    startDrag(_event: PointerEvent): void;
    drag(_newLocation: Blockly.utils.Coordinate, _event: PointerEvent): void;
    moveDuringDrag(_newLocation: Blockly.utils.Coordinate): void;
    endDrag(): void;
    revertDrag(): void;
    setDeleteStyle(_enable: boolean): void;
}
//# sourceMappingURL=checkbox_bubble.d.ts.map