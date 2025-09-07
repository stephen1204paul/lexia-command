import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

/**
 * ShortcutSettings component provides UI for customizing keyboard shortcuts
 * Integrated within the command bar interface similar to plugin management
 */
const ShortcutSettings = ({ onBack, closeCommandBar }) => {
    const {
        shortcuts,
        isMac,
        updateShortcut,
        resetShortcuts,
        resetShortcut,
        detectConflicts,
        exportShortcuts,
        importShortcuts,
        isValidShortcut
    } = useKeyboardShortcut(() => {}); // Empty callback since we're just managing shortcuts

    const [editingShortcut, setEditingShortcut] = useState(null);
    const [recordingKeys, setRecordingKeys] = useState(false);
    const [tempShortcut, setTempShortcut] = useState(null);
    const [conflicts, setConflicts] = useState([]);
    const [showImportExport, setShowImportExport] = useState(false);
    const [importText, setImportText] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Update conflicts when shortcuts change
    useEffect(() => {
        if (shortcuts) {
            setConflicts(detectConflicts());
        }
    }, [shortcuts, detectConflicts]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (recordingKeys) {
                    setRecordingKeys(false);
                    setTempShortcut(null);
                    setEditingShortcut(null);
                } else if (editingShortcut) {
                    setEditingShortcut(null);
                } else if (showImportExport) {
                    setShowImportExport(false);
                } else if (onBack) {
                    onBack();
                }
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [recordingKeys, editingShortcut, showImportExport, onBack]);

    // Format shortcut for display
    const formatShortcut = useCallback((shortcut) => {
        const keys = [];
        
        if (shortcut.meta) keys.push(isMac ? '⌘' : 'Ctrl');
        if (shortcut.ctrl && !shortcut.meta) keys.push('Ctrl');
        if (shortcut.alt) keys.push(isMac ? '⌥' : 'Alt');
        if (shortcut.shift) keys.push(isMac ? '⇧' : 'Shift');
        
        keys.push(shortcut.key.toUpperCase());
        
        return keys.join(' + ');
    }, [isMac]);

    // Handle recording new shortcut
    const handleRecordShortcut = useCallback((command) => {
        setEditingShortcut(command);
        setRecordingKeys(true);
        setTempShortcut(null);
    }, []);

    // Handle key press during recording
    const handleKeyDown = useCallback((e) => {
        if (!recordingKeys) return;

        e.preventDefault();
        e.stopPropagation();

        const newShortcut = {
            key: e.key,
            meta: e.metaKey,
            ctrl: e.ctrlKey,
            alt: e.altKey,
            shift: e.shiftKey
        };

        setTempShortcut(newShortcut);
    }, [recordingKeys]);

    // Save recorded shortcut
    const saveShortcut = useCallback(() => {
        if (tempShortcut && editingShortcut && isValidShortcut(tempShortcut)) {
            updateShortcut(editingShortcut, tempShortcut);
            setEditingShortcut(null);
            setRecordingKeys(false);
            setTempShortcut(null);
        }
    }, [tempShortcut, editingShortcut, isValidShortcut, updateShortcut]);

    // Cancel shortcut recording
    const cancelRecording = useCallback(() => {
        setEditingShortcut(null);
        setRecordingKeys(false);
        setTempShortcut(null);
    }, []);

    // Get command display name
    const getCommandDisplayName = useCallback((command) => {
        const displayNames = {
            openCommand: __('Open Command Bar', 'lexia-command'),
            selectResult1: __('Select Result 1', 'lexia-command'),
            selectResult2: __('Select Result 2', 'lexia-command'),
            selectResult3: __('Select Result 3', 'lexia-command'),
            selectResult4: __('Select Result 4', 'lexia-command'),
            selectResult5: __('Select Result 5', 'lexia-command'),
            selectResult6: __('Select Result 6', 'lexia-command'),
            selectResult7: __('Select Result 7', 'lexia-command'),
            selectResult8: __('Select Result 8', 'lexia-command'),
            selectResult9: __('Select Result 9', 'lexia-command')
        };
        
        return displayNames[command] || command;
    }, []);

    // Handle import shortcuts
    const handleImport = useCallback(() => {
        try {
            const config = JSON.parse(importText);
            importShortcuts(config);
            setImportText('');
            setShowImportExport(false);
        } catch (error) {
            alert(__('Invalid shortcuts configuration. Please check the JSON format.', 'lexia-command'));
        }
    }, [importText, importShortcuts]);

    // Handle export shortcuts
    const handleExport = useCallback(() => {
        const config = exportShortcuts();
        setImportText(JSON.stringify(config, null, 2));
        setShowImportExport(true);
    }, [exportShortcuts]);

    // Add event listener for key recording
    useEffect(() => {
        if (recordingKeys) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [recordingKeys, handleKeyDown]);

    if (!shortcuts) {
        return null;
    }

    // Show import/export interface
    if (showImportExport) {
        return (
            <div className="lexia-command-container shortcut-settings-container">
                <div className="shortcut-settings-back">
                    <button 
                        onClick={() => setShowImportExport(false)}
                        className="back-button"
                    >
                        ← {__('Back to Shortcuts', 'lexia-command')}
                    </button>
                </div>
                
                <div className="import-export-section">
                    <h3>{__('Import/Export Shortcuts Configuration', 'lexia-command')}</h3>
                    <textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder={__('Paste shortcuts configuration JSON here or copy the exported config...', 'lexia-command')}
                        rows={12}
                        className="shortcuts-config-textarea"
                        autoFocus
                    />
                    <div className="import-export-buttons">
                        <button
                            className="import-shortcuts action-button"
                            onClick={handleImport}
                            disabled={!importText.trim()}
                        >
                            {__('Import Configuration', 'lexia-command')}
                        </button>
                        <button
                            className="close-import-export secondary-button"
                            onClick={() => setShowImportExport(false)}
                        >
                            {__('Cancel', 'lexia-command')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show recording interface
    if (recordingKeys && editingShortcut) {
        return (
            <div className="lexia-command-container shortcut-settings-container">
                <div className="shortcut-settings-back">
                    <button 
                        onClick={cancelRecording}
                        className="back-button"
                    >
                        ← {__('Cancel', 'lexia-command')}
                    </button>
                </div>
                
                <div className="recording-section">
                    <h3>{__('Recording Shortcut for:', 'lexia-command')} {getCommandDisplayName(editingShortcut)}</h3>
                    <div className="recording-prompt">
                        {tempShortcut ? (
                            <div className="recorded-shortcut">
                                <kbd className="large-kbd">{formatShortcut(tempShortcut)}</kbd>
                                <div className="recording-actions">
                                    <button
                                        className="save-shortcut action-button"
                                        onClick={saveShortcut}
                                        disabled={!isValidShortcut(tempShortcut)}
                                        autoFocus
                                    >
                                        {__('Save Shortcut', 'lexia-command')}
                                    </button>
                                    <button
                                        className="cancel-recording secondary-button"
                                        onClick={cancelRecording}
                                    >
                                        {__('Cancel', 'lexia-command')}
                                    </button>
                                </div>
                                {!isValidShortcut(tempShortcut) && (
                                    <p className="error-message">
                                        {__('Invalid shortcut. Must include at least one modifier key (Ctrl, Alt, Shift, or Cmd)', 'lexia-command')}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="waiting-for-keys">
                                <p>{__('Press new shortcut keys...', 'lexia-command')}</p>
                                <p className="help-text">
                                    {__('Must include at least one modifier key (Ctrl, Alt, Shift, or Cmd)', 'lexia-command')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Main shortcuts list - return Command.Group like InstalledPluginsResults
    const shortcutEntries = Object.entries(shortcuts);
    
    return (
        <>
            <Command.Group>
                <div className="shortcut-settings-header">
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="back-button"
                        >
                            ← {__('Back to Commands', 'lexia-command')}
                        </button>
                    )}
                </div>

                {conflicts.length > 0 && (
                    <div className="shortcut-conflicts">
                        <strong>{__('⚠️ Conflicts:', 'lexia-command')}</strong>
                        {conflicts.map((conflict, index) => (
                            <span key={index} className="conflict-item">
                                {formatShortcut(conflict.shortcut)} → {conflict.commands.map(cmd => getCommandDisplayName(cmd)).join(', ')}
                            </span>
                        ))}
                    </div>
                )}

                {shortcutEntries.map(([command, shortcut], index) => (
                    <Command.Item
                        key={command}
                        value={command}
                        className="lexia-command-result shortcut-item"
                        onSelect={() => handleRecordShortcut(command)}
                        data-selected={index === selectedIndex}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <div className="lexia-command-plugin-result px-4 w-10">
                            <span className="shortcut-icon">⌨️</span>
                        </div>
                        <div className="lexia-command-plugin-result-name w-30">
                            <span className="lexia-command-result-title shortcut-name">
                                {getCommandDisplayName(command)}
                            </span>
                        </div>
                        <div className="lexia-command-result-details w-35">
                            <kbd className="shortcut-keys">{formatShortcut(shortcut)}</kbd>
                        </div>
                        <div className="lexia-command-result-meta w-25">
                            <div className="shortcut-buttons">
                                <button
                                    className="edit-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRecordShortcut(command);
                                    }}
                                >
                                    {__('Edit', 'lexia-command')}
                                </button>
                                <button
                                    className="reset-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        resetShortcut(command);
                                    }}
                                >
                                    {__('Reset', 'lexia-command')}
                                </button>
                            </div>
                        </div>
                    </Command.Item>
                ))}

                <Command.Item
                    value="reset-all"
                    className="lexia-command-result shortcut-action-item"
                    onSelect={resetShortcuts}
                >
                    <div className="lexia-command-plugin-result px-4 w-10">
                        <span className="action-icon">🔄</span>
                    </div>
                    <div className="lexia-command-plugin-result-name w-90">
                        <span className="lexia-command-result-title">
                            {__('Reset All to Defaults', 'lexia-command')}
                        </span>
                    </div>
                </Command.Item>
                
                <Command.Item
                    value="export"
                    className="lexia-command-result shortcut-action-item"
                    onSelect={handleExport}
                >
                    <div className="lexia-command-plugin-result px-4 w-10">
                        <span className="action-icon">📤</span>
                    </div>
                    <div className="lexia-command-plugin-result-name w-90">
                        <span className="lexia-command-result-title">
                            {__('Export Settings', 'lexia-command')}
                        </span>
                    </div>
                </Command.Item>
                
                <Command.Item
                    value="import"
                    className="lexia-command-result shortcut-action-item"
                    onSelect={() => setShowImportExport(true)}
                >
                    <div className="lexia-command-plugin-result px-4 w-10">
                        <span className="action-icon">📥</span>
                    </div>
                    <div className="lexia-command-plugin-result-name w-90">
                        <span className="lexia-command-result-title">
                            {__('Import Settings', 'lexia-command')}
                        </span>
                    </div>
                </Command.Item>
            </Command.Group>

            <Command.Empty className="lexia-command-no-results">
                {__('No keyboard shortcuts available', 'lexia-command')}
            </Command.Empty>
        </>
    );
};

export default ShortcutSettings;