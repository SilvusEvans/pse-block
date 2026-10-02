/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
export declare class ConstantProvider extends Blockly.zelos.ConstantProvider {
    REPLACEMENT_GLOW_COLOUR: string;
    SELECTED_GLOW_COLOUR: string;
    BOWLER_HAT_HEIGHT: number;
    /**
     * Sets the visual theme used to render the workspace.
     * This method also synthesizes a "selected" theme, used to color blocks with
     * dropdown menus when the menu is active. Additionally, if the theme's block
     * styles contain any raw color values, corresponding CSS variables will be
     * created/overridden so that those colors can be dynamically referenced in
     * stylesheets.
     * @param theme The new theme to apply.
     */
    setTheme(theme: Blockly.Theme): void;
    /**
     * Returns the shape for the given connection.
     *
     * For OUTPUT_VALUE connections, the block's explicit output shape takes
     * priority (e.g. a Boolean reporter gets a hexagonal output connector).
     * For INPUT_VALUE connections, we use only the connection's type checks so
     * that input slots inside a Boolean reporter (like `<a = b>`) are still
     * drawn with the rounded shape that matches what they accept, not the
     * hexagonal shape of their parent block's output.
     * @param connection The connection whose shape to determine.
     * @returns The shape object for the given connection.
     */
    shapeFor(connection: Blockly.RenderedConnection): ReturnType<Blockly.zelos.ConstantProvider['shapeFor']>;
    createDom(svg: SVGElement, tagName: string, selector: string): void;
    /**
     * Generate a bowler hat path string for a specific block.
     * @param width the `info_.width` of the block.
     * @returns The SVG path string for the bowler hat.
     */
    makeBowlerHatPath(width: number): string;
}
//# sourceMappingURL=constants.d.ts.map