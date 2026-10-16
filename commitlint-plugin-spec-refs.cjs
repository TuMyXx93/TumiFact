'use strict';

const specRefsRule = (parsed) => {
  const needsRefs = ['feat', 'fix'].includes(parsed.type);
  if (!needsRefs) return [true];
  const text = `${parsed.body ?? ''}\n${parsed.footer ?? ''}`;
  const ok = /Refs:\s*(specs\/features\/\d{3}-[a-z0-9-]+|specs\/adr\/\d{4}-[a-z0-9-]+|none)\b/.test(text);
  return [ok, 'los commits feat/fix deben incluir "Refs: specs/features/NNN-slug" (o specs/adr/NNNN-slug, o "Refs: none")'];
};

module.exports = { rules: { 'spec-refs': specRefsRule } };