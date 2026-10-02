/**
 * Visual Blocks Editor
 *
 * Copyright 2018 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @file Class for a category header in the flyout for Scratch
 * extensions which can display a textual label and a status button.
 * @author ericr@media.mit.edu (Eric Rosenbaum)
 */
import * as Blockly from 'blockly/core';
/**
 * Class for a category header in the flyout for Scratch extensions which can
 * display a textual label and a status button.
 */
export declare class StatusIndicatorLabel extends Blockly.FlyoutButton {
    /**
     * The ID of the Scratch extension whose status is indicated by this label.
     */
    extensionId: string;
    /**
     * DOM element that displays the status indicator dot.
     */
    imageElement: SVGImageElement;
    /**
     * Opaque data for mouse up listener used to unbind it in dispose().
     */
    mouseUpWrapper: Blockly.browserEvents.Data;
    /**
     * Function to be invoked when the status indicator is clicked.
     */
    static statusButtonCallback: ((extensionId: string) => void) | null;
    /**
     * Creates a new StatusIndicatorLabel.
     * @param workspace The workspace in which to place this header.
     * @param targetWorkspace The flyout's target workspace.
     * @param json The JSON specifying the header.
     */
    constructor(workspace: Blockly.WorkspaceSvg, targetWorkspace: Blockly.WorkspaceSvg, json: Blockly.utils.toolbox.LabelInfo);
    /**
     * Set the image on the status button using a status string.
     */
    refreshStatus(): void;
    /**
     * Set the source URL of the image for the button.
     * @param src New source.
     * @package
     */
    setImageSrc(src: string): void;
    /**
     * Gets the extension state. Overridden externally.
     * @param _extensionId A string identifying which extension's state to retrieve.
     * @returns Whether the extension is ready to be used.
     */
    getExtensionState(_extensionId: string): StatusButtonState;
    /**
     * Disposes of this status indicator label.
     */
    dispose(): void;
}
/**
 * Set of available states for a status indicator.
 */
export declare enum StatusButtonState {
    READY = "ready",
    NOT_READY = "not ready"
}
//# sourceMappingURL=status_indicator_label.d.ts.map