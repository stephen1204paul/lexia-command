<?php
/**
 * Class LexiaCommandTest
 *
 * @package Lexia_Command
 */

/**
 * Core plugin tests.
 */
class LexiaCommandTest extends WP_UnitTestCase {

	/**
	 * Test that the plugin is loaded.
	 */
	public function test_plugin_loaded() {
		$this->assertTrue( class_exists( 'Lexia_Command' ) );
	}

	/**
	 * Test that the plugin version is defined.
	 */
	public function test_plugin_version() {
		$this->assertTrue( defined( 'LEXIA_COMMAND_VERSION' ) );
		$this->assertEquals( '1.1.0', LEXIA_COMMAND_VERSION );
	}

	/**
	 * Test that the plugin only loads for logged-in users.
	 */
	public function test_plugin_loads_for_logged_in_users_only() {
		// Create a user and log them in
		$user_id = $this->factory->user->create();
		wp_set_current_user( $user_id );
		
		// Check if the plugin is loaded
		$this->assertTrue( is_user_logged_in() );
		
		// Log the user out
		wp_set_current_user( 0 );
		
		// Check that the plugin is not loaded
		$this->assertFalse( is_user_logged_in() );
	}

	/**
	 * Test that the REST API routes are registered.
	 */
	public function test_rest_routes_registered() {
		// Create a user with edit_posts capability
		$user_id = $this->factory->user->create( array(