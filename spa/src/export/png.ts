import { buildExportFilename, canvasToBlob, downloadBlob } from './download';
import type { GanttExportSnapshot } from './types';

export const composeExportCanvas = (snapshot: GanttExportSnapshot): HTMLCanvasElement => {
    const width = Math.max(
        snapshot.headerCanvas.width,
        snapshot.backgroundCanvas.width,
        snapshot.baselineCanvas.width,
        snapshot.taskCanvas.width,
        snapshot.overlayCanvas.width
    );
    const height =
        snapshot.headerCanvas.height +
        Math.max(
            snapshot.backgroundCanvas.height,
            snapshot.taskCanvas.height,
            snapshot.overlayCanvas.height
        );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to initialize export canvas');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(snapshot.headerCanvas, 0, 0);

    const chartY = snapshot.headerCanvas.height;
    ctx.drawImage(snapshot.backgroundCanvas, 0, chartY);
    ctx.drawImage(snapshot.baselineCanvas, 0, chartY);
    ctx.drawImage(snapshot.taskCanvas, 0, chartY);
    ctx.drawImage(snapshot.overlayCanvas, 0, chartY);

    return canvas;
};

export const exportSnapshotAsPng = async (snapshot: GanttExportSnapshot) => {
    const canvas = composeExportCanvas(snapshot);
    const blob = await canvasToBlob(canvas);
    downloadBlob(blob, buildExportFilename('png'));
};
