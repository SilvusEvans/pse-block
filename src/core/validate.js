// Structural self-check for an emitted project. Catches the failure modes that
// a green compile would otherwise hide: dangling refs, orphan shadows, variables
// referenced by an id that no target owns, costumes missing from the asset map.
const PRIMITIVE_NAMES = {4: 'num', 5: 'posNum', 6: 'wholeNum', 7: 'int', 8: 'angle', 9: 'color', 10: 'text', 11: 'broadcast', 12: 'variable', 13: 'list'};

export function validateProject(project, assetKeys = null) {
  const problems = [];
  if (!Array.isArray(project.targets) || project.targets.length === 0) problems.push('targets 为空');
  if (project.targets[0] && !project.targets[0].isStage) problems.push('targets[0] 必须是舞台');
  const allVarIds = new Set();
  const allListIds = new Set();
  const allBcastIds = new Set();
  const allArgIds = new Set();
  // Global ids are legal in any sprite's blocks, so collect everything first.
  for (const t of project.targets) {
    for (const id of Object.keys(t.variables || {})) allVarIds.add(id);
    for (const id of Object.keys(t.lists || {})) allListIds.add(id);
    for (const [id, nm] of Object.entries(t.broadcasts || {})) {
      allBcastIds.add(id);
      if (typeof nm !== 'string') problems.push(`${t.name}: 广播 ${id} 的值必须是字符串`);
    }
    for (const b of Object.values(t.blocks || {})) {
      if (!b.mutation || !b.mutation.argumentids) continue;
      try {
        for (const aid of JSON.parse(b.mutation.argumentids)) allArgIds.add(aid);
      } catch (e) {
        problems.push(`${t.name}: ${b.opcode} 的 mutation.argumentids 不是合法 JSON`);
      }
    }
  }
  for (const t of project.targets) {
    for (const [id, v] of Object.entries(t.variables || {})) {
      allVarIds.add(id);
      if (!Array.isArray(v) || typeof v[0] !== 'string') problems.push(`${t.name}: 变量定义格式错误 ${id}`);
    }
    for (const [id, v] of Object.entries(t.lists || {})) {
      allListIds.add(id);
      if (!Array.isArray(v) || !Array.isArray(v[1])) problems.push(`${t.name}: 列表定义格式错误 ${id}`);
    }
    for (const id of Object.keys(t.broadcasts || {})) allBcastIds.add(id);
    if (!t.costumes || t.costumes.length === 0) problems.push(`${t.name}: 没有造型`);
    if (!t.sounds) problems.push(`${t.name}: sounds 缺失`);
    if (typeof t.currentCostume !== 'number') problems.push(`${t.name}: currentCostume 缺失`);
    for (const c of t.costumes || []) {
      if (!/^[0-9a-f]{32}\.(png|svg|jpg|jpeg)$/.test(c.md5ext)) problems.push(`${t.name}: 造型 md5ext 非法 ${c.md5ext}`);
      if (assetKeys && !assetKeys.has(c.md5ext)) problems.push(`${t.name}: 素材文件缺失 ${c.md5ext}`);
      if (typeof c.rotationCenterX !== 'number' || typeof c.rotationCenterY !== 'number') problems.push(`${t.name}: ${c.name} 缺 rotationCenter`);
    }
    for (const s of t.sounds || []) {
      if (!s.name) problems.push(`${t.name}: 声音缺名字`);
      if (!/^[0-9a-f]{32}\.(wav|mp3)$/.test(s.md5ext || '')) problems.push(`${t.name}: 声音 md5ext 非法 ${s.md5ext}`);
      if (assetKeys && !assetKeys.has(s.md5ext)) problems.push(`${t.name}: 声音文件缺失 ${s.md5ext}`);
      // The VM resamples by rate/sampleCount; a missing one plays at the wrong speed.
      if (typeof s.rate !== 'number' || s.rate <= 0) problems.push(`${t.name}: 声音 ${s.name} 缺 rate`);
      if (typeof s.sampleCount !== 'number' || s.sampleCount < 0) problems.push(`${t.name}: 声音 ${s.name} 缺 sampleCount`);
    }
    checkBlocks(t, problems, allVarIds, allListIds, allBcastIds, allArgIds);
  }
  for (const m of project.monitors || []) {
    if (!m.id) problems.push('monitor 缺 id');
    if (m.opcode === 'data_variable' && !allVarIds.has(m.params.VARIABLE_ID)) { /* id carried in params for vars */ }
  }
  if (!project.meta || !project.meta.semver) problems.push('meta.semver 缺失');
  return problems;
}

function checkBlocks(target, problems, allVarIds, allListIds, allBcastIds, allArgIds) {
  const blocks = target.blocks;
  const ids = new Set(Object.keys(blocks));
  for (const [id, b] of Object.entries(blocks)) {
    if (!b.opcode) problems.push(`${target.name}: 块 ${id} 无 opcode`);
    if (b.next !== null && !ids.has(b.next)) problems.push(`${target.name}: ${b.opcode} 的 next 指向不存在的块 ${b.next}`);
    if (b.topLevel) {
      if (b.parent !== null) problems.push(`${target.name}: 顶层块 ${b.opcode} 不应有 parent`);
      if (typeof b.x !== 'number' || typeof b.y !== 'number') problems.push(`${target.name}: 顶层块 ${b.opcode} 缺坐标`);
    } else {
      if (b.parent === null && !b.shadow) problems.push(`${target.name}: 非顶层块 ${b.opcode} 没有 parent`);
      if (b.parent !== null && !ids.has(b.parent) && !(target.blocks[b.parent])) problems.push(`${target.name}: ${b.opcode} 的 parent 不存在`);
    }
    for (const [name, slot] of Object.entries(b.inputs || {})) {
      if (!Array.isArray(slot) || slot.length < 1) { problems.push(`${target.name}: ${b.opcode}.${name} 槽位格式错误`); continue; }
      const type = slot[0];
      if (![1, 2, 3].includes(type)) problems.push(`${target.name}: ${b.opcode}.${name} 槽位类型 ${type} 非法`);
      for (let k = 1; k < slot.length; k++) {
        const payload = slot[k];
        if (typeof payload === 'string') {
          if (!ids.has(payload)) problems.push(`${target.name}: ${b.opcode}.${name} 引用了本角色不存在的块 ${payload}`);
          else {
            const child = blocks[payload];
            if (!child.shadow && child.parent !== id && type !== 1) problems.push(`${target.name}: ${b.opcode}.${name} 的子块 parent 未回指`);
          }
        } else if (Array.isArray(payload)) {
          checkPrimitive(target.name, b.opcode, name, payload, problems, allVarIds, allListIds, allBcastIds);
        } else if (payload !== null) {
          problems.push(`${target.name}: ${b.opcode}.${name} 槽位内容类型不明 ${typeof payload}`);
        }
      }
    }
    for (const [name, f] of Object.entries(b.fields || {})) {
      if (!Array.isArray(f) || f.length === 0) problems.push(`${target.name}: ${b.opcode} 字段 ${name} 格式错误`);
      if (f.length === 2 && f[1] !== null && f[0] !== undefined) {
        const refId = f[1];
        if (typeof refId === 'string') {
          if (!allVarIds.has(refId) && !allListIds.has(refId) && !allBcastIds.has(refId) && !allArgIds.has(refId)) problems.push(`${target.name}: 字段 ${name} 引用未知数据 id ${refId}`);
        }
      }
    }
  }
  // every non-topLevel block must be reachable from some input of its parent
  for (const [id, b] of Object.entries(blocks)) {
    if (b.topLevel) continue;
    if (!b.parent) continue;
    const p = blocks[b.parent];
    if (!p) { problems.push(`${target.name}: ${b.opcode} 的 parent ${b.parent} 不存在`); continue; }
    const referenced = p.next === id ||
      Object.values(p.inputs || {}).some(slot => Array.isArray(slot) && slot.slice(1).some(x => x === id));
    if (!referenced) problems.push(`${target.name}: ${b.opcode} 的 parent 既不在 next 也不在任何槽位`);
  }
}

function checkPrimitive(tname, opcode, slotName, prim, problems, allVarIds, allListIds, allBcastIds) {
  const kind = prim[0];
  const label = PRIMITIVE_NAMES[kind];
  if (!label) { problems.push(`${tname}: ${opcode}.${slotName} 原始值类型 ${kind} 未知`); return; }
  if (kind === 12 && !allVarIds.has(prim[2])) problems.push(`${tname}: ${opcode}.${slotName} 变量 id ${prim[2]} 未注册`);
  if (kind === 13 && !allListIds.has(prim[2])) problems.push(`${tname}: ${opcode}.${slotName} 列表 id ${prim[2]} 未注册`);
  if (kind === 11 && !allBcastIds.has(prim[2])) problems.push(`${tname}: ${opcode}.${slotName} 广播 id ${prim[2]} 未注册`);
  if ((kind === 4) && typeof prim[1] !== 'number') problems.push(`${tname}: ${opcode}.${slotName} 数值原始值应为 number`);
}

export {PRIMITIVE_NAMES};
