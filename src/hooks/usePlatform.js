export function usePlatform() {
  const platform = window.electronAPI?.platform ?? 'web';
  return {
    isMac:     platform === 'darwin',
    isWin:     platform === 'win32',
    isLinux:   platform === 'linux',
    isWeb:     platform === 'web',
    isElectron: platform !== 'web',
  };
}
