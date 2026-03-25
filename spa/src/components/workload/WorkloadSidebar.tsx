import React from 'react';
import { useWorkloadStore } from '../../stores/WorkloadStore';
import { useTaskStore } from '../../stores/TaskStore';
import { i18n } from '../../utils/i18n';

export const WorkloadSidebar: React.FC = () => {
    const { workloadData } = useWorkloadStore();
    const { viewport } = useTaskStore();

    if (!workloadData) {
        return <div style={{ padding: '10px', color: '#666', fontSize: '13px' }}>{i18n.t('label_loading') || 'Loading...'}</div>;
    }

    const rowHeight = viewport.rowHeight * 2;
    const assignees = Array.from(workloadData.assignees.values()).sort((a, b) => a.assigneeName.localeCompare(b.assigneeName));
    const hasAssignees = assignees.length > 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
            <div style={{
                height: '40px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                fontWeight: 600,
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                {i18n.t('label_assignee_plural') || 'Assignees'}
            </div>
            <div style={{ flex: 1, overflowY: 'hidden', overflowX: 'hidden', position: 'relative' }}>
                {hasAssignees ? (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                        {assignees.map((assignee) => {
                            const hasOverload = Array.from(assignee.dailyWorkloads.values()).some(d => d.isOverload);
                            return (
                                <div
                                    key={assignee.assigneeId}
                                    style={{
                                        height: `${rowHeight}px`,
                                        borderBottom: '1px solid #f0f0f0',
                                        padding: '8px 16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {assignee.assigneeName}
                                        </div>
                                        {hasOverload && (
                                            <div style={{
                                                backgroundColor: '#fce8e6',
                                                color: '#d93025',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: 600
                                            }}>
                                                OVERLOAD
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Peak {assignee.peakLoad.toFixed(1)}h &bull; Total {assignee.totalLoad.toFixed(1)}h
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ padding: '16px', color: '#666', fontSize: '13px', lineHeight: '1.5' }}>
                        No workload data matches the current filters.
                    </div>
                )}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #e0e0e0', backgroundColor: '#fcfcfc', fontSize: '11px', color: '#777', lineHeight: '1.4' }}>
                <div style={{ marginBottom: '6px', fontWeight: 600, color: '#444' }}>
                    {workloadData.overloadedAssigneeCount > 0 
                        ? `${workloadData.overloadedAssigneeCount} assignees overloaded (${workloadData.overloadedDayCount} total days)` 
                        : 'No overloads detected'}
                </div>
                {i18n.t('label_workload_explanation') || 'Planned workload approximation based on estimated hours and scheduled business days.'}
            </div>
        </div>
    );
};
