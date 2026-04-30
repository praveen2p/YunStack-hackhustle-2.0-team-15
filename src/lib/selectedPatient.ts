const STORAGE_KEY = 'healpath_selected_patient_hp_id';

export function getSelectedPatientId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setSelectedPatientId(patientId: string) {
  localStorage.setItem(STORAGE_KEY, patientId);
}

export function clearSelectedPatientId() {
  localStorage.removeItem(STORAGE_KEY);
}
