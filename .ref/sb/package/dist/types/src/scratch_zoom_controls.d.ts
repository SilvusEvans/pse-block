/**
 * Copyright 2026 Scratch Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
/**
 * Scratch-specific zoom controls that use separate SVG files for each button
 * instead of Blockly's default sprite sheet approach. SVG files are loaded
 * from `workspace.options.pathToMedia`, which varies by color mode (e.g.
 * default vs. high-contrast), enabling per-mode icon designs.
 */
export declare class ScratchZoomControls implements Blockly.IPositionable {
    private readonly workspace;
    id: string;
    private boundEvents;
    private svgGroup;
    private zoomInGroup;
    private zoomOutGroup;
    private zoomResetGroup;
    /** Rendered width and height of each button, in SVG units. */
    private readonly SIZE;
    /** Gap between zoom in and zoom out buttons. */
    private readonly SMALL_SPACING;
    /** Gap between zoom in/out group and zoom reset button. */
    private readonly LARGE_SPACING;
    /** Distance from the workspace edge, vertical axis. */
    private readonly MARGIN_VERTICAL;
    /** Distance from the workspace edge, horizontal axis. */
    private readonly MARGIN_HORIZONTAL;
    private left;
    private top;
    private initialized;
    constructor(workspace: Blockly.WorkspaceSvg);
    /**
     * Creates the zoom controls DOM.
     * @returns The root SVG group element.
     */
    createDom(): SVGGElement;
    /**
     * Creates an SVG group containing one zoom button image.
     * @param extraClass Additional CSS class to add alongside `blocklyZoom`.
     * @param imageHref URL of the SVG icon to display.
     * @returns The button group element.
     */
    private createButtonGroup;
    /** Registers this component with the workspace's ComponentManager. */
    init(): void;
    /** Removes this component from the DOM and ComponentManager. */
    dispose(): void;
    /**
     * Returns the bounding rectangle of the zoom controls in pixels relative to
     * the Blockly injection div.
     * @returns The bounding rectangle, or null if not yet positioned.
     */
    getBoundingRectangle(): Blockly.utils.Rect | null;
    /**
     * Positions the zoom controls in the corner opposite the toolbox, bumping
     * down (or up) to avoid overlapping other positioned UI elements.
     * @param metrics The current workspace UI metrics.
     * @param savedPositions Bounding rectangles of already-placed UI elements to avoid overlapping.
     */
    position(metrics: Blockly.MetricsManager.UiMetrics, savedPositions: Blockly.utils.Rect[]): void;
    /**
     * Handles zoom in / zoom out button clicks.
     * @param amount Positive to zoom in, negative to zoom out.
     * @param e The pointer event.
     */
    private zoom;
    /**
     * Handles zoom reset button clicks. Animates back to the starting scale and
     * re-centers the workspace.
     * @param e The pointer event.
     */
    private resetZoom;
    /** Fires a zoom controls click event for external listeners. */
    private fireZoomEvent;
}
//# sourceMappingURL=scratch_zoom_controls.d.ts.map