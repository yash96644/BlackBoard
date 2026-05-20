import { describe, it, expect } from 'vitest';
import {
  shouldAddPoint,
  captureCanvasTransform,
  pointFromEvent,
  MIN_POINT_DIST_SQ,
  eraseOnCommitted,
} from './liveStroke';

import { useCanvasStore } from '../store/canvasStore';

describe('liveStroke', () => {
  it('shouldAddPoint filters points closer than 2px', () => {
    expect(shouldAddPoint([0, 0, 0.5], 1, 1)).toBe(false);
    expect(shouldAddPoint([0, 0, 0.5], 3, 0)).toBe(true);
    expect(MIN_POINT_DIST_SQ).toBe(4);
  });

  it('captureCanvasTransform maps screen coords to canvas space', () => {
    useCanvasStore.setState({
      zoom: 1.5,
      panOffset: { x: -200, y: 100 },
    });

    const canvas = {
      width: 1000,
      height: 800,
      getBoundingClientRect: () => ({
        left: 100,
        top: 50,
        width: 1000,
        height: 800,
      }),
    };
    const t = captureCanvasTransform(canvas);
    expect(t.left).toBe(100);
    expect(t.top).toBe(50);
    expect(t.zoom).toBe(1.5);
    expect(t.panOffset).toEqual({ x: -200, y: 100 });

    const pt = pointFromEvent(t, { clientX: 300, clientY: 450 }, 0.8);
    expect(pt[0]).toBeCloseTo(266.6667, 4);
    expect(pt[1]).toBe(200);
    expect(pt[2]).toBe(0.8);
  });


  it('eraseOnCommitted uses destination-out', () => {
    let gco = '';
    const ctx = {
      save() {},
      restore() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      get globalCompositeOperation() { return gco; },
      set globalCompositeOperation(v) { gco = v; },
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'round',
      lineJoin: 'round',
    };
    eraseOnCommitted(ctx, [0, 0], [10, 10], 8);
    expect(gco).toBe('destination-out');
  });

  it('pointFromEvent does not call getBoundingClientRect', () => {
    let rectCalls = 0;
    const canvas = {
      width: 100,
      height: 100,
      getBoundingClientRect: () => {
        rectCalls++;
        return { left: 0, top: 0, width: 100, height: 100 };
      },
    };
    const t = captureCanvasTransform(canvas);
    expect(rectCalls).toBe(1);

    for (let i = 0; i < 50; i++) {
      pointFromEvent(t, { clientX: i, clientY: i }, 0.5);
    }
    expect(rectCalls).toBe(1);
  });
});
