/**
 * Copyright 2026 Scratch Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
import { ScratchRenderer } from '../renderer';
import { ConstantProvider } from './constants';
import { Drawer } from './drawer';
import { PathObject } from './path_object';
import { RenderInfo } from './render_info';
export declare class CatScratchRenderer extends ScratchRenderer {
    makeConstants_(): ConstantProvider;
    makeDrawer_(block: Blockly.BlockSvg, info: Blockly.blockRendering.RenderInfo): Drawer;
    makeRenderInfo_(block: Blockly.BlockSvg): RenderInfo;
    makePathObject(root: SVGElement, style: Blockly.Theme.BlockStyle): PathObject;
}
//# sourceMappingURL=renderer.d.ts.map