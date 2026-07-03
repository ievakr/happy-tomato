import { renderHook, act } from '@testing-library/react';
import { useCalendar } from './useCalendar';
import { getMonth } from '../utils';
import { createWrapper } from '../test-utils/test-wrapper';

jest.mock('../utils', () => ({
  getMonth: jest.fn(() => [
    [null, null, null, { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }],
    [{ day: 5 }, { day: 6 }, { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 }, { day: 11 }],
    [{ day: 12 }, { day: 13 }, { day: 14 }, { day: 15 }, { day: 16 }, { day: 17 }, { day: 18 }],
    [{ day: 19 }, { day: 20 }, { day: 21 }, { day: 22 }, { day: 23 }, { day: 24 }, { day: 25 }],
    [{ day: 26 }, { day: 27 }, { day: 28 }, { day: 29 }, { day: 30 }, { day: 31 }, null],
  ]),
}));

describe('useCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with current month', () => {
    const mockMonth = [[null, null, null, { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }]];
    getMonth.mockReturnValue(mockMonth);

    const { result } = renderHook(() => useCalendar(), {
      wrapper: createWrapper({ calendar: { monthIndex: 0 } }),
    });

    expect(result.current.currentMonth).toEqual(mockMonth);
    expect(getMonth).toHaveBeenCalledWith(0);
  });

  test('should update month when monthIndex changes', () => {
    const mockMonth1 = [[null, null, null, { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }]];
    const mockMonth2 = [[{ day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 }, { day: 6 }, { day: 7 }]];

    getMonth.mockImplementation((index) => (index === 1 ? mockMonth2 : mockMonth1));

    const { result: first } = renderHook(() => useCalendar(), {
      wrapper: createWrapper({ calendar: { monthIndex: 0 } }),
    });
    expect(first.current.currentMonth).toEqual(mockMonth1);

    const { result: second } = renderHook(() => useCalendar(), {
      wrapper: createWrapper({ calendar: { monthIndex: 1 } }),
    });
    expect(second.current.currentMonth).toEqual(mockMonth2);
    expect(getMonth).toHaveBeenCalledWith(1);
  });

  test('should have setCurrentMonth function', () => {
    const { result } = renderHook(() => useCalendar(), {
      wrapper: createWrapper(),
    });

    expect(result.current.setCurrentMonth).toBeDefined();
    expect(typeof result.current.setCurrentMonth).toBe('function');
  });

  test('should call getMonth with monthIndex', () => {
    renderHook(() => useCalendar(), {
      wrapper: createWrapper({ calendar: { monthIndex: 5 } }),
    });

    expect(getMonth).toHaveBeenCalledWith(5);
  });
});
