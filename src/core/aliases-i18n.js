// 繁體中文 / 日本語 word tables for the pseudocode DSL.
//
// Design principle: aliases are "additive" — all four languages can be used at once, in
// line with the existing zh + en coexistence rule. So here we only append the zhHant / ja
// arrays onto OPS/HATS, never overwrite zh / en; menu options likewise only append
// label→value into MENU_SHADOW[kind].values without touching labels (labels is the
// baseline verifyCatalog compares against the scratch-blocks source; changing it breaks
// the self-check).

export const GROUP_I18N = {
  motion: {'zh-Hant': '運動', en: 'Motion', ja: '動き'},
  looks: {'zh-Hant': '外觀', en: 'Looks', ja: '見た目'},
  sound: {'zh-Hant': '聲音', en: 'Sound', ja: '音'},
  event: {'zh-Hant': '事件', en: 'Events', ja: 'イベント'},
  events: {'zh-Hant': '事件', en: 'Events', ja: 'イベント'},
  control: {'zh-Hant': '控制', en: 'Control', ja: '制御'},
  sensing: {'zh-Hant': '偵測', en: 'Sensing', ja: '調べる'},
  operators: {'zh-Hant': '運算', en: 'Operators', ja: '演算'},
  data: {'zh-Hant': '變數與清單', en: 'Variables', ja: '変数とリスト'},
  procedures: {'zh-Hant': '自訂積木', en: 'My Blocks', ja: '自作ブロック'},
  pen: {'zh-Hant': '畫筆', en: 'Pen', ja: 'ペン'},
  music: {'zh-Hant': '音樂', en: 'Music', ja: '音楽'},
  stretch: {'zh-Hant': 'Stretch', en: 'Stretch', ja: 'Stretch'}
};

// Shape labels (帽子/hat, 执行/stack, C形/C-block, 报值/reporter, 布尔/boolean)
export const KIND_I18N = {
  帽子: {'zh-Hant': '帽子', en: 'Hat', ja: 'ハット'},
  执行: {'zh-Hant': '執行', en: 'Stack', ja: 'スタック'},
  C形: {'zh-Hant': 'C 形', en: 'C-block', ja: 'C ブロック'},
  报值: {'zh-Hant': '報值', en: 'Reporter', ja: '値'},
  布尔: {'zh-Hant': '布林', en: 'Boolean', ja: '真偽'}
};

// op → {zhHant: [...], ja: [...]}
export const ALIAS_I18N = {
  // ---- motion ----
  motion_movesteps: {zhHant: ['移動步', '移動'], ja: ['歩動かす', '歩く']},
  motion_gotoxy: {zhHant: ['移到座標'], ja: ['座標へ移動', '座標に行く']},
  motion_glidesecstoxy: {zhHant: ['滑行到'], ja: ['秒で座標へ滑る', '滑る']},
  motion_changexby: {zhHant: ['x增加'], ja: ['xを増やす', 'x座標を増やす']},
  motion_changeyby: {zhHant: ['y增加'], ja: ['yを増やす', 'y座標を増やす']},
  motion_setx: {zhHant: ['x設為'], ja: ['xにする', 'x座標にする']},
  motion_sety: {zhHant: ['y設為'], ja: ['yにする', 'y座標にする']},
  motion_turnright: {zhHant: ['右轉'], ja: ['右に回す', '右回り']},
  motion_turnleft: {zhHant: ['左轉'], ja: ['左に回す', '左回り']},
  motion_pointindirection: {zhHant: ['指向'], ja: ['向きにする', '方向を向く']},
  motion_pointtowards: {zhHant: ['面向'], ja: ['の方へ向く', '向く']},
  motion_goto: {zhHant: ['移到對象'], ja: ['へ移動', '対象へ移動']},
  motion_glideto: {zhHant: ['滑行到對象'], ja: ['へ滑る', '対象へ滑る']},
  motion_setrotationstyle: {zhHant: ['旋轉方式'], ja: ['回転方法']},
  motion_align_scene: {zhHant: ['場景對齊'], ja: ['シーン整列', '画面整列']},
  motion_scroll_right: {zhHant: ['鏡頭橫移'], ja: ['横スクロール', 'カメラ横移動']},
  motion_scroll_up: {zhHant: ['鏡頭縱移'], ja: ['縦スクロール', 'カメラ縦移動']},
  motion_xscroll: {zhHant: ['鏡頭x'], ja: ['xスクロール', 'カメラx']},
  motion_yscroll: {zhHant: ['鏡頭y'], ja: ['yスクロール', 'カメラy']},
  motion_ifonedgebounce: {zhHant: ['碰到邊緣就反彈'], ja: ['端に触れたら跳ね返る', '跳ね返る']},
  motion_xposition: {zhHant: ['x座標'], ja: ['x座標']},
  motion_yposition: {zhHant: ['y座標'], ja: ['y座標']},
  motion_direction: {zhHant: ['方向'], ja: ['向き']},

  // ---- looks ----
  looks_show: {zhHant: ['顯示'], ja: ['表示する', '表示']},
  looks_hide: {zhHant: ['隱藏'], ja: ['隠す']},
  looks_say: {zhHant: ['說'], ja: ['言う']},
  looks_sayforsecs: {zhHant: ['說等待'], ja: ['秒言う', '言って待つ']},
  looks_think: {zhHant: ['思考'], ja: ['考える']},
  looks_setsizeto: {zhHant: ['大小設為'], ja: ['大きさにする']},
  looks_changesizeby: {zhHant: ['大小增加'], ja: ['大きさを増やす', '大きさを変える']},
  looks_nextcostume: {zhHant: ['下一個造型'], ja: ['次のコスチューム']},
  looks_switchcostumeto: {zhHant: ['換成造型'], ja: ['コスチュームにする', 'コスチュームを変える']},
  looks_nextbackdrop: {zhHant: ['下一個背景'], ja: ['次の背景']},
  looks_switchbackdropto: {zhHant: ['換成背景'], ja: ['背景にする']},
  looks_switchbackdroptoandwait: {zhHant: ['換成背景並等待'], ja: ['背景にして待つ']},
  looks_size: {zhHant: ['大小'], ja: ['大きさ']},
  looks_cleargraphiceffects: {zhHant: ['清除圖形特效'], ja: ['画像効果をなくす', '図形効果を消す']},
  looks_thinkforsecs: {zhHant: ['思考等待'], ja: ['秒考える', '考えて待つ']},
  looks_hideallsprites: {zhHant: ['隱藏全部'], ja: ['すべてのスプライトを隠す']},
  looks_gotofrontback: {zhHant: ['圖層位置'], ja: ['重ね順', 'レイヤー位置']},
  looks_goforwardbackwardlayers: {zhHant: ['移動層級'], ja: ['層を移動', 'レイヤーを移動']},
  looks_costumenumbername: {zhHant: ['造型資訊'], ja: ['コスチュームの情報', 'コスチューム情報']},
  looks_backdropnumbername: {zhHant: ['背景資訊'], ja: ['背景の情報', '背景情報']},
  looks_seteffectto: {zhHant: ['特效設為'], ja: ['効果を設定', '画像効果を設定']},
  looks_changeeffectby: {zhHant: ['特效增加'], ja: ['効果を変える', '画像効果を変える']},
  // 「伸縮にする / 伸縮を変える」 is reserved for the Stretch extension's stretch_setStretch /
  // stretch_changeStretch; here the wording with 「設定」 is used to tell them apart
  // (verifyCatalog catches the duplicate name).
  looks_setstretchto: {zhHant: ['伸縮設為'], ja: ['伸縮を設定']},
  looks_changestretchby: {zhHant: ['伸縮增加'], ja: ['伸縮を増やす']},

  // ---- sound ----
  sound_play: {zhHant: ['播放聲音'], ja: ['音を鳴らす', '演奏する']},
  sound_playuntildone: {zhHant: ['播放聲音並等待'], ja: ['音が終わるまで待つ', '音を鳴らして待つ']},
  sound_stopallsounds: {zhHant: ['停止全部聲音'], ja: ['すべての音を止める']},
  sound_setvolto: {zhHant: ['音量設為'], ja: ['音量にする']},
  sound_changevolumeby: {zhHant: ['音量增加'], ja: ['音量を変える', '音量を増やす']},
  sound_volume: {zhHant: ['音量'], ja: ['音量']},
  sound_seteffectto: {zhHant: ['音效設為'], ja: ['音の効果を設定', '音効果を設定']},
  sound_changeeffectby: {zhHant: ['音效增加'], ja: ['音の効果を変える', '音効果を変える']},
  sound_cleareffects: {zhHant: ['清除音效'], ja: ['音の効果をなくす', '音効果を消す']},

  // ---- control ----
  control_wait: {zhHant: ['等待'], ja: ['秒待つ', '待つ']},
  control_waituntil: {zhHant: ['等待直到'], ja: ['まで待つ']},
  control_repeat: {zhHant: ['重複'], ja: ['回繰り返す', '繰り返す']},
  control_while: {zhHant: ['當滿足'], ja: ['の間繰り返す', '条件の間']},
  control_forever_each: {zhHant: ['迴圈計數', '對於每個'], ja: ['各要素で繰り返す', 'カウント繰り返し']},
  control_all_at_once: {zhHant: ['並行執行', '同時執行'], ja: ['一斉に実行', 'まとめて実行']},
  control_get_counter: {zhHant: ['計數器'], ja: ['カウンター']},
  control_incr_counter: {zhHant: ['計數器增加'], ja: ['カウンターを増やす']},
  control_clear_counter: {zhHant: ['計數器清零'], ja: ['カウンターをリセット', 'カウンターを0にする']},
  control_forever: {zhHant: ['重複永遠', '永遠'], ja: ['ずっと']},
  control_repeat_until: {zhHant: ['重複直到'], ja: ['まで繰り返す']},
  control_if: {zhHant: ['如果', '若'], ja: ['もし']},
  control_if_else: {zhHant: ['如果否則'], ja: ['もしそうでなければ']},
  control_stop: {zhHant: ['停止'], ja: ['止める', '停止する']},
  control_create_clone_of: {zhHant: ['複製'], ja: ['クローンを作る', 'クローンする']},
  clone_self: {zhHant: ['複製自己'], ja: ['自分のクローン']},
  control_delete_this_clone: {zhHant: ['刪除複製體'], ja: ['このクローンを削除']},
  control_start_as_clone: {zhHant: ['當作為複製體啟動時', '複製開始'], ja: ['クローンされたとき', 'クローン開始']},

  // ---- event ----
  event_broadcast: {zhHant: ['廣播'], ja: ['知らせる', 'メッセージを送る']},
  event_broadcastandwait: {zhHant: ['廣播並等待'], ja: ['知らせて待つ', 'メッセージを送って待つ']},

  // ---- sensing ----
  sensing_resettimer: {zhHant: ['重置計時器'], ja: ['タイマーをリセット']},
  sensing_loudness: {zhHant: ['響度'], ja: ['マイクの大きさ', 'マイク音量']},
  sensing_username: {zhHant: ['使用者名稱', '用戶名'], ja: ['ユーザー名']},
  sensing_dayssince2000: {zhHant: ['2000年以來的天數'], ja: ['2000年からの日数']},
  sensing_current: {zhHant: ['目前的', '當前時間'], ja: ['現在の']},
  sensing_coloristouchingcolor: {zhHant: ['顏色碰到顏色'], ja: ['色が色に触れた']},
  sensing_loud: {zhHant: ['很吵'], ja: ['音が大きい', '大きな音']},
  sensing_userid: {zhHant: ['使用者ID', '用戶ID'], ja: ['ユーザーID']},
  sensing_setdragmode: {zhHant: ['拖曳模式'], ja: ['ドラッグモード']},
  sensing_askandwait: {zhHant: ['詢問'], ja: ['聞く', '質問する']},
  sensing_timer: {zhHant: ['計時器'], ja: ['タイマー']},
  sensing_answer: {zhHant: ['答案'], ja: ['答え']},
  sensing_mousedown: {zhHant: ['滑鼠按下'], ja: ['マウスが押された']},
  sensing_mousex: {zhHant: ['滑鼠x'], ja: ['マウスのx座標']},
  sensing_mousey: {zhHant: ['滑鼠y'], ja: ['マウスのy座標']},
  sensing_keypressed: {zhHant: ['按鍵按下', '按鍵'], ja: ['キーが押された']},
  sensing_touchingobject: {zhHant: ['碰到'], ja: ['に触れた', '触れた']},
  sensing_touchingcolor: {zhHant: ['碰到顏色'], ja: ['色に触れた']},
  sensing_distanceto: {zhHant: ['距離'], ja: ['までの距離', '距離']},
  sensing_online: {zhHant: ['線上', '聯網'], ja: ['オンライン']},

  // ---- data ----
  data_showvariable: {zhHant: ['顯示變數'], ja: ['変数を表示する', '変数を表示']},
  data_hidevariable: {zhHant: ['隱藏變數'], ja: ['変数を隠す']},
  data_showlist: {zhHant: ['顯示清單'], ja: ['リストを表示する', 'リストを表示']},
  data_hidelist: {zhHant: ['隱藏清單'], ja: ['リストを隠す']},
  data_addtolist: {zhHant: ['加入清單'], ja: ['リストに追加する', 'リストに追加']},
  data_deleteoflist: {zhHant: ['刪除清單第項'], ja: ['番目をリストから削除', 'リストの項目を削除']},
  data_deletealloflist: {zhHant: ['清空清單'], ja: ['リストを空にする', 'リストを全部削除']},
  data_insertatlist: {zhHant: ['插入清單'], ja: ['番目に挿入', 'リストに挿入']},
  data_replaceitemoflist: {zhHant: ['替換清單'], ja: ['番目を置き換える', 'リストを置換']},
  data_lengthoflist: {zhHant: ['清單長度'], ja: ['リストの長さ']},
  data_itemoflist: {zhHant: ['清單第項'], ja: ['番目の項目', 'リストの項目']},
  data_listcontents: {zhHant: ['清單內容'], ja: ['リストの中身', 'リストの内容']},
  data_itemnumoflist: {zhHant: ['清單項位置'], ja: ['項目の番号', 'リストの番号']},
  data_listcontainsitem: {zhHant: ['清單包含'], ja: ['リストに含む', 'リストに含まれる']},

  // ---- operators ----
  operator_length: {zhHant: ['長度'], ja: ['文字数', '長さ']},
  operator_letter_of: {zhHant: ['字元'], ja: ['番目の文字', '文字']},
  operator_join: {zhHant: ['連接'], ja: ['と結合', '結合']},
  operator_contains: {zhHant: ['文字包含'], ja: ['を含む', '含む']},
  operator_mod: {zhHant: ['取餘'], ja: ['余り', '剰余']},
  operator_round: {zhHant: ['取整', '四捨五入'], ja: ['四捨五入', '丸める']},
  operator_mathop: {zhHant: ['數學'], ja: ['数学関数', '計算']},
  operator_random: {zhHant: ['隨機'], ja: ['乱数', 'ランダム']},
  operator_not: {zhHant: ['非'], ja: ['ではない', '否定']},
  operator_and: {zhHant: ['與'], ja: ['かつ']},
  operator_or: {zhHant: ['或'], ja: ['または']},

  // ---- pen ----
  pen_penDown: {zhHant: ['落筆', '下筆'], ja: ['ペンを下ろす', '下ろす']},
  pen_penUp: {zhHant: ['抬筆', '上筆'], ja: ['ペンを上げる', '上げる']},
  pen_clear: {zhHant: ['清空畫筆'], ja: ['全部消す', 'ペンを消す']},
  pen_stamp: {zhHant: ['圖章'], ja: ['スタンプ']},
  pen_setPenSizeTo: {zhHant: ['畫筆大小設為'], ja: ['ペンの太さにする', 'ペンサイズを設定']},
  pen_changePenSizeBy: {zhHant: ['畫筆大小增加'], ja: ['ペンの太さを変える', 'ペンサイズを増やす']},
  pen_setPenColorToColor: {zhHant: ['畫筆顏色設為'], ja: ['ペンの色にする', 'ペンの色を設定']},
  pen_setPenHueToNumber: {zhHant: ['畫筆色相設為'], ja: ['ペンの色相にする']},
  pen_changePenHueBy: {zhHant: ['畫筆色相增加'], ja: ['ペンの色相を変える']},
  pen_setPenShadeToNumber: {zhHant: ['畫筆亮度設為'], ja: ['ペンの明るさにする', 'ペンの輝度を設定']},
  pen_changePenShadeBy: {zhHant: ['畫筆亮度增加'], ja: ['ペンの明るさを変える']},

  // ---- Stretch ----
  stretch_setStretchX: {zhHant: ['橫向拉伸設為', '拉伸x設為'], ja: ['横伸縮にする', 'x伸縮を設定']},
  stretch_setStretchY: {zhHant: ['縱向拉伸設為', '拉伸y設為'], ja: ['縦伸縮にする', 'y伸縮を設定']},
  stretch_setStretch: {zhHant: ['拉伸設為'], ja: ['伸縮にする']},
  stretch_changeStretch: {zhHant: ['拉伸增加'], ja: ['伸縮を変える']},
  stretch_changeStretchX: {zhHant: ['橫向拉伸增加'], ja: ['横伸縮を変える']},
  stretch_changeStretchY: {zhHant: ['縱向拉伸增加'], ja: ['縦伸縮を変える']},
  stretch_getX: {zhHant: ['橫向拉伸', '拉伸x'], ja: ['横伸縮', 'x伸縮']},
  stretch_getY: {zhHant: ['縱向拉伸', '拉伸y'], ja: ['縦伸縮', 'y伸縮']},

  // ---- music ----
  music_playNoteForBeats: {zhHant: ['播放音符', '彈奏'], ja: ['音符を鳴らす', '演奏']},
  music_playDrumForBeats: {zhHant: ['擊鼓', '敲鼓', '擊打'], ja: ['ドラムを鳴らす', '太鼓']},
  music_setInstrument: {zhHant: ['樂器設為', '換樂器'], ja: ['楽器にする', '楽器を設定']},
  music_restForBeats: {zhHant: ['休止', '休息'], ja: ['休符', '休む']},
  music_setTempo: {zhHant: ['節拍速度設為'], ja: ['テンポにする', 'テンポを設定']},
  music_changeTempo: {zhHant: ['節拍速度增加'], ja: ['テンポを変える']},
  music_getTempo: {zhHant: ['節拍速度'], ja: ['テンポ']},
  music_midiSetInstrument: {zhHant: ['樂器編號設為'], ja: ['MIDI楽器にする', '楽器番号を設定']}
};

// Aliases for HATS
export const HAT_ALIAS_I18N = {
  event_whenflagclicked: {zhHant: ['當綠旗被點擊', '綠旗'], ja: ['緑の旗がクリックされたとき', '緑の旗']},
  event_whenbroadcastreceived: {zhHant: ['當收到'], ja: ['を受け取ったとき', 'メッセージを受け取ったとき']},
  event_whenkeypressed: {zhHant: ['當按鍵按下', '當按鍵', '按鍵'], ja: ['キーが押されたとき', 'キー']},
  event_whenthisspriteclicked: {zhHant: ['當角色被點擊'], ja: ['このスプライトがクリックされたとき', 'スプライトをクリック']},
  event_whenstageclicked: {zhHant: ['當舞台被點擊'], ja: ['ステージがクリックされたとき', 'ステージをクリック']},
  event_whenbackdropswitchesto: {zhHant: ['當背景換成'], ja: ['背景が切り替わったとき', '背景が変わったとき']},
  event_whengreaterthan: {zhHant: ['當大於'], ja: ['が大きくなったとき', 'より大きくなったとき']},
  event_whentouchingobject: {zhHant: ['當碰到'], ja: ['に触れたとき', '触れたとき']}
};

// Structural keywords (角色/sprite, 舞台/stage, 变量/variable, 列表/list, 定义/def,
// 不刷新/warp, 否则/else, 造型/costume, …), appended to the sets in compiler.js
export const KEYWORDS_I18N = {
  head: ['スプライト', 'ステージ'],
  var: ['變數', '區域', '私有', '変数', 'ローカル', 'プライベート'],
  global: ['全域', '全域變數', 'グローバル'],
  list: ['清單', 'リスト'],
  def: ['定義'],
  warp: ['不刷新', '不刷新螢幕', '無刷新', 'ワープ', 'リフレッシュなし'],
  else: ['否則', 'でなければ', 'そうでなければ'],
  returnish: ['返回', '返す'],
  assets: {
    造型: 'costume', 聲音: 'sound', コスチューム: 'costume', 音: 'sound'
  }
};

// Menu options: kind → language → {label: value}
export const MENU_I18N = {
  stop: {
    'zh-Hant': {'全部': 'all', '此腳本': 'this script', '其他腳本': 'other scripts in sprite'},
    ja: {'すべて': 'all', 'このスクリプト': 'this script', '他のスクリプト': 'other scripts in sprite'}
  },
  clone: {'zh-Hant': {'自己': '_myself_'}, ja: {'自分': '_myself_'}},
  touching: {
    'zh-Hant': {'滑鼠指標': '_mouse_', '邊緣': '_edge_'},
    ja: {'マウスポインター': '_mouse_', '端': '_edge_'}
  },
  sprite: {'zh-Hant': {'滑鼠指標': '_mouse_'}, ja: {'マウスポインター': '_mouse_'}},
  towards: {
    'zh-Hant': {'滑鼠指標': '_mouse_', '隨機位置': '_random_'},
    ja: {'マウスポインター': '_mouse_', 'ランダムな場所': '_random_'}
  },
  destination: {
    'zh-Hant': {'滑鼠指標': '_mouse_', '隨機位置': '_random_'},
    ja: {'マウスポインター': '_mouse_', 'ランダムな場所': '_random_'}
  },
  glideto: {
    'zh-Hant': {'滑鼠指標': '_mouse_', '隨機位置': '_random_'},
    ja: {'マウスポインター': '_mouse_', 'ランダムな場所': '_random_'}
  },
  current: {
    'zh-Hant': {'計時器': 'TIMER', '音量': 'LOUDNESS'},
    ja: {'タイマー': 'TIMER', 'マイクの大きさ': 'LOUDNESS'}
  },
  touchinghat: {
    'zh-Hant': {'滑鼠指標': '_mouse_', '邊緣': '_edge_'},
    ja: {'マウスポインター': '_mouse_', '端': '_edge_'}
  },
  key: {
    'zh-Hant': {'空格': 'space', '任意': 'any', '上': 'up arrow', '下': 'down arrow', '左': 'left arrow', '右': 'right arrow'},
    ja: {'スペース': 'space', 'どれかのキー': 'any', '上向き矢印': 'up arrow', '下向き矢印': 'down arrow', '左向き矢印': 'left arrow', '右向き矢印': 'right arrow'}
  },
  listindexall: {'zh-Hant': {'末尾': 'last', '全部': 'all'}, ja: {'末尾': 'last', 'すべて': 'all'}},
  listindexrandom: {'zh-Hant': {'末尾': 'last', '隨機': 'random'}, ja: {'末尾': 'last', 'ランダム': 'random'}},
  // The menus below are built by staticMenu(); in the source the notation is {value: label},
  // while here everything is turned into {label: value} to stay consistent with the dynamic
  // menus (stop/clone/touching…).
  mathop: {
    'zh-Hant': {'絕對值': 'abs', '向下取整': 'floor', '向上取整': 'ceiling', '平方根': 'sqrt', '自然對數': 'ln', 'e的冪': 'e ^', '10的冪': '10 ^'},
    ja: {'絶対値': 'abs', '切り捨て': 'floor', '切り上げ': 'ceiling', '平方根': 'sqrt', '自然対数': 'ln', 'eの累乗': 'e ^', '10の累乗': '10 ^'}
  },
  frontback: {'zh-Hant': {'最前': 'front', '最後': 'back'}, ja: {'最前面': 'front', '最背面': 'back'}},
  forwardback: {'zh-Hant': {'前': 'forward', '後': 'backward'}, ja: {'前': 'forward', '後ろ': 'backward'}},
  numbername: {'zh-Hant': {'編號': 'number', '名稱': 'name'}, ja: {'番号': 'number', '名前': 'name'}},
  currentmenu: {
    'zh-Hant': {'年': 'YEAR', '月': 'MONTH', '日': 'DATE', '星期': 'DAYOFWEEK', '時': 'HOUR', '分': 'MINUTE', '秒': 'SECOND'},
    ja: {'年': 'YEAR', '月': 'MONTH', '日': 'DATE', '曜日': 'DAYOFWEEK', '時': 'HOUR', '分': 'MINUTE', '秒': 'SECOND'}
  },
  dragmode: {
    'zh-Hant': {'允許拖曳': 'draggable', '禁止拖曳': 'not draggable'},
    ja: {'ドラッグできる': 'draggable', 'ドラッグできない': 'not draggable'}
  },
  effect: {
    'zh-Hant': {'顏色': 'COLOR', '魚眼': 'FISHEYE', '漩渦': 'WHIRL', '像素化': 'PIXELATE', '馬賽克': 'MOSAIC', '亮度': 'BRIGHTNESS', '虛像': 'GHOST'},
    ja: {'色': 'COLOR', '魚眼': 'FISHEYE', '渦巻き': 'WHIRL', 'ピクセル化': 'PIXELATE', 'モザイク': 'MOSAIC', '明るさ': 'BRIGHTNESS', '幽霊': 'GHOST'}
  },
  soundeffect: {'zh-Hant': {'音調': 'PITCH', '左右平衡': 'PAN'}, ja: {'ピッチ': 'PITCH', '左右バランス': 'PAN'}},
  rotation: {
    'zh-Hant': {'左右翻轉': 'left-right', '不可旋轉': "don't rotate", '任意旋轉': 'all around'},
    ja: {'左右のみ': 'left-right', '回転しない': "don't rotate", '自由に回転': 'all around'}
  },
  alignment: {
    'zh-Hant': {'左下角': 'bottom-left', '右下角': 'bottom-right', '中間': 'middle', '左上角': 'top-left', '右上角': 'top-right'},
    ja: {'左下': 'bottom-left', '右下': 'bottom-right', '中央': 'middle', '左上': 'top-left', '右上': 'top-right'}
  },
  drum: {
    'zh-Hant': {'小軍鼓': '1', '低音鼓': '2', '敲鼓邊': '3', '碎音鈸': '4', '開擊踩鑔': '5', '閉擊踩鑔': '6', '鈴鼓': '7', '手掌': '8', '音棒': '9', '木魚': '10', '牛鈴': '11', '三角鐵': '12', '邦戈鼓': '13', '康加鼓': '14', '卡巴薩': '15', '刮瓜': '16', '顫音器': '17', '鋸加鼓': '18'},
    ja: {'スネアドラム': '1', 'バスドラム': '2', 'サイドスティック': '3', 'クラッシュシンバル': '4', 'オープンハイハット': '5', 'クローズドハイハット': '6', 'タンバリン': '7', '手拍子': '8', 'クラベス': '9', 'ウッドブロック': '10', 'カウベル': '11', 'トライアングル': '12', 'ボンゴ': '13', 'コンガ': '14', 'カバサ': '15', 'ギロ': '16', 'ビブラスラップ': '17', 'クイーカ': '18'}
  },
  instrument: {
    'zh-Hant': {'鋼琴': '1', '電鋼琴': '2', '風琴': '3', '吉他': '4', '電吉他': '5', '貝斯': '6', '撥弦': '7', '大提琴': '8', '長號': '9', '單簧管': '10', '薩克斯管': '11', '長笛': '12', '木長笛': '13', '巴松管': '14', '唱詩班': '15', '顫音琴': '16', '八音盒': '17', '鋼鼓': '18', '馬林巴琴': '19', '合成主音': '20', '合成柔音': '21'},
    ja: {'ピアノ': '1', '電子ピアノ': '2', 'オルガン': '3', 'ギター': '4', 'エレキギター': '5', 'ベース': '6', 'ピチカート': '7', 'チェロ': '8', 'トロンボーン': '9', 'クラリネット': '10', 'サックス': '11', 'フルート': '12', '木製フルート': '13', 'バスーン': '14', '合唱': '15', 'ビブラフォン': '16', 'オルゴール': '17', 'スチールドラム': '18', 'マリンバ': '19', 'シンセリード': '20', 'シンセパッド': '21'}
  }
};

// English menu labels.
// Menus built by staticMenu() already register the source's English text as valid values
// (last/all/random…), but the menus whose "options are only known at runtime"
// (碰到/touching, 面向/towards, 克隆/clone, 计时器/timer…) originally had only Chinese labels, so
// English pseudocode could not say edge / mouse-pointer; this fills the gap.
const KEY_EN = {space: 'space', any: 'any', 'up arrow': 'up arrow', 'down arrow': 'down arrow', 'left arrow': 'left arrow', 'right arrow': 'right arrow'};
for (const ch of 'abcdefghijklmnopqrstuvwxyz0123456789') KEY_EN[ch] = ch;

export const MENU_I18N_EN = {
  stop: {all: 'all', 'this script': 'this script', 'other scripts in sprite': 'other scripts in sprite'},
  clone: {myself: '_myself_'},
  touching: {'mouse-pointer': '_mouse_', edge: '_edge_'},
  sprite: {'mouse-pointer': '_mouse_'},
  towards: {'mouse-pointer': '_mouse_', 'random position': '_random_'},
  destination: {'mouse-pointer': '_mouse_', 'random position': '_random_'},
  glideto: {'mouse-pointer': '_mouse_', 'random position': '_random_'},
  current: {timer: 'TIMER', loudness: 'LOUDNESS'},
  touchinghat: {'mouse-pointer': '_mouse_', edge: '_edge_'},
  key: KEY_EN,
  listindexall: {last: 'last', all: 'all'},
  listindexrandom: {last: 'last', random: 'random'}
};

// Merge the tables above into OPS / HATS / MENU_SHADOW.
// Append only: zh / en / labels are never touched, so verifyCatalog's baseline is unaffected.
export function augmentCatalog (OPS, HATS, MENU_SHADOW) {
  // Do not register an alias twice within one op: words that look the same in Traditional and
  // Simplified Chinese (方向/direction, 大小/size, 停止/stop, 音量/volume, 碰到/touching…) are
  // not inserted again, which both avoids verifyCatalog reporting a "self-conflict" and keeps
  // the index cleaner.
  const addAliases = (spec, extra) => {
    for (const lang of ['zhHant', 'ja']) {
      const list = extra[lang];
      if (!list || !list.length) continue;
      const seen = new Set([...(spec.zh || []), ...(spec.zhHant || []), ...(spec.en || []), ...(spec.ja || [])]);
      const fresh = list.filter(a => !seen.has(a));
      if (fresh.length) spec[lang] = [...(spec[lang] || []), ...fresh];
    }
  };
  for (const [op, extra] of Object.entries(ALIAS_I18N)) if (OPS[op]) addAliases(OPS[op], extra);
  for (const [op, extra] of Object.entries(HAT_ALIAS_I18N)) if (HATS[op]) addAliases(HATS[op], extra);
  const mergeMenu = (kind, lang, table) => {
    const menu = MENU_SHADOW[kind];
    if (!menu || !table) return;
    menu.values = menu.values || {};
    menu.i18n = menu.i18n || {};
    menu.i18n[lang] = {...(menu.i18n[lang] || {}), ...table};
    for (const [label, value] of Object.entries(table)) menu.values[label] = value;
  };
  for (const [kind, byLang] of Object.entries(MENU_I18N)) {
    for (const [lang, table] of Object.entries(byLang)) mergeMenu(kind, lang, table);
  }
  for (const [kind, table] of Object.entries(MENU_I18N_EN)) mergeMenu(kind, 'en', table);
}

// Display labels for a menu in a given language (falls back to the Simplified-Chinese labels when none are registered)
export function menuLabelsFor (menu, lang) {
  if (menu && menu.i18n && menu.i18n[lang] && Object.keys(menu.i18n[lang]).length) {
    return Object.keys(menu.i18n[lang]);
  }
  return (menu && menu.labels) || [];
}

export const groupLabel = (group, lang) => {
  const e = GROUP_I18N[group];
  return (e && e[lang]) || e && e.en || group;
};
export const kindLabel = (kind, lang) => {
  const e = KIND_I18N[kind];
  return (e && e[lang]) || e && e.en || kind;
};
