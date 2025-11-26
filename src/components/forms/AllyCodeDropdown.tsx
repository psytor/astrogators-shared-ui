import React, { useState } from 'react';
import { Select, SelectOption } from './Select';
import { Button } from './Button';
import { useAuth } from '../../contexts/AuthContext';
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
    isLoadingAllyCodes,
  } = useAuth();

  const [showManage, setShowManage] = useState(false);

  // Convert ally codes to select options
  const options: SelectOption[] = allyCodes.map(code => ({
    value: code.ally_code,
    label: code.player_name
      ? `${code.player_name} (${code.ally_code})`
      : code.ally_code,
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
          {allyCodes.map(code => (
            <div key={code.ally_code} className={styles.codeItem}>
              <span>
                {code.player_name || code.ally_code}
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowManage(false)}
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
