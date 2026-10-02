/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core';
import { CheckboxBubble } from './checkbox_bubble';
/**
 * Invisible icon that exists solely to host the corresponding checkbox bubble.
 */
export declare class FlyoutCheckboxIcon extends Blockly.icons.Icon implements Blockly.IHasBubble {
    protected sourceBlock: Blockly.BlockSvg;
    private checkboxBubble?;
    private type;
    constructor(sourceBlock: Blockly.BlockSvg);
    getType(): Blockly.icons.IconType<FlyoutCheckboxIcon>;
    getSize(): Blockly.utils.Size;
    isClickableInFlyout(): boolean;
    bubbleIsVisible(): boolean;
    onLocationChange(_blockOrigin: Blockly.utils.Coordinate): void;
    setChecked(checked: boolean): void;
    dispose(): void;
    setBubbleVisible(_visible: boolean): Promise<void>;
    initView(_pointerDownListener: (e: PointerEvent) => void): void;
    canBeFocused(): boolean;
    getBubble(): CheckboxBubble | null;
}
//# sourceMappingURL=flyout_checkbox_icon.d.ts.map