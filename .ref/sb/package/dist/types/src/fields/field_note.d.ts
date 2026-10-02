/**
 * Visual Blocks Editor
 *
 * Copyright 2018 Massachusetts Institute of Technology
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
 * @file Note input field, for selecting a musical note on a piano.
 * @author ericr@media.mit.edu (Eric Rosenbaum)
 */
import * as Blockly from 'blockly/core';
/**
 * Class for a note input field, for selecting a musical note on a piano.
 * @param opt_value The initial content of the field. The
 *     value should cast to a number, and if it does not, '0' will be used.
 * @param opt_validator An optional function that is called
 *     to validate any constraints on what the user entered.  Takes the new
 *     text as an argument and returns the accepted text or null to abort
 *     the change.
 */
export declare class FieldNote extends Blockly.FieldTextInput {
    /**
     * Width of the field. Computed when drawing it, and used for animation.
     */
    private fieldEditorWidth_;
    /**
     * Height of the field. Computed when drawing it.
     */
    private fieldEditorHeight_;
    /**
     * The piano SVG.
     */
    private pianoSVG_;
    /**
     * Array of SVG elements representing the clickable piano keys.
     */
    private keySVGs_;
    /**
     * Note name indicator at the top of the field.
     */
    private noteNameText_;
    /**
     * Note name indicator on the low C key.
     */
    private lowCText_;
    /**
     * Note name indicator on the low C key.
     */
    private highCText_;
    /**
     * Octave number of the currently displayed range of keys.
     */
    private displayedOctave_;
    /**
     * Current animation position of the piano SVG, as it shifts left or right to
     * change octaves.
     */
    private animationPos_;
    /**
     * Target position for the animation as the piano SVG shifts left or right.
     */
    private animationTarget_;
    /**
     * A flag indicating that the mouse is currently down. Used in combination with
     * mouse enter events to update the key selection while dragging.
     */
    private mouseIsDown_;
    /**
     * An array of wrappers for mouse down events on piano keys.
     */
    private mouseDownWrappers_;
    /**
     * A wrapper for the mouse up event.
     */
    private mouseUpWrapper_;
    /**
     * An array of wrappers for mouse enter events on piano keys.
     */
    private mouseEnterWrappers_;
    /**
     * A wrapper for the mouse down event on the octave down button.
     */
    private octaveDownMouseDownWrapper_;
    /**
     * A wrapper for the mouse down event on the octave up button.
     */
    private octaveUpMouseDownWrapper_;
    /**
     * Inset in pixels of content displayed in the field, caused by parent properties.
     * The inset is actually determined by the CSS property blocklyDropDownDiv- it is
     * the sum of the padding and border thickness.
     */
    static INSET: number;
    /**
     * Height of the top area of the field, in px.
     */
    static readonly TOP_MENU_HEIGHT: number;
    /**
     * Padding on the top and sides of the field, in px.
     */
    static readonly EDGE_PADDING = 1;
    /**
     * Height of the drop shadow on the piano, in px.
     */
    static readonly SHADOW_HEIGHT = 4;
    /**
     * Color for the shadow on the piano.
     */
    static readonly SHADOW_COLOR = "#000";
    /**
     * Opacity for the shadow on the piano.
     */
    static readonly SHADOW_OPACITY = 0.2;
    /**
     * A color for the white piano keys.
     */
    static readonly WHITE_KEY_COLOR = "#FFFFFF";
    /**
     * A color for the black piano keys.
     */
    static readonly BLACK_KEY_COLOR = "#323133";
    /**
     * A color for stroke around black piano keys.
     */
    static readonly BLACK_KEY_STROKE = "#555555";
    /**
     * A color for the selected state of a piano key.
     */
    static readonly KEY_SELECTED_COLOR = "#b0d6ff";
    /**
     * The number of white keys in one octave on the piano.
     */
    static readonly NUM_WHITE_KEYS = 8;
    /**
     * Height of a white piano key, in px.
     */
    static readonly WHITE_KEY_HEIGHT = 72;
    /**
     * Width of a white piano key, in px.
     */
    static readonly WHITE_KEY_WIDTH = 40;
    /**
     * Height of a black piano key, in px.
     */
    static readonly BLACK_KEY_HEIGHT = 40;
    /**
     * Width of a black piano key, in px.
     */
    static readonly BLACK_KEY_WIDTH = 32;
    /**
     * Radius of the curved bottom corner of a piano key, in px.
     */
    static readonly KEY_RADIUS = 6;
    /**
     * Bottom padding for the labels on C keys.
     */
    static readonly KEY_LABEL_PADDING = 8;
    /**
     * An array of objects with data describing the keys on the piano.
     */
    static readonly KEY_INFO: ({
        name: string;
        pitch: number;
        isBlack?: undefined;
    } | {
        name: string;
        pitch: number;
        isBlack: boolean;
    })[];
    /**
     * The MIDI note number of the highest note selectable on the piano.
     */
    static readonly MAX_NOTE = 130;
    /**
     * The fraction of the distance to the target location to move the piano at each
     * step of the animation.
     */
    static readonly ANIMATION_FRACTION = 0.2;
    /**
     * Path to the arrow svg icon, used on the octave buttons.
     */
    static readonly ARROW_SVG_PATH = "icons/arrow_button.svg";
    /**
     * The size of the square octave buttons.
     */
    static readonly OCTAVE_BUTTON_SIZE = 32;
    /**
     * Construct a FieldNote from a JSON arg object.
     * @param options A JSON object with options.
     * @returns The new field instance.
     */
    static fromJson(options: FieldNoteJsonConfig): FieldNote;
    /**
     * Clean up this FieldNote, as well as the inherited FieldTextInput.
     */
    dispose(): void;
    /**
     * Show a field with piano keys.
     * @param event The triggering pointer event.
     * @param quietInput If true, suppress the sound preview while the editor opens.
     */
    showEditor_(event: PointerEvent, quietInput?: boolean): void;
    /**
     * Add one octave of piano keys drawn using SVG.
     * @param x The x position of the left edge of this octave of keys.
     * @param whiteKeyGroup The group for all white piano keys.
     * @param blackKeyGroup The group for all black piano keys.
     * @param keySVGarray An array containing all the key SVGs.
     * @param parentBlock The validated parent block providing styling.
     */
    private addPianoOctave_;
    /**
     * Construct the SVG path string for a piano key shape: a rectangle with rounded
     * corners at the bottom.
     * @param x the x position for the key.
     * @param y the y position for the key.
     * @param width the horizontal extent of the key in pixels.
     * @param height the vertical extent of the key in pixels.
     * @returns the SVG path as a string.
     */
    private getPianoKeyPath_;
    /**
     * Add a button for switching the displayed octave of the piano up or down.
     * @param x The x position of the button.
     * @param flipped If true, the icon should be flipped.
     * @param svg The svg element to add the buttons to.
     * @param parentBlock The validated parent block providing styling.
     * @returns A group containing the button SVG elements.
     */
    private addOctaveButton_;
    /**
     * Add an SVG text label for display on the C keys of the piano.
     * @param x The x position for the label.
     * @param svg The SVG element to add the label to.
     * @returns The SVG element containing the label.
     */
    private addCKeyLabel_;
    /**
     * Set the visibility of the C key labels.
     * @param visible If true, set labels to be visible.
     */
    private setCKeyLabelsVisible_;
    /**
     * Animate an SVG to fade it in or out to a target opacity.
     * @param svg The SVG element to apply the fade to.
     * @param opacity The target opacity.
     */
    private fadeSvgToOpacity_;
    /**
     * Handle the mouse down event on a piano key.
     * @param e Mouse down event.
     */
    private onMouseDownOnKey_;
    /**
     * Handle the mouse up event following a mouse down on a piano key.
     */
    private onMouseUp_;
    /**
     * Handle the event when the mouse enters a piano key.
     * @param e Mouse enter event.
     */
    private onMouseEnter_;
    /**
     * Use the data in a mouse event to select a new note, and play it.
     * @param e Mouse event.
     */
    private selectNoteWithMouseEvent_;
    /**
     * Play a note, by calling the externally overriden play note function.
     */
    private playNoteInternal_;
    /**
     * Function to play a musical note corresponding to the key selected.
     * Overridden externally.
     * @param _noteNum the MIDI note number to play.
     * @param _id An id to select a scratch extension to play the note.
     */
    static playNote_: ((noteNum: number, id: string) => void) | null;
    /**
     * Change the selected note by a number of octaves, and start the animation.
     * @param octaves The number of octaves to change by.
     */
    private changeOctaveBy_;
    /**
     * Animate the piano up or down an octave by sliding it to the left or right.
     */
    private stepOctaveAnimation_;
    doValueUpdate_(newValue: string): void;
    /**
     * For a MIDI note number, find the index of the corresponding piano key.
     * @param noteNum The note number.
     * @returns The index of the piano key.
     */
    private noteNumToKeyIndex_;
    /**
     * Update the selected note and labels on the field.
     */
    private updateSelection_;
    /**
     * Ensure that only a valid MIDI note number may be entered.
     * @param text The user's text.
     * @returns A string representing a valid note number, or null if invalid.
     */
    doClassValidation_(text: string | null): string | null;
}
interface FieldNoteJsonConfig extends Blockly.FieldTextInputFromJsonConfig {
    note: string;
}
/**
 * Register the field and any dependencies.
 */
export declare function registerFieldNote(): void;
export {};
//# sourceMappingURL=field_note.d.ts.map