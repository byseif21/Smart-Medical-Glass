import { useState, useCallback } from 'react';
import { validateWithSchema } from '../utils/validation';

const handleValidation = (schema, formData) => {
  if (!schema) return { isValid: true, data: formData };
  return validateWithSchema(schema, formData);
};

const executeSubmit = async (onSubmit, data, setErrors) => {
  try {
    await onSubmit(data);
    return true;
  } catch (err) {
    console.error('Form submission error:', err);
    setErrors({ submit: err.message || 'Operation failed' });
    return false;
  }
};

export const useForm = ({ initialValues, schema, onSubmit }) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevInitialValues, setPrevInitialValues] = useState(initialValues);

  if (initialValues && initialValues !== prevInitialValues) {
    setPrevInitialValues(initialValues);
    setFormData(initialValues);
  }

  const clearFieldError = useCallback((name) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      clearFieldError(name);
    },
    [clearFieldError]
  );

  const setValue = useCallback(
    (name, value) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
      clearFieldError(name);
    },
    [clearFieldError]
  );

  const handleSubmit = useCallback(
    async (e) => {
      if (e?.preventDefault) e.preventDefault();
      if (isSubmitting) return;

      const { isValid, errors: validationErrors, data } = handleValidation(schema, formData);

      if (!isValid) {
        setErrors(validationErrors);
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      const success = await executeSubmit(onSubmit, data, setErrors);
      setIsSubmitting(false);
      return success;
    },
    [formData, isSubmitting, onSubmit, schema]
  );

  const reset = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    setValue,
    handleSubmit,
    reset,
    setFormData,
    setErrors,
  };
};
