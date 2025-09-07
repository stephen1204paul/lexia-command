# Lexia Command Documentation

## Overview

Lexia Command is a powerful, keyboard-driven command bar for WordPress that enhances productivity by providing quick access to WordPress features and content. Inspired by macOS Spotlight, it allows users to search, navigate, and perform actions with just a few keystrokes.

## Features

### Core Features

- **Command Bar Interface**: A sleek, modern interface accessible via keyboard shortcuts
- **Universal Search**: Quickly find posts, pages, products, users, media, and more
- **Fast Actions**: Create, edit, or manage content directly from the command bar
- **Keyboard-First Navigation**: Designed for keyboard-driven workflows
- **Accessibility Features**: High contrast mode, reduced motion, larger font size options

### Command Types

Lexia Command provides several types of commands:

- **Create**: Commands for creating new content (posts, pages)
- **Edit**: Commands for editing existing content
- **Delete**: Commands for deleting content
- **Manage**: Commands for managing WordPress features (plugins, settings)
- **Search**: Commands for searching content
- **Action**: General action commands

### Command Categories

Commands are organized into categories:

- **Content**: Commands related to posts, pages, and media
- **Plugins**: Commands for managing plugins
- **Settings**: Commands for WordPress settings
- **Users**: Commands for user management

## Installation

1. Upload the plugin files to the `/wp-content/plugins/lexia-command` directory, or install the plugin through the WordPress plugins screen directly
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Use the command bar by pressing CMD+K on Mac or CTRL+K on Windows/Linux

## Usage

### Opening the Command Bar

Press `CMD+K` on Mac or `CTRL+K` on Windows/Linux to open the command bar.

### Basic Navigation

- Type to search for commands or content
- Use arrow keys to navigate through results
- Press Enter to execute the selected command
- Press Escape to close the command bar

### Available Commands

#### Content Management

- **Create a new page**: Create a new WordPress page
- **Create a new post**: Create a new WordPress post
- **Open Media Library**: Access the WordPress media library
- **Manage Menus**: Access the WordPress menu editor
- **Search Pages**: Find and navigate to specific pages
- **Search Posts**: Find and navigate to specific posts

#### Plugin Management

- **Manage Plugins**: Access the WordPress plugins screen
- **Install Plugin**: Search and install plugins from the WordPress repository

#### Settings

- **Site Settings**: Access WordPress general settings
- **Customize Theme**: Open the WordPress theme customizer

### Accessibility Features

Lexia Command includes several accessibility features:

- **High Contrast Mode**: Toggle with `Alt+H` for improved visibility
- **Reduced Motion**: Toggle with `Alt+M` to reduce animations
- **Larger Font Size**: Toggle with `Alt+F` for improved readability

## Developer Documentation

### Plugin Structure

```
lexia-command/
├── assets/                  # Plugin assets (images, etc.)
├── build/                   # Compiled JavaScript and CSS
├── includes/                # PHP classes
│   ├── class-lexia-command.php             # Main plugin class
│   ├── class-lexia-command-activator.php   # Activation handler
│   ├── class-lexia-command-deactivator.php # Deactivation handler
│   ├── class-lexia-command-i18n.php        # Internationalization
│   ├── class-lexia-command-loader.php      # Action/filter loader
│   └── class-lexia-command-plugin-status.php # Plugin status handler
├── languages/               # Translation files
├── src/                     # Source files
│   └── js/                  # JavaScript source
│       ├── commands/        # Command definitions
│       ├── components/      # React components
│       ├── css/             # CSS styles
│       ├── hooks/           # Custom React hooks
│       ├── utils/           # Utility functions
│       └── index.js         # Main entry point
├── lexia-command.php        # Plugin bootstrap file
└── README.txt               # Plugin readme
```

### REST API Endpoints

Lexia Command registers several REST API endpoints:

- `lexia-command/v1/search`: Search for content
- `lexia-command/v1/install-plugin`: Install a plugin
- `lexia-command/v1/activate-plugin`: Activate a plugin
- `lexia-command/v1/get-plugin-statuses`: Get plugin statuses

### Adding Custom Commands

Developers can extend Lexia Command with custom commands. The plugin provides a structure for defining commands with the following properties:

```javascript
{
    id: 'unique-command-id',
    type: COMMAND_TYPES.ACTION, // Choose from available types
    category: COMMAND_CATEGORIES.CONTENT, // Choose from available categories
    title: __('Command Title', 'text-domain'),
    keywords: ['keyword1', 'keyword2'], // Search keywords
    icon: '🔍', // Emoji or icon
    action: () => {
        // Command action code
    },
}
```

### Keyboard Shortcuts

Lexia Command uses the following keyboard shortcuts:

- `CMD+K` (Mac) or `CTRL+K` (Windows/Linux): Open command bar
- `CMD+1` through `CMD+9` (Mac) or `CTRL+1` through `CTRL+9` (Windows/Linux): Select and execute the corresponding numbered result
- `Alt+H`: Toggle high contrast mode
- `Alt+M`: Toggle reduced motion
- `Alt+F`: Toggle larger font size
- Arrow keys: Navigate through results
- Enter: Execute selected command
- Escape: Close command bar

### Accessibility Features

Lexia Command includes several accessibility features:

- **Screen Reader Support**: Announcements for state changes
- **Focus Management**: Proper focus trapping and restoration
- **ARIA Attributes**: Proper ARIA attributes for improved screen reader experience
- **High Contrast Mode**: Improved visibility for users with visual impairments
- **Reduced Motion**: Reduced animations for users with vestibular disorders
- **Larger Font Size**: Improved readability for users with visual impairments

## Changelog

### 1.1.0
- Updated plugin core for improved performance and compatibility
- Enhanced command bar interface
- Added new keyboard shortcuts for faster navigation

### 1.0.1
- Added feedback notice for collecting feedback

### 1.0.0
- Initial release
- Command bar with keyboard shortcuts
- Universal search functionality
- Quick actions for common tasks
- Support for custom commands

## Support and Contribution

- [GitHub Repository](https://github.com/stephen1204paul/lexia-command)
- [Report Issues](https://github.com/stephen1204paul/lexia-command/issues)
- [Feature Requests](https://github.com/stephen1204paul/lexia-command/issues)