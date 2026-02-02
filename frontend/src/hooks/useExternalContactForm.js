import { useMemo, useCallback } from 'react';
import { externalContactSchema } from '../utils/validation';
import { useForm } from './useForm';

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

const submitContactForm = async (onSubmit, data) => {
  try {
    await onSubmit(data);
  } catch (error) {
    const isNetworkError = error.message?.includes('network');
    const message = isNetworkError
      ? 'Network error. Please check your connection and try again.'
      : error.message || 'Failed to save contact. Please try again.';
    throw new Error(message);
  }
};

export const useExternalContactForm = ({
  initialData,
  onSubmit,
  isEditMode,
  externalIsSubmitting,
}) => {
  const initialValues = useMemo(() => getInitialFormData(initialData), [initialData]);

  const handleFormSubmit = useCallback((data) => submitContactForm(onSubmit, data), [onSubmit]);

  const { formData, errors, isSubmitting, handleChange, setValue, handleSubmit, reset } = useForm({
    initialValues,
    schema: externalContactSchema,
    onSubmit: handleFormSubmit,
  });

  const wrappedHandleSubmit = async (e) => {
    const success = await handleSubmit(e);
    if (success && !isEditMode) {
      reset();
    }
  };

  return {
    formData,
    errors,
    handleChange,
    handleRelationshipChange: (value) => setValue('relationship', value),
    handleSubmit: wrappedHandleSubmit,
    submitting: isSubmitting || externalIsSubmitting,
  };
};
