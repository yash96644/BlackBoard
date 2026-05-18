import { describe, it, expect, beforeEach } from 'vitest';
import {
  CANVAS_SIZE,
  ensureCanvasSize,
  getDefaultPanOffset,
  buildCanvasTransform,
} from './canvasLifecycle';

describe('canvasLifecycle', () => {
  let canvas;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(10, 10, 20, 20);
  });

  it('ensureCanvasSize resizes backing store when dimensions differ', () => {
    const changed = ensureCanvasSize(canvas, CANVAS_SIZE, CANVAS_SIZE);
    expect(changed).toBe(true);
    expect(canvas.width).toBe(CANVAS_SIZE);
    expect(canvas.height).toBe(CANVAS_SIZE);
  });

  it('ensureCanvasSize is a no-op when size unchanged', () => {
    ensureCanvasSize(canvas, CANVAS_SIZE, CANVAS_SIZE);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(100, 100, 5, 5);

    const changed = ensureCanvasSize(canvas, CANVAS_SIZE, CANVAS_SIZE);
    expect(changed).toBe(false);

    const green = ctx.getImageData(100, 100, 1, 1).data;
    expect(green[1]).toBe(255);
  });

  it('getDefaultPanOffset centers the board', () => {
    const pan = getDefaultPanOffset(1000, 800);
    expect(pan.x).toBe(-2000);
    expect(pan.y).toBe(-2100);
  });

  it('buildCanvasTransform returns matching translate+scale', () => {
    const style = buildCanvasTransform(10, 20, 1.5);
    expect(style.transform).toBe('translate(10px, 20px) scale(1.5)');
    expect(style.transformOrigin).toBe('0 0');
  });
});
