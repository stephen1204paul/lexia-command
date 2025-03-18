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
			),
		));
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
}
