import { render, screen, fireEvent } from '@testing-library/react';
import CommandBar from '../../../src/js/components/CommandBar';

// Mock the hooks
jest.mock('../../../src/js/hooks/useKeyboardShortcut', () => ({
  useKeyboardShortcut: jest.fn((shortcut, callback) => {
    // Store the callback to trigger it in tests
    if (shortcut.key === 'k' && shortcut.metaKey) {
      global.triggerCommandBarOpen = callback;
    }
  }),
}));

jest.mock('../../../src/js/hooks/useSearchManager', () => ({
  useSearchManager: jest.fn(() => ({
    searchTerm: '',
    loading: false,
    currentPage: 1,
    totalPages: 1,
    loadingMore: false,
    selectedIndex: 0,
    isLoadingMoreRef: { current: false },
    setSearchTerm: jest.fn(),
    setLoading: jest.fn(),
    setCurrentPage: jest.fn(),
    setTotalPages: jest.fn(),
    setLoadingMore: jest.fn(),
    setSelectedIndex: jest.fn(),
    resetSearch: jest.fn(),
    handleSearchTermChange: jest.fn(),
    searchPlugins: jest.fn(),
    searchPages: jest.fn(),
    searchPosts: jest.fn(),
    searchCommandsAndContent: jest.fn(),
    loadMore: jest.fn(),
    setupScrollHandler: jest.fn(),
  })),
}));

jest.mock('../../../src/js/hooks/usePluginManager', () => ({
  usePluginManager: jest.fn(() => ({
    installingPlugin: false,
    activatingPlugin: false,
    pluginStatuses: {},
    fetchPluginStatuses: jest.fn(),
    installPlugin: jest.fn(),
    activatePlugin: jest.fn(),
  })),
}));

// Mock the components
jest.mock('../../../src/js/components/SearchResults', () => () => <div data-testid="search-results">Search Results</div>);
jest.mock('../../../src/js/components/PluginSearchResults', () => () => <div data-testid="plugin-search-results">Plugin Results</div>);
jest.mock('../../../src/js/components/PageSearchResults', () => () => <div data-testid="page-search-results">Page Results</div>);
jest.mock('../../../src/js/components/PostSearchResults', () => () => <div data-testid="post-search-results">Post Results</div>);
jest.mock('../../../src/js/components/PageActionMenu', () => () => <div data-testid="page-action-menu">Page Actions</div>);
jest.mock('../../../src/js/components/PostActionMenu', () => () => <div data-testid="post-action-menu">Post Actions</div>);
jest.mock('../../../src/js/components/NoCommandSuggestion', () => () => <div data-testid="no-command-suggestion">No Commands</div>);
jest.mock('../../../src/js/components/AccessibilityMenu', () => () => <div data-testid="accessibility-menu">Accessibility Menu</div>);

// Mock accessibility utilities
jest.mock('../../../src/js/utils/accessibility', () => ({
  useFocusTrap: jest.fn(() => jest.fn()),
  announceToScreenReader: jest.fn(),
  isHighContrastEnabled: jest.fn(() => false),
  toggleHighContrast: jest.fn(),
  addFocusStyles: jest.fn(),
}));

jest.mock('../../../src/js/utils/accessibilityEnhanced', () => ({
  manageFocus: jest.fn(),
  addAriaAttributes: jest.fn(),
  setupAccessibilityShortcuts: jest.fn(() => jest.fn()),
  toggleReducedMotion: jest.fn(),
  isReducedMotionEnabled: jest.fn(() => false),
  toggleLargerFontSize: jest.fn(),
  isLargerFontSizeEnabled: jest.fn(() => false),
}));

describe('CommandBar', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('renders correctly when closed', () => {
    render(<CommandBar />);
    // The command bar should not be visible when closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opens when keyboard shortcut is triggered', () => {
    render(<CommandBar />);
    
    // Trigger the keyboard shortcut
    global.triggerCommandBarOpen();
    
    // The command bar should now be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('closes when Escape key is pressed', () => {
    render(<CommandBar />);
    
    // Open the command bar
    global.triggerCommandBarOpen();
    
    // The command bar should be visible
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Press Escape key
    fireEvent.keyDown(dialog, { key: 'Escape' });
    
    // The command bar should no longer be visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});