import React, { useState } from 'react';
import { Select, SelectOption } from './Select';
import { Button } from './Button';
import { Input } from './Input';
import { useAuth } from '../../contexts/AuthContext';
import { formatAllyCode } from '../../utils/formatAllyCode';
import styles from './AllyCodeDropdown.module.css';

export interface AllyCodeDropdownProps {
  onAllyCodeSelected?: (allyCode: string | null) => void;
  className?: string;
}

/**
 * AllyCodeDropdown component
 * Dropdown for selecting and managing saved ally codes
 * Shows all saved codes with player names, allows quick switching
 */
export const AllyCodeDropdown: React.FC<AllyCodeDropdownProps> = ({
  onAllyCodeSelected,
  className = '',
}) => {
  const {
    allyCodes,
    selectedAllyCode,
    selectAllyCode,
    removeAllyCode,
    addAllyCode,
    isLoadingAllyCodes,
  } = useAuth();

  const [showManage, setShowManage] = useState(false);
  const [newAllyCode, setNewAllyCode] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Convert ally codes to select options
  const options: SelectOption[] = allyCodes.map(code => ({
    value: code.ally_code,
    label: code.player_name
      ? `${code.player_name} (${formatAllyCode(code.ally_code)})`
      : formatAllyCode(code.ally_code),
  }));

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    selectAllyCode(value);
    onAllyCodeSelected?.(value);
  };

  const handleRemove = async (allyCodeToRemove: string) => {
    const code = allyCodes.find(ac => ac.ally_code === allyCodeToRemove);
    if (code) {
      const idToRemove: number | string = 'id' in code ? (code.id as number) : code.ally_code;
      await removeAllyCode(idToRemove);
    }
  };

  const handleAdd = async () => {
    setAddError('');
    setAddSuccess('');

    if (!/^\d{9}$/.test(newAllyCode)) {
      setAddError('Ally code must be exactly 9 digits');
      return;
    }

    setIsAdding(true);

    try {
      await addAllyCode(newAllyCode);
      setAddSuccess('Added successfully!');
      setNewAllyCode('');
      setTimeout(() => setAddSuccess(''), 2000);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add ally code');
    } finally {
      setIsAdding(false);
    }
  };

  if (allyCodes.length === 0) {
    return null; // Don't show dropdown if no codes saved
  }

  return (
    <div className={`${styles.allyCodeDropdown} ${className}`}>
      <Select
        options={options}
        value={selectedAllyCode || ''}
        onChange={handleSelectChange}
        placeholder="Select ally code"
        disabled={isLoadingAllyCodes}
        className={styles.select}
      />

      {showManage && (
        <div className={styles.managePanel}>
          <h4>Manage Ally Codes</h4>

          {/* Add new ally code */}
          <div className={styles.addSection}>
            <div className={styles.addInputGroup}>
              <Input
                type="text"
                placeholder="9-digit ally code"
                value={newAllyCode}
                onChange={(e) => setNewAllyCode(e.target.value.replace(/\D/g, '').slice(0, 9))}
                disabled={isAdding}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleAdd}
                loading={isAdding}
                disabled={newAllyCode.length !== 9}
              >
                Add
              </Button>
            </div>
            {addError && <div className={styles.error}>{addError}</div>}
            {addSuccess && <div className={styles.success}>{addSuccess}</div>}
          </div>

          {/* Existing ally codes */}
          <div className={styles.codesList}>
            {allyCodes.map(code => (
              <div key={code.ally_code} className={styles.codeItem}>
                <span>
                  {code.player_name ? `${code.player_name} (${formatAllyCode(code.ally_code)})` : formatAllyCode(code.ally_code)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(code.ally_code)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowManage(false)}
            className={styles.doneButton}
          >
            Done
          </Button>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowManage(!showManage)}
        className={styles.manageButton}
      >
        Manage
      </Button>
    </div>
  );
};
