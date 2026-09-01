import { Student, Gender } from './types';

export async function parsePdfRoster(file: File): Promise<{ success: boolean; data: Student[]; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, data: [], error: 'Hanya dapat dijalankan di browser.' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();

    // Dynamically import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '3.11.174'}/build/pdf.worker.min.js`;
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const extractedStudents: Student[] = [];
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items.map((item: any) => item.str);
      const pageText = pageStrings.join(' ');
      fullText += '\n' + pageText;

      // Also parse line by line
      parseLines(textContent.items, extractedStudents);
    }

    if (extractedStudents.length === 0) {
      // Fallback: regex search on full text
      const fallback = parseRegexFromText(fullText);
      if (fallback.length > 0) {
        return { success: true, data: fallback };
      }
      return {
        success: false,
        data: [],
        error: 'Tidak ditemukan data mahasiswa yang valid dalam berkas PDF. Pastikan PDF memuat NIM (contoh: 2530311...) dan Nama.',
      };
    }

    return { success: true, data: extractedStudents };
  } catch (err: any) {
    console.error('PDF parse error:', err);
    return {
      success: false,
      data: [],
      error: err?.message || 'Gagal membaca berkas PDF. Pastikan berkas tidak terkunci password.',
    };
  }
}

function parseLines(items: any[], records: Student[]) {
  const lineMap: Record<number, { str: string; x: number }[]> = {};

  items.forEach((item) => {
    if (!item.str || !item.str.trim()) return;
    const y = Math.round(item.transform[5]);
    let matchedY = Object.keys(lineMap)
      .map(Number)
      .find((existingY) => Math.abs(existingY - y) <= 4);

    if (matchedY === undefined) {
      matchedY = y;
      lineMap[matchedY] = [];
    }

    lineMap[matchedY].push({
      str: item.str.trim(),
      x: item.transform[4],
    });
  });

  const sortedYKeys = Object.keys(lineMap)
    .map(Number)
    .sort((a, b) => b - a);

  sortedYKeys.forEach((y) => {
    const rowItems = lineMap[y].sort((a, b) => a.x - b.x);
    const rowText = rowItems.map((i) => i.str).join(' ');
    const parsed = parseStudentFromRow(rowText);
    if (parsed && !records.some((r) => r.nim === parsed.nim)) {
      records.push(parsed);
    }
  });
}

function parseStudentFromRow(text: string): Student | null {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean || clean.length < 5) return null;

  // Pattern: Name [separator] NIM (e.g. "Moh. Raihan - 2530311065" or "2530311065 Moh. Raihan")
  const nimMatches = clean.match(/(25\d{8}|\d{10})/);
  if (!nimMatches) return null;

  const nim = nimMatches[1];
  let name = clean
    .replace(nim, '')
    .replace(/[\d\.\-\–\—\•\~\|\,\:\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Filter out table headers or noisy tokens
  const lowerName = name.toLowerCase();
  if (
    !name ||
    name.length < 3 ||
    lowerName.includes('kelompok') ||
    lowerName.includes('nomor') ||
    lowerName.includes('matakuliah') ||
    lowerName.includes('semester')
  ) {
    return null;
  }

  // Guess gender if row has L/P
  let gender: Gender = 'L';
  if (/\b(P|Perempuan|Wanita)\b/i.test(clean)) {
    gender = 'P';
  }

  return {
    nim,
    name,
    gender,
    isPinSet: false,
    status: 'AKTIF',
    createdAt: new Date().toISOString().split('T')[0],
  };
}

function parseRegexFromText(text: string): Student[] {
  const results: Student[] = [];
  const lines = text.split('\n');
  lines.forEach((line) => {
    const s = parseStudentFromRow(line);
    if (s && !results.some((r) => r.nim === s.nim)) {
      results.push(s);
    }
  });
  return results;
}

// CSV / TSV text parser
export function parseCsvRoster(csvText: string): Student[] {
  const lines = csvText.split('\n');
  const results: Student[] = [];

  lines.forEach((line, idx) => {
    if (idx === 0 && (line.toLowerCase().includes('nim') || line.toLowerCase().includes('nama'))) return;
    const cols = line.split(/[,;\t]/).map((c) => c.replace(/^["']|["']$/g, '').trim());

    if (cols.length >= 2) {
      // Find which column is NIM (looks like digits 8-12)
      let nim = '';
      let name = '';
      let gender: Gender = 'L';

      cols.forEach((col) => {
        if (/^\d{8,14}$/.test(col)) {
          nim = col;
        } else if (col.length > 2 && !name && !/^\d+$/.test(col)) {
          name = col;
        } else if (/^(L|P|Laki-laki|Perempuan)$/i.test(col)) {
          gender = col.toUpperCase().startsWith('P') ? 'P' : 'L';
        }
      });

      if (nim && name && !results.some((r) => r.nim === nim)) {
        results.push({
          nim,
          name,
          gender,
          isPinSet: false,
          status: 'AKTIF',
          createdAt: new Date().toISOString().split('T')[0],
        });
      }
    }
  });

  return results;
}
