export function formatFileSize(bytes: number): string {
  return `${new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: 1,
  }).format(bytes / 1024)} KiB`;
}
