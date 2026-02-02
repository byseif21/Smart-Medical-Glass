import { useState, useEffect } from 'react';
import { updateMainInfo } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { profileUpdateSchema, validateWithSchema } from '../utils/validation';

const INITIAL_FORM_STATE = {
  name: '',
  phone: '',
  date_of_birth: '',
  nationality: '',
  gender: '',
  id_number: '',
};

const getFormDataFromProfile = (profileData) => {
  if (!profileData) return INITIAL_FORM_STATE;

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
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setFormData(getFormDataFromProfile(profile));
    setErrors({});
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSave = async () => {
    const {
      isValid,
      errors: validationErrors,
      data: sanitizedData,
    } = validateWithSchema(profileUpdateSchema, formData);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const userId = targetUserId || user?.id;
    try {
      const result = await updateMainInfo(userId, sanitizedData);

      if (result.success) {
        setIsEditing(false);
        onUpdate({ silent: true });
      } else {
        // TODO: replace alert with GeneralModal (unified app modal) for error feedback
        alert('Failed to update: ' + result.error);
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(getFormDataFromProfile(profile));
    setIsEditing(false);
    setErrors({});
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
