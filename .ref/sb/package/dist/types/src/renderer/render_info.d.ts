/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
import { BowlerHat } from './bowler_hat';
import { ConstantProvider } from './constants';
export declare class RenderInfo extends Blockly.zelos.RenderInfo {
    constants_: ConstantProvider;
    populateTopRow_(): void;
    populateBottomRow_(): void;
    computeBounds_(): void;
    getInRowSpacing_(prev: Blockly.blockRendering.Measurable | null, next: Blockly.blockRendering.Measurable | null): number;
    getSpacerRowHeight_(prev: Blockly.blockRendering.Row, next: Blockly.blockRendering.Row): number;
    getElemCenterline_(row: Blockly.blockRendering.Row, elem: Blockly.blockRendering.Measurable): number;
    isBowlerHatBlock(): boolean;
    makeBowlerHat(): BowlerHat;
}
//# sourceMappingURL=render_info.d.ts.map