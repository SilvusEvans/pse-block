/**
 * Copyright 2026 Scratch Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
import { type ConstantProvider, type CatPathState } from './constants';
import { type RenderInfo } from './render_info';
import { type CatScratchRenderer } from './renderer';
declare enum FacePart {
    MOUTH = 0,
    EYE_1_OPEN = 1,
    EYE_2_OPEN = 2,
    EYE_1_CLOSED = 3,
    EYE_2_CLOSED = 4,
    EAR_1_INSIDE = 5,
    EAR_2_INSIDE = 6
}
/**
 * Manages the SVG elements for the cat face.
 * This class holds the persistent SVG elements and manages events (blinking, etc.)
 * Owned by the PathObject with similar lifetime.
 */
export declare class CatFace {
    faceGroup_: SVGElement | null;
    parts_: Record<FacePart, SVGElement>;
    pathEarState: CatPathState;
    constants_: ConstantProvider;
    renderer_: CatScratchRenderer;
    block_: Blockly.BlockSvg;
    constructor(info: RenderInfo);
    /**
     * Initializes the face SVG elements if they haven't been created yet.
     * @param parent The SVG element to attach the face geometry to.
     */
    init(parent: SVGElement): void;
    /**
     * Updates the transform of the entire face group.
     * @param transform The SVG transform attribute value to apply.
     */
    setTransform(transform: string): void;
    private setupBlinking_;
    /**
     * Asks the renderer to re-render the block at a time when it normally wouldn't.
     * Necessary if the path geometry has changed (ear flicks).
     * Not necessary for face changes (blinking).
     */
    private triggerRedraw;
    private setupEarFlicks_;
    private buildFaceGeometry_;
}
export {};
//# sourceMappingURL=cat_face.d.ts.map