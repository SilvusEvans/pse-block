import en from '../msg/json/en.json';
type Messages = Record<string, string>;
/** A message key defined in this repository's English source. */
export type ScratchMessageKey = keyof typeof en;
/**
 * Localized strings for Scratch blocks and workspace UI.
 *
 * English comes from this repository's `msg/json/en.json`, so new strings are usable before they are translated.
 * Every other locale comes from scratch-l10n, which pulls reviewed translations from Transifex.
 */
export declare class ScratchMsgs {
    static currentLocale_: string;
    static locales: Record<string, Messages>;
    /**
     * Apply a locale's messages to `Blockly.Msg`.
     * @param locale A key of `ScratchMsgs.locales`, such as `'de'` or `'pt-br'`.
     */
    static setLocale(locale: string): void;
    /**
     * Look up a message without changing the current locale.
     * @param msgId The message key.
     * @param defaultMsg Returned when the locale has no translation for `msgId`.
     * @param useLocale The locale to use instead of the current one.
     * @returns The translation, else `defaultMsg`, else the English message.
     */
    static translate(msgId: ScratchMessageKey, defaultMsg?: string, useLocale?: string): string;
    static translate(msgId: string, defaultMsg: string, useLocale?: string): string;
    static translate(msgId: string, defaultMsg?: string, useLocale?: string): string | undefined;
    private static getLocaleMessages;
}
export {};
//# sourceMappingURL=scratch_msgs.d.ts.map