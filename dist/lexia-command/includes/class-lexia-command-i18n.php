<?php

/**
 * Define the internationalization functionality
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @link       https://github.com/stephen1204paul/lexia-command
 * @since      1.0.0
 *
 * @package    Lexia_Command
 * @subpackage Lexia_Command/includes
 */

/**
 * Define the internationalization functionality.
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @since      1.0.0
 * @package    Lexia_Command
 * @subpackage Lexia_Command/includes
 * @author     Stephen Paul <stephen1204paul@gmail.com>
 */
class Lexia_Command_i18n {


	/**
	 * Load the plugin text domain for translation.
	 *
	 * @since    1.0.0
	 */
	public function load_plugin_textdomain() {

		load_plugin_textdomain(
			'lexia-command',
			false,
			dirname( dirname( plugin_basename( __FILE__ ) ) ) . '/languages/'
		);

	}



}
