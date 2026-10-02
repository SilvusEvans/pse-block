// Multi-language layer for UI copy and compiler messages:
// English / 简体中文 / 繁體中文 / 日本語.
//
// Two independent chains:
//   1) UI copy     — read with t(key, ...args); the key table is UI. The renderer pulls
//      the whole dictionary at once through uiDict(lang).
//   2) Compiler messages — the compiler keeps writing them in Simplified Chinese (the
//      "native language" of the pseudocode DSL, and the baseline the existing tests pin),
//      and PsError plus the structural self-check run translateMessage(lang, zhText) at
//      the boundary. The message template *is* the key (the gettext msgid idea), so
//      Simplified Chinese output stays byte-for-byte identical and the existing
//      /布尔/, /第 3 行/, /需要 2 个参数/ assertions are unaffected.

// English is the primary language: it is the runtime default and is listed first here.
export const LANGS = ['en', 'zh-Hans', 'zh-Hant', 'ja'];

// Display order in the language dropdown (kept separate from LANGS: that one is the
// validation set and its order carries no meaning). English/Japanese on top, the two
// Chinese variants at the bottom.
export const LANG_MENU_ORDER = ['en', 'ja', 'zh-Hans', 'zh-Hant'];

// How each language names itself in the UI (the name shown in the menu when switching languages; always written in that language itself)
export const LANG_LABELS = {
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  en: 'English',
  ja: '日本語'
};

// BCP-47, for <html lang>
export const LANG_TAGS = {
  'zh-Hans': 'zh-Hans',
  'zh-Hant': 'zh-Hant',
  en: 'en',
  ja: 'ja'
};

export const isLang = l => LANGS.includes(l);
export const normalizeLang = l => {
  const s = String(l || '').replace('_', '-');
  if (isLang(s)) return s;
  const lower = s.toLowerCase();
  if (lower === 'zh' || lower === 'zh-cn' || lower === 'zh-hans' || lower === 'chs') return 'zh-Hans';
  if (lower === 'zh-tw' || lower === 'zh-hk' || lower === 'zh-hant' || lower === 'cht') return 'zh-Hant';
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('ja') || lower === 'jp') return 'ja';
  return null;
};

// Default language: English (both app startup and the CLI read it from here; a choice made in the dropdown is stored in settings.json)
let LANG = 'en';
export function setLang (l) {
  const n = normalizeLang(l);
  if (n) LANG = n;
  return LANG;
}
export const getLang = () => LANG;

const fill = (tpl, args) => {
  let i = 0;
  return String(tpl).replace(/\{\}/g, () => (args[i] === undefined || args[i] === null ? '' : String(args[i++])));
};

/* ============================ 1) UI copy ============================ */

const UI = {
  'app.title': {
    'zh-Hans': '伪代码 → .sb3', 'zh-Hant': '虛擬碼 → .sb3', en: 'Pseudocode → .sb3', ja: '疑似コード → .sb3'
  },
  'brand.studio': {'zh-Hans': 'SilvusEvans', 'zh-Hant': 'SilvusEvans', en: 'SilvusEvans', ja: 'SilvusEvans'},

  'btn.example': {'zh-Hans': '示例', 'zh-Hant': '範例', en: 'Examples', ja: 'サンプル'},
  'btn.open': {'zh-Hans': '打开…', 'zh-Hant': '開啟…', en: 'Open…', ja: '開く…'},
  'btn.save': {'zh-Hans': '保存', 'zh-Hant': '儲存', en: 'Save', ja: '保存'},
  'btn.media': {'zh-Hans': '插入素材…', 'zh-Hant': '插入素材…', en: 'Insert media…', ja: '素材を挿入…'},
  'btn.media.title': {
    'zh-Hans': '选 png/svg 造型或 wav 声音，路径写进当前角色/舞台',
    'zh-Hant': '選 png/svg 造型或 wav 聲音，路徑寫進目前角色/舞台',
    en: 'Pick a png/svg costume or wav sound; the path is written into the current sprite/stage',
    ja: 'png/svg のコスチュームか wav の音を選び、パスを現在のスプライト/ステージに書き込みます'
  },
  'btn.compile': {'zh-Hans': '检查 (Ctrl+B)', 'zh-Hant': '檢查 (Ctrl+B)', en: 'Check (Ctrl+B)', ja: 'チェック (Ctrl+B)'},
  'btn.export': {'zh-Hans': '导出 .sb3 (Ctrl+E)', 'zh-Hant': '匯出 .sb3 (Ctrl+E)', en: 'Export .sb3 (Ctrl+E)', ja: '.sb3 を書き出す (Ctrl+E)'},
  'lang.label': {'zh-Hans': '语言', 'zh-Hant': '語言', en: 'Language', ja: '言語'},

  'file.untitled': {'zh-Hans': '未命名.pseudo', 'zh-Hant': '未命名.pseudo', en: 'untitled.pseudo', ja: '無題.pseudo'},
  'file.exampleSuffix': {'zh-Hans': '（示例）', 'zh-Hant': '（範例）', en: ' (example)', ja: '（サンプル）'},

  'panel.result': {'zh-Hans': '结果', 'zh-Hant': '結果', en: 'Result', ja: '結果'},
  'badge.pending': {'zh-Hans': '待编译', 'zh-Hant': '待編譯', en: 'Not compiled', ja: '未コンパイル'},
  'badge.ok': {'zh-Hans': '通过', 'zh-Hant': '通過', en: 'Passed', ja: '合格'},
  'badge.err': {'zh-Hans': '有问题', 'zh-Hant': '有問題', en: 'Problems', ja: '問題あり'},
  'badge.fixFirst': {'zh-Hans': '先修好错误', 'zh-Hant': '先修好錯誤', en: 'Fix errors first', ja: '先にエラーを直してください'},
  'badge.exported': {'zh-Hans': '已导出', 'zh-Hant': '已匯出', en: 'Exported', ja: '書き出し完了'},

  'panel.problems': {'zh-Hans': '结构问题', 'zh-Hant': '結構問題', en: 'Structural issues', ja: '構造の問題'},
  'panel.warnings': {'zh-Hans': '警告', 'zh-Hant': '警告', en: 'Warnings', ja: '警告'},
  'panel.stats': {'zh-Hans': '统计', 'zh-Hant': '統計', en: 'Statistics', ja: '統計'},

  'stats.blocks': {'zh-Hans': '积木总数', 'zh-Hant': '積木總數', en: 'Total blocks', ja: 'ブロック総数'},
  'stats.targets': {'zh-Hans': '角色/舞台', 'zh-Hant': '角色/舞台', en: 'Targets', ja: 'スプライト/ステージ'},
  'stats.size': {'zh-Hans': '文件大小', 'zh-Hant': '檔案大小', en: 'File size', ja: 'ファイルサイズ'},
  'stats.chip': {
    'zh-Hans': '{} · {} 脚本 · 造型 {} · 声音 {}',
    'zh-Hant': '{} · {} 指令 · 造型 {} · 聲音 {}',
    en: '{} · {} scripts · {} costumes · {} sounds',
    ja: '{} · {} 個のスクリプト · コスチューム {} · 音 {}'
  },
  'stats.stage': {'zh-Hans': '舞台', 'zh-Hant': '舞台', en: 'Stage', ja: 'ステージ'},
  'stats.ext': {'zh-Hans': '扩展: {}', 'zh-Hant': '擴充功能: {}', en: 'Extension: {}', ja: '拡張機能: {}'},

  'ref.syntax': {'zh-Hans': '语法速查', 'zh-Hant': '語法速查', en: 'Syntax cheat sheet', ja: '文法早見表'},
  'ref.hint': {
    'zh-Hans': '缩进用空格；数值/文本/布尔积木会按槽位类型校验。素材支持 png/svg 造型与 wav 声音，路径相对已打开或已保存的 .pseudo 所在目录；「插入素材…」会把选中的文件写进当前角色/舞台名下，目录外的文件会复制进 assets/。',
    'zh-Hant': '縮排用空格；數值/文字/布林積木會依槽位型別檢查。素材支援 png/svg 造型與 wav 聲音，路徑相對於已開啟或已儲存的 .pseudo 所在目錄；「插入素材…」會把選取的檔案寫進目前角色/舞台名下，目錄外的檔案會複製進 assets/。',
    en: 'Indent with spaces. Number/text/boolean blocks are type-checked against their slots. Media supports png/svg costumes and wav sounds; paths are relative to the folder of the opened or saved .pseudo. "Insert media…" writes the picked files under the current sprite/stage and copies files from outside the folder into assets/.',
    ja: 'インデントはスペース。数値・テキスト・真偽ブロックはスロットの型で検査されます。素材は png/svg のコスチュームと wav の音に対応し、パスは開いている／保存済みの .pseudo のフォルダーからの相対パスです。「素材を挿入…」は選んだファイルを現在のスプライト/ステージに書き込み、フォルダー外のファイルは assets/ にコピーします。'
  },
  'ref.vocab': {'zh-Hans': '积木别名表', 'zh-Hant': '積木別名表', en: 'Block alias table', ja: 'ブロック別名表'},
  'ref.vocab.loading': {'zh-Hans': '载入中…', 'zh-Hant': '載入中…', en: 'Loading…', ja: '読み込み中…'},
  'ref.vocab.count': {'zh-Hans': '{} 条', 'zh-Hant': '{} 條', en: '{} entries', ja: '{} 件'},
  'ref.vocab.unit': {'zh-Hans': '条', 'zh-Hant': '條', en: 'entries', ja: '件'},

  // Keywords for target declarations (used by Insert media, the syntax cheat sheet and the examples)
  'word.stage': {'zh-Hans': '舞台', 'zh-Hant': '舞台', en: 'stage', ja: 'ステージ'},
  'word.sprite': {'zh-Hans': '角色', 'zh-Hant': '角色', en: 'sprite', ja: 'スプライト'},
  // Keywords for media declarations (used by Insert media, the syntax cheat sheet and the examples)
  'word.costume': {'zh-Hans': '造型', 'zh-Hant': '造型', en: 'costume', ja: 'コスチューム'},
  'word.backdrop': {'zh-Hans': '背景', 'zh-Hant': '背景', en: 'backdrop', ja: '背景'},
  'word.sound': {'zh-Hans': '声音', 'zh-Hant': '聲音', en: 'sound', ja: '音'},
  'vocab.filter': {
    'zh-Hans': '筛选：中文 / 英文 / opcode / 菜单选项',
    'zh-Hant': '篩選：中文 / 英文 / opcode / 選單選項',
    en: 'Filter: alias / English / opcode / menu option',
    ja: '絞り込み：別名 / 英語 / opcode / メニュー項目'
  },
  'vocab.th.group': {'zh-Hans': '分组', 'zh-Hant': '分組', en: 'Group', ja: 'グループ'},
  'vocab.th.kind': {'zh-Hans': '形状', 'zh-Hant': '形狀', en: 'Shape', ja: '形'},
  'vocab.th.alias': {'zh-Hans': '写法（当前语言）', 'zh-Hant': '寫法（目前語言）', en: 'Aliases (current language)', ja: '書き方（現在の言語）'},
  'vocab.th.en': {'zh-Hans': '英文写法', 'zh-Hant': '英文寫法', en: 'English aliases', ja: '英語の書き方'},
  'vocab.th.slots': {'zh-Hans': '槽位', 'zh-Hant': '槽位', en: 'Slots', ja: 'スロット'},

  'err.mediaCopy': {
    'zh-Hans': '有素材没能复制到工程目录：', 'zh-Hant': '有素材沒能複製到專案目錄：',
    en: 'Some media could not be copied into the project folder: ',
    ja: 'プロジェクトフォルダーにコピーできなかった素材があります: '
  },
  'err.exampleLoad': {'zh-Hans': '示例载入失败：', 'zh-Hant': '範例載入失敗：', en: 'Failed to load example: ', ja: 'サンプルの読み込みに失敗しました: '},

  'menu.file': {'zh-Hans': '文件', 'zh-Hant': '檔案', en: 'File', ja: 'ファイル'},
  'menu.open': {'zh-Hans': '打开伪代码…', 'zh-Hant': '開啟虛擬碼…', en: 'Open pseudocode…', ja: '疑似コードを開く…'},
  'menu.save': {'zh-Hans': '保存', 'zh-Hant': '儲存', en: 'Save', ja: '保存'},
  'menu.export': {'zh-Hans': '导出 .sb3', 'zh-Hant': '匯出 .sb3', en: 'Export .sb3', ja: '.sb3 を書き出す'},
  'menu.quit': {'zh-Hans': '退出', 'zh-Hant': '結束', en: 'Quit', ja: '終了'},
  'menu.compile': {'zh-Hans': '编译', 'zh-Hant': '編譯', en: 'Compile', ja: 'コンパイル'},
  'menu.check': {'zh-Hans': '检查', 'zh-Hant': '檢查', en: 'Check', ja: 'チェック'},
  'menu.examples': {'zh-Hans': '载入示例', 'zh-Hant': '載入範例', en: 'Load example', ja: 'サンプルを読み込む'},
  'menu.view': {'zh-Hans': '视图', 'zh-Hant': '檢視', en: 'View', ja: '表示'},
  'menu.reload': {'zh-Hans': '重载', 'zh-Hant': '重新載入', en: 'Reload', ja: '再読み込み'},
  'menu.devtools': {'zh-Hans': '开发者工具', 'zh-Hant': '開發者工具', en: 'Developer tools', ja: '開発者ツール'},

  'dlg.compileFailed': {'zh-Hans': '编译失败', 'zh-Hant': '編譯失敗', en: 'Compile failed', ja: 'コンパイルに失敗しました'},
  'dlg.selfCheck': {'zh-Hans': '结构自检未通过', 'zh-Hant': '結構自檢未通過', en: 'Structural self-check failed', ja: '構造の自己検査に通りませんでした'},
  'dlg.selfCheck.msg': {
    'zh-Hans': '有 {} 个结构问题，仍要导出吗？', 'zh-Hant': '有 {} 個結構問題，仍要匯出嗎？',
    en: 'There are {} structural issues. Export anyway?',
    ja: '{} 件の構造の問題があります。それでも書き出しますか？'
  },
  'dlg.exportAnyway': {'zh-Hans': '仍然导出', 'zh-Hant': '仍然匯出', en: 'Export anyway', ja: '書き出す'},
  'dlg.cancel': {'zh-Hans': '取消', 'zh-Hant': '取消', en: 'Cancel', ja: 'キャンセル'},
  'dlg.filter.scratch': {'zh-Hans': 'Scratch 工程', 'zh-Hant': 'Scratch 專案', en: 'Scratch project', ja: 'Scratch プロジェクト'},
  'dlg.filter.pseudo': {'zh-Hans': '伪代码', 'zh-Hant': '虛擬碼', en: 'Pseudocode', ja: '疑似コード'},
  'dlg.filter.all': {'zh-Hans': '所有文件', 'zh-Hant': '所有檔案', en: 'All files', ja: 'すべてのファイル'},
  'dlg.filter.media': {
    'zh-Hans': '素材（png / svg / wav）', 'zh-Hant': '素材（png / svg / wav）',
    en: 'Media (png / svg / wav)', ja: '素材（png / svg / wav）'
  },
  'err.badExampleName': {'zh-Hans': '示例名不合法', 'zh-Hant': '範例名不合法', en: 'Invalid example name', ja: 'サンプル名が不正です'},
  'err.exampleNotFound': {'zh-Hans': '找不到示例 {}', 'zh-Hant': '找不到範例 {}', en: 'Example {} not found', ja: 'サンプル {} が見つかりません'},

  'cli.usage': {
    'zh-Hans': '用法: node src/cli.js <输入.pseudo> [-o 输出.sb3] [--json] [--parse-check] [--no-validate] [--base-dir 目录] [--lang zh-Hans|zh-Hant|en|ja]',
    'zh-Hant': '用法: node src/cli.js <輸入.pseudo> [-o 輸出.sb3] [--json] [--parse-check] [--no-validate] [--base-dir 目錄] [--lang zh-Hans|zh-Hant|en|ja]',
    en: 'Usage: node src/cli.js <input.pseudo> [-o out.sb3] [--json] [--parse-check] [--no-validate] [--base-dir dir] [--lang zh-Hans|zh-Hant|en|ja]',
    ja: '使い方: node src/cli.js <入力.pseudo> [-o 出力.sb3] [--json] [--parse-check] [--no-validate] [--base-dir フォルダー] [--lang zh-Hans|zh-Hant|en|ja]'
  },
  'cli.mediaHint': {
    'zh-Hans': '素材路径（造型/背景/声音）默认相对输入 .pseudo 所在目录解析。',
    'zh-Hant': '素材路徑（造型/背景/聲音）預設相對輸入 .pseudo 所在目錄解析。',
    en: 'Media paths (costume/backdrop/sound) resolve relative to the input .pseudo folder by default.',
    ja: '素材のパス（コスチューム/背景/音）は既定で入力 .pseudo のフォルダーからの相対パスとして解決されます。'
  },
  'cli.unknownArg': {'zh-Hans': '未知参数 {}', 'zh-Hant': '未知參數 {}', en: 'Unknown option {}', ja: '不明な引数 {}'},
  'cli.selfCheckFailed': {'zh-Hans': '结构自检未通过 ({} 项):', 'zh-Hant': '結構自檢未通過 ({} 項):', en: 'Structural self-check failed ({}):', ja: '構造の自己検査に失敗 ({} 件):'},
  'cli.wrote': {'zh-Hans': '✔ 已生成 {}  ({} KB)', 'zh-Hant': '✔ 已產生 {}  ({} KB)', en: '✔ Wrote {}  ({} KB)', ja: '✔ 生成しました {}  ({} KB)'},
  'cli.summary': {'zh-Hans': '  积木 {} 块 · 角色 {} 个 · 扩展 {}', 'zh-Hant': '  積木 {} 塊 · 角色 {} 個 · 擴充功能 {}', en: '  {} blocks · {} targets · extensions {}', ja: '  ブロック {} 個 · ターゲット {} 個 · 拡張機能 {}'},
  'cli.none': {'zh-Hans': '无', 'zh-Hant': '無', en: 'none', ja: 'なし'},
  'cli.targetLine': {'zh-Hans': '  - {} {}: {} 个脚本 · 造型 {} · 声音 {}', 'zh-Hant': '  - {} {}: {} 個指令 · 造型 {} · 聲音 {}', en: '  - {} {}: {} scripts · {} costumes · {} sounds', ja: '  - {} {}: {} スクリプト · コスチューム {} · 音 {}'},
  'cli.stageTag': {'zh-Hans': '[舞台]', 'zh-Hant': '[舞台]', en: '[stage]', ja: '[ステージ]'},
  'cli.spriteTag': {'zh-Hans': '[角色]', 'zh-Hant': '[角色]', en: '[sprite]', ja: '[スプライト]'},
  'cli.parseOk': {'zh-Hans': '✔ scratch-parser 通过：semver {} · zip 内 {} 个文件（素材 {} 个）', 'zh-Hant': '✔ scratch-parser 通過：semver {} · zip 內 {} 個檔案（素材 {} 個）', en: '✔ scratch-parser passed: semver {} · {} files in zip ({} media)', ja: '✔ scratch-parser 合格: semver {} · zip 内 {} ファイル（素材 {}）'},
  'cli.compileFailed': {'zh-Hans': '✘ 编译失败 ', 'zh-Hant': '✘ 編譯失敗 ', en: '✘ Compile failed ', ja: '✘ コンパイル失敗 '},
  'cli.internalError': {'zh-Hans': '✘ 内部错误:', 'zh-Hant': '✘ 內部錯誤:', en: '✘ Internal error:', ja: '✘ 内部エラー:'}
};

// Syntax cheat sheet (a whole example per language)
const SYNTAX = {
  'zh-Hans': `# 注释
全局 分数 = 0
角色 球:
  # 共享变量（存于舞台）
  变量 高度 = 180
  变量 速度 = 0
  # 仅本角色可见
  私有 上一高度
  列表 轨迹
  # 真实素材，路径相对本文件；素材优先 SVG，位图会被压画质
  造型 "assets/cat.svg"
  声音 "assets/meow.wav"
  定义 推进一步(重力: 数):
    速度 ← 速度 + 重力
  # 不刷新 = 运行时不刷新屏幕；批量建克隆/重建列表必须开
  定义 建克隆池 不刷新:
    重复 (20):
      克隆自己
  绿旗:
    重复 永远:
      推进一步(1)
      如果 (碰到("边缘")):
        右转(180)
  当按键("空格"):
    克隆自己
  当收到("结束"):
    说(连接("落地 ", 计时器))
    # 画笔扩展：落笔/抬笔/图章/画笔大小设为…
    清空画笔()
    # Stretch 扩展：纵向拉伸/拉伸设为…
    横向拉伸设为(150)
    # 音乐扩展：击鼓(小军鼓, 1)/乐器设为(钢琴)/休止(1)…
    播放音符(60, 0.5)
舞台:
  # 舞台用 背景，角色用 造型
  背景 "assets/bg.png"
  绿旗:
    显示变量(分数)`,
  'zh-Hant': `# 註解
全域 分數 = 0
角色 球:
  # 共用變數（存於舞台）
  變數 高度 = 180
  變數 速度 = 0
  # 僅本角色可見
  私有 上一高度
  清單 軌跡
  # 真實素材，路徑相對於本檔；素材優先 SVG，點陣圖會被壓畫質
  造型 "assets/cat.svg"
  聲音 "assets/meow.wav"
  定義 推進一步(重力: 數):
    速度 ← 速度 + 重力
  # 不刷新 = 執行時不重繪畫面；批次建複製體/重建清單必須開
  定義 建複製池 不刷新:
    重複 (20):
      複製自己
  綠旗:
    重複 永遠:
      推進一步(1)
      如果 (碰到("邊緣")):
        右轉(180)
  當按鍵("空格"):
    複製自己
  當收到("結束"):
    說(連接("落地 ", 計時器))
    # 畫筆擴充：落筆/抬筆/圖章/畫筆大小設為…
    清空畫筆()
    # Stretch 擴充：縱向拉伸/拉伸設為…
    橫向拉伸設為(150)
    # 音樂擴充：擊鼓(小軍鼓, 1)/樂器設為(鋼琴)/休止(1)…
    播放音符(60, 0.5)
舞台:
  # 舞台用 背景，角色用 造型
  背景 "assets/bg.png"
  綠旗:
    顯示變數(分數)`,
  en: `# comment
global score = 0
sprite ball:
  # shared variable (lives on the stage)
  var height = 180
  var speed = 0
  # visible only inside this sprite
  private lastHeight
  list trail
  # real asset, path relative to this file; prefer SVG, bitmaps get re-encoded
  costume "assets/cat.svg"
  sound "assets/meow.wav"
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
    # pen extension: pen down / pen up / stamp / set pen size to…
    erase all()
    # Stretch extension: set stretch y to / set stretch to…
    set stretch x to(150)
    # music extension: play drum(1, 1) / set instrument(1) / rest for(1)…
    play note(60, 0.5)
stage:
  # 背景 on the stage, 造型 on sprites
  backdrop "assets/bg.png"
  when green flag clicked:
    show variable(score)`,
  ja: `# コメント
グローバル スコア = 0
スプライト ボール:
  # 共有変数（ステージに置かれる）
  変数 高さ = 180
  変数 速度 = 0
  # このスプライトだけが見える
  プライベート 前の高さ
  リスト 軌跡
  # 実素材。パスはこのファイルからの相対；SVG 推奨、ビットマップは再圧縮される
  コスチューム "assets/cat.svg"
  音 "assets/meow.wav"
  定義 一歩進む(重力: 数):
    速度 ← 速度 + 重力
  # ワープ = 実行中は画面を更新しない；大量クローン/リスト再構築に必須
  定義 クローン準備 ワープ:
    繰り返す (20):
      自分のクローン
  緑の旗:
    ずっと:
      一歩進む(1)
      もし (に触れた("端")):
        右に回す(180)
  キーが押されたとき("スペース"):
    自分のクローン
  メッセージを受け取ったとき("終了"):
    言う(と結合("着地 ", タイマー))
    # ペン拡張: ペンを下ろす / ペンを上げる / スタンプ / ペンの太さにする…
    全部消す()
    # Stretch 拡張: 縦伸縮にする / 伸縮にする…
    横伸縮にする(150)
    # 音楽拡張: ドラムを鳴らす(1, 1) / 楽器にする(1) / 休符(1)…
    音符を鳴らす(60, 0.5)
ステージ:
  # ステージは 背景、スプライトは コスチューム
  背景 "assets/bg.png"
  緑の旗:
    変数を表示する(スコア)`
};

/* ========================= 2) Compiler messages ========================= */

// Fragment words produced by describe() and friends, translated separately
const FRAG = {
  '文件结尾': {'zh-Hant': '檔案結尾', en: 'end of file', ja: 'ファイルの終わり'},
  '换行': {'zh-Hant': '換行', en: 'newline', ja: '改行'},
  '缩进': {'zh-Hant': '縮排', en: 'indent', ja: 'インデント'},
  '退格': {'zh-Hant': '取消縮排', en: 'dedent', ja: 'インデント解除'},
  '数字': {'zh-Hant': '數字', en: 'number', ja: '数値'},
  '文本': {'zh-Hant': '文字', en: 'text', ja: 'テキスト'},
  '造型': {'zh-Hant': '造型', en: 'costume', ja: 'コスチューム'},
  '声音': {'zh-Hant': '聲音', en: 'sound', ja: '音'}
};

const PREFIX = {
  'zh-Hans': '[第 {} 行] {}', 'zh-Hant': '[第 {} 行] {}', en: '[line {}] {}', ja: '[{} 行目] {}'
};

// The single exit point for PsError: translate the message body + add the line-number prefix per language
export function formatError (lang, msg, line) {
  const l = normalizeLang(lang) || 'en';
  const body = translateMessage(l, msg);
  if (!line) return body;
  return (PREFIX[l] || PREFIX.en).replace('{}', String(line)).replace('{}', body);
}

// [regex (anchored), {language: template}]; the {} in a template correspond to the capture groups in order
const MSG = [
  // —— lexer / parser ——
  [/^字符串引号未闭合$/, {'zh-Hant': '字串引號未閉合', en: 'Unterminated string quote', ja: '文字列の引用符が閉じられていません'}],
  [/^无法识别的字符 "(.+)"$/, {'zh-Hant': '無法識別的字元 "{}"', en: 'Unrecognized character "{}"', ja: '解釈できない文字 "{}"'}],
  [/^期望 (.+?)，实际得到 (.+)$/, {'zh-Hant': '期望 {}，實際得到 {}', en: 'Expected {}, got {}', ja: '{} を期待しましたが {} でした'}],
  [/^角色声明后需要冒号$/, {'zh-Hant': '角色宣告後需要冒號', en: 'A sprite declaration needs a trailing colon', ja: 'スプライト宣言の後にはコロンが必要です'}],
  [/^无法开始的语句 (.+)$/, {'zh-Hant': '無法開始的語句 {}', en: 'Cannot start a statement with {}', ja: '文を開始できません: {}'}],
  [/^上一行不是块语句，下面不应有缩进$/, {'zh-Hant': '上一行不是積木語句，下面不應有縮排', en: 'The line above is not a block statement, so it must not be indented', ja: '前の行がブロック文ではないため、インデントできません'}],
  [/^块内容需要缩进$/, {'zh-Hant': '積木內容需要縮排', en: 'Block body must be indented', ja: 'ブロックの中身はインデントが必要です'}],
  [/^无法解析的语句 (.+)$/, {'zh-Hant': '無法解析的語句 {}', en: 'Cannot parse statement {}', ja: '解析できない文 {}'}],
  [/^语句应以名称开始，实际是 (.+)$/, {'zh-Hant': '語句應以名稱開始，實際是 {}', en: 'A statement must start with a name, got {}', ja: '文は名前から始まる必要があります: {}'}],
  [/^"(.+)" 不是可用的块名，也不是事件帽子或控制积木$/, {'zh-Hant': '"{}" 不是可用的積木名，也不是事件帽子或控制積木', en: '"{}" is not a known block, hat or control block', ja: '"{}" は有効なブロック名でもイベントハットでも制御ブロックでもありません'}],
  [/^不支持连续比较$/, {'zh-Hant': '不支援連續比較', en: 'Chained comparisons are not supported', ja: '連続した比較は使えません'}],
  [/^表达式位置不对，遇到 (.+)$/, {'zh-Hant': '運算式位置不對，遇到 {}', en: 'Unexpected token in expression: {}', ja: '式の位置が不正です: {}'}],
  [/^只能有一个舞台$/, {'zh-Hant': '只能有一個舞台', en: 'There can only be one stage', ja: 'ステージは 1 つだけです'}],
  [/^块内容需要缩进$/, {'zh-Hant': '積木內容需要縮排', en: 'Block body must be indented', ja: 'ブロックの中身はインデントが必要です'}],
  // —— media declarations ——
  [/^(.+) 的路径不能为空$/, {'zh-Hant': '{} 的路徑不能為空', en: 'The path for {} must not be empty', ja: '{} のパスは空にできません'}],
  [/^(.+) 后面需要引号里的文件路径，例如 (.+)$/, {'zh-Hant': '{} 後面需要引號裡的路徑，例如 {}', en: '{} needs a quoted file path, e.g. {}', ja: '{} の後には引用符付きのパスが必要です。例: {}'}],
  [/^背景 只能用在舞台里，角色请用 造型$/, {'zh-Hant': '背景 只能用在舞台裡，角色請用 造型', en: 'backdrop can only be used on the stage; use costume in a sprite', ja: '背景 はステージでのみ使えます。スプライトでは コスチューム を使ってください'}],
  // —— custom blocks ——
  [/^事件帽子需要 (\d+) 个参数，实际给了 (\d+)$/, {'zh-Hant': '事件帽子需要 {} 個參數，實際給了 {}', en: 'This hat needs {} arguments, got {}', ja: 'このハットは引数 {} 個が必要ですが {} 個でした'}],
  [/^(.+) 的 (.+) 必须写在括号里$/, {'zh-Hant': '{} 的 {} 必須寫在括號裡', en: '{} of {} must be written inside parentheses', ja: '{} の {} は括弧の中に書く必要があります'}],
  [/^自定义块只能作为语句调用$/, {'zh-Hant': '自訂積木只能作為語句呼叫', en: 'A custom block can only be called as a statement', ja: 'カスタムブロックは文としてのみ呼び出せます'}],
  [/^未定义的自定义块 "(.+)"$/, {'zh-Hant': '未定義的自訂積木 "{}"', en: 'Undefined custom block "{}"', ja: '未定義のカスタムブロック "{}"'}],
  [/^"(.+)" 需要 (\d+) 个参数，实际 (\d+)$/, {'zh-Hant': '"{}" 需要 {} 個參數，實際 {}', en: '"{}" needs {} arguments, got {}', ja: '"{}" は引数 {} 個が必要ですが {} 個でした'}],
  // —— menus / fields ——
  [/^未知菜单类型 (.+)$/, {'zh-Hant': '未知的選單類型 {}', en: 'Unknown menu type {}', ja: '不明なメニュー種別 {}'}],
  [/^(.+) 处应为菜单选项名称$/, {'zh-Hant': '{} 處應為選單選項名稱', en: '{} must be a menu option name', ja: '{} にはメニュー項目名が必要です'}],
  [/^(.+) 没有选项 "(.+)"，可选：(.+)$/, {'zh-Hant': '{} 沒有選項 "{}"，可選：{}', en: '{} has no option "{}"; available: {}', ja: '{} に選択肢 "{}" はありません。選択可: {}'}],
  [/^(.+) 处应为名称$/, {'zh-Hant': '{} 處應為名稱', en: '{} must be a name', ja: '{} には名前が必要です'}],
  [/^字段 (.+) 需要名称或文本$/, {'zh-Hant': '欄位 {} 需要名稱或文字', en: 'Field {} needs a name or text', ja: 'フィールド {} には名前かテキストが必要です'}],
  [/^菜单字段名不匹配: (.+) vs (.+)$/, {'zh-Hant': '選單欄位名不符: {} vs {}', en: 'Menu field name mismatch: {} vs {}', ja: 'メニューのフィールド名が一致しません: {} vs {}'}],
  [/^(.+) 处颜色需为 #RRGGBB 形式，实际 "(.+)"$/, {'zh-Hant': '{} 處顏色需為 #RRGGBB 形式，實際 "{}"', en: '{} must be a #RRGGBB color, got "{}"', ja: '{} の色は #RRGGBB 形式が必要です: "{}"'}],
  // —— variables / lists ——
  [/^变量 "(.+)" 重复声明$/, {'zh-Hant': '變數 "{}" 重複宣告', en: 'Variable "{}" is declared twice', ja: '変数 "{}" が重複して宣言されています'}],
  [/^列表 "(.+)" 重复声明$/, {'zh-Hant': '清單 "{}" 重複宣告', en: 'List "{}" is declared twice', ja: 'リスト "{}" が重複して宣言されています'}],
  [/^未声明的变量 "(.+)"$/, {'zh-Hant': '未宣告的變數 "{}"', en: 'Undeclared variable "{}"', ja: '宣言されていない変数 "{}"'}],
  [/^未声明的列表 "(.+)"$/, {'zh-Hant': '未宣告的清單 "{}"', en: 'Undeclared list "{}"', ja: '宣言されていないリスト "{}"'}],
  [/^"(.+)" 是列表，请用列表积木$/, {'zh-Hant': '"{}" 是清單，請用清單積木', en: '"{}" is a list; use a list block', ja: '"{}" はリストです。リスト用ブロックを使ってください'}],
  // —— type checking / operators ——
  [/^不支持的运算符 (.+)$/, {'zh-Hant': '不支援的運算子 {}', en: 'Unsupported operator {}', ja: '未対応の演算子 {}'}],
  [/^条件槽 (.+) 需要布尔\(六边形\)积木，但得到(.+)$/, {'zh-Hant': '條件槽 {} 需要布林（六邊形）積木，但得到{}', en: 'Boolean slot {} needs a hexagonal block, got {}', ja: '真偽スロット {} には六角形ブロックが必要ですが {} でした'}],
  [/^数值槽 (.+) 不能插入布尔积木$/, {'zh-Hant': '數值槽 {} 不能插入布林積木', en: 'Number slot {} cannot take a boolean block', ja: '数値スロット {} に真偽ブロックは入れられません'}],
  [/^文本槽 (.+) 不能插入布尔积木$/, {'zh-Hant': '文字槽 {} 不能插入布林積木', en: 'Text slot {} cannot take a boolean block', ja: 'テキストスロット {} に真偽ブロックは入れられません'}],
  // —— asset name checking (including warnings) ——
  [/^(.+) "(.+)" 没有被 (.+) 语句导入，可选：(.+)$/, {'zh-Hant': '{} "{}" 沒有被 {} 語句匯入，可選：{}', en: '{} "{}" was not imported by a {} statement; available: {}', ja: '{} "{}" は {} 文で読み込まれていません。選択可: {}'}],
  [/^(.+) 没有用 声音 导入素材，"(.+)" 放不出来$/, {'zh-Hant': '{} 沒有用 聲音 匯入素材，"{}" 放不出來', en: '{} imported no sound; "{}" cannot play', ja: '{} は 音 で素材を読み込んでいないため "{}" は鳴りません'}],
  [/^(.+) 没有用 造型 导入素材，工程里只有占位造型 (.+)，没有 "(.+)"$/, {'zh-Hant': '{} 沒有用 造型 匯入素材，專案裡只有佔位造型 {}，沒有 "{}"', en: '{} imported no costume; the project only has the placeholder {} and no "{}"', ja: '{} は コスチューム で素材を読み込んでいません。プロジェクトには仮の {} しかなく "{}" はありません'}],
  // —— internal ——
  [/^内部错误: 未知语句类型 (.+)$/, {'zh-Hant': '內部錯誤: 未知的語句類型 {}', en: 'Internal error: unknown statement type {}', ja: '内部エラー: 不明な文の種類 {}'}],
  [/^内部错误：未知表达式 (.+)$/, {'zh-Hant': '內部錯誤：未知的運算式 {}', en: 'Internal error: unknown expression {}', ja: '内部エラー: 不明な式 {}'}],
  // —— asset loading (build.js / project.js) ——
  [/^(造型|声音)素材找不到文件：(.+)（相对 (.+)）$/, {'zh-Hant': '{}素材找不到檔案：{}（相對於 {}）', en: '{} asset not found: {} (relative to {})', ja: '{}の素材が見つかりません: {}（{} からの相対）'}],
  [/^(造型|声音)素材是目录不是文件：(.+)（相对 (.+)）$/, {'zh-Hant': '{}素材是目錄不是檔案：{}（相對於 {}）', en: '{} asset is a directory, not a file: {} (relative to {})', ja: '{}の素材がフォルダーでありファイルではありません: {}（{} からの相対）'}],
  [/^(造型|声音)素材(.+)：(.+)（相对 (.+)）$/, {'zh-Hant': '{}素材{}：{}（相對於 {}）', en: '{} asset{}: {} (relative to {})', ja: '{}の素材{}: {}（{} からの相対）'}],
  [/^(造型|声音)素材是空文件：(.+)$/, {'zh-Hant': '{}素材是空檔案：{}', en: '{} asset is an empty file: {}', ja: '{}の素材が空のファイルです: {}'}],
  [/^无法识别的素材文件（支持 png\/jpg\/svg）：(.+)$/, {'zh-Hant': '無法識別的素材檔案（支援 png/jpg/svg）：{}', en: 'Unrecognized media file (png/jpg/svg supported): {}', ja: '判別できない素材ファイル（png/jpg/svg 対応）: {}'}],
  [/^(.+) 是音频，不能用 造型\/背景 载入$/, {'zh-Hant': '{} 是音訊，不能用 造型/背景 載入', en: '{} is audio and cannot be loaded as a costume/backdrop', ja: '{} は音声なので コスチューム/背景 としては読み込めません'}],
  [/^暂不支持 jpg 造型（无法稳定取出宽高）：(.+)$/, {'zh-Hant': '暫不支援 jpg 造型（無法穩定取得寬高）：{}', en: 'jpg costumes are not supported yet (size cannot be read reliably): {}', ja: 'jpg のコスチュームは未対応です（サイズを安定して取得できません）: {}'}],
  [/^声音暂只支持 wav（实际识别为 (.+)）：(.+)$/, {'zh-Hant': '聲音暫只支援 wav（實際識別為 {}）：{}', en: 'Only wav sounds are supported (detected {}): {}', ja: '音は wav のみ対応です（判別結果 {}）: {}'}],
  // —— structural self-check (validate.js) ——
  [/^targets 为空$/, {'zh-Hant': 'targets 為空', en: 'targets is empty', ja: 'targets が空です'}],
  [/^targets\[0\] 必须是舞台$/, {'zh-Hant': 'targets[0] 必須是舞台', en: 'targets[0] must be the stage', ja: 'targets[0] はステージでなければなりません'}],
  [/^(.+): 广播 (.+) 的值必须是字符串$/, {'zh-Hant': '{}: 廣播 {} 的值必須是字串', en: '{}: broadcast {} must map to a string', ja: '{}: メッセージ {} の値は文字列でなければなりません'}],
  [/^(.+): (.+) 的 mutation\.argumentids 不是合法 JSON$/, {'zh-Hant': '{}: {} 的 mutation.argumentids 不是合法 JSON', en: '{}: mutation.argumentids of {} is not valid JSON', ja: '{}: {} の mutation.argumentids が正しい JSON ではありません'}],
  [/^(.+): 变量定义格式错误 (.+)$/, {'zh-Hant': '{}: 變數定義格式錯誤 {}', en: '{}: malformed variable definition {}', ja: '{}: 変数の定義が不正です {}'}],
  [/^(.+): 列表定义格式错误 (.+)$/, {'zh-Hant': '{}: 清單定義格式錯誤 {}', en: '{}: malformed list definition {}', ja: '{}: リストの定義が不正です {}'}],
  [/^(.+): 没有造型$/, {'zh-Hant': '{}: 沒有造型', en: '{}: no costumes', ja: '{}: コスチュームがありません'}],
  [/^(.+): sounds 缺失$/, {'zh-Hant': '{}: 缺少 sounds', en: '{}: sounds is missing', ja: '{}: sounds がありません'}],
  [/^(.+): currentCostume 缺失$/, {'zh-Hant': '{}: 缺少 currentCostume', en: '{}: currentCostume is missing', ja: '{}: currentCostume がありません'}],
  [/^(.+): 造型 md5ext 非法 (.+)$/, {'zh-Hant': '{}: 造型 md5ext 不合法 {}', en: '{}: invalid costume md5ext {}', ja: '{}: コスチュームの md5ext が不正 {}'}],
  [/^(.+): 素材文件缺失 (.+)$/, {'zh-Hant': '{}: 素材檔案缺失 {}', en: '{}: missing asset file {}', ja: '{}: 素材ファイルがありません {}'}],
  [/^(.+): (.+) 缺 rotationCenter$/, {'zh-Hant': '{}: {} 缺少 rotationCenter', en: '{}: {} has no rotationCenter', ja: '{}: {} に rotationCenter がありません'}],
  [/^(.+): 声音缺名字$/, {'zh-Hant': '{}: 聲音缺名字', en: '{}: sound has no name', ja: '{}: 音に名前がありません'}],
  [/^(.+): 声音 md5ext 非法 (.+)$/, {'zh-Hant': '{}: 聲音 md5ext 不合法 {}', en: '{}: invalid sound md5ext {}', ja: '{}: 音の md5ext が不正 {}'}],
  [/^(.+): 声音文件缺失 (.+)$/, {'zh-Hant': '{}: 聲音檔案缺失 {}', en: '{}: missing sound file {}', ja: '{}: 音声ファイルがありません {}'}],
  [/^(.+): 声音 (.+) 缺 rate$/, {'zh-Hant': '{}: 聲音 {} 缺少 rate', en: '{}: sound {} has no rate', ja: '{}: 音 {} に rate がありません'}],
  [/^(.+): 声音 (.+) 缺 sampleCount$/, {'zh-Hant': '{}: 聲音 {} 缺少 sampleCount', en: '{}: sound {} has no sampleCount', ja: '{}: 音 {} に sampleCount がありません'}],
  [/^monitor 缺 id$/, {'zh-Hant': 'monitor 缺少 id', en: 'monitor has no id', ja: 'monitor に id がありません'}],
  [/^meta\.semver 缺失$/, {'zh-Hant': '缺少 meta.semver', en: 'meta.semver is missing', ja: 'meta.semver がありません'}],
  [/^(.+): 块 (.+) 无 opcode$/, {'zh-Hant': '{}: 積木 {} 沒有 opcode', en: '{}: block {} has no opcode', ja: '{}: ブロック {} に opcode がありません'}],
  [/^(.+): (.+) 的 next 指向不存在的块 (.+)$/, {'zh-Hant': '{}: {} 的 next 指向不存在的積木 {}', en: '{}: next of {} points at a missing block {}', ja: '{}: {} の next が存在しないブロック {} を指しています'}],
  [/^(.+): 顶层块 (.+) 不应有 parent$/, {'zh-Hant': '{}: 頂層積木 {} 不應有 parent', en: '{}: top-level block {} must not have a parent', ja: '{}: 最上位ブロック {} に parent は不要です'}],
  [/^(.+): 顶层块 (.+) 缺坐标$/, {'zh-Hant': '{}: 頂層積木 {} 缺少座標', en: '{}: top-level block {} has no coordinates', ja: '{}: 最上位ブロック {} に座標がありません'}],
  [/^(.+): 非顶层块 (.+) 没有 parent$/, {'zh-Hant': '{}: 非頂層積木 {} 沒有 parent', en: '{}: non-top-level block {} has no parent', ja: '{}: 最上位でないブロック {} に parent がありません'}],
  [/^(.+): (.+) 的 parent 不存在$/, {'zh-Hant': '{}: {} 的 parent 不存在', en: '{}: parent of {} does not exist', ja: '{}: {} の parent が存在しません'}],
  [/^(.+): (.+) 的 parent (.+) 不存在$/, {'zh-Hant': '{}: {} 的 parent {} 不存在', en: '{}: parent {} of {} does not exist', ja: '{}: {} の parent {} が存在しません'}],
  [/^(.+): (.+)\.(.+) 槽位格式错误$/, {'zh-Hant': '{}: {}.{} 槽位格式錯誤', en: '{}: malformed slot {}.{}', ja: '{}: スロット {}.{} の形式が不正'}],
  [/^(.+): (.+)\.(.+) 槽位类型 (.+) 非法$/, {'zh-Hant': '{}: {}.{} 槽位類型 {} 不合法', en: '{}: invalid slot type {} for {}.{}', ja: '{}: {}.{} のスロット種別 {} が不正'}],
  [/^(.+): (.+)\.(.+) 引用了本角色不存在的块 (.+)$/, {'zh-Hant': '{}: {}.{} 引用了本角色不存在的積木 {}', en: '{}: {}.{} references a block missing from this target {}', ja: '{}: {}.{} がこのターゲットにないブロック {} を参照しています'}],
  [/^(.+): (.+)\.(.+) 的子块 parent 未回指$/, {'zh-Hant': '{}: {}.{} 的子積木 parent 未回指', en: '{}: child of {}.{} does not point its parent back', ja: '{}: {}.{} の子ブロックの parent が戻っていません'}],
  [/^(.+): (.+)\.(.+) 槽位内容类型不明 (.+)$/, {'zh-Hant': '{}: {}.{} 槽位內容型別不明 {}', en: '{}: unknown slot payload type {} in {}.{}', ja: '{}: {}.{} のスロット内容の型が不明 {}'}],
  [/^(.+): (.+) 字段 (.+) 格式错误$/, {'zh-Hant': '{}: {} 欄位 {} 格式錯誤', en: '{}: malformed field {} on {}', ja: '{}: {} のフィールド {} の形式が不正'}],
  [/^(.+): 字段 (.+) 引用未知数据 id (.+)$/, {'zh-Hant': '{}: 欄位 {} 引用未知的資料 id {}', en: '{}: field {} references an unknown data id {}', ja: '{}: フィールド {} が未知のデータ id {} を参照しています'}],
  [/^(.+): (.+) 的 parent 既不在 next 也不在任何槽位$/, {'zh-Hant': '{}: {} 的 parent 既不在 next 也不在任何槽位', en: '{}: parent of {} is neither in next nor in any slot', ja: '{}: {} の parent が next にもどのスロットにもありません'}],
  [/^(.+): (.+)\.(.+) 原始值类型 (.+) 未知$/, {'zh-Hant': '{}: {}.{} 原始值型別 {} 未知', en: '{}: unknown primitive type {} in {}.{}', ja: '{}: {}.{} の原始値型 {} が不明'}],
  [/^(.+): (.+)\.(.+) 变量 id (.+) 未注册$/, {'zh-Hant': '{}: {}.{} 變數 id {} 未註冊', en: '{}: variable id {} in {}.{} is not registered', ja: '{}: {}.{} の変数 id {} が登録されていません'}],
  [/^(.+): (.+)\.(.+) 列表 id (.+) 未注册$/, {'zh-Hant': '{}: {}.{} 清單 id {} 未註冊', en: '{}: list id {} in {}.{} is not registered', ja: '{}: {}.{} のリスト id {} が登録されていません'}],
  [/^(.+): (.+)\.(.+) 广播 id (.+) 未注册$/, {'zh-Hant': '{}: {}.{} 廣播 id {} 未註冊', en: '{}: broadcast id {} in {}.{} is not registered', ja: '{}: {}.{} のメッセージ id {} が登録されていません'}],
  [/^(.+): (.+)\.(.+) 数值原始值应为 number$/, {'zh-Hant': '{}: {}.{} 數值原始值應為 number', en: '{}: numeric primitive in {}.{} must be a number', ja: '{}: {}.{} の数値原始値は number である必要があります'}]
];

const fragOf = (lang, s) => {
  if (s === undefined || s === null) return s;
  const f = FRAG[s];
  return (f && f[lang]) || s;
};

// Translate one Simplified-Chinese message into the target language; return it unchanged when
// there is no matching template (Simplified Chinese is the baseline)
export function translateMessage (lang, text) {
  if (!text || lang === 'zh-Hans') return text;
  const s = String(text);
  const pre = /^\[第 (\d+) 行\] ([\s\S]*)$/.exec(s);
  if (pre) {
    const body = translateMessage(lang, pre[2]);
    return (PREFIX[lang] || PREFIX.en).replace('{}', pre[1]).replace('{}', body);
  }
  for (const [re, tpl] of MSG) {
    const m = re.exec(s);
    if (!m) continue;
    const out = tpl[lang];
    if (!out) return s;
    let i = 0;
    return out.replace(/\{\}/g, () => fragOf(lang, m[++i]));
  }
  return s;
}

/* ============================== exports ============================== */

export function t (key, ...args) {
  const e = UI[key];
  if (!e) return key;
  return fill(e[LANG] !== undefined ? e[LANG] : e.en, args);
}

export function tIn (lang, key, ...args) {
  const l = normalizeLang(lang) || 'en';
  const e = UI[key];
  if (!e) return key;
  return fill(e[l] !== undefined ? e[l] : e.en, args);
}

// The renderer fetches all copy for the current language in one go (including the syntax cheat sheet)
export function uiDict (lang) {
  const l = normalizeLang(lang) || 'en';
  const out = {};
  for (const [k, v] of Object.entries(UI)) out[k] = v[l] !== undefined ? v[l] : v.en;
  out['ref.syntax.text'] = SYNTAX[l] || SYNTAX.en;
  return out;
}

export function langLabel (lang) {
  return LANG_LABELS[normalizeLang(lang) || 'en'];
}

export {UI as UI_STRINGS, SYNTAX as SYNTAX_TEXT};
