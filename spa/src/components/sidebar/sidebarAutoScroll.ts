export const SIDEBAR_AUTO_SCROLL_EDGE_PX = 40;
export const SIDEBAR_AUTO_SCROLL_MIN_SPEED = 2;
export const SIDEBAR_AUTO_SCROLL_MAX_SPEED = 6;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export type SidebarAutoScrollMetrics = {
    topDepth: number;
    bottomDepth: number;
    speed: number;
    delta: number;
};

export const getSidebarAutoScrollMetrics = (
    clientY: number,
    rect: Pick<DOMRectReadOnly, 'top' | 'bottom'>,
    edgeZonePx = SIDEBAR_AUTO_SCROLL_EDGE_PX,
    minSpeed = SIDEBAR_AUTO_SCROLL_MIN_SPEED,
    maxSpeed = SIDEBAR_AUTO_SCROLL_MAX_SPEED
): SidebarAutoScrollMetrics => {
    const topDepth = clamp((rect.top + edgeZonePx) - clientY, 0, edgeZonePx);
    const bottomDepth = clamp(clientY - (rect.bottom - edgeZonePx), 0, edgeZonePx);

    const depth = Math.max(topDepth, bottomDepth);
    if (depth <= 0) {
        return { topDepth, bottomDepth, speed: 0, delta: 0 };
    }

    const speed = Math.round(minSpeed + ((depth / edgeZonePx) * (maxSpeed - minSpeed)));
    const delta = topDepth >= bottomDepth ? -speed : speed;

    return { topDepth, bottomDepth, speed, delta };
};
