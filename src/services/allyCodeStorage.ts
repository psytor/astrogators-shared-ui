/**
 * localStorage utility for anonymous user ally codes
 * Stores ally codes with player names for non-logged-in users
 */

const ALLY_CODES_KEY = 'astrogators_ally_codes';
const SELECTED_ALLY_CODE_KEY = 'astrogators_selected_ally_code';

export interface StoredAllyCode {
  ally_code: string;
  player_name: string | null;
  last_used_at: string | null;
}

export const getAllyCodesFromStorage = (): StoredAllyCode[] => {
  try {
    const stored = localStorage.getItem(ALLY_CODES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to read ally codes from localStorage:', error);
    return [];
  }
};

export const saveAllyCodeToStorage = (allyCode: StoredAllyCode): void => {
  try {
    const codes = getAllyCodesFromStorage();

    // Check if already exists
    const exists = codes.some(c => c.ally_code === allyCode.ally_code);
    if (exists) {
      return; // Don't add duplicates
    }

    codes.push(allyCode);
    localStorage.setItem(ALLY_CODES_KEY, JSON.stringify(codes));
  } catch (error) {
    console.error('Failed to save ally code to localStorage:', error);
  }
};

export const removeAllyCodeFromStorage = (allyCode: string): void => {
  try {
    const codes = getAllyCodesFromStorage();
    const filtered = codes.filter(c => c.ally_code !== allyCode);
    localStorage.setItem(ALLY_CODES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove ally code from localStorage:', error);
  }
};

export const updateAllyCodeLastUsed = (allyCode: string): void => {
  try {
    const codes = getAllyCodesFromStorage();
    const updated = codes.map(c =>
      c.ally_code === allyCode
        ? { ...c, last_used_at: new Date().toISOString() }
        : c
    );
    localStorage.setItem(ALLY_CODES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update ally code last used:', error);
  }
};

export const getSelectedAllyCode = (): string | null => {
  return localStorage.getItem(SELECTED_ALLY_CODE_KEY);
};

export const setSelectedAllyCode = (allyCode: string | null): void => {
  if (allyCode) {
    localStorage.setItem(SELECTED_ALLY_CODE_KEY, allyCode);
  } else {
    localStorage.removeItem(SELECTED_ALLY_CODE_KEY);
  }
};

export const clearAllyCodes = (): void => {
  localStorage.removeItem(ALLY_CODES_KEY);
  localStorage.removeItem(SELECTED_ALLY_CODE_KEY);
};
