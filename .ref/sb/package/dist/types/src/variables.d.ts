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
 * @file Utility functions for handling variables.
 * @author fraser@google.com (Neil Fraser)
 */
import * as Blockly from 'blockly/core';
import { ScratchVariableModel } from './scratch_variable_model';
type PromptType = (message: string, defaultValue: string, callback: (variableName: string, additionalVars: string[], variableOptions?: {
    scope?: string;
    isCloud?: boolean;
}) => void, title?: string, varType?: string) => void;
/**
 * Sets the handler for calls to prompt().
 * @param handler The new prompt function.
 */
export declare function setPromptHandler(handler: PromptType): void;
/**
 * Create a new variable on the given workspace.
 * @param workspace The workspace on which to create the variable.
 * @param opt_callback An optional callback function to act on the id of the
 *     variable that is created from the user's input, or null if the change is
 *     to be aborted (cancel button or an invalid name was provided).
 * @param opt_type Optional type of the variable to be created, like 'string' or
 *     'list'.
 */
export declare function createVariable(workspace: Blockly.WorkspaceSvg, opt_callback?: (id?: string) => void, opt_type?: string): void;
/**
 * Rename a variable with the given workspace, variableType, and oldName.
 * @param workspace The workspace on which to rename the variable.
 * @param variable Variable to rename.
 * @param opt_callback A callback. It will be passed an acceptable new variable
 *     name, or null if change is to be aborted (cancel button), or undefined if
 *     an existing variable was chosen.
 */
export declare function renameVariable(workspace: Blockly.Workspace, variable: ScratchVariableModel, opt_callback?: (id?: string) => void): void;
export { getVariablesCategory } from './data_category';
//# sourceMappingURL=variables.d.ts.map