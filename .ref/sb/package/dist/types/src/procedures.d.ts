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
 * @file Utility functions for handling procedures.
 * @author fraser@google.com (Neil Fraser)
 */
import * as Blockly from 'blockly/core';
/**
 * Construct the blocks required by the flyout for the procedure category.
 * @param workspace The workspace containing procedures.
 * @returns Array of XML block elements.
 */
declare function getProceduresCategory(workspace: Blockly.WorkspaceSvg): Element[];
/**
 * Find all callers of a named procedure.
 * @param name Name of procedure (procCode in scratch-blocks).
 * @param workspace The workspace to find callers in.
 * @param definitionRoot The root of the stack where the
 *     procedure is defined.
 * @param allowRecursive True if the search should include recursive
 *     procedure calls.  False if the search should ignore the stack starting
 *     with definitionRoot.
 * @returns Array of caller blocks.
 */
export declare function getCallers(name: string, workspace: Blockly.Workspace, definitionRoot: Pick<Blockly.Block, 'id'>, allowRecursive: boolean): ProcedureBlock[];
/**
 * Callback to create a new procedure custom command block.
 * @param workspace The workspace to create the new procedure on.
 */
declare function createProcedureDefCallback(workspace: Blockly.WorkspaceSvg): void;
/**
 * Make a context menu option for editing a custom procedure.
 * This appears in the context menu for procedure definitions and procedure
 * calls.
 * @param block The block where the right-click originated.
 * @returns A menu option, containing text, enabled, and a callback.
 */
declare function makeEditOption(block: Blockly.BlockSvg): Blockly.ContextMenuRegistry.ContextMenuOption;
/**
 * Callback to try to delete a custom block definitions.
 * @param procCode The identifier of the procedure to delete.
 * @param definitionRoot The root block of the stack that defines the custom
 *     procedure.
 * @returns True if the custom procedure was deleted, false otherwise.
 */
declare function deleteProcedureDefCallback(procCode: string, definitionRoot: Blockly.Block): boolean;
/**
 * Returns whether the given block is a procedure block and narrows its type.
 * @param block The block to check.
 * @returns True if the block is a procedure block, otherwise false.
 */
export declare function isProcedureBlock(block: Blockly.Block): block is ProcedureBlock;
/**
 * Interface for procedure blocks, which have the getProcCode method added
 * through an extension.
 */
interface ProcedureBlock extends Blockly.Block {
    getProcCode(): string;
}
/**
 * Type for a callback function invoked after a procedure is modified.
 */
type ProcedureDefCallback = (mutation: Element, postEditCallback: (mutation?: Element) => void) => void;
declare const ScratchProcedures: {
    externalProcedureDefCallback: ProcedureDefCallback | undefined;
    createProcedureDefCallback: typeof createProcedureDefCallback;
    deleteProcedureDefCallback: typeof deleteProcedureDefCallback;
    getProceduresCategory: typeof getProceduresCategory;
    makeEditOption: typeof makeEditOption;
};
export { ScratchProcedures };
//# sourceMappingURL=procedures.d.ts.map