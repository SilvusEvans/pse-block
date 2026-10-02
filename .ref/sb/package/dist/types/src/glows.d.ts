/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
/**
 * Glow/unglow a stack in the workspace.
 * @param id ID of block which starts the stack.
 * @param isGlowingStack Whether to glow the stack.
 */
export declare function glowStack(id: string, isGlowingStack: boolean): void;
/**
 * Creates an SVG filter to render block glows and adds it to the DOM.
 * @param workspace The workspace whose DOM the filter will be inserted in.
 */
export declare function buildGlowFilter(workspace: Blockly.WorkspaceSvg): void;
//# sourceMappingURL=glows.d.ts.map