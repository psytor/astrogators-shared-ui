import React, { useRef, useState } from 'react';
import { Select, SelectOption } from './Select';
import { Button } from './Button';
import { Input } from './Input';
import { useAuth } from '../../contexts/AuthContext';
import { formatAllyCode } from '../../utils/formatAllyCode';
import { useDismissableMenu } from '../../hooks/useDismissableMenu';
import styles from './AllyCodeDropdown.module.css';

export interface AllyCodeDropdownProps {
  onAllyCodeSelected?: (allyCode: string | null) => void;
  className?: string;
  /** Controlled manage-panel open state, so a parent (NavBar) can enforce
   *  "only one popover open at a time" across the whole bar. Falls back to
   *  self-managed state when omitted. */
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** 'floating' (default): an absolutely-positioned popover, for the desktop
   *  bar. 'inline': a plain block in normal flow — used when this is nested
   *  inside MobileNavPanel's own scroll container, where a floating popover
   *  could get clipped by an ancestor's `overflow`. */
  variant?: 'floating' | 'inline';
}

/**
 * AllyCodeDropdown component
 * Dropdown for selecting and managing saved ally codes
 * Shows all saved codes with player names, allows quick switching
 */
export const AllyCodeDropdown: React.FC<AllyCodeDropdownProps> = ({
  onAllyCodeSelected,
  className = '',
  isOpen,
  onOpenChange,
  variant = 'floating',
}) => {
  const {
    allyCodes,
    selectedAllyCode,
    selectAllyCode,
    removeAllyCode,
    addAllyCode,
    isLoadingAllyCodes,
  } = useAuth();

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const showManage = isOpen ?? uncontrolledOpen;
  const setShowManage = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const [newAllyCode, setNewAllyCode] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Button doesn't forward refs, so the trigger's ref lives on this wrapper
  // for outside-click detection and Escape-refocus.
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useDismissableMenu({
    isOpen: showManage && variant === 'floating',
    onClose: () => setShowManage(false),
    triggerRef,
    panelRef,
  });

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

  const hasCodes = allyCodes.length > 0;

  return (
    <div
      className={`${styles.allyCodeDropdown} ${variant === 'inline' ? styles.inline : ''} ${className}`}
    >
      {hasCodes && (
        <Select
          options={options}
          value={selectedAllyCode || ''}
          onChange={handleSelectChange}
          placeholder="Select ally code"
          disabled={isLoadingAllyCodes}
          className={styles.select}
        />
      )}

      {showManage && (
        <div className={styles.managePanel} ref={panelRef} id="ally-code-manage-panel">
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

      <span ref={triggerRef}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowManage(!showManage)}
          className={styles.manageButton}
          aria-expanded={showManage}
          aria-controls="ally-code-manage-panel"
          aria-haspopup="true"
        >
          {hasCodes ? 'Manage' : '+ Add ally code'}
        </Button>
      </span>
    </div>
  );
};
