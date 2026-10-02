# pseudo2sb3

A pseudocode → Scratch `.sb3` compiler with an Electron front end.

Write a small indentation-based script, compile it, and open the result in
[TurboWarp](https://turbowarp.org/) or the Scratch editor. Built for SilvusEvans'
advanced Scratch tutorials: the point is to let a learner describe a program in
text (loops, conditions, custom blocks, clones, lists) and get real, editable
Scratch blocks back — not a screenshot of blocks, but a project that runs.

**Download:** a prebuilt Windows x64 portable build is on the
[Releases](https://github.com/SilvusEvans/pse-block/releases) page — no installer, no admin
rights, just run the `.exe`. Everything below is about building it yourself from source.

```
npm install
npm run start                          # Electron app (loads the examples/ menu)
node src/cli.js examples/hello-en.pseudo -o out/hello.sb3 --parse-check
```

## Languages

The UI and the pseudocode DSL both speak **English, 简体中文, 繁體中文 and 日本語**.

- **English is the primary language.** It is the runtime default (`getLang()`),
  it is listed first in `LANGS`, and it is the fallback when a message has no
  translation.
- Aliases are **additive**: all four languages' spellings are accepted at the
  same time, and they can be mixed inside one file. `src/core/aliases-i18n.js`
  only ever appends to the `zh` / `en` tables, never replaces them.
- The compiler's internal error messages are authored in Simplified Chinese and
  translated at the boundary by `translateMessage(lang, text)` — the message
  template *is* the key (the gettext `msgid` idea), so Simplified Chinese output
  stays byte-for-byte stable. See `src/core/i18n.js`.

### Example naming

Every example file is named **`<english-name>-<lang>.pseudo`**. No language gets
a bare name:

| File | Language |
|:--|:--|
| `examples/hello-en.pseudo` | English |
| `examples/hello-zh-Hans.pseudo` | 简体中文 |
| `examples/hello-zh-Hant.pseudo` | 繁體中文 |
| `examples/hello-ja.pseudo` | 日本語 |
| `examples/snake-en.pseudo` | English |
| `examples/snake-zh-Hans.pseudo` | 简体中文 |

`zh-Hans` / `zh-Hant` / `en` / `ja` are exactly the codes in `LANGS`. The
**Examples** button loads the variant matching the current UI language and falls
back to English if that variant does not exist. The `Load example` menu lists
every file by name and loads the one you click.

Programs that only exist in one language carry that language's suffix and
nothing else — e.g. `pen-zh-Hans.pseudo`.

## Examples

| File | What it demonstrates |
|:--|:--|
| `hello-en.pseudo` / `hello-zh-Hans.pseudo` / `hello-zh-Hant.pseudo` / `hello-ja.pseudo` | The same bouncing-ball program in four languages. Global and private variables, a list, a custom block, broadcasts, clones, hats. Each compiles to exactly **50 blocks** — the four variants are asserted to be structurally identical. |
| `snake-en.pseudo` / `snake-zh-Hans.pseudo` | A playable snake game: 17×11 grid, arrow keys / WASD, grows when it eats, ends on a wall or on itself. The body is drawn with a **clone pool**, not the pen stamp (the pen layer is a bitmap and `stamp` would rasterise the SVG costumes). Both variants compile to **205 blocks** and are asserted to be isomorphic. |
| `pen-zh-Hans.pseudo` | Pen extension plus the Stretch extension: a Fibonacci spiral, then stretching. |
| `lists-zh-Hans.pseudo` | List index dropdowns (`last` / `random` / `all`), list contents, iteration, lookup. |
| `menus-zh-Hans.pseudo` | Static dropdowns (layer, time, maths, keys) and runtime-populated menus (point towards, go to). |
| `media-zh-Hans.pseudo` | Importing real costumes, backdrops and sounds from `examples/assets/`. |
| `advanced-zh-Hans.pseudo` | TurboWarp / Stretch blocks: camera and scene alignment, rotation style, stretch, counter, for-each, while, run-without-refresh, list show/hide. |
| `scale-zh-Hans.pseudo` | Music extension, a custom block with a parameter, and a list. |

Menu labels come from each file's first `#` comment, so adding an example needs
no menu edit.

## Pseudocode in one screen

```pseudo
# comment
global score = 0
sprite ball:
  # var = shared variable (lives on the stage); private = only this sprite sees it
  var height = 180
  var speed = 0
  private lastHeight
  list trail
  # real asset, path relative to this file; prefer SVG, bitmaps get re-encoded
  costume "assets/head.svg"
  def step(gravity: num):
    speed = speed + gravity
  # warp = no screen refresh while running; required for bulk clones / rebuilding lists
  def buildPool warp:
    repeat (20):
      create clone myself
  when green flag clicked:
    forever:
      step(1)
      if (touching("edge")):
        turn right(180)
  when key pressed("space"):
    create clone myself
  when I receive("end"):
    say(join("landed ", timer))
stage:
  # backdrop on the stage, costume on sprites
  backdrop "assets/field.svg"
  when green flag clicked:
    show variable(score)
```

Rules that bite:

- Indentation decides block nesting. Hats and C-blocks end with `:`.
- Assign with `=` or `←` — `<-` is **not** an operator.
- `#` comments must occupy a **whole line**. There are no trailing comments, because
  `#` also starts a colour literal (`set pen color to("#ff8800")`).
- Dropdown arguments go in **quotes** — `touching("edge")`, `item of list("last", xs)`,
  `stop("all")`. A bare word only works when it is neither a variable nor a block alias.
- Custom block and variable names are **single tokens** — use `placeFood`, not `place food`.
- A custom block that does dozens of things in one go (bulk clones, rebuilding a list)
  needs `warp`; one that contains `wait` must **never** use it.
- Prefer **clone pools over `stamp`** for anything repeated: the pen layer is a bitmap.
- Prefer **SVG** assets; Scratch re-encodes bitmaps and loses quality.

The sample above compiles as written (the *Aliases* panel in the app has the full
reference for all four languages, generated from the same tables the compiler reads).

## Commands

| Command | What it does |
|:--|:--|
| `npm run start` | Electron desktop app. |
| `npm run compile -- <in.pseudo> -o <out.sb3>` | CLI compile. Options: `--json`, `--parse-check`, `--no-validate`, `--base-dir dir`, `--lang zh-Hans\|zh-Hant\|en\|ja`. |
| `npm test` | 68 tests: block-shape assertions, `scratch-parser` schema checks, real `scratch-vm` execution, i18n equivalence. |
| `npm run check-catalog` | Verifies the block metadata against the `scratch-blocks` / `scratch-vm` sources in `.ref/`. |
| `npm run smoke` | 52 end-to-end assertions in a real Electron window (needs a desktop session). |
| `npm run extract-catalog` / `extract-extensions` | Regenerate `src/core/generated-*.json` from `.ref/`. |
| `npm run demo-assets` | Regenerate `examples/assets/` (no downloads needed). |
| `npm run regen` | extract + check-catalog + test. |
| `npm run dist` | Windows portable build into `dist/`. |

### Definition of done

`npm run check-catalog` green → `npm test` green → `npm run smoke` green
(last line `SMOKE PASS`) → for a release, the source inside the `.exe` has the
same md5 as the working tree and the process starts.

## Layout

```
src/cli.js            command line entry point
src/build.js          compile + resolve media + pack .sb3
src/core/compiler.js  lexer / parser / block emitter
src/core/catalog.js   block metadata (opcodes, slots, dropdowns)
src/core/aliases-i18n.js  zh-Hant / ja aliases, keywords, menu labels
src/core/i18n.js      UI copy, syntax cheat sheet, message translation
src/core/validate.js  structural self-check on the emitted project
src/core/project.js   .sb3 packing, costume/sound parsing, placeholder assets
electron/             main process, menu, IPC
renderer/             editor UI
examples/             the examples above (assets/ inside)
test/                 node:test suites + the Electron smoke test
scripts/              catalog extraction and asset generation
.ref/                 vendored scratch-blocks / scratch-vm sources (metadata ground truth)
```

## How it works

**`scratch-blocks` / `scratch-vm` are the single source of truth for block
metadata, and this repo emits `.sb3` itself** — it does not go through
scratch-vm's serialiser. Opcodes, input and field names, and the raw dropdown
values are extracted from the vendored sources into `generated-catalog.json` /
`generated-extensions.json`, and `npm run check-catalog` fails the build if the
hand-written tables drift from them.

This matters because **the failure mode of a compiler like this is silently
dropping content, not throwing**. A missing `CONDITION` declaration once made
`if…else…` compile without its condition and its entire then-branch, with no
error at all. So every change needs two kinds of evidence: the shape of the
emitted blocks, and a real run in the VM.

## Not supported

- Return values from custom blocks.
- `sensing_of` ("… of …") — its options are only known at runtime.
- Dropdown menus for the hardware extensions (microbit, wedo2, ev3, boost,
  makeymakey, gdxfor, text2speech); their options have no zh-Hant / ja labels.
- Reverse import (`.sb3` → pseudocode). Planned, not implemented.
