import { useState, useEffect, useCallback } from 'react';
import { externalContactSchema, validateWithSchema } from '../utils/validation';

const initialFormState = {
  name: '',
  phone: '',
  address: '',
  relationship: '',
};

const getInitialFormData = (data) => {
  if (!data) return { ...initialFormState };
  const { name, phone, address, relationship } = data;
  return {
    name: name || '',
    phone: phone || '',
    address: address || '',
    relationship: relationship || '',
  };
};

export const useExternalContactForm = ({
  initialData,
  onSubmit,
  isEditMode,
  externalIsSubmitting,
}) => {
  const [formData, setFormData] = useState(() => getInitialFormData(initialData));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(getInitialFormData(initialData));
    }
  }, [initialData]);

  const clearError = useCallback((fieldName) => {
    setErrors((prev) => (prev[fieldName] ? { ...prev, [fieldName]: '' } : prev));
  }, []);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      clearError(name);
    },
    [clearError]
  );

  const handleRelationshipChange = useCallback(
    (value) => {
      setFormData((prev) => ({ ...prev, relationship: value }));
      clearError('relationship');
    },
    [clearError]
  );

  const handleSubmitSuccess = useCallback(() => {
    if (!isEditMode) {
      setFormData(initialFormState);
      setErrors({});
    }
  }, [isEditMode]);

  const handleSubmitError = useCallback((error) => {
    console.error('Error submitting form:', error);
    const isNetworkError = error.message?.includes('network');
    const message = isNetworkError
      ? 'Network error. Please check your connection and try again.'
      : error.message || 'Failed to save contact. Please try again.';

    setErrors({ submit: message });
  }, []);

  const processSubmission = async (data) => {
    try {
      await onSubmit(data);
      handleSubmitSuccess();
    } catch (error) {
      handleSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting || externalIsSubmitting) return;

    const {
      isValid,
      errors: validationErrors,
      data: sanitizedData,
    } = validateWithSchema(externalContactSchema, formData);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    await processSubmission(sanitizedData);
  };

  return {
    formData,
    errors,
    handleChange,
    handleRelationshipChange,
    handleSubmit,
    submitting: isSubmitting || externalIsSubmitting,
  };
};
