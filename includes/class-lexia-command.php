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
}
