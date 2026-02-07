import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useForm } from '../../hooks/useForm';
import { z } from 'zod';

describe('useForm', () => {
  const schema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Too short'),
  });

  const initialValues = {
    email: '',
    password: '',
  };

  it('initializes with default values', () => {
    const { result } = renderHook(() => useForm({ initialValues, schema, onSubmit: vi.fn() }));

    expect(result.current.formData).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('updates form data on change', () => {
    const { result } = renderHook(() => useForm({ initialValues, schema, onSubmit: vi.fn() }));

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' },
      });
    });

    expect(result.current.formData.email).toBe('test@example.com');
  });

  it('clears error on field change', () => {
    const { result } = renderHook(() => useForm({ initialValues, schema, onSubmit: vi.fn() }));

    // Set error manually
    act(() => {
      result.current.setErrors({ email: 'Some error' });
    });
    expect(result.current.errors.email).toBe('Some error');

    // Change field
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'new' },
      });
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  it('validates on submit and prevents submission if invalid', async () => {
    const mockSubmit = vi.fn();
    const { result } = renderHook(() => useForm({ initialValues, schema, onSubmit: mockSubmit }));

    // Submit empty form (invalid)
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errors.email).toBe('Invalid email');
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits successfully when valid', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useForm({ initialValues, schema, onSubmit: mockSubmit }));

    // Fill valid data
    act(() => {
      result.current.setFormData({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errors).toEqual({});
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('resets form to initial values', () => {
    const { result } = renderHook(() => useForm({ initialValues, schema, onSubmit: vi.fn() }));

    act(() => {
      result.current.setFormData({ email: 'changed', password: 'changed' });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.formData).toEqual(initialValues);
  });
});
