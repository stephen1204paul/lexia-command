<?php

/**
 * The plugin bootstrap file
 *
 * @link              https://profiles.wordpress.org/stephen1204paul/
 * @since             1.0.0
 * @package           Lexia_Command
 *
 * @wordpress-plugin
 * Plugin Name:       Lexia Command
 * Plugin URI:        https://github.com/stephen1204paul/lexia-command
 * Description:       A powerful, keyboard-driven command bar for WordPress, inspired by macOS Spotlight.
 * Version:           1.1.0
 * Author:            Stephen Paul
 * Author URI:        https://profiles.wordpress.org/stephen1204paul/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       lexia-command
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 */
define('LEXIA_COMMAND_VERSION', '1.1.0');

/**
 * The code that runs during plugin activation.
 */
function activate_lexia_command() {
    require_once plugin_dir_path(__FILE__) . 'includes/class-lexia-command-activator.php';
    Lexia_Command_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 */
function deactivate_lexia_command() {
    require_once plugin_dir_path(__FILE__) . 'includes/class-lexia-command-deactivator.php';
    Lexia_Command_Deactivator::deactivate();
}

register_activation_hook(__FILE__, 'activate_lexia_command');
register_deactivation_hook(__FILE__, 'deactivate_lexia_command');

/**
 * The core plugin class.
 */
require plugin_dir_path(__FILE__) . 'includes/class-lexia-command.php';

/**
 * Begins execution of the plugin.
 *
 * @since    1.0.0
 */
function run_lexia_command() {
    // Only load the plugin when user is logged in
    if (is_user_logged_in()) {
        $plugin = new Lexia_Command();
        $plugin->run();
    }
}

// Hook into WordPress init to ensure WordPress is fully loaded before checking if user is logged in
add_action('init', 'run_lexia_command');

function plugin_feedback_admin_notice() {
    // Get the current user ID
    $user_id = get_current_user_id();

    // Check if the notice has already been dismissed
    if (get_user_meta($user_id, 'plugin_feedback_notice_dismissed', true)) {
        return;
    }

    // Output the notice
    ?>
    <div class="notice notice-info is-dismissible" id="plugin-feedback-notice">
        <p>Enjoying <strong>Lexia Command</strong>? Please share your feedback or request integration through <a href="https://docs.google.com/forms/d/e/1FAIpQLSeZzO0u0MC6VqA14kN-0L7RR6IW-yRqEPG9RezbddKDloaHOQ/viewform?usp=dialog" target="_blank">this form </a>!</p>
    </div>

    <script type="text/javascript">
        (function($){
            $(document).on('click', '#plugin-feedback-notice .notice-dismiss', function() {
                $.post(ajaxurl, {
                    action: 'dismiss_plugin_feedback_notice',
                    security: '<?php echo wp_create_nonce("dismiss_feedback_nonce"); ?>'
                });
            });
        })(jQuery);
    </script>
    <?php
}
add_action('admin_notices', 'plugin_feedback_admin_notice');

// Handle AJAX request to mark the notice as dismissed
function plugin_dismiss_feedback_notice() {
    check_ajax_referer('dismiss_feedback_nonce', 'security');
    
    $user_id = get_current_user_id();
    update_user_meta($user_id, 'plugin_feedback_notice_dismissed', true);

    wp_send_json_success();
}
add_action('wp_ajax_dismiss_plugin_feedback_notice', 'plugin_dismiss_feedback_notice');

