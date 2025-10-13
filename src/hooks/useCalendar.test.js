import { renderHook, act } from '@testing-library/react';
import { useCalendar } from './useCalendar';
import { getMonth } from '../utils';
import { createWrapper } from '../test-utils/test-wrapper';

// Mock dependencies
jest.mock('../utils', () => ({
  getMonth: jest.fn(() => [
    [null, null, null, { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }],
    [{ day: 5 }, { day: 6 }, { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 }, { day: 11 }],
    [{ day: 12 }, { day: 13 }, { day: 14 }, { day: 15 }, { day: 16 }, { day: 17 }, { day: 18 }],
    [{ day: 19 }, { day: 20 }, { day: 21 }, { day: 22 }, { day: 23 }, { day: 24 }, { day: 25 }],
    [{ day: 26 }, { day: 27 }, { day: 28 }, { day: 29 }, { day: 30 }, { day: 31 }, null]
  ])
}));

jest.mock('../context/GlobalContext', () => ({
  __esModule: true,
  default: {
    monthIndex: 0
  }
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(() => ({
    monthIndex: 0
  })),
  useState: jest.fn((initial) => {
    const state = typeof initial === 'function' ? initial() : initial;
    return [state, jest.fn()];
  }),
  useEffect: jest.fn((fn) => fn())
}));

describe('useCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with current month', () => {
    const mockMonth = [
      [null, null, null, { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }]
    ];
    getMonth.mockReturnValue(mockMonth);

    const { result } = renderHook(() => useCalendar(), { wrapper: createWrapper() });

    expect(result.current.currentMonth).toEqual(mockMonth);
    expect(getMonth).toHaveBeenCalled();
  });

  test('should update month when monthIndex changes', () => {
    const React = require('react');
    let effectCallback;
    
    // Capture the effect callback
    React.useEffect.mockImplementation((fn) => {
      effectCallback = fn;
      return fn();
    });

    const mockMonth1 = [
      [null, null, null, { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }]
    ];
    const mockMonth2 = [
      [{ day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 }, { day: 6 }, { day: 7 }]
    ];

    getMonth.mockReturnValueOnce(mockMonth1).mockReturnValueOnce(mockMonth2);

    // Initial render
    React.useContext.mockReturnValue({ monthIndex: 0 });
    const { result } = renderHook(() => useCalendar(), { wrapper: createWrapper() });

    expect(result.current.currentMonth).toBeDefined();

    // Simulate monthIndex change
    React.useContext.mockReturnValue({ monthIndex: 1 });
    if (effectCallback) {
      act(() => {
        effectCallback();
      });
    }

    expect(getMonth).toHaveBeenCalledWith(1);
  });

  test('should have setCurrentMonth function', () => {
    const { result } = renderHook(() => useCalendar(), { wrapper: createWrapper() });

    expect(result.current.setCurrentMonth).toBeDefined();
    expect(typeof result.current.setCurrentMonth).toBe('function');
  });

  test('should call getMonth with monthIndex', () => {
    const React = require('react');
    React.useContext.mockReturnValue({ monthIndex: 5 });

    renderHook(() => useCalendar(), { wrapper: createWrapper() });

    // getMonth should be called with the monthIndex
    expect(getMonth).toHaveBeenCalledWith(5);
  });
});

