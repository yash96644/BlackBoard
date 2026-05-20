import { useEffect, useLayoutEffect, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useBoardStore } from '../store/boardStore';
import { redrawCanvas } from '../utils/strokeCommit';
import { getDefaultPanOffset } from '../utils/canvasLifecycle';

export function useCanvas(committedRef, activeRef, containerRef) {
  const { zoom, setZoom, panOffset, setPanOffset } = useCanvasStore();

  const applyTransform = useCallback(() => {
    const committed = committedRef?.current;
    if (!committed) return;

    const activePage = useBoardStore.getState().activePage;
    const page = useBoardStore.getState().pages.find((p) => p.id === activePage);
    const strokes = page?.data || [];
    redrawCanvas(committed, strokes);
  }, [committedRef]);

  // Set initial pan offset centered in the viewport on mount
  useEffect(() => {
    const currentPan = useCanvasStore.getState().panOffset;
    if (currentPan.x === 0 && currentPan.y === 0) {
      const initialPan = getDefaultPanOffset(window.innerWidth, window.innerHeight);
      setPanOffset(initialPan);
    }
  }, [setPanOffset]);

  // Redraw when page or zoom changes
  useLayoutEffect(() => {
    applyTransform();
  }, [zoom, applyTransform]);

  useEffect(() => {
    const target = activeRef?.current ?? committedRef?.current;
    if (!target) return;

    const handleWheel = (e) => {
      e.preventDefault();

      if (e.ctrlKey) {
        const zoomSensitivity = 0.005;
        const delta = -e.deltaY * zoomSensitivity;
        const currentZoom = useCanvasStore.getState().zoom;
        const newZoom = Math.min(5.0, Math.max(0.25, currentZoom + delta));

        const rect = target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomRatio = newZoom / currentZoom;
        const currentPan = useCanvasStore.getState().panOffset;
        const newPan = {
          x: mouseX - zoomRatio * (mouseX - currentPan.x),
          y: mouseY - zoomRatio * (mouseY - currentPan.y),
        };

        setPanOffset(newPan);
        setZoom(newZoom);
      } else {
        const currentPan = useCanvasStore.getState().panOffset;
        const newPan = {
          x: currentPan.x - e.deltaX,
          y: currentPan.y - e.deltaY,
        };
        setPanOffset(newPan);
        applyTransform();
      }
    };

    target.addEventListener('wheel', handleWheel, { passive: false });
    return () => target.removeEventListener('wheel', handleWheel);
  }, [activeRef, committedRef, setZoom, setPanOffset, applyTransform]);

  const zoomIn = useCallback(() => {
    const current = useCanvasStore.getState().zoom;
    setZoom(Math.min(5.0, current + 0.1));
  }, [setZoom]);

  const zoomOut = useCallback(() => {
    const current = useCanvasStore.getState().zoom;
    setZoom(Math.max(0.25, current - 0.1));
  }, [setZoom]);

  const resetZoom = useCallback(() => {
    setZoom(1.0);
    const initialPan = getDefaultPanOffset(window.innerWidth, window.innerHeight);
    setPanOffset(initialPan);
    applyTransform();
  }, [setZoom, setPanOffset, applyTransform]);

  return { zoomIn, zoomOut, resetZoom, panOffset, applyTransform };
}
