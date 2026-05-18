import { Path2D, createCanvas } from 'canvas';

global.Path2D = Path2D;
global.HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === '2d') {
    const c = createCanvas(this.width || 300, this.height || 150);
    return c.getContext('2d');
  }
  return null;
};
