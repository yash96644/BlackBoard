import { describe, it, expect } from 'vitest';
import {
  shouldAddPoint,
  captureCanvasTransform,
  pointFromEvent,
  MIN_POINT_DIST_SQ,
  eraseOnCommitted,
} from './liveStroke';

describe('liveStroke', () => {
  it('shouldAddPoint filters points closer than 2px', () => {
    expect(shouldAddPoint([0, 0, 0.5], 1, 1)).toBe(false);
    expect(shouldAddPoint([0, 0, 0.5], 3, 0)).toBe(true);
    expect(MIN_POINT_DIST_SQ).toBe(4);
  });

  it('captureCanvasTransform maps screen coords to canvas space', () => {
    const canvas = {
      width: 5000,
      height: 5000,
      getBoundingClientRect: () => ({
        left: 100,
        top: 50,
        width: 1000,
        height: 1000,
      }),
    };
    const t = captureCanvasTransform(canvas);
    expect(t.scaleX).toBe(5);
    expect(t.scaleY).toBe(5);

    const pt = pointFromEvent(t, { clientX: 200, clientY: 150 }, 0.5);
    expect(pt[0]).toBe(500);
    expect(pt[1]).toBe(500);
    expect(pt[2]).toBe(0.5);
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
