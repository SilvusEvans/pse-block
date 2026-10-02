/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ContinuousCategory } from '@blockly/continuous-toolbox';
import * as Blockly from 'blockly/core';
type StatusIndicatorCategoryInfo = Blockly.utils.toolbox.CategoryInfo & {
    showStatusButton?: string;
};
/**
 * Selectable category shown in the Scratch toolbox.
 */
export declare class ScratchContinuousCategory extends ContinuousCategory {
    /**
     * Whether this toolbox category has a status indicator button on its label
     * in the flyout, typically for extensions that interface with hardware
     * devices.
     */
    private showStatusButton;
    private iconURI?;
    private secondaryColour?;
    /**
     * Creates a new ScratchContinuousCategory.
     * @param toolboxItemDef A toolbox item definition.
     * @param parentToolbox The toolbox this category is being added to.
     * @param opt_parent The parent toolbox category, if any.
     */
    constructor(toolboxItemDef: StatusIndicatorCategoryInfo, parentToolbox: Blockly.Toolbox, opt_parent?: Blockly.ICollapsibleToolboxItem);
    /**
     * Creates a DOM element for this category's icon.
     * @returns A DOM element for this category's icon.
     */
    createIconDom_(): Element;
    /**
     * Sets whether or not this category is selected.
     * @param isSelected True if this category is selected.
     */
    setSelected(isSelected: boolean): void;
    /**
     * Returns whether or not this category's label in the flyout should display
     * status indicators.
     * @returns True if the status indicator button should be shown.
     */
    shouldShowStatusButton(): boolean;
}
/** Registers this toolbox category and unregisters the default one. */
export declare function registerScratchContinuousCategory(): void;
export {};
//# sourceMappingURL=scratch_continuous_category.d.ts.map