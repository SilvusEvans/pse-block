/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { RecyclableBlockFlyoutInflater as BlocklyRecyclableBlockFlyoutInflater } from '@blockly/continuous-toolbox';
import * as Blockly from 'blockly/core';
/**
 * A block inflater that caches and reuses blocks to improve performance.
 */
export declare class RecyclableBlockFlyoutInflater extends BlocklyRecyclableBlockFlyoutInflater {
    /**
     * Creates a block on the flyout workspace from the given block definition.
     * @param state A JSON representation of a block to load.
     * @param flyout The flyout on which the block will be inflated.
     * @returns The newly created block.
     */
    load(state: object, flyout: Blockly.IFlyout): Blockly.FlyoutItem;
}
/**
 * Registers the recyclable block flyout inflater, replacing the standard
 * block flyout inflater.
 */
export declare function registerRecyclableBlockFlyoutInflater(): void;
//# sourceMappingURL=recyclable_block_flyout_inflater.d.ts.map