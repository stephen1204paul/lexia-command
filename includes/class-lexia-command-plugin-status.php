<?php

/**
 * Class for handling plugin status checks
 */
class Lexia_Command_Plugin_Status {

    /**
     * Get the status of plugins (installed and active)
     *
     * @return array Array of plugin statuses
     */
    public static function get_plugin_statuses() {
        // Get all installed plugins
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        
        $installed_plugins = get_plugins();
        $active_plugins = get_option('active_plugins', array());
        
        $plugin_statuses = array();
        
        // Create a map of plugin slugs to their status
        foreach ($installed_plugins as $plugin_path => $plugin_data) {
            // Extract the plugin slug from the path
            $path_parts = explode('/', $plugin_path);
            $slug = $path_parts[0];
            
            // For single-file plugins without a directory
            if (count($path_parts) === 1) {
                $slug = str_replace('.php', '', $slug);
            }
            
            $plugin_statuses[$slug] = array(
                'installed' => true,
                'active' => in_array($plugin_path, $active_plugins),
                'plugin_path' => $plugin_path
            );
        }
        
        return $plugin_statuses;
    }
}