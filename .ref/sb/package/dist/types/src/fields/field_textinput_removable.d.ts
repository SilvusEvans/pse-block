/**
 * Visual Blocks Editor
 *
 * Copyright 2016 Massachusetts Institute of Technology
 * All rights reserved.
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
 * @file Text input field with floating "remove" button.
 * @author pkaplan@media.mit.edu (Paul Kaplan)
 */
import * as Blockly from 'blockly/core';
/**
 * Class for an editable text field displaying a deletion icon when selected.
 */
export declare class FieldTextInputRemovable extends Blockly.FieldTextInput {
    private removeButtonMouseWrapper_?;
    /**
     * Show the inline free-text editor on top of the text with the remove button.
     */
    showEditor_(): void;
    /**
     * Function to call when remove button is called. Checks for removeFieldCallback
     * on sourceBlock and calls it if possible.
     */
    private removeCallback_;
    /**
     * Helper function to construct a FieldTextInputRemovable from a JSON arg object,
     * dereferencing any string table references.
     * @param options A JSON object with options (text, class, and spellcheck).
     * @returns The new text input.
     */
    fromJson(options: Blockly.FieldTextInputFromJsonConfig): FieldTextInputRemovable;
}
/**
 * Register the field and any dependencies.
 */
export declare function registerFieldTextInputRemovable(): void;
//# sourceMappingURL=field_textinput_removable.d.ts.map