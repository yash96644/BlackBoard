import jsPDF from 'jspdf';
import { useCanvasStore } from '../store/canvasStore';

export function exportAsPNG(committedRef, activeRef,
    filename = 'blackboard.png') {
  // If committedRef is a Canvas element (legacy fallback) instead of a ref object
  const committed = committedRef?.current || committedRef;
  const boardColor = useCanvasStore.getState().boardColor;
  if (!committed) return;

  // Create merge canvas
  const merge    = document.createElement('canvas');
  merge.width    = committed.width;
  merge.height   = committed.height;
  const mergeCtx = merge.getContext('2d');

  // Fill background color
  mergeCtx.fillStyle = boardColor;
  mergeCtx.fillRect(0, 0, merge.width, merge.height);

  // Draw committed strokes
  mergeCtx.drawImage(committed, 0, 0);

  const link      = document.createElement('a');
  link.download   = filename;
  link.href       = merge.toDataURL('image/png', 1.0);
  link.click();
}

export function exportAsJPEG(committedRef,
    filename = 'blackboard.jpg') {
  const committed = committedRef?.current || committedRef;
  const boardColor = useCanvasStore.getState().boardColor;
  if (!committed) return;

  const merge    = document.createElement('canvas');
  merge.width    = committed.width;
  merge.height   = committed.height;
  const mergeCtx = merge.getContext('2d');

  mergeCtx.fillStyle = boardColor;
  mergeCtx.fillRect(0, 0, merge.width, merge.height);
  mergeCtx.drawImage(committed, 0, 0);

  const link    = document.createElement('a');
  link.download = filename;
  link.href     = merge.toDataURL('image/jpeg', 0.95);
  link.click();
}

export function exportAsPDF(committedRef,
    filename = 'blackboard.pdf') {
  const committed = committedRef?.current || committedRef;
  const boardColor = useCanvasStore.getState().boardColor;
  if (!committed) return;

  const merge    = document.createElement('canvas');
  merge.width    = committed.width;
  merge.height   = committed.height;
  const mergeCtx = merge.getContext('2d');

  mergeCtx.fillStyle = boardColor;
  mergeCtx.fillRect(0, 0, merge.width, merge.height);
  mergeCtx.drawImage(committed, 0, 0);

  const imgData = merge.toDataURL('image/jpeg', 0.95);
  const pdf     = new jsPDF({
    orientation: committed.width > committed.height
      ? 'landscape' : 'portrait',
    unit:   'px',
    format: [committed.width, committed.height],
  });
  pdf.addImage(imgData, 'JPEG', 0, 0,
    committed.width, committed.height);
  pdf.save(filename);
}
