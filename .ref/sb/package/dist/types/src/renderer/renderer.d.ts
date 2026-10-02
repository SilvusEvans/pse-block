/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
import { ConstantProvider } from './constants';
import { Drawer } from './drawer';
import { PathObject } from './path_object';
import { RenderInfo } from './render_info';
/**
 * Custom renderer for Scratch-style blocks.
 */
export declare class ScratchRenderer extends Blockly.zelos.Renderer {
    /**
     * Get the CSS class name associated with this renderer.
     * Note that all Scratch renderers share the same CSS class name.
     * @returns The CSS class name shared by all Scratch-style renderers.
     */
    getClassName(): string;
    /**
     * Create a new instance of the renderer's drawer.
     * @param block The block to render.
     * @param info An object containing all the information needed to render this
     *     block.
     * @returns The drawer.
     */
    makeDrawer_(block: Blockly.BlockSvg, info: Blockly.blockRendering.RenderInfo): Drawer;
    /**
     * Create a new instance of the renderer's render info object.
     * @param block The block to measure.
     * @returns The render info object.
     */
    makeRenderInfo_(block: Blockly.BlockSvg): RenderInfo;
    /**
     * Create a new instance of the renderer's constant provider.
     * @returns The constant provider.
     */
    makeConstants_(): ConstantProvider;
    /**
     * Create a new instance of a renderer path object.
     * @param root The root SVG element.
     * @param style The style object to use for colouring.
     * @returns A new path object configured for the given SVG root and block style.
     */
    makePathObject(root: SVGElement, style: Blockly.Theme.BlockStyle): PathObject;
    /**
     * Determine whether or not to highlight a connection.
     * @param connection The connection to determine whether or not to highlight.
     * @returns True if we should highlight the connection.
     */
    shouldHighlightConnection(connection: Blockly.RenderedConnection): boolean;
}
//# sourceMappingURL=renderer.d.ts.map