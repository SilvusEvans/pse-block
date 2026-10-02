/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ContinuousToolbox } from '@blockly/continuous-toolbox';
import * as Blockly from 'blockly/core';
/**
 * A toolbox that displays items from all categories in one scrolling list.
 */
export declare class ScratchContinuousToolbox extends ContinuousToolbox {
    /**
     * List of functions to run after the next time the toolbox renders.
     */
    private postRenderCallbacks;
    private getInitialFlyoutContents_;
    refreshSelection(): void;
    /**
     * Converts the given toolbox item to a corresponding array of items that
     * should appear in the flyout.
     * @param toolboxItem The toolbox item to translate into flyout content.
     * @returns An array of flyout item definitions.
     */
    protected convertToolboxItemToFlyoutItems(toolboxItem: Blockly.IToolboxItem): Blockly.utils.toolbox.FlyoutItemInfoArray;
    /**
     * Forcibly rerenders the toolbox, preserving selection when possible.
     */
    forceRerender(): void;
    /**
     * Runs the specified callback after the next rerender.
     * @param callback A callback to run whenever the toolbox next rerenders.
     */
    runAfterRerender(callback: () => void): void;
    /**
     * Returns whether or not the given item should be deselected.
     * Prevents items from being deselected without a replacement.
     * @param oldItem The item that was previously selected.
     * @param newItem The item that is proposed to be selected instead.
     * @returns True if the old item should be allowed to be deselected.
     */
    shouldDeselectItem_(oldItem: Blockly.ISelectableToolboxItem | null, newItem: Blockly.ISelectableToolboxItem | null): boolean;
}
//# sourceMappingURL=scratch_continuous_toolbox.d.ts.map