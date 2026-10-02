/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
/**
 * Class that represents a variable with extra fields for Scratch.
 */
export declare class ScratchVariableModel extends Blockly.VariableModel {
    isLocal: boolean;
    isCloud: boolean;
    constructor(workspace: Blockly.Workspace, name: string, type?: string, id?: string, isLocal?: boolean, isCloud?: boolean);
}
//# sourceMappingURL=scratch_variable_model.d.ts.map