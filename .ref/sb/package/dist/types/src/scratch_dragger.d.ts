/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
/**
 * Class responsible for managing dragging items on the workspace.
 */
export declare class ScratchDragger extends Blockly.dragging.Dragger {
    /**
     * Whether or not the current drag location is outside of the main workspace.
     */
    draggedOutOfBounds: boolean;
    /**
     * Whether or not the current drag started from the flyout.
     */
    originatedFromFlyout: boolean;
    /**
     * Sets the current item being dragged.
     * @param draggable The item being dragged.
     */
    setDraggable(draggable: Blockly.IDraggable): void;
    /**
     * Handles the start of a drag operation.
     * @param event The event that triggered the drag.
     */
    onDragStart(event: PointerEvent): void;
    /**
     * Handles motion during an ongoing drag operation.
     * @param event The event that triggered this call.
     * @param totalDelta The change in pointer position since the last invocation.
     */
    onDrag(event: PointerEvent, totalDelta: Blockly.utils.Coordinate): void;
    /**
     * Records whether or not the current drag is out of the workspace's bounds.
     * @param event The event that triggered this call.
     */
    updateOutOfBoundsState(event: PointerEvent): void;
    /**
     * Handles the end of a drag.
     * @param event The event that ended the drag.
     */
    onDragEnd(event: PointerEvent): void;
    /**
     * Returns whether or not the dragged item would be deleted if dropped at
     * the current location. When a block is dragged outside the workspace
     * bounds (e.g. onto the backpack or a different sprite), the GUI handles
     * the drop — the flyout should not delete the block even if the pointer
     * happens to overlap the flyout's bounding rect.
     * @param event The drag event that triggered this check.
     * @param rootDraggable The topmost item being dragged.
     * @returns True if the draggable would be deleted.
     */
    wouldDeleteDraggable(event: PointerEvent, rootDraggable: Blockly.IDraggable & Blockly.IDeletable): boolean;
    /**
     * Returns whether or not the dragged item should return to its starting
     * position.
     * @param event The drag event that triggered this check.
     * @param rootDraggable The topmost item being dragged.
     * @returns True if the draggable should return to its starting position.
     */
    shouldReturnToStart(event: PointerEvent, rootDraggable: Blockly.IDraggable): boolean;
    /**
     * Returns the root element being dragged. For shadow blocks and the
     * procedures_prototype block, this is the parent block.
     * @param draggable The element being dragged directly.
     * @returns The element being dragged, or its parent.
     */
    getDragRoot(draggable: Blockly.IDraggable): Blockly.IDraggable | null;
    /**
     * Returns whether or not the given event occurred within the bounds of the
     * workspace.
     * @param event The event to check.
     * @returns True if the event occurred inside the workspace.
     */
    isInsideWorkspace(event: PointerEvent): boolean;
}
//# sourceMappingURL=scratch_dragger.d.ts.map