import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { CANVAS_SIZE, getDefaultPanOffset, buildCanvasTransform } from '../utils/canvasLifecycle';

export function useCanvas(committedRef, activeRef, containerRef) {
  const { zoom, setZoom } = useCanvasStore();
  const panOffset = useRef(getDefaultPanOffset(window.innerWidth, window.innerHeight));

  const applyTransform = useCallback(() => {
    const { x, y } = panOffset.current;
    const z = useCanvasStore.getState().zoom;
    const style = buildCanvasTransform(x, y, z);

    for (const ref of [committedRef, activeRef]) {
      const el = ref?.current;
      if (!el) continue;
      el.style.transform = style.transform;
      el.style.transformOrigin = style.transformOrigin;
    }
  }, [committedRef, activeRef]);

  // Sync transforms before paint so drawing aligns with the visible board
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
        panOffset.current = {
          x: mouseX - zoomRatio * (mouseX - panOffset.current.x),
          y: mouseY - zoomRatio * (mouseY - panOffset.current.y),
        };

        setZoom(newZoom);
      } else {
        panOffset.current = {
          x: panOffset.current.x - e.deltaX,
          y: panOffset.current.y - e.deltaY,
        };
        applyTransform();
      }
    };

    target.addEventListener('wheel', handleWheel, { passive: false });
    return () => target.removeEventListener('wheel', handleWheel);
  }, [activeRef, committedRef, setZoom, applyTransform]);

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
    panOffset.current = getDefaultPanOffset(window.innerWidth, window.innerHeight);
    applyTransform();
  }, [setZoom, applyTransform]);

  return { zoomIn, zoomOut, resetZoom, panOffset, applyTransform, CANVAS_SIZE };
}
