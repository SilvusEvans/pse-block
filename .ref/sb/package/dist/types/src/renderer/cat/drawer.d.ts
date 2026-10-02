/**
 * Copyright 2026 Scratch Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import { Drawer as ClassicDrawer } from '../drawer';
import { type ConstantProvider } from './constants';
import { type RenderInfo } from './render_info';
export declare class Drawer extends ClassicDrawer {
    constants_: ConstantProvider;
    info_: RenderInfo;
    draw(): void;
    drawInternals_(): void;
    makeReplacementTop_(): string | undefined;
}
//# sourceMappingURL=drawer.d.ts.map