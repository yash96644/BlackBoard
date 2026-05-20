global.Path2D = class Path2D {};

global.HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === '2d') {
    const width = this.width || 300;
    const height = this.height || 150;
    // Keep a local state for fillStyle and a mock buffer
    const buffer = new Uint8ClampedArray(width * height * 4);
    let fillStyle = '#000000';
    
    return {
      get fillStyle() { return fillStyle; },
      set fillStyle(val) { fillStyle = val; },
      fillRect(x, y, w, h) {
        // Simple fillRect implementation for unit testing
        const color = fillStyle === '#00ff00' ? [0, 255, 0, 255] : [255, 0, 0, 255];
        for (let i = y; i < y + h; i++) {
          for (let j = x; j < x + w; j++) {
            if (i >= 0 && i < height && j >= 0 && j < width) {
              const idx = (i * width + j) * 4;
              buffer[idx] = color[0];
              buffer[idx + 1] = color[1];
              buffer[idx + 2] = color[2];
              buffer[idx + 3] = color[3];
            }
          }
        }
      },
      getImageData(x, y, w, h) {
        const data = new Uint8ClampedArray(w * h * 4);
        for (let i = 0; i < h; i++) {
          for (let j = 0; j < w; j++) {
            const srcIdx = ((y + i) * width + (x + j)) * 4;
            const destIdx = (i * w + j) * 4;
            if (srcIdx >= 0 && srcIdx < buffer.length) {
              data[destIdx] = buffer[srcIdx];
              data[destIdx + 1] = buffer[srcIdx + 1];
              data[destIdx + 2] = buffer[srcIdx + 2];
              data[destIdx + 3] = buffer[srcIdx + 3];
            }
          }
        }
        return { data };
      },
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      save: () => {},
      restore: () => {},
      setTransform: () => {},
      scale: () => {},
      translate: () => {},
      fillText: () => {},
      measureText: () => ({ width: 10 }),
    };
  }
  return null;
};
