import { useState } from 'react';
import { updateMedicalInfo } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const initialFormState = {
  health_history: '',
  chronic_conditions: '',
  allergies: '',
  current_medications: '',
  previous_surgeries: '',
  emergency_notes: '',
};

const getMedicalFormData = (medicalInfo) => {
  if (!medicalInfo) return { ...initialFormState };

  return {
    health_history: medicalInfo.health_history || '',
    chronic_conditions: medicalInfo.chronic_conditions || '',
    allergies: medicalInfo.allergies || '',
    current_medications: medicalInfo.current_medications || '',
    previous_surgeries: medicalInfo.previous_surgeries || '',
    emergency_notes: medicalInfo.emergency_notes || '',
  };
};

const useMedicalFormData = (profile) => {
  const [prevMedicalInfoStr, setPrevMedicalInfoStr] = useState(
    JSON.stringify(profile?.medical_info)
  );
  const [formData, setFormData] = useState(() => getMedicalFormData(profile?.medical_info));

  const currentMedicalInfoStr = JSON.stringify(profile?.medical_info);
  if (currentMedicalInfoStr !== prevMedicalInfoStr) {
    setPrevMedicalInfoStr(currentMedicalInfoStr);
    if (profile?.medical_info) {
      setFormData(getMedicalFormData(profile.medical_info));
    }
  }

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(getMedicalFormData(profile?.medical_info));
  };

  return { formData, updateField, resetForm };
};

export const useMedicalInfo = (profile, onUpdate, targetUserId = null) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { formData, updateField, resetForm } = useMedicalFormData(profile);
  const { user } = useAuth();

  const handleChange = (e) => {
    updateField(e.target.name, e.target.value);
  };

  const handleSave = async () => {
    // Identify fields that were non-empty before and are now being cleared
    const prevInfo = profile?.medical_info || {};

    const clearedFields = Object.keys(formData)
      .filter((key) => (prevInfo[key] || '').trim() && !(formData[key] || '').trim())
      .map((key) =>
        key
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      );

    if (clearedFields.length > 0) {
      const confirmMessage = `You are about to clear the following fields:\n- ${clearedFields.join('\n- ')}\n\nAre you sure you want to proceed?`;
      // TODO: replace alert with GeneralModal (unified app modal) for confirmation feedback
      if (!window.confirm(confirmMessage)) return;
    }

    setLoading(true);
    const userId = targetUserId || user?.id;
    const result = await updateMedicalInfo(userId, formData);

    if (result.success) {
      setIsEditing(false);
      onUpdate({ silent: true });
    } else {
      // TODO: replace alert with GeneralModal (unified app modal) for error feedback
      alert('Failed to update: ' + result.error);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    resetForm();
    setIsEditing(false);
  };

  return {
    isEditing,
    setIsEditing,
    loading,
    formData,
    handleChange,
    handleSave,
    handleCancel,
  };
};
