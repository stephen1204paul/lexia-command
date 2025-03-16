<?php
/**
 * Class RestApiTest
 *
 * @package Lexia_Command
 */

/**
 * REST API tests.
 */
class RestApiTest extends WP_UnitTestCase {

	protected $server;
	protected $plugin;

	public function setUp() {
		parent::setUp();
		
		// Initialize REST server
		global $wp_rest_server;
		$this->server = $wp_rest_server = new WP_REST_Server;
		do_action( 'rest_api_init' );
		
		// Initialize the plugin
		$this->plugin = new Lexia_Command();
		$this->plugin->register_rest_routes();
	}

	public function tearDown() {
		global $wp_rest_server;
		$wp_rest_server = null;
		parent::tearDown();
	}

	/**
	 * Test the search endpoint.
	 */
	public function test_search_endpoint() {
		// Create a test post
		$post_id = $this->factory->post->create( array(
			'post_title' => 'Test Search Post',
			'post_content' => 'This is a test post for searching.',
			'post_status' => 'publish',
		) );
		
		// Create a user with edit_posts capability
		$user_id = $this->factory->user->create( array(
			'role' => 'editor',
		) );
		wp_set_current_user( $user_id );
		
		// Make a request to the search endpoint
		$request = new WP_REST_Request( 'GET', '/lexia-command/v1/search' );
		$request->set_param( 'query', 'Test Search' );
		$response = $this->server->dispatch( $request );
		
		// Check the response
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		
		// Verify the search results contain our test post
		$found = false;
		foreach ( $data as $item ) {
			if ( isset( $item['id'] ) && $item['id'] === $post_id ) {
				$found = true;
				break;
			}
		}
		
		$this->assertTrue( $found, 'Search results should contain the test post' );
	}

	/**
	 * Test that unauthorized users cannot access the endpoints.
	 */
	public function test_unauthorized_access() {
		// Log out
		wp_set_current_user( 0 );
		
		// Try to access the search endpoint
		$request = new WP_REST_Request( 'GET', '/lexia-command/v1/search' );
		$request->set_param( 'query', 'Test' );
		$response = $this->server->dispatch( $request );
		
		// Check that access is denied
		$this->assertEquals( 401, $response->get_status() );
	}
}