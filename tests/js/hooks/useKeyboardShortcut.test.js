import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcut } from '../../../src/js/hooks/useKeyboardShortcut';

describe('useKeyboardShortcut', () => {
  let addEventListenerSpy;
  let removeEventListenerSpy;
  
  beforeEach(() => {
    // Mock addEventListener and removeEventListener
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
  });
  
  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks();
  });
  
  test('registers event listener on mount', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k', metaKey: true }, callback));
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
  
  test('removes event listener on unmount', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut({ key: 'k', metaKey: true }, callback));
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
  
  test('calls callback when shortcut is triggered (Mac)', () => {
    // Mock navigator.platform to simulate Mac
    Object.defineProperty(navigator, 'platform', {
      get: () => 'MacIntel',
      configurable: true
    });
    
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k', metaKey: true }, callback));
    
    // Get the event handler function
    const handler = addEventListenerSpy.mock.calls[0][1];
    
    // Simulate keydown event with meta key
    act(() => {
      handler({ key: 'k', metaKey: true, ctrlKey: false, preventDefault: jest.fn() });
    });
    
    expect(callback).toHaveBeenCalled();
  });
  
  test('calls callback when shortcut is triggered (Windows)', () => {
    // Mock navigator.platform to simulate Windows
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
      configurable: true
    });
    
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k', metaKey: true }, callback));
    
    // Get the event handler function
    const handler = addEventListenerSpy.mock.calls[0][1];
    
    // Simulate keydown event with ctrl key
    act(() => {
      handler({ key: 'k', metaKey: false, ctrlKey: true, preventDefault: jest.fn() });
    });
    
    expect(callback).toHaveBeenCalled();
  });
  
  test('does not call callback when wrong key is pressed', () => {
    const callback = jest.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k', metaKey: true }, callback));
    
    // Get the event handler function
    const handler = addEventListenerSpy.mock.calls[0][1];
    
    // Simulate keydown event with wrong key
    act(() => {
      handler({ key: 'j', metaKey: true, ctrlKey: false, preventDefault: jest.fn() });
    });
    
    expect(callback).not.toHaveBeenCalled();
  });
});