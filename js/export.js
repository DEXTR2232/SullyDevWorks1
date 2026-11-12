/* =========================================================
   EXPORT: CSV and Excel (.xlsx), generated in the browser
   No library: a minimal Office Open XML writer + an uncompressed
   ZIP container. Output opens in Excel, Numbers, LibreOffice and
   Google Sheets.

   Sheet model used by both formats:
     { name: 'Summary', freezeRows: 1,
       rows: [ {cells:[...], style:'title'|'header'|undefined}, ... ] }
   Cells are strings, numbers, null/undefined (empty) or Date.
========================================================= */

/* ---------- shared helpers ---------- */
function exportStamp(d){
  d = d || new Date();
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}
function fmtDateTime(d){
  if(!(d instanceof Date) || isNaN(d)) return '';
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function cellText(v){
  if(v == null) return '';
  if(v instanceof Date) return fmtDateTime(v);
  return String(v);
}
function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}
function safeFileName(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

/* ---------- CSV ---------- */
/* Spreadsheet apps execute cells that start with = + - @ as formulas
   ("CSV injection"). Alert data comes from outside tools, so any text
   cell starting with one of those is prefixed with an apostrophe.
   Real numbers are written as numbers and left alone. */
function csvCell(v){
  if(typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  let s = cellText(v);
  if(/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
}
/* All sheets go into one CSV, one after another, separated by a blank
   line, so a multi-part report stays a single readable file. */
function toCSV(sheets){
  const lines = [];
  sheets.forEach((sh, i)=>{
    if(i > 0) lines.push('');
    if(sheets.length > 1) lines.push(csvCell('# ' + sh.name));
    sh.rows.forEach(r => lines.push(r.cells.map(csvCell).join(',')));
  });
  return '﻿' + lines.join('\r\n') + '\r\n';   // BOM so Excel reads UTF-8
}
function exportCSV(baseName, sheets){
  downloadBlob(new Blob([toCSV(sheets)], {type:'text/csv;charset=utf-8'}), `${baseName}_${exportStamp()}.csv`);
}

/* ---------- XLSX ---------- */
function xmlEsc(s){
  return String(s)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')   // not allowed in XML
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function colName(i){ let s=''; i++; while(i>0){ const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26); } return s; }
function sheetSafeName(name, used){
  let n = String(name).replace(/[\[\]:*?\/\\]/g,' ').trim().slice(0,31) || 'Sheet';
  let base = n, k = 2;
  while(used.has(n.toLowerCase())){ const suf = ' ('+(k++)+')'; n = base.slice(0, 31-suf.length) + suf; }
  used.add(n.toLowerCase());
  return n;
}
const XLSX_STYLE = {title:2, header:1};

function sheetXML(sh){
  const widths = [];
  const rowsXml = sh.rows.map((r, ri)=>{
    const s = XLSX_STYLE[r.style] || 0;
    const cells = r.cells.map((v, ci)=>{
      const ref = colName(ci) + (ri+1);
      const text = cellText(v);
      widths[ci] = Math.max(widths[ci]||0, Math.min(60, text.length + 2));
      if(v == null || text === '') return s ? `<c r="${ref}" s="${s}"/>` : '';
      if(typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${s?` s="${s}"`:''}><v>${v}</v></c>`;
      return `<c r="${ref}" t="inlineStr"${s?` s="${s}"`:''}><is><t xml:space="preserve">${xmlEsc(text)}</t></is></c>`;
    }).join('');
    return `<row r="${ri+1}">${cells}</row>`;
  }).join('');
  const cols = widths.length ? '<cols>' + widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${Math.max(8,w)}" customWidth="1"/>`).join('') + '</cols>' : '';
  const freeze = sh.freezeRows
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sh.freezeRows}" topLeftCell="A${sh.freezeRows+1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${freeze}${cols}<sheetData>${rowsXml}</sheetData></worksheet>`;
}

function buildXLSX(sheets){
  const used = new Set();
  const names = sheets.map(sh => sheetSafeName(sh.name, used));
  const files = [];
  const add = (path, text) => files.push({path, data: new TextEncoder().encode(text)});
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  add('[Content_Types].xml', XML +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    names.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
    '</Types>');
  add('_rels/.rels', XML +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>');
  add('xl/workbook.xml', XML +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
    names.map((n,i)=>`<sheet name="${xmlEsc(n)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('') +
    '</sheets></workbook>');
  add('xl/_rels/workbook.xml.rels', XML +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    names.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('') +
    `<Relationship Id="rId${names.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    '</Relationships>');
  add('xl/styles.xml', XML +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE8EEF7"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="3">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>');
  sheets.forEach((sh,i)=> add(`xl/worksheets/sheet${i+1}.xml`, sheetXML(sh)));
  return zipStore(files);
}

function exportXLSX(baseName, sheets){
  downloadBlob(new Blob([buildXLSX(sheets)], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), `${baseName}_${exportStamp()}.xlsx`);
}

/* ---------- minimal ZIP writer (STORE, no compression) ---------- */
const CRC_TABLE = (()=>{ const t = new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320^(c>>>1) : c>>>1; t[n]=c>>>0; } return t; })();
function crc32(bytes){ let c = 0xFFFFFFFF; for(let i=0;i<bytes.length;i++) c = CRC_TABLE[(c^bytes[i])&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }

function zipStore(files){
  const now = new Date();
  const dosTime = (now.getHours()<<11)|(now.getMinutes()<<5)|(Math.floor(now.getSeconds()/2));
  const dosDate = ((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
  const enc = new TextEncoder();
  const chunks = [], central = [];
  let offset = 0;
  for(const f of files){
    const name = enc.encode(f.path), crc = crc32(f.data), size = f.data.length;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true); h.setUint16(4,20,true); h.setUint16(6,0x0800,true); h.setUint16(8,0,true);
    h.setUint16(10,dosTime,true); h.setUint16(12,dosDate,true); h.setUint32(14,crc,true);
    h.setUint32(18,size,true); h.setUint32(22,size,true); h.setUint16(26,name.length,true); h.setUint16(28,0,true);
    chunks.push(new Uint8Array(h.buffer), name, f.data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true); c.setUint16(4,20,true); c.setUint16(6,20,true); c.setUint16(8,0x0800,true); c.setUint16(10,0,true);
    c.setUint16(12,dosTime,true); c.setUint16(14,dosDate,true); c.setUint32(16,crc,true);
    c.setUint32(20,size,true); c.setUint32(24,size,true); c.setUint16(28,name.length,true);
    c.setUint32(42,offset,true);
    central.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + size;
  }
  const cdSize = central.reduce((s,a)=>s+a.length,0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true); e.setUint16(8,files.length,true); e.setUint16(10,files.length,true);
  e.setUint32(12,cdSize,true); e.setUint32(16,offset,true);
  const parts = [...chunks, ...central, new Uint8Array(e.buffer)];
  const out = new Uint8Array(parts.reduce((s,a)=>s+a.length,0));
  let p = 0; for(const a of parts){ out.set(a,p); p += a.length; }
  return out;
}

/* ---------- convenience: turn a table into a sheet ---------- */
function tableSheet(name, columns, rows){
  return {name, freezeRows:1, rows:[{cells:columns, style:'header'}, ...rows.map(r=>({cells:r}))]};
}
