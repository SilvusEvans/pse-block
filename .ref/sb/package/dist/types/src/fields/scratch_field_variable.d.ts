/**
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @file Variable input field.
 * @author fraser@google.com (Neil Fraser)
 */
import * as Blockly from 'blockly/core';
export declare class ScratchFieldVariable extends Blockly.FieldVariable {
    private originalStyle;
    private getSourceWorkspaceSvg_;
    constructor(varName: string | null | typeof Blockly.Field.SKIP_SETUP, validator?: Blockly.FieldVariableValidator, variableTypes?: string[], defaultType?: string, config?: Blockly.FieldVariableConfig);
    initModel(): void;
    /**
     * Initialize broadcast blocks in the flyout.
     * Implicit deletion of broadcast messages from the scratch vm may cause
     * broadcast blocks in the flyout to change which variable they display as the
     * selected option when the workspace is refreshed.
     * Re-sort the broadcast messages by name, and set the field value to the id
     * of the variable that comes first in sorted order.
     * @param workspace The flyout workspace containing the broadcast block.
     * @returns The variable of type 'broadcast_msg' that comes first in sorted
     * order.
     */
    initFlyoutBroadcast(workspace: Blockly.WorkspaceSvg): Blockly.IVariableModel<Blockly.IVariableState> | undefined;
    /**
     * Return a sorted list of variable names for variable dropdown menus.
     * Include a special option at the end for creating a new variable name.
     * @returns Array of variable names.
     */
    static dropdownCreate(this: ScratchFieldVariable): Blockly.MenuOption[];
    /**
     * Handle the selection of an item in the variable dropdown menu.
     * Special case the 'Rename variable...', 'Delete variable...',
     * and 'New message...' options.
     * In the rename case, prompt the user for a new name.
     * @param menu The Menu component clicked.
     * @param menuItem The MenuItem selected within menu.
     */
    onItemSelected_(menu: Blockly.Menu, menuItem: Blockly.MenuItem): void;
    showEditor_(event: PointerEvent): void;
    dropdownDispose_(): void;
}
/**
 * Register the field and any dependencies.
 */
export declare function registerScratchFieldVariable(): void;
//# sourceMappingURL=scratch_field_variable.d.ts.map