import {execFile} from 'node:child_process';
import {mkdir, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const FOLDER_ID = '18IXGH8P60BWBuZ7ReSI5YXd_miCF3BYr';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const PUBLIC_BASE_URL = 'https://raw.githubusercontent.com/amaralcamilla/ipj-data/main';
const PAGES_DIR = 'avisos';
const OUTPUT_FILE = 'avisos.json';
const PAGE_WIDTH = 1280;
const JPEG_QUALITY = 80;
const TIME_ZONE = 'America/Sao_Paulo';

const run = promisify(execFile);

const driveUrl = (path, params) => {
  const url = new URL(`${DRIVE_API_URL}${path}`);
  url.search = new URLSearchParams({...params, key: process.env.GOOGLE_API_KEY}).toString();
  return url;
};

const fetchOk = async url => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Drive API respondeu ${response.status}: ${await response.text()}`);
  }
  return response;
};

const fetchLatestPdf = async () => {
  const url = driveUrl('', {
    q: `'${FOLDER_ID}' in parents and mimeType = 'application/pdf' and trashed = false`,
    orderBy: 'createdTime desc',
    pageSize: 1,
    fields: 'files(id,name,modifiedTime)',
  });
  const {files} = await (await fetchOk(url)).json();
  return files[0];
};

const readCurrentBoard = async () => {
  try {
    return JSON.parse(await readFile(OUTPUT_FILE, 'utf8'));
  } catch {
    return null;
  }
};

export const isSamePdf = (board, pdf) => board?.pdf?.id === pdf.id && board?.pdf?.modifiedTime === pdf.modifiedTime;

// Descarta capa e encerramento; PDFs muito curtos são exibidos inteiros
export const selectPageRange = pageCount => (pageCount > 2 ? {first: 2, last: pageCount - 1} : {first: 1, last: pageCount});

export const toLocalDate = date => new Intl.DateTimeFormat('en-CA', {timeZone: TIME_ZONE}).format(date);

const downloadPdf = async (pdf, directory) => {
  const response = await fetchOk(driveUrl(`/${pdf.id}`, {alt: 'media'}));
  const path = join(directory, 'avisos.pdf');
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
  return path;
};

const readPdfInfo = async pdfPath => {
  const {stdout} = await run('pdfinfo', [pdfPath]);
  const pageCount = Number(stdout.match(/^Pages:\s+(\d+)/m)[1]);
  const [, width, height] = stdout.match(/^Page size:\s+([\d.]+) x ([\d.]+)/m).map(Number);
  return {pageCount, aspectRatio: Number((width / height).toFixed(4))};
};

const renderPages = async (pdfPath, pdfId, pageCount) => {
  const {first, last} = selectPageRange(pageCount);
  await rm(PAGES_DIR, {recursive: true, force: true});
  await mkdir(PAGES_DIR);
  await run('pdftoppm', ['-jpeg', '-jpegopt', `quality=${JPEG_QUALITY}`, '-scale-to-x', String(PAGE_WIDTH), '-scale-to-y', '-1', '-f', String(first), '-l', String(last), pdfPath, join(PAGES_DIR, pdfId)]);
  const files = (await readdir(PAGES_DIR)).sort();
  return files.map(file => `${PUBLIC_BASE_URL}/${PAGES_DIR}/${file}`);
};

const main = async () => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('Variável de ambiente GOOGLE_API_KEY não definida');
  }

  const pdf = await fetchLatestPdf();
  if (!pdf) {
    throw new Error('Nenhum PDF encontrado na pasta; mantendo o mural atual');
  }

  if (isSamePdf(await readCurrentBoard(), pdf)) {
    console.log(`PDF inalterado (${pdf.name})`);
    return;
  }

  const workDir = await mkdtemp(join(tmpdir(), 'avisos-'));
  try {
    const pdfPath = await downloadPdf(pdf, workDir);
    const {pageCount, aspectRatio} = await readPdfInfo(pdfPath);
    const paginas = await renderPages(pdfPath, pdf.id, pageCount);
    const board = {pdf, atualizadoEm: toLocalDate(new Date()), proporcao: aspectRatio, paginas};
    await writeFile(OUTPUT_FILE, `${JSON.stringify(board, null, 2)}\n`);
    console.log(`${OUTPUT_FILE} atualizado com ${paginas.length} páginas de "${pdf.name}"`);
  } finally {
    await rm(workDir, {recursive: true, force: true});
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
