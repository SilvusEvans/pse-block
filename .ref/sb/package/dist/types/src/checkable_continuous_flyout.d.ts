/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ContinuousFlyout, type LabelFlyoutItem } from '@blockly/continuous-toolbox';
import * as Blockly from 'blockly/core';
export declare class CheckableContinuousFlyout extends ContinuousFlyout {
    protected tabWidth_: number;
    MARGIN: number;
    GAP_Y: number;
    /**
     * Creates a new CheckableContinuousFlyout.
     * @param workspaceOptions Configuration options for the flyout workspace.
     */
    constructor(workspaceOptions: Blockly.Options);
    /**
     * Serializes a block to JSON in order to copy it to the main workspace.
     * @param block The block to serialize.
     * @returns A JSON representation of the block.
     */
    protected serializeBlock(block: Blockly.BlockSvg): Blockly.serialization.blocks.State;
    /**
     * Set the state of a checkbox by block ID.
     * @param blockId ID of the block whose checkbox should be set
     * @param value Value to set the checkbox to.
     */
    setCheckboxState(blockId: string, value: boolean): void;
    getFlyoutScale(): number;
    getWidth(): number;
    protected reflowInternal_(): void;
    /**
     * Validates that the given toolbox item represents a label.
     * @param item The toolbox item to check.
     * @returns True if the item represents a label in the flyout.
     */
    protected toolboxItemIsLabel(item: Blockly.FlyoutItem): item is LabelFlyoutItem;
    /**
     * Updates the state of status indicators for hardware-based extensions.
     */
    refreshStatusButtons(): void;
    scrollTo(position: number): void;
}
//# sourceMappingURL=checkable_continuous_flyout.d.ts.map