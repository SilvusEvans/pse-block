import * as Blockly from 'blockly/core';
import './blocks/colour';
import './blocks/control';
import './blocks/data';
import './blocks/event';
import './blocks/looks';
import './blocks/math';
import './blocks/matrix';
import './blocks/motion';
import './blocks/note';
import './blocks/operators';
import './blocks/procedures';
import './blocks/sensing';
import './blocks/sound';
import './blocks/text';
import './blocks/vertical_extensions';
import { CheckableContinuousFlyout } from './checkable_continuous_flyout';
import { ScratchBlocksTheme } from './constants';
import * as contextMenuItems from './context_menu_items';
import './css';
import './events/events_block_comment_change';
import './events/events_block_comment_collapse';
import './events/events_block_comment_create';
import './events/events_block_comment_delete';
import './events/events_block_comment_move';
import './events/events_block_comment_resize';
import './events/events_scratch_variable_create';
import { FieldColourSlider } from './fields/field_colour_slider';
import { FieldNote } from './fields/field_note';
import './flyout_checkbox_icon';
import { glowStack } from './glows';
import './renderer/cat/renderer';
import './renderer/renderer';
import * as scratchBlocksUtils from './scratch_blocks_utils';
import './scratch_c_block_wrap';
import './scratch_comment_icon';
import './scratch_connection_checker';
import './scratch_dragger';
import './scratch_insertion_marker_previewer';
import './scratch_variable_map';
import './scratch_variable_model';
import * as ScratchVariables from './variables';
export * from 'blockly/core';
export * from './block_reporting';
export * from './procedures';
export * from './scratch_msgs';
export * from './constants';
export { glowStack };
export { scratchBlocksUtils };
export { CheckableContinuousFlyout };
export { ScratchVariables };
export { contextMenuItems };
export { FieldColourSlider, FieldNote };
export { CheckboxBubble } from './checkbox_bubble';
export { ScratchZoomControls } from './scratch_zoom_controls';
export { StatusIndicatorLabel, StatusButtonState } from './status_indicator_label';
export * from './xml';
interface ScratchBlocksOptions extends Blockly.BlocklyOptions {
    /**
     * Scratch uses "theme" to talk about the shape of blocks. The Blockly concept of a theme affects CSS properties and
     * aligns more closely with "color mode" in Scratch.
     */
    scratchTheme?: ScratchBlocksTheme;
}
export declare function inject(container: Element, options: ScratchBlocksOptions): Blockly.WorkspaceSvg;
/**
 * Returns true when a specific content node (block, comment, etc.) within the
 * Blockly workspace has keyboard focus, as opposed to the workspace background
 * itself or nothing at all.
 *
 * Host applications can use this to decide whether to handle a keyboard event
 * themselves or defer to Blockly. When this returns false and the workspace SVG
 * has DOM focus, key presses should be treated as if the workspace background
 * is focused and the host UI hierarchy should handle them normally (e.g. for
 * Scratch's key-sensing).
 * @returns True if a content node has focus, false otherwise.
 */
export declare function isContentNodeFocused(): boolean;
//# sourceMappingURL=index.d.ts.map