import { usePlatform } from '../../hooks/usePlatform';
import { useCanvasStore } from '../../store/canvasStore';

export default function TitleBar() {
  const { isWin } = usePlatform();
  const boardMode = useCanvasStore((s) => s.boardMode);
  const isWhiteboard = boardMode === 'whiteboard';

  // Mac uses native traffic lights — no custom titlebar needed
  if (!isWin) return null;

  return (
    <div
      className={`h-8 flex items-center justify-between px-4 select-none shrink-0 transition-colors
        ${isWhiteboard ? 'bg-gray-100' : 'bg-gray-950'}`}
      style={{ WebkitAppRegion: 'drag' }}
    >
      <span className={`text-xs font-medium ${isWhiteboard ? 'text-gray-500' : 'text-gray-500'}`}>
        Blackboard
      </span>
    </div>
  );
}
