// Compiles content/notes/*.md (YAML frontmatter + markdown) into public/data/notes.json,
// which notes.html fetches at runtime. Runs before every build; notes.json is gitignored.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { load as yamlLoad } from 'js-yaml';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const srcDir = path.join(root, 'content', 'notes');
const outFile = path.join(root, 'public', 'data', 'notes.json');

const toDateString = d =>
  d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);

const files = fs.existsSync(srcDir)
  ? fs.readdirSync(srcDir).filter(f => f.endsWith('.md'))
  : [];

const notes = files.map(file => {
  const raw = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const meta = yamlLoad(m[1]) ?? {};
  if (!meta.title || !meta.date) throw new Error(`${file}: frontmatter needs title and date`);
  const body = m[2].trim();
  const text = body.replace(/[#*_>`\[\]!]|\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  return {
    slug: file.replace(/\.md$/, ''),
    title: String(meta.title),
    date: toDateString(meta.date),
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : meta.tags ? [String(meta.tags)] : [],
    excerpt: text.length > 180 ? text.slice(0, 180).replace(/\s\S*$/, '') + '…' : text,
    // media uploads reference /images/notes/... absolutely; make them relative so any base path works
    html: marked.parse(body).replace(/(src|href)="\//g, '$1="'),
  };
}).sort((a, b) => (b.date + b.slug).localeCompare(a.date + a.slug));

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ notes }, null, 2));
console.log(`build-notes: wrote ${notes.length} note(s) to public/data/notes.json`);
