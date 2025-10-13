import { renderHook, act } from '@testing-library/react';
import { useRecurringActions } from './useRecurringActions';
import dayjs from 'dayjs';
import { EVENT_ACTIONS, PLANT_ACTIONS, TODO_ACTIONS } from '../constants';
import { createWrapper } from '../test-utils/test-wrapper';

// Mock dependencies
jest.mock('../utils/recurringActions', () => ({
  generateRecurringToDos: jest.fn(() => []),
  shouldGenerateRecurringTodos: jest.fn(() => false),
  parseRecurringInterval: jest.fn(() => ({ maxOccurrences: 6 }))
}));

describe('useRecurringActions', () => {
  let mockDispatch;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
  });

  describe('createActionWithRecurringTodos', () => {
    test('should create action without recurring todos', async () => {
      const actionEvent = {
        id: '1',
        title: 'Watered',
        day: dayjs().toISOString(),
        actions: ['Watered'],
        labels: ['Tomatoes']
      };

      const { shouldGenerateRecurringTodos } = require('../utils/recurringActions');
      shouldGenerateRecurringTodos.mockReturnValue(false);

      const { result } = renderHook(() => useRecurringActions(), { 
        wrapper: createWrapper({ dispatchCallEvent: mockDispatch })
      });

      await act(async () => {
        await result.current.createActionWithRecurringTodos(actionEvent);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.PUSH,
        payload: actionEvent
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    test('should create action with recurring todos', async () => {
      const actionEvent = {
        id: '1',
        title: 'Fertilized',
        day: dayjs().toISOString(),
        actions: ['Fertilized'],
        labels: ['Tomatoes']
      };

      const recurringTodos = [
        {
          id: '2',
          title: 'TO DO: Fertilized',
          day: dayjs().add(7, 'days').toISOString(),
          isRecurringTodo: true
        }
      ];

      const { shouldGenerateRecurringTodos, generateRecurringToDos } = require('../utils/recurringActions');
      shouldGenerateRecurringTodos.mockReturnValue(true);
      generateRecurringToDos.mockReturnValue(recurringTodos);

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.createActionWithRecurringTodos(actionEvent);
      });

      expect(mockDispatch).toHaveBeenCalledTimes(2); // Main action + 1 recurring todo
      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.PUSH,
        payload: actionEvent
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.PUSH,
        payload: recurringTodos[0]
      });
    });

    test('should not create recurring todos if series was cancelled', async () => {
      const actionEvent = {
        id: '1',
        title: 'Fertilized',
        day: dayjs().toISOString(),
        actions: ['Fertilized'],
        labels: ['Tomatoes'],
        recurringCancelled: true
      };

      const { shouldGenerateRecurringTodos } = require('../utils/recurringActions');
      shouldGenerateRecurringTodos.mockReturnValue(true);

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.createActionWithRecurringTodos(actionEvent);
      });

      expect(mockDispatch).toHaveBeenCalledTimes(1); // Only main action
    });
  });

  describe('completeTodo', () => {
    test('should complete a todo and convert to action', async () => {
      const todoEvent = {
        id: '1',
        title: 'TO DO: Water plants',
        day: dayjs().toISOString(),
        actions: ['Water plants'],
        isRecurringTodo: true,
        completed: false
      };

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.completeTodo(todoEvent);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.UPDATE,
        payload: expect.objectContaining({
          id: '1',
          title: 'Water plants',
          completed: true,
          isRecurringTodo: false,
          originalTodoId: '1',
          createdFromAction: true
        })
      });
    });

    test('should handle todo with title instead of actions array', async () => {
      const todoEvent = {
        id: '1',
        title: 'TO DO: Water plants',
        day: dayjs().toISOString(),
        isRecurringTodo: true,
        completed: false
      };

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.completeTodo(todoEvent);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.UPDATE,
        payload: expect.objectContaining({
          title: 'Water plants',
          completed: true
        })
      });
    });
  });

  describe('markTodoCompleted', () => {
    test('should mark todo as completed without converting', async () => {
      const todoEvent = {
        id: '1',
        title: 'TO DO: Water plants',
        day: dayjs().toISOString(),
        isRecurringTodo: true,
        completed: false
      };

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.markTodoCompleted(todoEvent);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.UPDATE,
        payload: expect.objectContaining({
          id: '1',
          completed: true,
          completedAt: expect.any(Number)
        })
      });
    });
  });

  describe('getPendingTodosForDay', () => {
    test('should return pending todos for specific day', () => {
      const today = dayjs();
      const React = require('react');
      React.useContext.mockReturnValue({
        dispatchCallEvent: mockDispatch,
        filteredEvents: [
          {
            id: '1',
            title: 'TO DO: Water plants',
            day: today.toISOString(),
            isRecurringTodo: true,
            completed: false
          },
          {
            id: '2',
            title: 'TO DO: Fertilize',
            day: today.add(1, 'day').toISOString(),
            isRecurringTodo: true,
            completed: false
          },
          {
            id: '3',
            title: 'TO DO: Prune',
            day: today.toISOString(),
            isRecurringTodo: true,
            completed: true
          }
        ]
      });

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      const todos = result.current.getPendingTodosForDay(today);

      expect(todos).toHaveLength(1);
      expect(todos[0].id).toBe('1');
    });

    test('should handle manually created todos', () => {
      const today = dayjs();
      const React = require('react');
      React.useContext.mockReturnValue({
        dispatchCallEvent: mockDispatch,
        filteredEvents: [
          {
            id: '1',
            title: 'TO DO: Water plants',
            day: today.toISOString(),
            isRecurringTodo: false,
            completed: false
          }
        ]
      });

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      const todos = result.current.getPendingTodosForDay(today);

      expect(todos).toHaveLength(1);
    });
  });

  describe('getCompletedActionsForDay', () => {
    test('should return completed actions for specific day', () => {
      const today = dayjs();
      const React = require('react');
      React.useContext.mockReturnValue({
        dispatchCallEvent: mockDispatch,
        filteredEvents: [
          {
            id: '1',
            title: 'Water plants',
            day: today.toISOString(),
            createdFromAction: true,
            completed: true
          },
          {
            id: '2',
            title: 'Fertilize',
            day: today.add(1, 'day').toISOString(),
            createdFromAction: true,
            completed: true
          }
        ]
      });

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      const actions = result.current.getCompletedActionsForDay(today);

      expect(actions).toHaveLength(1);
      expect(actions[0].id).toBe('1');
    });
  });

  describe('isTodoEvent', () => {
    test('should identify recurring todo', () => {
      const event = {
        id: '1',
        title: 'TO DO: Water plants',
        isRecurringTodo: true,
        completed: false
      };

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      expect(result.current.isTodoEvent(event)).toBe(true);
    });

    test('should identify manual todo by title', () => {
      const event = {
        id: '1',
        title: 'TO DO: Water plants',
        completed: false
      };

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      expect(result.current.isTodoEvent(event)).toBe(true);
    });

    test('should identify manual todo by toDo field', () => {
      const event = {
        id: '1',
        toDo: 'TO DO: Water plants',
        completed: false
      };

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      expect(result.current.isTodoEvent(event)).toBe(true);
    });

    test('should not identify completed todo', () => {
      const event = {
        id: '1',
        title: 'TO DO: Water plants',
        isRecurringTodo: true,
        completed: true
      };

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      expect(result.current.isTodoEvent(event)).toBe(false);
    });
  });

  describe('isCompletedTodoAction', () => {
    test('should identify completed action from todo', () => {
      const event = {
        id: '1',
        title: 'Water plants',
        createdFromAction: true,
        completed: true
      };

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      expect(result.current.isCompletedTodoAction(event)).toBe(true);
    });

    test('should identify completed todo with toDo field', () => {
      const event = {
        id: '1',
        toDo: 'Water plants',
        completed: true
      };

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      expect(result.current.isCompletedTodoAction(event)).toBe(true);
    });

    test('should not identify incomplete action', () => {
      const event = {
        id: '1',
        title: 'Water plants',
        createdFromAction: true,
        completed: false
      };

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      expect(result.current.isCompletedTodoAction(event)).toBe(false);
    });
  });

  describe('getUpcomingTodos', () => {
    test('should return upcoming todos for action and labels', () => {
      const today = dayjs();
      const React = require('react');
      React.useContext.mockReturnValue({
        dispatchCallEvent: mockDispatch,
        filteredEvents: [
          {
            id: '1',
            title: 'TO DO: Fertilize',
            day: today.add(7, 'days').toISOString(),
            actions: ['Fertilize'],
            labels: ['Tomatoes'],
            isRecurringTodo: true,
            completed: false
          },
          {
            id: '2',
            title: 'TO DO: Fertilize',
            day: today.add(14, 'days').toISOString(),
            actions: ['Fertilize'],
            labels: ['Tomatoes'],
            isRecurringTodo: true,
            completed: false
          }
        ]
      });

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      const todos = result.current.getUpcomingTodos('Fertilize', ['Tomatoes'], 30);

      expect(todos).toHaveLength(2);
    });
  });

  describe('getAllPendingTodos', () => {
    test('should return all pending todos', () => {
      const today = dayjs();
      const React = require('react');
      React.useContext.mockReturnValue({
        dispatchCallEvent: mockDispatch,
        filteredEvents: [
          {
            id: '1',
            title: 'TO DO: Water plants',
            day: today.toISOString(),
            isRecurringTodo: true,
            completed: false
          },
          {
            id: '2',
            title: 'TO DO: Fertilize',
            day: today.add(1, 'day').toISOString(),
            isRecurringTodo: true,
            completed: false
          },
          {
            id: '3',
            title: 'TO DO: Prune',
            day: today.toISOString(),
            isRecurringTodo: true,
            completed: true
          }
        ]
      });

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });
      const todos = result.current.getAllPendingTodos();

      expect(todos).toHaveLength(2);
      expect(todos.map(t => t.id)).toEqual(['1', '2']);
    });
  });

  describe('deleteAllRecurringTodos', () => {
    test('should delete all recurring todos', async () => {
      const today = dayjs();
      const React = require('react');
      const mockFilteredEvents = [
        {
          id: '1',
          title: 'TO DO: Water plants',
          day: today.toISOString(),
          isRecurringTodo: true,
          completed: false,
          actions: ['Water plants'],
          labels: ['Tomatoes']
        },
        {
          id: '2',
          title: 'TO DO: Fertilize',
          day: today.add(1, 'day').toISOString(),
          isRecurringTodo: true,
          completed: false,
          actions: ['Fertilize'],
          labels: ['Tomatoes']
        }
      ];

      React.useContext.mockReturnValue({
        dispatchCallEvent: mockDispatch,
        filteredEvents: mockFilteredEvents
      });

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.deleteAllRecurringTodos();
      });

      // Should call DELETE for each todo
      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.DELETE,
        payload: mockFilteredEvents[0]
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.DELETE,
        payload: mockFilteredEvents[1]
      });
    });

    test('should filter by action when provided', async () => {
      const today = dayjs();
      const React = require('react');
      const mockFilteredEvents = [
        {
          id: '1',
          title: 'TO DO: Water plants',
          day: today.toISOString(),
          isRecurringTodo: true,
          completed: false,
          actions: ['Water plants'],
          labels: ['Tomatoes']
        },
        {
          id: '2',
          title: 'TO DO: Fertilize',
          day: today.add(1, 'day').toISOString(),
          isRecurringTodo: true,
          completed: false,
          actions: ['Fertilize'],
          labels: ['Tomatoes']
        }
      ];

      React.useContext.mockReturnValue({
        dispatchCallEvent: mockDispatch,
        filteredEvents: mockFilteredEvents
      });

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.deleteAllRecurringTodos('Fertilize');
      });

      // Should only delete the Fertilize todo
      expect(mockDispatch).toHaveBeenCalledTimes(2); // 1 DELETE + 1 UPDATE for cancel
    });
  });

  describe('cancelRecurringSeries', () => {
    test('should mark original actions as cancelled', async () => {
      const today = dayjs();
      const React = require('react');
      const originalAction = {
        id: '1',
        title: 'Fertilize',
        day: today.toISOString(),
        actions: ['Fertilize'],
        labels: ['Tomatoes'],
        isRecurringTodo: false,
        completed: false
      };

      React.useContext.mockReturnValue({
        dispatchCallEvent: mockDispatch,
        filteredEvents: [originalAction]
      });

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.cancelRecurringSeries('Fertilize', ['Tomatoes']);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.UPDATE,
        payload: expect.objectContaining({
          id: '1',
          recurringCancelled: true,
          recurringCancelledAt: expect.any(Number)
        })
      });
    });
  });

  describe('updateEventWithRecurringRecalculation', () => {
    test('should update event without recalculation when date unchanged', async () => {
      const today = dayjs();
      const originalEvent = {
        id: '1',
        title: 'Watered',
        day: today.toISOString(),
        actions: ['Watered'],
        labels: ['Tomatoes']
      };

      const updatedEvent = {
        ...originalEvent,
        description: 'Updated description'
      };

      const React = require('react');
      React.useContext.mockReturnValue({
        dispatchCallEvent: mockDispatch,
        filteredEvents: []
      });

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.updateEventWithRecurringRecalculation(updatedEvent, originalEvent);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.UPDATE,
        payload: updatedEvent
      });
    });

    test('should recalculate recurring todos when date changes', async () => {
      const today = dayjs();
      const originalEvent = {
        id: '1',
        title: 'Fertilized',
        day: today.toISOString(),
        actions: ['Fertilized'],
        labels: ['Tomatoes']
      };

      const updatedEvent = {
        ...originalEvent,
        day: today.add(1, 'day').toISOString()
      };

      const recurringTodos = [
        {
          id: '2',
          title: 'TO DO: Fertilized',
          day: today.add(8, 'days').toISOString(),
          isRecurringTodo: true
        }
      ];

      const { shouldGenerateRecurringTodos, generateRecurringToDos } = require('../utils/recurringActions');
      shouldGenerateRecurringTodos.mockReturnValue(true);
      generateRecurringToDos.mockReturnValue(recurringTodos);

      const React = require('react');
      React.useContext.mockReturnValue({
        dispatchCallEvent: mockDispatch,
        filteredEvents: []
      });

      const { result } = renderHook(() => useRecurringActions(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.updateEventWithRecurringRecalculation(updatedEvent, originalEvent);
      });

      // Should update the main event and create new recurring todos
      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.UPDATE,
        payload: updatedEvent
      });
    });
  });
});

