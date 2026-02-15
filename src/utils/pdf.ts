import { wrap } from 'comlink';
import PdfWorker from '@/workers/pdf.worker?worker';
import type { PdfExportPayload } from '@/utils/pdf-export-types';
import type { PdfWorkerApi } from '@/workers/pdf.worker';

const worker = new PdfWorker();
const api = wrap<PdfWorkerApi>(worker);

export async function renderPdfBytes(payload: PdfExportPayload): Promise<Uint8Array> {
  return api.renderPDFInWorker(payload);
}
