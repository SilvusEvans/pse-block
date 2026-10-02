/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
import { ConstantProvider } from './constants';
import type { RenderInfo } from './render_info';
export declare class Drawer extends Blockly.zelos.Drawer {
    constants_: ConstantProvider;
    info_: RenderInfo;
    drawStatementInput_(row: Blockly.blockRendering.Row): void;
    drawRightSideRow_(row: Blockly.blockRendering.Row): void;
    drawTop_(): void;
    makeReplacementTop_(): string | undefined;
    /**
     * Draw the connection highlight path for the given connection measurable.
     *
     * For rounded (non-hexagonal) input slots we expand the outline by 1px in
     * every direction so the white highlight stroke sits just outside the input
     * slot's background and remains visible rather than merging with it.
     * @param measurable The connection measurable to highlight.
     * @returns The highlight path element, if one was created.
     */
    drawConnectionHighlightPath(measurable: Blockly.blockRendering.Connection): SVGElement | undefined;
}
//# sourceMappingURL=drawer.d.ts.map