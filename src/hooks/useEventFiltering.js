import { useState, useEffect, useMemo } from 'react';

/**
 * Hook for label-based event filtering.
 * Labels are derived from plant categories; filteredEvents shows events matching checked labels.
 */
export function useEventFiltering(savedEvents, plants = [], plantsById = {}) {
  const [labels, setLabels] = useState([]);

  // Sync labels from plant categories when plants change
  useEffect(() => {
    setLabels((prevLabels) => {
      const categories = [...new Set(plants.map((p) => p.category).filter(Boolean))];
      return categories.map((category) => {
        const current = prevLabels.find((lbl) => lbl.label === category);
        return {
          label: category,
          displayName: category,
          checked: current ? current.checked : true,
        };
      });
    });
  }, [plants]);

  const filteredEvents = useMemo(() => {
    if (labels.length === 0) return savedEvents;

    const checkedCategories = labels.filter((lbl) => lbl.checked).map((lbl) => lbl.label);

    return savedEvents.filter((evt) => {
      if (!evt.labels || evt.labels.length === 0) return true;
      return evt.labels.some((plantId) => {
        const plant = plantsById[plantId];
        return plant && checkedCategories.includes(plant.category);
      });
    });
  }, [savedEvents, labels, plantsById]);

  const updateLabel = (label) => {
    setLabels((prev) => prev.map((lbl) => (lbl.label === label.label ? label : lbl)));
  };

  return {
    filteredEvents,
    labels,
    setLabels,
    updateLabel,
  };
}
