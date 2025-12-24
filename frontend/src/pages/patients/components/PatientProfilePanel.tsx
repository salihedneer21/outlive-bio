import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { AdminPatient, AdminComprehensiveIntake, AdminPatientProfile } from '@outlive/shared';
import { getPatientComprehensiveIntake, getPatientProfile } from '@/api/patients';

type PanelTab = 'profile' | 'chats' | 'care-plan' | 'labs' | 'files';

interface PatientProfilePanelProps {
  patient: AdminPatient | null;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

const formatDate = (value: string | null | undefined): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

const formatDateWithAge = (value: string | null | undefined): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  return `${date.toLocaleDateString()} (${age} yrs)`;
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const formatHeight = (heightInches: number | null): string => {
  if (!heightInches || Number.isNaN(heightInches)) return 'N/A';
  const feet = Math.floor(heightInches / 12);
  const inches = heightInches % 12;
  return `${feet}'${inches ? ` ${inches}"` : ''}`;
};

// ============================================================================
// Sub-Components
// ============================================================================

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0">{label}</span>
    <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 text-right">
      {value || 'N/A'}
    </span>
  </div>
);

const SectionCard: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, children, className = '' }) => (
  <div className={`rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 ${className}`}>
    <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
      {icon && <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>}
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
        {title}
      </h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const TagList: React.FC<{ values: string[] | null | undefined }> = ({ values }) => {
  if (!values || values.length === 0) return <span className="text-xs text-neutral-400">None</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          {value}
        </span>
      ))}
    </div>
  );
};

const ImageThumbnail: React.FC<{
  label: string;
  url: string | null | undefined;
  onExpand: (url: string, label: string) => void;
}> = ({ label, url, onExpand }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!url) {
    return (
      <div className="flex flex-col">
        <span className="mb-2 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
        <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">No file</span>
        </div>
      </div>
    );
  }

  const isPdf = url.toLowerCase().includes('.pdf');

  return (
    <div className="flex flex-col">
      <span className="mb-2 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      {isPdf ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex aspect-[4/3] items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 2a2 2 0 00-2 2v16c0 1.1.9 2 2 2h7.5a2 2 0 001.414-.586l3.5-3.5A2 2 0 0019 17.5V4a2 2 0 00-2-2H6zm0 2h11v13.5L15.5 19H6V4z" />
          </svg>
          <span className="text-[10px] font-medium">View PDF</span>
        </a>
      ) : (
        <button
          type="button"
          onClick={() => onExpand(url, label)}
          className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600 dark:border-neutral-600 dark:border-t-neutral-300" />
            </div>
          )}
          {hasError ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2">
              <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] text-neutral-400">Failed to load</span>
            </div>
          ) : (
            <img
              src={url}
              alt={label}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-200 group-hover:scale-105 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <svg className="h-4 w-4 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        </button>
      )}
    </div>
  );
};

const ImageLightbox: React.FC<{
  url: string;
  label: string;
  onClose: () => void;
}> = ({ url, label, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === '+' || e.key === '=') setScale((s) => Math.min(s + 0.25, 3));
    else if (e.key === '-') setScale((s) => Math.max(s - 0.25, 0.5));
    else if (e.key === '0') {
      setScale(1);
      setRotation(0);
    }
    else if (e.key === 'r' || e.key === 'R') setRotation((r) => (r + 90) % 360);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-950"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Label */}
      <div className="absolute left-4 top-4 z-20 rounded-lg bg-black/50 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
        {label}
      </div>

      {/* Controls */}
      <div
        className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/60 px-3 py-2 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zoom out */}
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          title="Zoom out (-)"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>

        {/* Zoom percentage */}
        <span className="min-w-[3.5rem] text-center text-xs font-medium text-white/80">
          {Math.round(scale * 100)}%
        </span>

        {/* Zoom in */}
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          title="Zoom in (+)"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>

        <div className="mx-1 h-5 w-px bg-white/20" />

        {/* Rotate left */}
        <button
          type="button"
          onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          title="Rotate left"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        {/* Rotate right */}
        <button
          type="button"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          title="Rotate right (R)"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        <div className="mx-1 h-5 w-px bg-white/20" />

        {/* Reset */}
        <button
          type="button"
          onClick={handleReset}
          className="flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          title="Reset (0)"
        >
          Reset
        </button>

        {/* Open in new tab */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          title="Open in new tab"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Image container */}
      <div
        className="flex h-full w-full items-center justify-center p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={label}
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}> = ({ active, onClick, label, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative whitespace-nowrap px-4 py-3 text-xs font-medium transition-colors ${
      active
        ? 'text-neutral-900 dark:text-white'
        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
    }`}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-semibold text-white">
        {count}
      </span>
    )}
    {active && (
      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white" />
    )}
  </button>
);

const PlaceholderTab: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex flex-1 flex-col items-center justify-center p-8">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
      {icon}
    </div>
    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{title}</h4>
    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Coming soon</p>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const PatientProfilePanel: React.FC<PatientProfilePanelProps> = ({
  patient,
  isOpen,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>('profile');
  const [profile, setProfile] = useState<AdminPatientProfile | null>(null);
  const [comprehensiveIntake, setComprehensiveIntake] = useState<AdminComprehensiveIntake | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    if (!isOpen || !patient) {
      setProfile(null);
      setComprehensiveIntake(null);
      setError(null);
      setIsLoading(false);
      setIsExpanded(false);
      setActiveTab('profile');
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [profileRes, intakeRes] = await Promise.all([
          getPatientProfile(patient.id),
          getPatientComprehensiveIntake(patient.id)
        ]);
        setProfile(profileRes.data.profile ?? null);
        setComprehensiveIntake(intakeRes.data.comprehensiveIntake ?? null);
      } catch (err) {
        setError(
          typeof err === 'object' && err && 'message' in err
            ? (err as { message?: string }).message ?? 'Failed to load'
            : 'Failed to load'
        );
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [isOpen, patient]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lightboxImage) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, lightboxImage]);

  if (!patient || !isOpen) return null;

  const fullName = patient.name.full || 'Unknown';
  const intakeStatus = patient.intake.status;
  const statusColors = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    not_started: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
  };

  const renderProfileTab = () => {
    if (isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600 dark:border-neutral-700 dark:border-t-neutral-300" />
            <span className="text-xs text-neutral-500">Loading...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="m-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {/* Profile Section */}
          {profile && (
            <>
              <SectionCard
                title="Profile"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              >
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <InfoRow label="Phone" value={profile.phone} />
                  <InfoRow label="Date of birth" value={formatDateWithAge(profile.dateOfBirth)} />
                  <InfoRow label="Height / Weight" value={`${formatHeight(profile.heightInches)} / ${profile.weight != null ? `${profile.weight} lbs` : 'N/A'}`} />
                  <InfoRow
                    label="Address"
                    value={
                      profile.address.street
                        ? `${profile.address.street}, ${profile.address.city}, ${profile.address.state?.toUpperCase()} ${profile.address.zipCode}`
                        : null
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Lab & Phlebotomy"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                }
              >
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <InfoRow label="Lab Provider" value={profile.lab.labProvider || 'Not assigned'} />
                  <InfoRow label="Phlebotomy Eligible" value={profile.lab.phlebotomyEligible ? 'Yes' : 'No'} />
                  <InfoRow label="At-Home Phlebotomy" value={profile.lab.requiresAtHomePhlebotomy ? 'Yes' : 'No'} />
                  <InfoRow label="Subscription Tier" value={profile.lab.subscriptionTier} />
                  <InfoRow label="Test Ordered" value={profile.lab.testOrdered ? 'Yes' : 'No'} />
                  <InfoRow label="Ordered At" value={formatDateTime(profile.lab.testOrderedAt)} />
                </div>
              </SectionCard>

              <SectionCard
                title="Documents"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                <div className="grid grid-cols-3 gap-3">
                  <ImageThumbnail
                    label="Driver's License"
                    url={profile.driversLicenseUrl}
                    onExpand={(url, label) => setLightboxImage({ url, label })}
                  />
                  <ImageThumbnail
                    label="Profile Picture"
                    url={profile.profilePictureUrl}
                    onExpand={(url, label) => setLightboxImage({ url, label })}
                  />
                  <ImageThumbnail
                    label="Consent Signature"
                    url={profile.consents.consentSignatureUrl}
                    onExpand={(url, label) => setLightboxImage({ url, label })}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Consents"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <InfoRow label="Intake Completed" value={formatDateTime(profile.intakeCompletedAt)} />
                  <InfoRow label="Refund Policy" value={formatDateTime(profile.consents.refundPolicyConsentDate)} />
                  <InfoRow label="Terms & Conditions" value={formatDateTime(profile.consents.termsConditionsConsentDate)} />
                  <InfoRow label="Privacy Policy" value={formatDateTime(profile.consents.privacyPolicyConsentDate)} />
                </div>
              </SectionCard>
            </>
          )}

          {/* Comprehensive Intake Section */}
          {comprehensiveIntake && (
            <>
              <SectionCard
                title="Comprehensive Intake"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      comprehensiveIntake.completed
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {comprehensiveIntake.completed ? 'Completed' : 'In Progress'}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {comprehensiveIntake.completed
                      ? formatDateTime(comprehensiveIntake.completedAt)
                      : `Updated: ${formatDateTime(comprehensiveIntake.updatedAt)}`}
                  </span>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <InfoRow label="Occupation" value={comprehensiveIntake.occupation} />
                  <InfoRow label="Typical Schedule" value={comprehensiveIntake.typicalWeekdaySchedule} />
                  <InfoRow label="Travel Frequently" value={comprehensiveIntake.travelFrequently === null ? 'N/A' : comprehensiveIntake.travelFrequently ? 'Yes' : 'No'} />
                </div>
              </SectionCard>

              <SectionCard
                title="Exercise & Fitness"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                }
              >
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <InfoRow label="Cardio (days/week)" value={comprehensiveIntake.cardioDaysPerWeek ?? 'N/A'} />
                  <InfoRow label="Strength (days/week)" value={comprehensiveIntake.strengthDaysPerWeek ?? 'N/A'} />
                  <InfoRow label="Mobility (days/week)" value={comprehensiveIntake.mobilityDaysPerWeek ?? 'N/A'} />
                  <InfoRow label="Injury History" value={comprehensiveIntake.injuryHistory} />
                </div>
              </SectionCard>

              <SectionCard
                title="Sleep & Nutrition"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                }
              >
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <InfoRow label="Sleep Quality" value={comprehensiveIntake.sleepQuality} />
                  <InfoRow label="Current Diet" value={comprehensiveIntake.currentDiet} />
                  <InfoRow label="Nutrition Assessment" value={comprehensiveIntake.nutritionSelfAssessment} />
                  <InfoRow label="Diet History" value={comprehensiveIntake.dietHistory} />
                  <InfoRow label="Diet (Other)" value={comprehensiveIntake.dietOther} />
                  <InfoRow label="Snoring" value={comprehensiveIntake.snoring} />
                  <div className="py-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Sleep Issues</span>
                    <div className="mt-1.5"><TagList values={comprehensiveIntake.sleepIssues} /></div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Alcohol & Nicotine"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                }
              >
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <InfoRow label="Alcohol Frequency" value={comprehensiveIntake.alcoholFrequency} />
                  <InfoRow label="Drinks Per Day" value={comprehensiveIntake.alcoholDrinksPerDay} />
                  <InfoRow label="Binge Drinking" value={comprehensiveIntake.alcoholBingeDrinking} />
                  <InfoRow label="Nicotine Use" value={comprehensiveIntake.nicotineUse === null ? 'N/A' : comprehensiveIntake.nicotineUse ? 'Yes' : 'No'} />
                  {comprehensiveIntake.nicotineUse && (
                    <>
                      <InfoRow label="Nicotine Type" value={comprehensiveIntake.nicotineType} />
                      <InfoRow label="Nicotine Frequency" value={comprehensiveIntake.nicotineFrequency} />
                    </>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Medical History"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                }
              >
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <InfoRow label="Last Physical Exam" value={comprehensiveIntake.lastPhysicalExam} />
                  <InfoRow label="Stress Level" value={comprehensiveIntake.stressLevel} />
                  <InfoRow label="Cancer Type" value={comprehensiveIntake.cancerType} />
                  <InfoRow label="Other Medical Condition" value={comprehensiveIntake.otherMedicalCondition} />
                  <InfoRow label="Other Conditions" value={comprehensiveIntake.otherConditions} />
                  <InfoRow
                    label="Family Risk Profile"
                    value={
                      Array.isArray(comprehensiveIntake.familyMembers)
                        ? `${comprehensiveIntake.familyMembers.length} relative(s)`
                        : 'None'
                    }
                  />
                  <div className="py-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Medical Conditions</span>
                    <div className="mt-1.5"><TagList values={comprehensiveIntake.medicalConditions} /></div>
                  </div>
                  <div className="py-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Screenings Completed</span>
                    <div className="mt-1.5"><TagList values={comprehensiveIntake.screeningsCompleted} /></div>
                  </div>
                  <InfoRow
                    label="Uploaded Lab IDs"
                    value={comprehensiveIntake.uploadedLabIds?.length ? comprehensiveIntake.uploadedLabIds.join(', ') : 'None'}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Health Priorities & Goals"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              >
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <div className="py-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Health Priorities</span>
                    <div className="mt-1.5"><TagList values={comprehensiveIntake.healthPriorities} /></div>
                  </div>
                  <InfoRow label="Other Health Priority" value={comprehensiveIntake.otherHealthPriority} />
                  <InfoRow label="Why These Matter" value={comprehensiveIntake.prioritiesReason} />
                  <InfoRow label="Biggest Difficulties" value={comprehensiveIntake.biggestDifficulties} />
                  <InfoRow label="Expectations" value={comprehensiveIntake.experienceExpectations} />
                  <InfoRow label="Involvement Level" value={comprehensiveIntake.involvementLevel} />
                  <InfoRow label="Data Research Permission" value={comprehensiveIntake.dataResearchPermission === null ? 'N/A' : comprehensiveIntake.dataResearchPermission ? 'Yes' : 'No'} />
                </div>
              </SectionCard>

            </>
          )}

          {!profile && !comprehensiveIntake && !isLoading && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 p-8 dark:border-neutral-700">
              <svg className="mb-2 h-10 w-10 text-neutral-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No intake data</p>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Patient has not completed intake</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'chats':
        return (
          <PlaceholderTab
            title="Chats"
            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
          />
        );
      case 'care-plan':
        return (
          <PlaceholderTab
            title="Care Plan"
            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
          />
        );
      case 'labs':
        return (
          <PlaceholderTab
            title="Lab Results"
            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
          />
        );
      case 'files':
        return (
          <PlaceholderTab
            title="Files"
            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
          />
        );
      default:
        return null;
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden bg-neutral-50 shadow-2xl transition-all duration-300 ease-out dark:bg-neutral-950 ${
          isExpanded
            ? 'left-0'
            : 'w-full sm:w-[420px] md:w-[480px] lg:w-[520px] xl:w-[580px]'
        } ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="shrink-0 bg-white dark:bg-neutral-900">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 lg:flex dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>

          {/* Profile section */}
          <div className="px-4 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {fullName}
                </h2>
                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                  {patient.email || 'No email'}
                </p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${statusColors[intakeStatus] || statusColors.not_started}`}>
                {patient.intake.step?.replace(/_/g, ' ') || 'Not started'}
              </span>
            </div>

            {/* Info row */}
            <div className="mt-4 flex gap-6 text-xs">
              <div>
                <div className="text-neutral-400 dark:text-neutral-500">Phone</div>
                <div className="mt-0.5 font-medium text-neutral-900 dark:text-neutral-100">{patient.phone || 'N/A'}</div>
              </div>
              <div>
                <div className="text-neutral-400 dark:text-neutral-500">Birthday</div>
                <div className="mt-0.5 font-medium text-neutral-900 dark:text-neutral-100">{formatDate(patient.dateOfBirth)}</div>
              </div>
              <div>
                <div className="text-neutral-400 dark:text-neutral-500">Sex</div>
                <div className="mt-0.5 font-medium text-neutral-900 dark:text-neutral-100">{patient.sexAtBirth?.toUpperCase() || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 overflow-x-auto border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex">
            <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Profile" />
            <TabButton active={activeTab === 'chats'} onClick={() => setActiveTab('chats')} label="Chats" count={0} />
            <TabButton active={activeTab === 'care-plan'} onClick={() => setActiveTab('care-plan')} label="Care Plan" />
            <TabButton active={activeTab === 'labs'} onClick={() => setActiveTab('labs')} label="Labs" />
            <TabButton active={activeTab === 'files'} onClick={() => setActiveTab('files')} label="Files" />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {renderTabContent()}
        </div>
      </div>

      {/* Image Lightbox - rendered outside panel for true full-screen overlay */}
      {lightboxImage && (
        <ImageLightbox
          url={lightboxImage.url}
          label={lightboxImage.label}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>,
    document.body
  );
};
