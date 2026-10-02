/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
/**
 * An object that handles creating and setting each of the SVG elements
 * used by the renderer.
 */
export declare class PathObject extends Blockly.zelos.PathObject {
    /**
     * Apply the stored colours to the block's path, taking into account whether
     * the paths belong to a shadow block.
     * @param block The source block.
     */
    applyColour(block: Blockly.BlockSvg): void;
}
//# sourceMappingURL=path_object.d.ts.map