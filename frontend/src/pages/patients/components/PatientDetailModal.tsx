import React, { useEffect, useState } from 'react';
import type { AdminPatient, AdminComprehensiveIntake, AdminPatientProfile } from '@outlive/shared';
import { Modal } from '@/components/Modal';
import { ImageViewer } from '@/components/ImageViewer';
import { getPatientComprehensiveIntake, getPatientProfile } from '@/api/patients';

interface PatientDetailModalProps {
  patient: AdminPatient | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
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
  return `${feet}′${inches ? ` ${inches}″` : ''}`;
};

const TagList: React.FC<{ label: string; values: string[] | null | undefined }> = ({
  label,
  values
}) => {
  if (!values || values.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
};

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  isOpen,
  onClose
}) => {
  const [profile, setProfile] = useState<AdminPatientProfile | null>(null);
  const [comprehensiveIntake, setComprehensiveIntake] = useState<AdminComprehensiveIntake | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !patient) {
      setProfile(null);
      setComprehensiveIntake(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [profileResponse, intakeResponse] = await Promise.all([
          getPatientProfile(patient.id),
          getPatientComprehensiveIntake(patient.id)
        ]);

        setProfile(profileResponse.data.profile ?? null);
        setComprehensiveIntake(intakeResponse.data.comprehensiveIntake ?? null);
      } catch (err) {
        const message =
          typeof err === 'object' && err && 'message' in err
            ? (err as { message?: string }).message ?? 'Failed to load patient details'
            : 'Failed to load patient details';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [isOpen, patient]);

  if (!patient) return null;

  const fullName = patient.name.full || 'N/A';
  const intakeStatus = patient.intake.status;

  const intakeClasses =
    intakeStatus === 'completed'
      ? 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:bg-emerald-950'
      : intakeStatus === 'in_progress'
      ? 'border-amber-500 text-amber-700 bg-amber-50 dark:border-amber-500 dark:text-amber-300 dark:bg-amber-950'
      : 'border-neutral-300 text-neutral-700 bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:bg-neutral-800';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Patient intake details"
      size="xl"
      error={error}
    >
      <div className="space-y-6">
        {/* Summary */}
        <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {fullName}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              {patient.email || 'No email on file'}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-neutral-600 dark:text-neutral-400">
              <span>Phone: {patient.phone || 'N/A'}</span>
              <span>DOB: {formatDate(patient.dateOfBirth)}</span>
              <span>Sex at birth: {patient.sexAtBirth?.toUpperCase() || 'N/A'}</span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase ${intakeClasses}`}
            >
              {patient.intake.step ? patient.intake.step.replace(/_/g, ' ') : 'Not started'}
            </span>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Registered: {formatDateTime(patient.registrationDate)}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Intake completed:{' '}
              {patient.intake.completedAt ? formatDateTime(patient.intake.completedAt) : 'N/A'}
            </div>
          </div>
        </section>

        {isLoading && (
          <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            Loading intake details...
          </div>
        )}

        {!isLoading && (
          <>
            {/* Profile section */}
            <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    Profile
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Demographics, address and lab assignment.
                  </p>
                </div>
              </div>

              {profile ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Phone
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {profile.phone || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Date of birth
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {formatDate(profile.dateOfBirth)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Profile height / weight
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {formatHeight(profile.heightInches)} /{' '}
                        {profile.weight != null ? `${profile.weight} lbs` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Address
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100 space-y-0.5">
                        <div>{profile.address.street || 'N/A'}</div>
                        <div>
                          {profile.address.city || 'N/A'},{' '}
                          {profile.address.state?.toUpperCase() || 'N/A'}{' '}
                          {profile.address.zipCode || ''}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Lab &amp; phlebotomy
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100 space-y-0.5">
                        <div>
                          Provider:{' '}
                          {profile.lab.labProvider || 'Not assigned'}
                        </div>
                        <div>
                          Phlebotomy eligible:{' '}
                          {profile.lab.phlebotomyEligible ? 'Yes' : 'No'}
                        </div>
                        <div>
                          Requires at-home phlebotomy:{' '}
                          {profile.lab.requiresAtHomePhlebotomy ? 'Yes' : 'No'}
                        </div>
                        <div>
                          Selected phlebotomy:{' '}
                          {profile.lab.selectedPhlebotomy ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Subscription / test &amp; order
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100 space-y-0.5">
                        <div>
                          Tier:{' '}
                          {profile.lab.subscriptionTier
                            ? profile.lab.subscriptionTier
                            : 'N/A'}
                        </div>
                        <div>
                          Pre-selected test:{' '}
                          {profile.lab.preSelectedTestId || 'N/A'}
                        </div>
                        <div>
                          Test ordered:{' '}
                          {profile.lab.testOrdered ? 'Yes' : 'No'}
                        </div>
                        <div>
                          Ordered at:{' '}
                          {profile.lab.testOrderedAt
                            ? formatDateTime(profile.lab.testOrderedAt)
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <ImageViewer
                        label="Driver's license"
                        url={profile.driversLicenseUrl}
                      />
                      <ImageViewer
                        label="Profile picture"
                        url={profile.profilePictureUrl}
                      />
                      <ImageViewer
                        label="Consent signature"
                        url={profile.consents.consentSignatureUrl}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-4">
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Intake completed at
                        </div>
                        <div className="text-xs text-neutral-900 dark:text-neutral-100">
                          {formatDateTime(profile.intakeCompletedAt)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Refund policy consent
                        </div>
                        <div className="text-xs text-neutral-900 dark:text-neutral-100">
                          {formatDateTime(profile.consents.refundPolicyConsentDate)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Terms &amp; conditions consent
                        </div>
                        <div className="text-xs text-neutral-900 dark:text-neutral-100">
                          {formatDateTime(profile.consents.termsConditionsConsentDate)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Privacy policy consent
                        </div>
                        <div className="text-xs text-neutral-900 dark:text-neutral-100">
                          {formatDateTime(profile.consents.privacyPolicyConsentDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-neutral-200 p-3 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                  No profile information found for this patient.
                </div>
              )}
            </section>

            {/* Comprehensive intake section */}
            <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    Comprehensive intake
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Questionnaire responses from the comprehensive intake flow.
                  </p>
                </div>
                {comprehensiveIntake && (
                  <div className="space-y-0.5 text-[11px] text-right text-neutral-500 dark:text-neutral-400">
                    <div>
                      {comprehensiveIntake.completed
                        ? `Completed: ${formatDateTime(comprehensiveIntake.completedAt)}`
                        : 'Not completed'}
                    </div>
                    <div>
                      Created: {formatDateTime(comprehensiveIntake.createdAt)}
                    </div>
                    <div>
                      Updated: {formatDateTime(comprehensiveIntake.updatedAt)}
                    </div>
                  </div>
                )}
              </div>

              {comprehensiveIntake ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Occupation
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.occupation || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Typical weekday schedule
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.typicalWeekdaySchedule || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Travel frequently
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.travelFrequently === null
                          ? 'N/A'
                          : comprehensiveIntake.travelFrequently
                          ? 'Yes'
                          : 'No'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Exercise days / week
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100 space-y-0.5">
                        <div>
                          Cardio:{' '}
                          {comprehensiveIntake.cardioDaysPerWeek ?? 'N/A'}
                        </div>
                        <div>
                          Strength:{' '}
                          {comprehensiveIntake.strengthDaysPerWeek ?? 'N/A'}
                        </div>
                        <div>
                          Mobility:{' '}
                          {comprehensiveIntake.mobilityDaysPerWeek ?? 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Injury history
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.injuryHistory || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Sleep quality
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.sleepQuality || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Current diet
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.currentDiet || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Nutrition self-assessment
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.nutritionSelfAssessment || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Diet history
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.dietHistory || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Diet (other)
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.dietOther || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <TagList
                      label="Sleep issues"
                      values={comprehensiveIntake.sleepIssues}
                    />
                    <TagList
                      label="Health priorities"
                      values={comprehensiveIntake.healthPriorities}
                    />
                    <TagList
                      label="Medical conditions"
                      values={comprehensiveIntake.medicalConditions}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Alcohol use
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100 space-y-0.5">
                        <div>
                          Frequency:{' '}
                          {comprehensiveIntake.alcoholFrequency || 'N/A'}
                        </div>
                        <div>
                          Drinks / day:{' '}
                          {comprehensiveIntake.alcoholDrinksPerDay || 'N/A'}
                        </div>
                        <div>
                          Binge:{' '}
                          {comprehensiveIntake.alcoholBingeDrinking || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Nicotine use
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100 space-y-0.5">
                        <div>
                          Uses nicotine:{' '}
                          {comprehensiveIntake.nicotineUse === null
                            ? 'N/A'
                            : comprehensiveIntake.nicotineUse
                            ? 'Yes'
                            : 'No'}
                        </div>
                        {comprehensiveIntake.nicotineUse && (
                          <>
                            <div>
                              Type:{' '}
                              {comprehensiveIntake.nicotineType || 'N/A'}
                            </div>
                            <div>
                              Frequency:{' '}
                              {comprehensiveIntake.nicotineFrequency || 'N/A'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Biggest difficulties
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.biggestDifficulties || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Last physical exam
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.lastPhysicalExam || 'N/A'}
                      </div>
                    </div>
                    <TagList
                      label="Screenings completed"
                      values={comprehensiveIntake.screeningsCompleted}
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Uploaded lab IDs
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.uploadedLabIds &&
                        comprehensiveIntake.uploadedLabIds.length > 0
                          ? comprehensiveIntake.uploadedLabIds.join(', ')
                          : 'None'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Intake height / weight
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {(() => {
                          const height =
                            comprehensiveIntake.heightUnit === 'ft-in'
                              ? `${comprehensiveIntake.heightFeet || '–'}′${comprehensiveIntake.heightInches ? ` ${comprehensiveIntake.heightInches}″` : ''}`
                              : comprehensiveIntake.height && comprehensiveIntake.heightUnit
                              ? `${comprehensiveIntake.height} ${comprehensiveIntake.heightUnit}`
                              : 'N/A';
                          const weight = comprehensiveIntake.currentWeight
                            ? `${comprehensiveIntake.currentWeight} ${comprehensiveIntake.weightUnit || ''}`.trim()
                            : 'N/A';
                          return `${height} / ${weight}`;
                        })()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Involvement level
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.involvementLevel || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Data research permission
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.dataResearchPermission === null
                          ? 'N/A'
                          : comprehensiveIntake.dataResearchPermission
                          ? 'Yes'
                          : 'No'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Stress level
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.stressLevel || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Cancer type
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.cancerType || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        Other medical condition
                      </div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {comprehensiveIntake.otherMedicalCondition || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Other conditions (free text)
                    </div>
                    <div className="text-sm text-neutral-900 dark:text-neutral-100">
                      {comprehensiveIntake.otherConditions || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Family risk profile
                    </div>
                    <div className="text-sm text-neutral-900 dark:text-neutral-100">
                      {Array.isArray(comprehensiveIntake.familyMembers)
                        ? `${comprehensiveIntake.familyMembers.length} relative(s) recorded`
                        : 'None recorded'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Expectations
                    </div>
                    <div className="text-sm text-neutral-900 dark:text-neutral-100">
                      {comprehensiveIntake.experienceExpectations || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Why these health priorities matter
                    </div>
                    <div className="text-sm text-neutral-900 dark:text-neutral-100">
                      {comprehensiveIntake.prioritiesReason || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Other health priority
                    </div>
                    <div className="text-sm text-neutral-900 dark:text-neutral-100">
                      {comprehensiveIntake.otherHealthPriority || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Snoring screening
                    </div>
                    <div className="text-sm text-neutral-900 dark:text-neutral-100">
                      {comprehensiveIntake.snoring || 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-neutral-200 p-3 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                  No comprehensive intake responses found for this patient.
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Modal>
  );
};
