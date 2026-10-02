/**
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
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
 * @file Colour input field.
 * @author fraser@google.com (Neil Fraser)
 */
import { FieldColour, FieldColourFromJsonConfig } from '@blockly/field-colour';
/**
 * Class for a slider-based colour input field.
 */
export declare class FieldColourSlider extends FieldColour {
    /**
     * Function to be called if eyedropper can be activated.
     * If defined, an eyedropper button will be added to the color picker.
     * The button calls this function with a callback to update the field value.
     * BEWARE: This is not a stable API. It may change.
     */
    static activateEyedropper_?: (callback: (colour: string) => void) => void;
    /**
     * Path to the eyedropper svg icon.
     */
    EYEDROPPER_PATH: string;
    SERIALIZABLE: boolean;
    EDITABLE: boolean;
    private hueChangeEventKey_?;
    private saturationChangeEventKey_?;
    private brightnessChangeEventKey_?;
    private hueSlider_?;
    private saturationSlider_?;
    private brightnessSlider_?;
    private hueReadout_?;
    private saturationReadout_?;
    private brightnessReadout_?;
    private hue_;
    private saturation_;
    private brightness_;
    private eyedropperEventData_?;
    /**
     * Construct a FieldColourSlider from a JSON arg object.
     * @param options A JSON object with options (colour).
     * @returns The new field instance.
     */
    static fromJson(options: FieldColourFromJsonConfig): FieldColourSlider;
    doValueUpdate_(newValue: string): void;
    /**
     * Create the hue, saturation or value CSS gradient for the slide backgrounds.
     * @param channel – Either "hue", "saturation" or "value".
     * @returns Array colour hex colour stops for the given channel
     */
    private createColourStops_;
    /**
     * Set the gradient CSS properties for the given node and channel
     * @param node The DOM node the gradient will be set on.
     * @param channel Either "hue", "saturation" or "value".
     */
    private setGradient_;
    /**
     * Update the readouts and slider backgrounds after value has changed.
     */
    private updateDom_;
    /**
     * Update the slider handle positions from the current field value.
     */
    private updateSliderHandles_;
    /**
     * Create label and readout DOM elements, returning the readout.
     * @param labelText Text for the label
     * @returns The container node and the readout node.
     */
    private createLabelDom_;
    /**
     * Factory for creating the different slider callbacks
     * @param channel One of "hue", "saturation" or "brightness"
     * @returns The callback for slider update
     */
    private sliderCallbackFactory_;
    /**
     * Activate the eyedropper, passing in a callback for setting the field value.
     */
    private activateEyedropperInternal_;
    /**
     * Create hue, saturation and brightness sliders under the colour field.
     */
    showEditor_(): void;
    dispose(): void;
    rgbToHsv(red: number, green: number, blue: number): {
        hue: number;
        saturation: number;
        value: number;
    };
}
/**
 * Register the field and any dependencies.
 */
export declare function registerFieldColourSlider(): void;
//# sourceMappingURL=field_colour_slider.d.ts.map