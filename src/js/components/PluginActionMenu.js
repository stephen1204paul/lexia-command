import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';
import { useState, useEffect, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

function PluginActionMenu({ plugin, closeCommandBar, onBack }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hoverIndex, setHoverIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Define the available actions for the plugin based on its status
    const actions = useMemo(() => {
        const actionsList = [];
        
        // Add actions based on plugin status
        if (plugin.active) {
            // Actions for active plugins
            actionsList.push({
                id: 'deactivate',
                title: __('Deactivate Plugin', 'lexia-command'),
                icon: '🔌',
                action: async () => {
                    setIsProcessing(true);
                    try {
                        await apiFetch({
                            path: `${window.lexiaCommandData.restNamespace}/deactivate-plugin`,
                            method: 'POST',
                            data: { slug: plugin.slug }
                        });
                        closeCommandBar();
                        window.location.reload();
                    } catch (error) {
                        console.error('Plugin deactivation failed:', error);
                        setIsProcessing(false);
                    }
                }
            });
        } else {
            // Actions for inactive plugins
            actionsList.push({
                id: 'activate',
                title: __('Activate Plugin', 'lexia-command'),
                icon: '✅',
                action: async () => {
                    setIsProcessing(true);
                    try {
                        await apiFetch({
                            path: `${window.lexiaCommandData.restNamespace}/activate-plugin`,
                            method: 'POST',
                            data: { slug: plugin.slug }
                        });
                        closeCommandBar();
                        window.location.reload();
                    } catch (error) {
                        console.error('Plugin activation failed:', error);
                        setIsProcessing(false);
                    }
                }
            });
        }
        
        // Common actions for all plugins
        actionsList.push({
            id: 'delete',
            title: __('Delete Plugin', 'lexia-command'),
            icon: '🗑️',
            action: async () => {
                if (window.confirm(__('Are you sure you want to delete this plugin?', 'lexia-command'))) {
                    setIsProcessing(true);
                    try {
                        await apiFetch({
                            path: `${window.lexiaCommandData.restNamespace}/delete-plugin`,
                            method: 'POST',
                            data: { slug: plugin.slug }
                        });
                        closeCommandBar();
                        window.location.reload();
                    } catch (error) {
                        console.error('Plugin deletion failed:', error);
                        setIsProcessing(false);
                    }
                }
            }
        });
        
        return actionsList;
    }, [plugin, closeCommandBar]);
    
    // Filter actions based on search term
    const filteredActions = useMemo(() => {
        if (!searchTerm) return actions;
        
        return actions.filter(action => 
            action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            action.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, actions]);
    
    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onBack();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prevIndex => {
                    const nextIndex = prevIndex + 1;
                    return nextIndex >= filteredActions.length ? 0 : nextIndex;
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prevIndex => {
                    const nextIndex = prevIndex - 1;
                    return nextIndex < 0 ? filteredActions.length - 1 : nextIndex;
                });
            } else if (e.key === 'Enter') {
                if (filteredActions.length > 0 && selectedIndex >= 0 && selectedIndex < filteredActions.length) {
                    filteredActions[selectedIndex].action();
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBack, filteredActions, selectedIndex]);
    
    // Reset selected index when filtered actions change
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredActions.length]);
    
    return (
        <div className="lexia-command-action-menu">
            <Command.Input 
                value={searchTerm}
                onValueChange={setSearchTerm}
                placeholder={__('Search actions...', 'lexia-command')}
                className="lexia-command-search"
                autoComplete="off"
                autoFocus
            />
            
            <div className="lexia-command-plugin-info">
                <h3>{plugin.name}</h3>
                <div className="lexia-command-plugin-status">
                    <span className={`status-indicator ${plugin.active ? 'active' : 'inactive'}`}></span>
                    <span>{plugin.active ? __('Active', 'lexia-command') : __('Inactive', 'lexia-command')}</span>
                </div>
            </div>
            
            <Command.List className="lexia-command-action-list">
                {isProcessing ? (
                    <Command.Loading className="lexia-command-loading">
                        {__('Processing...', 'lexia-command')}
                    </Command.Loading>
                ) : filteredActions.length > 0 ? (
                    <Command.Group>
                        {filteredActions.map((action, index) => (
                            <Command.Item
                                key={action.id}
                                value={action.id}
                                className="lexia-command-action-item"
                                onMouseEnter={() => setHoverIndex(index)}
                                onMouseLeave={() => setHoverIndex(null)}
                                onSelect={() => action.action()}
                                data-selected={index === selectedIndex || index === hoverIndex}
                            >
                                <div className="lexia-command-action-icon">{action.icon}</div>
                                <div className="lexia-command-action-title">{action.title}</div>
                            </Command.Item>
                        ))}
                    </Command.Group>
                ) : (
                    <Command.Empty className="lexia-command-no-results">
                        {__('No actions found', 'lexia-command')}
                    </Command.Empty>
                )}
            </Command.List>
        </div>
    );
}

export default PluginActionMenu;