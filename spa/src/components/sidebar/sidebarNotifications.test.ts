import { describe, expect, it } from 'vitest';
import { getTaskNotification } from './sidebarNotifications';

describe('sidebarNotifications helpers', () => {
    it('prefers scheduling notifications over critical path notifications', () => {
        const notification = getTaskNotification(
            { state: 'unscheduled', message: 'Unscheduled' },
            { critical: true, totalSlackDays: 4 }
        );

        expect(notification).toEqual({
            iconName: 'rcg-icon-notification-unscheduled',
            color: '#5f6368',
            tooltip: 'Unscheduled',
            testIdSuffix: 'unscheduled'
        });
    });

    it('builds a critical path notification when scheduling is normal', () => {
        const notification = getTaskNotification(
            { state: 'normal', message: 'OK' },
            { critical: true, totalSlackDays: 2 }
        );

        expect(notification).toEqual({
            iconName: 'rcg-icon-notification-critical',
            color: '#b42318',
            tooltip: 'Critical path task. Total slack: 2 working day(s).',
            testIdSuffix: 'critical'
        });
    });
});
