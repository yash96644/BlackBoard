import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Static regression guards — live drawing must not use full-canvas
 * getImageData/putImageData or requestAnimationFrame throttling.
 */
describe('useDrawing performance contract', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'src/hooks/useDrawing.js'),
    'utf8'
  );

  it('does not snapshot committed canvas during pointer down / move', () => {
    const livePath = source.slice(
      source.indexOf('handlePointerDown'),
      source.indexOf('const commitStroke')
    );
    expect(livePath).not.toMatch(/getImageData/);
    expect(livePath).not.toMatch(/putImageData/);
    expect(livePath).not.toMatch(/snapshotRef/);
  });

  it('does not defer live strokes with requestAnimationFrame', () => {
    expect(source).not.toMatch(/requestAnimationFrame/);
    expect(source).not.toMatch(/rafRef/);
  });

  it('uses incremental live segment drawing', () => {
    expect(source).toContain('drawLiveSegment');
    expect(source).toContain('drawLiveDot');
    expect(source).toContain('captureCanvasTransform');
  });

  it('uses synchronous vector snapshotting', () => {
    expect(source).toContain('Vector-based snapshot scheduling runs instantly and synchronously.');
    expect(source).not.toContain('scheduleHistorySnapshot');
  });
});

