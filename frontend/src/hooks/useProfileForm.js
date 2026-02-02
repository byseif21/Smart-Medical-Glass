import { useState, useMemo, useCallback } from 'react';
import { updateMainInfo } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { profileUpdateSchema } from '../utils/validation';
import { useForm } from './useForm';

const initialFormState = {
  name: '',
  phone: '',
  date_of_birth: '',
  nationality: '',
  gender: '',
  id_number: '',
};

const getFormDataFromProfile = (profileData) => {
  if (!profileData) return initialFormState;

  const { name, phone, date_of_birth, nationality, gender, id_number } = profileData;

  return {
    name: name || '',
    phone: phone || '',
    date_of_birth: date_of_birth || '',
    nationality: nationality || '',
    gender: gender || '',
    id_number: id_number || '',
  };
};

export const useProfileForm = (profile, targetUserId, onUpdate) => {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  const initialValues = useMemo(() => getFormDataFromProfile(profile), [profile]);

  const handleFormSubmit = useCallback(
    async (data) => {
      const userId = targetUserId || user?.id;
      const result = await updateMainInfo(userId, data);

      if (result.success) {
        setIsEditing(false);
        onUpdate({ silent: true });
      } else {
        // TODO: replace alert with GeneralModal (unified app modal) for error feedback
        alert('Failed to update: ' + result.error);
        // We throw to let useForm know it failed, although we already alerted.
        throw new Error(result.error);
      }
    },
    [targetUserId, user, onUpdate]
  );

  const {
    formData,
    errors,
    isSubmitting: loading,
    handleChange,
    handleSubmit,
    reset,
  } = useForm({
    initialValues,
    schema: profileUpdateSchema,
    onSubmit: handleFormSubmit,
  });

  const handleSave = async () => {
    await handleSubmit();
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return {
    formData,
    errors,
    loading,
    isEditing,
    setIsEditing,
    handleChange,
    handleSave,
    handleCancel,
  };
};
