import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMedicalInfo } from '../../hooks/useMedicalInfo';
import { useAuth } from '../../hooks/useAuth';
import { updateMedicalInfo } from '../../services/api';

// Mock dependencies
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  updateMedicalInfo: vi.fn(),
}));

describe('useMedicalInfo Hook', () => {
  const mockProfile = {
    medical_info: {
      health_history: 'None',
      chronic_conditions: 'Asthma',
      allergies: 'Peanuts',
      current_medications: 'Inhaler',
      previous_surgeries: 'None',
      emergency_notes: 'None',
    },
  };

  const mockUser = { id: 'user-123' };
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('initializes form data from profile', () => {
    const { result } = renderHook(() => useMedicalInfo(mockProfile, mockOnUpdate));

    expect(result.current.formData).toEqual({
      health_history: 'None',
      chronic_conditions: 'Asthma',
      allergies: 'Peanuts',
      current_medications: 'Inhaler',
      previous_surgeries: 'None',
      emergency_notes: 'None',
    });
  });

  it('initializes with empty strings if profile is null', () => {
    const { result } = renderHook(() => useMedicalInfo(null, mockOnUpdate));

    expect(result.current.formData).toEqual({
      health_history: '',
      chronic_conditions: '',
      allergies: '',
      current_medications: '',
      previous_surgeries: '',
      emergency_notes: '',
    });
  });

  it('updates form fields', () => {
    const { result } = renderHook(() => useMedicalInfo(mockProfile, mockOnUpdate));

    act(() => {
      result.current.handleChange({
        target: { name: 'health_history', value: 'Updated History' },
      });
    });

    expect(result.current.formData.health_history).toBe('Updated History');
  });

  it('submits data successfully', async () => {
    updateMedicalInfo.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMedicalInfo(mockProfile, mockOnUpdate));

    // Change a field
    act(() => {
      result.current.handleChange({
        target: { name: 'chronic_conditions', value: 'None' },
      });
    });

    // Save
    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateMedicalInfo).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({ chronic_conditions: 'None' })
    );
    expect(mockOnUpdate).toHaveBeenCalledWith({ silent: true });
    expect(result.current.isEditing).toBe(false);
  });

  it('handles submission errors', async () => {
    updateMedicalInfo.mockResolvedValue({ success: false, error: 'Network Error' });

    const { result } = renderHook(() => useMedicalInfo(mockProfile, mockOnUpdate));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to update'));
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('confirms before clearing existing fields', async () => {
    updateMedicalInfo.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMedicalInfo(mockProfile, mockOnUpdate));

    // Clear a field that had value
    act(() => {
      result.current.handleChange({
        target: { name: 'allergies', value: '' },
      });
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(window.confirm).toHaveBeenCalled();
  });

  it('cancels update if confirmation is rejected', async () => {
    window.confirm.mockReturnValue(false);

    const { result } = renderHook(() => useMedicalInfo(mockProfile, mockOnUpdate));

    act(() => {
      result.current.handleChange({
        target: { name: 'allergies', value: '' },
      });
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateMedicalInfo).not.toHaveBeenCalled();
  });

  it('resets form on cancel', () => {
    const { result } = renderHook(() => useMedicalInfo(mockProfile, mockOnUpdate));

    act(() => {
      result.current.setIsEditing(true);
      result.current.handleChange({
        target: { name: 'health_history', value: 'Changed' },
      });
    });

    act(() => {
      result.current.handleCancel();
    });

    expect(result.current.formData.health_history).toBe('None'); // Reverted to initial
    expect(result.current.isEditing).toBe(false);
  });
});
