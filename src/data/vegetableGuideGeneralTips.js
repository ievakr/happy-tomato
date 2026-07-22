/** Shared garden advice shown alongside per-crop guides. */

export const GENERAL_GROWING_TIPS_ID = 'general-tips';

export const GENERAL_GROWING_TIPS = {
  id: GENERAL_GROWING_TIPS_ID,
  name: 'General Growing Tips',
  iconName: 'tips_and_updates',
  isGeneralTips: true,
  sections: [
    {
      icon: 'terrain',
      title: 'Healthy soil is the foundation of a productive garden',
      body: 'Most vegetables grow best in fertile, well-drained soil enriched with compost. Improve soil structure each year by incorporating organic matter, and avoid walking on growing beds to prevent compaction.',
    },
    {
      icon: 'water_drop',
      title: 'Water deeply, not frequently',
      body: 'Deep watering encourages stronger root systems than frequent shallow watering. Water early in the morning whenever possible and aim for the soil rather than the leaves.',
    },
    {
      icon: 'layers',
      title: 'Mulching',
      intro: 'Applying mulch helps:',
      bullets: [
        'Reduce weeds',
        'Conserve soil moisture',
        'Moderate soil temperature',
        'Reduce soil splash that spreads diseases',
        'Improve soil as organic mulches decompose',
      ],
    },
    {
      icon: 'autorenew',
      title: 'Crop rotation',
      body: 'Avoid growing vegetables from the same plant family in the same location every year. Rotating crops helps reduce pests, diseases, and nutrient depletion.',
    },
    {
      icon: 'local_florist',
      title: 'Encourage pollinators',
      body: 'Flowering herbs and companion plants attract bees and beneficial insects that improve pollination and naturally control pests. Avoid spraying insecticides while plants are flowering.',
    },
    {
      icon: 'yard',
      title: 'Containers',
      body: 'Many vegetables grow successfully in containers if they receive enough sunlight, regular watering, and consistent feeding. Use high-quality potting mix and ensure containers have good drainage.',
    },
    {
      icon: 'compost',
      title: 'Compost',
      body: 'Well-made compost improves nearly every garden soil. It increases fertility, enhances water retention in sandy soils, and improves drainage in heavy clay soils.',
    },
    {
      icon: 'bug_report',
      title: 'Integrated pest management',
      body: 'Inspect plants regularly for signs of pests or disease. Remove damaged leaves promptly, encourage beneficial insects, use physical barriers such as insect netting where appropriate, and only consider pesticides as a last resort.',
    },
    {
      icon: 'device_thermostat',
      title: 'Weather matters',
      body: 'Temperature often has a greater effect on plant growth than the calendar. Delay planting warm-season crops if soils remain cold, and protect tender plants from unexpected late frosts.',
    },
    {
      icon: 'hourglass_empty',
      title: 'Patience pays off',
      body: 'Healthy vegetables rarely grow overnight. Consistent watering, timely feeding, regular harvesting, and careful observation are far more important than trying to fix problems after they appear.',
    },
  ],
};

export default GENERAL_GROWING_TIPS;
