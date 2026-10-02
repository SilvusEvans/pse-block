/**
 * Copyright 2026 Scratch Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import { ConstantProvider as ClassicConstantProvider } from '../constants';
export declare enum PathCapType {
    CAP = "CAP",
    BOWLER = "BOWLER"
}
export declare enum PathEarState {
    DOWN = "DOWN",
    UP = "UP"
}
export interface CatPathState {
    capType: PathCapType;
    ear1State: PathEarState;
    ear2State: PathEarState;
}
export declare class ConstantProvider extends ClassicConstantProvider {
    START_HAT_HEIGHT: number;
    START_HAT_WIDTH: number;
    BOWLER_HAT_HEIGHT: number;
    FACE_OPACITY: number;
    EYE_1_X: number;
    EYE_1_Y: number;
    EYE_2_X: number;
    EYE_2_Y: number;
    OPEN_EYE_RADIUS: number;
    CLOSED_EYE_1_PATH: string;
    CLOSED_EYE_2_PATH: string;
    MOUTH_PATH: string;
    EAR_INSIDE_COLOR: string;
    EAR_1_INSIDE_PATH: string;
    EAR_2_INSIDE_PATH: string;
    CAP_START_PATH: string;
    CAP_MIDDLE_PATH: string;
    CAP_END_PATH: string;
    CAP_EAR_1_UP_PATH: string;
    CAP_EAR_2_UP_PATH: string;
    CAP_EAR_1_DOWN_PATH: string;
    CAP_EAR_2_DOWN_PATH: string;
    BOWLER_START_PATH: string;
    BOWLER_MIDDLE_PATH: string;
    BOWLER_END_PATH: string;
    BOWLER_EAR_1_UP_PATH: string;
    BOWLER_EAR_2_UP_PATH: string;
    BOWLER_EAR_1_DOWN_PATH: string;
    BOWLER_EAR_2_DOWN_PATH: string;
    BOWLER_WIDTH_MAGIC: number;
    /**
     * Make the starting portion of a block's hat.
     * The return value will be stored as START_HAT.
     * In the case of cat blocks, this is just a placeholder for sizing.
     * @returns An object containing the hat's height and width dimensions.
     */
    makeStartHat(): {
        height: number;
        width: number;
        path: string;
    };
    makeCatPath(width: number, state: CatPathState): string;
}
//# sourceMappingURL=constants.d.ts.map