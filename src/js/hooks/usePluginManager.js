import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

export function usePluginManager() {
    const [installingPlugin, setInstallingPlugin] = useState(null);
    const [activatingPlugin, setActivatingPlugin] = useState(null);
    const [pluginStatuses, setPluginStatuses] = useState({});

    const fetchPluginStatuses = async () => {
        try {
            const response = await apiFetch({
                path: `/${window.lexiaCommandData.restNamespace}/get-plugin-statuses`,
                method: 'GET'
            });
            setPluginStatuses(response.data || {});
        } catch (error) {
            console.error('Failed to fetch plugin statuses:', error);
        }
    };

    const installPlugin = async (slug) => {
        setInstallingPlugin(slug);
        try {
            await apiFetch({
                path: `${window.lexiaCommandData.restNamespace}/install-plugin`,
                method: 'POST',
                data: { slug }
            });
            // Update plugin statuses
            setPluginStatuses(prev => ({
                ...prev,
                [slug]: { ...prev[slug], installed: true }
            }));
            return true;
        } catch (error) {
            console.error('Plugin installation failed:', error);
            return false;
        } finally {
            setInstallingPlugin(null);
        }
    };

    const activatePlugin = async (slug) => {
        setActivatingPlugin(slug);
        try {
            await apiFetch({
                path: `${window.lexiaCommandData.restNamespace}/activate-plugin`,
                method: 'POST',
                data: { slug }
            });
            // Update plugin statuses
            setPluginStatuses(prev => ({
                ...prev,
                [slug]: { ...prev[slug], installed: true, active: true }
            }));
            return true;
        } catch (error) {
            console.error('Plugin activation failed:', error);
            return false;
        } finally {
            setActivatingPlugin(null);
        }
    };

    return {
        installingPlugin,
        activatingPlugin,
        pluginStatuses,
        fetchPluginStatuses,
        installPlugin,
        activatePlugin
    };
}