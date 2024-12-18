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
 * Version:           1.0.0
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
define('LEXIA_COMMAND_VERSION', '1.0.0');

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
    $plugin = new Lexia_Command();
    $plugin->run();
}

run_lexia_command();
