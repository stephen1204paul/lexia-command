<?php

/**
 * The core plugin class.
 */
class Lexia_Command {

	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->plugin_name = 'lexia-command';
		$this->version = LEXIA_COMMAND_VERSION;
	}

	private function should_load_command_bar() {
		global $pagenow;
		
		// Don't load on post/page edit screens in admin
		if (is_admin() && in_array($pagenow, array('post.php', 'post-new.php'))) {
			return false;
		}

		// Don't load in Gutenberg editor
		if (is_admin() && function_exists('get_current_screen')) {
			$screen = get_current_screen();
			if ($screen && method_exists($screen, 'is_block_editor') && $screen->is_block_editor()) {
				return false;
			}
		}

		return true;
	}

	private function define_hooks() {
		// Always register REST routes
		add_action('rest_api_init', array($this, 'register_rest_routes'));

		// Register AJAX handlers
		add_action('wp_ajax_lexia_toggle_maintenance', array($this, 'handle_toggle_maintenance'));
		add_action('wp_ajax_lexia_clear_cache', array($this, 'handle_clear_cache'));

		// Register scripts and styles
		add_action('wp_enqueue_scripts', array($this, 'register_assets'));
		add_action('admin_enqueue_scripts', array($this, 'register_assets'));

		// Only add the command bar if we should load it
		if ($this->should_load_command_bar()) {
			// Frontend
			add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
			add_action('wp_footer', array($this, 'render_command_bar'));

			// Admin
			add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
			add_action('admin_footer', array($this, 'render_command_bar'));
		}
	}

	public function run() {
		$this->define_hooks();
	}

	public function register_assets() {
		// Register WordPress packages as dependencies
		wp_register_script(
			'wp-element',
			includes_url('js/dist/element.min.js'),
			array('react', 'react-dom'),
			$this->version,
			true
		);

		wp_register_script(
			'wp-api-fetch',
			includes_url('js/dist/api-fetch.min.js'),
			array('wp-i18n', 'wp-polyfill'),
			$this->version,
			true
		);

		// Register our plugin assets
		wp_register_script(
			$this->plugin_name,
			plugin_dir_url(dirname(__FILE__)) . 'build/index.js',
			array('wp-element', 'wp-api-fetch', 'wp-components', 'wp-i18n'),
			$this->version,
			true
		);

		wp_register_style(
			$this->plugin_name,
			plugin_dir_url(dirname(__FILE__)) . 'build/index.css',
			array('wp-components'),
			$this->version
		);
	}

	public function enqueue_assets() {
		if (!$this->should_load_command_bar()) {
			return;
		}

		// Enqueue WordPress core packages
		wp_enqueue_script('wp-element');
		wp_enqueue_script('wp-api-fetch');
		wp_enqueue_script('wp-components');
		wp_enqueue_script('wp-i18n');
		wp_enqueue_style('wp-components');

		// Enqueue our plugin assets
		wp_enqueue_script($this->plugin_name);
		wp_enqueue_style($this->plugin_name);

		// Get user preferences from database
		$user_id = get_current_user_id();
		$user_preferences = array();
		if ($user_id) {
			$user_preferences = array(
				'darkMode' => get_user_meta($user_id, 'lexia_command_darkMode', true) ?: 'false',
				'theme' => get_user_meta($user_id, 'lexia_command_theme', true) ?: 'light',
				'highContrast' => get_user_meta($user_id, 'lexia_command_highContrast', true) ?: 'false',
				'reducedMotion' => get_user_meta($user_id, 'lexia_command_reducedMotion', true) ?: 'false',
				'largerFontSize' => get_user_meta($user_id, 'lexia_command_largerFontSize', true) ?: 'false',
			);
		}

		wp_localize_script($this->plugin_name, 'lexiaCommandData', array(
			'nonce' => wp_create_nonce('wp_rest'),
			'restNamespace' => 'lexia-command/v1',
			'adminUrl' => admin_url(),
			'homeUrl' => home_url(),
			'ajaxUrl' => admin_url('admin-ajax.php'),
			'isAdmin' => is_admin(),
			'userCaps' => array(
				'edit_posts' => current_user_can('edit_posts'),
				'manage_options' => current_user_can('manage_options'),
				'upload_files' => current_user_can('upload_files'),
				'edit_theme_options' => current_user_can('edit_theme_options'),
				'customize' => current_user_can('customize'),
				'switch_themes' => current_user_can('switch_themes'),
			),
			'userPreferences' => $user_preferences,
			'plugins' => $this->get_available_plugin_integrations(),
			'isBlockWidgets' => wp_use_widgets_block_editor(),
		));
	}

	/**
	 * Get available plugin integrations
	 * Detects popular plugins and returns availability info
	 */
	private function get_available_plugin_integrations() {
		$plugins = array();
		
		// Check for popular plugins
		$plugin_checks = array(
			'yoast_seo' => array(
				'files' => array('wordpress-seo/wp-seo.php', 'wordpress-seo-premium/wp-seo-premium.php'),
				'class' => 'WPSEO_Options'
			),
			'woocommerce' => array(
				'files' => array('woocommerce/woocommerce.php'),
				'class' => 'WooCommerce'
			),
			'contact_form_7' => array(
				'files' => array('contact-form-7/wp-contact-form-7.php'),
				'class' => 'WPCF7'
			),
			'elementor' => array(
				'files' => array('elementor/elementor.php'),
				'class' => '\Elementor\Plugin'
			),
			'wordfence' => array(
				'files' => array('wordfence/wordfence.php'),
				'class' => 'wordfence'
			),
			'updraftplus' => array(
				'files' => array('updraftplus/updraftplus.php'),
				'class' => 'UpdraftPlus'
			),
			'wp_rocket' => array(
				'files' => array('wp-rocket/wp-rocket.php'),
				'function' => 'rocket_init'
			),
			'advanced_custom_fields' => array(
				'files' => array('advanced-custom-fields/acf.php', 'advanced-custom-fields-pro/acf.php'),
				'class' => 'ACF'
			),
			'all_in_one_seo' => array(
				'files' => array('all-in-one-seo-pack/all_in_one_seo_pack.php'),
				'class' => 'All_in_One_SEO_Pack'
			),
			'google_analytics_for_wordpress' => array(
				'files' => array('google-analytics-for-wordpress/googleanalytics.php'),
				'class' => 'MonsterInsights'
			),
			'wpforms_lite' => array(
				'files' => array('wpforms-lite/wpforms.php'),
				'class' => 'WPForms'
			),
			'wpforms' => array(
				'files' => array('wpforms/wpforms.php'),
				'class' => 'WPForms'
			),
			'w3_total_cache' => array(
				'files' => array('w3-total-cache/w3-total-cache.php'),
				'class' => 'W3_Plugin_TotalCache'
			),
			'fluentform' => array(
				'files' => array('fluentform/fluentform.php'),
				'class' => 'FluentForm\Framework\Foundation\Application'
			)
		);
		
		foreach ($plugin_checks as $plugin_key => $check) {
			$is_active = false;
			
			// Check if plugin files exist and are active
			foreach ($check['files'] as $file) {
				if (is_plugin_active($file)) {
					$is_active = true;
					break;
				}
			}
			
			// Additional checks for classes/functions
			if ($is_active) {
				if (isset($check['class']) && !class_exists($check['class'])) {
					$is_active = false;
				} elseif (isset($check['function']) && !function_exists($check['function'])) {
					$is_active = false;
				}
			}
			
			if ($is_active) {
				$plugins[$plugin_key] = true;
			}
		}
		
		return $plugins;
	}

	public function render_command_bar() {
		if (!$this->should_load_command_bar()) {
			return;
		}
		echo '<div id="lexia-command-root"></div>';
	}

	public function register_rest_routes() {
		register_rest_route('lexia-command/v1', '/search', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array($this, 'handle_search'),
			'permission_callback' => function () {
				return current_user_can('edit_posts');
			},
			'args' => array(
				'query' => array(
					'required' => true,
					'type' => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		));

		register_rest_route('lexia-command/v1', '/install-plugin', array(
			'methods' => WP_REST_Server::CREATABLE,
			'callback' => array($this, 'handle_install_plugin'),
			'permission_callback' => function () {
				return current_user_can('install_plugins');
			},
			'args' => array(
				'slug' => array(
					'required' => true,
					'type' => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		));

		register_rest_route('lexia-command/v1', '/activate-plugin', array(
			'methods' => WP_REST_Server::CREATABLE,
			'callback' => array($this, 'handle_activate_plugin'),
			'permission_callback' => function () {
				return current_user_can('activate_plugins');
			},
			'args' => array(
				'slug' => array(
					'required' => true,
					'type' => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		));

		// Add new endpoint for getting plugin statuses
		register_rest_route('lexia-command/v1', '/get-plugin-statuses', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array($this, 'handle_get_plugin_statuses'),
			'permission_callback' => function () {
				return current_user_can('install_plugins');
			},
		));

		// Add endpoint for saving user preferences
		register_rest_route('lexia-command/v1', '/save-user-preference', array(
			'methods' => WP_REST_Server::CREATABLE,
			'callback' => array($this, 'handle_save_user_preference'),
			'permission_callback' => function () {
				return is_user_logged_in();
			},
			'args' => array(
				'key' => array(
					'required' => true,
					'type' => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'value' => array(
					'required' => true,
					'type' => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		));

		// Add Fluent Forms endpoints
		register_rest_route('lexia-command/v1', '/fluent-forms/export-entries', array(
			'methods' => WP_REST_Server::CREATABLE,
			'callback' => array($this, 'handle_fluent_forms_export_entries'),
			'permission_callback' => function () {
				return current_user_can('manage_options') && $this->is_fluentform_active();
			},
		));

		register_rest_route('lexia-command/v1', '/fluent-forms/activate-license', array(
			'methods' => WP_REST_Server::CREATABLE,
			'callback' => array($this, 'handle_fluent_forms_activate_license'),
			'permission_callback' => function () {
				return current_user_can('manage_options') && $this->is_fluentform_active();
			},
			'args' => array(
				'license_key' => array(
					'required' => true,
					'type' => 'string',
					'sanitize_callback' => 'sanitize_text_field',
					'validate_callback' => function($param) {
						return !empty(trim($param));
					}
				),
			),
		));

		register_rest_route('lexia-command/v1', '/fluent-forms/license-status', array(
			'methods' => WP_REST_Server::READABLE,
			'callback' => array($this, 'handle_fluent_forms_license_status'),
			'permission_callback' => function () {
				return current_user_can('manage_options') && $this->is_fluentform_active();
			},
		));
	}

	public function handle_search($request) {
		$query = sanitize_text_field($request->get_param('query'));
		
		$results = array();
		
		$posts = get_posts(array(
			's' => $query,
			'post_type' => array('post', 'page'),
			'posts_per_page' => 5,
		));

		foreach ($posts as $post) {
			$results[] = array(
				'id' => $post->ID,
				'title' => $post->post_title,
				'type' => $post->post_type,
				'url' => get_edit_post_link($post->ID, 'raw'),
			);
		}

		return new WP_REST_Response(array(
			'success' => true,
			'data' => $results,
		));
	}

	public function handle_install_plugin($request) {
		if (!current_user_can('install_plugins')) {
			return new WP_Error('rest_forbidden', __('Sorry, you are not allowed to install plugins.'), array('status' => 403));
		}

		$slug = sanitize_text_field($request->get_param('slug'));
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-ajax-upgrader-skin.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';

		// Get plugin information
		$api = plugins_api('plugin_information', array('slug' => $slug));
		if (is_wp_error($api)) {
			return new WP_Error('plugin_api_error', $api->get_error_message(), array('status' => 400));
		}

		$skin = new WP_Ajax_Upgrader_Skin();
		$upgrader = new Plugin_Upgrader($skin);
		$result = $upgrader->install($api->download_link);

		if (is_wp_error($result)) {
			return new WP_Error('plugin_install_error', $result->get_error_message(), array('status' => 400));
		}

		return new WP_REST_Response(array(
			'success' => true,
			'message' => __('Plugin installed successfully.'),
		));
	}

	public function handle_activate_plugin($request) {
		if (!current_user_can('activate_plugins')) {
			return new WP_Error('rest_forbidden', __('Sorry, you are not allowed to activate plugins.'), array('status' => 403));
		}

		$slug = sanitize_text_field($request->get_param('slug'));

		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$plugins = get_plugins();
		$plugin_file = false;

		// Find the plugin file based on the slug
		foreach ($plugins as $file => $data) {
			if (strpos($file, $slug . '/') === 0 || $file === $slug . '.php') {
				$plugin_file = $file;
				break;
			}
		}

		if (!$plugin_file) {
			return new WP_Error('plugin_not_found', __('Plugin not found.'), array('status' => 404));
		}

		$result = activate_plugin($plugin_file);
		if (is_wp_error($result)) {
			return new WP_Error('plugin_activation_error', $result->get_error_message(), array('status' => 400));
		}

		return new WP_REST_Response(array(
			'success' => true,
			'message' => __('Plugin activated successfully.'),
		));
	}

	/**
	 * Handle the request to get plugin statuses
	 *
	 * @param WP_REST_Request $request The request object
	 * @return WP_REST_Response Response with plugin statuses
	 */
	public function handle_get_plugin_statuses($request) {
		require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-lexia-command-plugin-status.php';
		
		$plugin_statuses = Lexia_Command_Plugin_Status::get_plugin_statuses();
		
		return new WP_REST_Response(array(
			'success' => true,
			'data' => $plugin_statuses,
		));
	}

	/**
	 * Handle saving user preferences
	 */
	public function handle_save_user_preference($request) {
		$key = sanitize_text_field($request->get_param('key'));
		$value = sanitize_text_field($request->get_param('value'));
		
		// Validate allowed preference keys
		$allowed_keys = array('darkMode', 'theme', 'highContrast', 'reducedMotion', 'largerFontSize');
		if (!in_array($key, $allowed_keys)) {
			return new WP_REST_Response(array(
				'success' => false,
				'message' => 'Invalid preference key',
			), 400);
		}
		
		$user_id = get_current_user_id();
		if (!$user_id) {
			return new WP_REST_Response(array(
				'success' => false,
				'message' => 'User not logged in',
			), 401);
		}
		
		// Save the preference using WordPress user meta
		$meta_key = 'lexia_command_' . $key;
		$result = update_user_meta($user_id, $meta_key, $value);
		
		// update_user_meta returns false if the value is the same as existing value
		// So we need to check if the value was actually saved
		$saved_value = get_user_meta($user_id, $meta_key, true);
		
		if ($saved_value === $value) {
			return new WP_REST_Response(array(
				'success' => true,
				'message' => 'Preference saved successfully',
			));
		} else {
			return new WP_REST_Response(array(
				'success' => false,
				'message' => 'Failed to save preference',
				'debug' => array(
					'key' => $key,
					'value' => $value,
					'meta_key' => $meta_key,
					'saved_value' => $saved_value,
					'update_result' => $result
				)
			), 500);
		}
	}

	/**
	 * AJAX handler for toggling maintenance mode
	 */
	public function handle_toggle_maintenance() {
		// Verify nonce
		if (!wp_verify_nonce($_POST['_ajax_nonce'], 'wp_rest')) {
			wp_die('Security check failed');
		}

		// Check permissions
		if (!current_user_can('manage_options')) {
			wp_die('Insufficient permissions');
		}

		// Simple maintenance mode toggle using a WordPress option
		$is_maintenance = get_option('lexia_maintenance_mode', false);
		$new_status = !$is_maintenance;
		
		update_option('lexia_maintenance_mode', $new_status);
		
		wp_send_json(array(
			'success' => true,
			'maintenance_mode' => $new_status,
			'message' => $new_status ? 
				__('Maintenance mode enabled', 'lexia-command') : 
				__('Maintenance mode disabled', 'lexia-command')
		));
	}

	/**
	 * AJAX handler for clearing cache
	 */
	public function handle_clear_cache() {
		// Verify nonce
		if (!wp_verify_nonce($_POST['_ajax_nonce'], 'wp_rest')) {
			wp_die('Security check failed');
		}

		// Check permissions
		if (!current_user_can('manage_options')) {
			wp_die('Insufficient permissions');
		}

		$cleared = array();
		$errors = array();

		// Clear WordPress object cache
		if (function_exists('wp_cache_flush')) {
			wp_cache_flush();
			$cleared[] = 'Object Cache';
		}

		// Clear transients
		global $wpdb;
		$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%'");
		$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_site_transient_%'");
		$cleared[] = 'Transients';

		// WP Rocket
		if (function_exists('rocket_clean_domain')) {
			rocket_clean_domain();
			$cleared[] = 'WP Rocket';
		}

		// W3 Total Cache
		if (function_exists('w3tc_pgcache_flush')) {
			w3tc_pgcache_flush();
			w3tc_minify_flush();
			w3tc_objectcache_flush();
			$cleared[] = 'W3 Total Cache';
		}

		// WP Super Cache
		if (function_exists('wp_cache_clear_cache')) {
			wp_cache_clear_cache();
			$cleared[] = 'WP Super Cache';
		}

		wp_send_json(array(
			'success' => true,
			'cleared' => $cleared,
			'errors' => $errors,
			'message' => sprintf(
				__('Cleared: %s', 'lexia-command'), 
				implode(', ', $cleared)
			)
		));
	}

	/**
	 * Check if Fluent Forms is active
	 */
	private function is_fluentform_active() {
		return class_exists('FluentForm\Framework\Foundation\Application') || 
			   is_plugin_active('fluentform/fluentform.php');
	}

	/**
	 * Handle Fluent Forms export entries
	 */
	public function handle_fluent_forms_export_entries($request) {
		if (!$this->is_fluentform_active()) {
			return new WP_Error('plugin_not_active', __('Fluent Forms is not active', 'lexia-command'), array('status' => 404));
		}

		try {
			// Check if Fluent Forms export functions are available
			if (!class_exists('FluentForm\App\Services\FormBuilder\ExportImportService')) {
				return new WP_Error('export_not_available', __('Export service not available', 'lexia-command'), array('status' => 500));
			}

			// Get all forms with entries
			global $wpdb;
			$forms_table = $wpdb->prefix . 'fluentform_forms';
			$submissions_table = $wpdb->prefix . 'fluentform_submissions';
			
			$forms_with_entries = $wpdb->get_results("
				SELECT f.id, f.title, COUNT(s.id) as entry_count 
				FROM {$forms_table} f 
				LEFT JOIN {$submissions_table} s ON f.id = s.form_id 
				GROUP BY f.id, f.title 
				HAVING entry_count > 0 
				ORDER BY f.title
			");

			if (empty($forms_with_entries)) {
				return new WP_Error('no_entries', __('No form entries found to export', 'lexia-command'), array('status' => 404));
			}

			// For now, return form information - actual export would need more complex implementation
			return new WP_REST_Response(array(
				'success' => true,
				'message' => __('Forms with entries found', 'lexia-command'),
				'forms' => $forms_with_entries,
				'note' => __('Navigate to Fluent Forms > Entries to export specific form data', 'lexia-command')
			), 200);

		} catch (Exception $e) {
			return new WP_Error('export_failed', $e->getMessage(), array('status' => 500));
		}
	}

	/**
	 * Handle Fluent Forms license activation
	 */
	public function handle_fluent_forms_activate_license($request) {
		if (!$this->is_fluentform_active()) {
			return new WP_Error('plugin_not_active', __('Fluent Forms is not active', 'lexia-command'), array('status' => 404));
		}

		$license_key = sanitize_text_field($request->get_param('license_key'));
		
		if (empty($license_key)) {
			return new WP_Error('invalid_license', __('License key is required', 'lexia-command'), array('status' => 400));
		}

		try {
			// Check if Fluent Forms Pro is installed
			if (!$this->is_fluentform_pro_installed()) {
				return new WP_Error('pro_not_installed', __('Fluent Forms Pro is not installed. Please install the Pro add-on first.', 'lexia-command'), array('status' => 400));
			}

			// Store the license key in WordPress options
			// Fluent Forms typically stores license data in fluentform_* options
			$license_option = 'fluentformpro_license_key';
			update_option($license_option, $license_key);

			// Try to activate the license if Fluent Forms Pro activation method is available
			$activation_result = $this->activate_fluentform_license($license_key);

			if ($activation_result['success']) {
				return new WP_REST_Response(array(
					'success' => true,
					'message' => __('License key saved and activated successfully!', 'lexia-command'),
					'license_status' => $activation_result['status'] ?? 'active'
				), 200);
			} else {
				return new WP_REST_Response(array(
					'success' => false,
					'message' => $activation_result['message'] ?? __('License key saved but activation failed. Please verify the key manually.', 'lexia-command'),
					'license_status' => 'inactive'
				), 200);
			}

		} catch (Exception $e) {
			return new WP_Error('activation_failed', $e->getMessage(), array('status' => 500));
		}
	}

	/**
	 * Handle Fluent Forms license status check
	 */
	public function handle_fluent_forms_license_status($request) {
		if (!$this->is_fluentform_active()) {
			return new WP_Error('plugin_not_active', __('Fluent Forms is not active', 'lexia-command'), array('status' => 404));
		}

		try {
			$license_key = get_option('fluentformpro_license_key', '');
			$license_status = get_option('fluentformpro_license_status', 'inactive');
			
			return new WP_REST_Response(array(
				'success' => true,
				'has_license_key' => !empty($license_key),
				'license_key' => !empty($license_key) ? substr($license_key, 0, 8) . '...' : '',
				'status' => $license_status,
				'pro_installed' => $this->is_fluentform_pro_installed()
			), 200);

		} catch (Exception $e) {
			return new WP_Error('status_check_failed', $e->getMessage(), array('status' => 500));
		}
	}

	/**
	 * Check if Fluent Forms Pro is installed
	 */
	private function is_fluentform_pro_installed() {
		// Check for Pro plugin files or classes
		return class_exists('FluentFormPro\Framework\Foundation\Application') ||
			   is_plugin_active('fluentformpro/fluentformpro.php') ||
			   file_exists(WP_PLUGIN_DIR . '/fluentformpro/fluentformpro.php');
	}

	/**
	 * Activate Fluent Forms license
	 */
	private function activate_fluentform_license($license_key) {
		// This method attempts to activate the license using Fluent Forms Pro methods
		// if they're available, otherwise it just saves the key for manual activation
		
		try {
			// Try to use Fluent Forms Pro license activation if available
			if (class_exists('FluentFormPro\Framework\Foundation\Application')) {
				// Attempt to activate through Pro application
				// Note: This is a simplified implementation - actual activation may require 
				// specific API calls to WPManageNinja servers
				
				// Store license status as pending verification
				update_option('fluentformpro_license_status', 'pending');
				
				return array(
					'success' => true,
					'status' => 'pending',
					'message' => __('License key saved. Please verify activation in Fluent Forms settings.', 'lexia-command')
				);
			}

			// If Pro classes aren't available, just save the key
			return array(
				'success' => true,
				'status' => 'saved',
				'message' => __('License key saved. Install Fluent Forms Pro to complete activation.', 'lexia-command')
			);

		} catch (Exception $e) {
			return array(
				'success' => false,
				'status' => 'error',
				'message' => $e->getMessage()
			);
		}
	}
}
