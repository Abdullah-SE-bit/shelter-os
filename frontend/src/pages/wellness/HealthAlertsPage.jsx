import { useState } from 'react';
import { wellnessApi } from '../../api/wellnessApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import { timeAgo, formatDate } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SEVERITY_CONFIG = {
  INFO:      { bg: 'var(--cat-blue-light)',  color: 'var(--cat-blue)', icon: '🔵', label: 'Info' },
  WARNING:   { bg: 'var(--cat-amber-light)', color: 'var(--cat-amber)', icon: '🟡', label: 'Warning' },
  CRITICAL:  { bg: 'var(--cat-red-light)',  color: 'var(--cat-red)', icon: '🔴', label: 'Critical' },
};

const ALERT_TYPE_CONFIG = {
  VACCINATION_DUE:      { icon: '💉', label: 'Vaccination Due' },
  VACCINATION_OVERDUE:  { icon: '⚠️', label: 'Vaccination Overdue' },
  MISSED_DOSE:          { icon: '💊', label: 'Missed Medication' },
  CHECKUP_DUE:          { icon: '🩺', label: 'Checkup Due' },
  WEIGHT_CONCERN:       { icon: '⚖️', label: 'Weight Concern' },
  CUSTOM:               { icon: '📋', label: 'Custom Alert' },
};

export default function HealthAlertsPage() {
  const { user } = useAuth();
  const isVet = user?.role === 'VET';
  
  const [filterType, setFilterType] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  
  // Use role-based API call
  const { data, loading, refetch } = useApi(
    () => isVet 
      ? wellnessApi.vetHealthAlerts({ 
          type: filterType !== 'ALL' ? filterType : undefined,
          severity: filterSeverity !== 'ALL' ? filterSeverity : undefined 
        })
      : wellnessApi.listHealthAlerts(),
    null,
    [filterType, filterSeverity]
  );
  
  const alerts = data?.data || data?.results || data || [];

  const handleResolve = async (id) => {
    try {
      await wellnessApi.resolveHealthAlert(id);
      refetch();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      alert('Failed to resolve alert. Please try again.');
    }
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="🚨 Health Alerts" 
        subtitle={isVet ? "System-wide health monitoring alerts" : "Health alerts for your cats"} 
      />

      {/* Filters */}
      {isVet && (
        <div style={{ marginBottom: '1.5rem' }}>
          {/* Alert Type Filter */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Alert Type
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['ALL', 'VACCINATION_DUE', 'VACCINATION_OVERDUE', 'MISSED_DOSE', 'CHECKUP_DUE', 'WEIGHT_CONCERN'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: `2px solid ${filterType === type ? 'var(--cat-terra)' : 'var(--border-default)'}`,
                    background: filterType === type ? 'var(--cat-terra)' : 'var(--surface-card)',
                    color: filterType === type ? 'white' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {type === 'ALL' ? 'All Types' : ALERT_TYPE_CONFIG[type]?.label || type}
                </button>
              ))}
            </div>
          </div>

          {/* Severity Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Severity
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map(severity => {
                const config = SEVERITY_CONFIG[severity];
                return (
                  <button
                    key={severity}
                    onClick={() => setFilterSeverity(severity)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: `2px solid ${filterSeverity === severity ? 'var(--cat-terra)' : 'var(--border-default)'}`,
                      background: filterSeverity === severity ? 'var(--cat-terra)' : 'var(--surface-card)',
                      color: filterSeverity === severity ? 'white' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {severity === 'ALL' ? 'All' : `${config?.icon} ${config?.label}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingSpinner text="Loading health alerts…" />}

      {!loading && alerts.length === 0 && (
        <EmptyState
          icon="✅"
          title="No health alerts"
          message={isVet 
            ? "No health alerts found in the system. All cats appear to be healthy!"
            : "No health alerts for your cats. They appear to be healthy!"
          }
        />
      )}

      {!loading && alerts.length > 0 && (
        <>
          {/* Summary */}
          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9375rem',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}>
            <span style={{ fontSize: '1.25rem' }}>📊</span>
            <span>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{alerts.length}</strong> health alert{alerts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Alerts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {alerts.map(alert => {
              const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.WARNING;
              const typeConfig = ALERT_TYPE_CONFIG[alert.alert_type] || ALERT_TYPE_CONFIG.CUSTOM;
              
              return (
                <div key={alert.id} style={{
                  background: 'var(--surface-card)',
                  border: `1px solid ${alert.severity === 'CRITICAL' ? sev.color : 'var(--border-default)'}`,
                  borderLeft: `4px solid ${sev.color}`,
                  borderRadius: '14px',
                  padding: '1.25rem 1.5rem',
                  boxShadow: alert.severity === 'CRITICAL' ? '0 2px 12px rgba(192,82,78,0.12)' : 'var(--shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = alert.severity === 'CRITICAL' ? '0 2px 12px rgba(192,82,78,0.12)' : 'var(--shadow-sm)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ 
                          background: sev.bg, 
                          color: sev.color, 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '0.3rem 0.625rem', 
                          borderRadius: '999px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {sev.icon} {sev.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {timeAgo(alert.triggered_at)}
                        </span>
                      </div>
                      <h3 style={{ 
                        margin: '0 0 0.5rem', 
                        fontSize: '1.0625rem', 
                        fontWeight: 700, 
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}>
                        <span style={{ fontSize: '1.25rem' }}>{typeConfig.icon}</span>
                        {typeConfig.label}
                      </h3>
                    </div>
                    
                    {/* Cat Link */}
                    {alert.cat && (
                      <Link 
                        to={`/cats/${alert.cat}`} 
                        style={{ 
                          color: 'var(--cat-terra)', 
                          textDecoration: 'none', 
                          fontWeight: 700, 
                          fontSize: '0.9375rem', 
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.5rem 0.875rem',
                          background: 'var(--cat-terra-light)',
                          borderRadius: '8px',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        🐱 {alert.cat_name || 'View cat'} →
                      </Link>
                    )}
                  </div>

                  {/* Alert Message */}
                  <p style={{ 
                    margin: '0 0 1rem', 
                    fontSize: '0.9375rem', 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.6 
                  }}>
                    {alert.message}
                  </p>

                  {/* Action Button */}
                  {!alert.is_resolved && (
                    <button 
                      onClick={() => handleResolve(alert.id)} 
                      className="btn btn-primary"
                      style={{
                        fontSize: '0.875rem',
                        padding: '0.625rem 1.25rem',
                      }}
                    >
                      ✅ Mark as Resolved
                    </button>
                  )}
                  
                  {alert.is_resolved && (
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--cat-sage)', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      ✅ Resolved{alert.resolved_at ? ` on ${formatDate(alert.resolved_at)}` : ''}
                      {alert.resolved_by_name && (
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
                          by {alert.resolved_by_name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}