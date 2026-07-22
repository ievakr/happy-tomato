/** Detailed vegetable guide entries (expanded format). */

const DETAILED_VEGETABLES = [
  {
    id: 'tomato',
    name: 'Tomato',
    icon: 'tomato',
    difficulty: 'Moderate',
    growingSeason: 'Spring to autumn',
    harvestTime: '60–85 days after transplanting',
    overview:
      'Tomatoes are warm-season plants grown for their juicy fruits. They need a long growing season, plenty of sunshine, and consistent care to produce high yields. Although they require more attention than many vegetables, healthy plants can provide a continuous harvest from midsummer until the first autumn frost.',
    conditions: {
      sun: 'Tomatoes need full sun and perform best with at least 6–8 hours of direct sunlight daily. More sun generally means sweeter fruit and better yields.',
      soil: {
        summary: 'Grow tomatoes in fertile, well-drained loam rich in organic matter.',
        details: [
          'pH: 6.0–6.8',
          'High compost content improves growth and water retention.',
          'Avoid heavy, waterlogged soils.',
          'Rotate crops to reduce soil-borne diseases.',
        ],
      },
      temperature: {
        lines: [
          'Germination: 21–27°C',
          'Ideal growing temperature: 20–28°C',
          'Night temperature: above 13°C',
          'Frost tolerant: No',
        ],
        note: 'Growth slows below 15°C and flowers may fail to set when temperatures exceed 32°C.',
      },
      water:
        'Tomatoes require deep, consistent watering. Allow the top few centimetres of soil to begin drying before watering again, but never allow prolonged drought. Irregular watering often causes blossom-end rot and fruit splitting.',
    },
    planting: {
      paragraphs: [
        'Start seeds indoors 6–8 weeks before the last expected frost.',
        'Transplant outdoors only after all danger of frost has passed and the soil has warmed.',
        'Plant seedlings deeper than they were growing in their pots, burying part of the stem to encourage additional root development.',
      ],
      spacing: '45–60 cm between plants.',
    },
    care: {
      watering:
        'Water deeply rather than little and often. Water the soil directly instead of wetting the leaves to reduce fungal diseases. Mulching helps conserve moisture and keeps soil from splashing onto leaves.',
      fertilizing: {
        intro: 'Tomatoes are heavy feeders.',
        bullets: [
          'Incorporate compost before planting.',
          'Apply a balanced fertilizer at planting.',
          'Once the first fruits begin developing, switch to a potassium-rich tomato fertilizer every 7–14 days.',
          'Avoid excessive nitrogen, which promotes leafy growth instead of fruit production.',
        ],
      },
      support:
        'Install stakes, cages or strings when planting. Indeterminate varieties benefit from removing side shoots (suckers) growing between the main stem and leaf branches. Remove lower leaves that touch the soil to improve airflow and reduce disease.',
    },
    commonProblems: [
      'blossom-end-rot',
      'late-blight',
      'early-blight',
      'cracked-fruit',
      'flower-drop',
      'aphids',
      'whiteflies',
    ],
    harvest: [
      'Harvest when fruits are fully coloured and slightly soft.',
      'Tomatoes continue ripening after picking, but vine-ripened fruit develops the best flavour.',
      'Harvest regularly to encourage continued fruit production.',
    ],
    companions: {
      good: ['Basil', 'Onions', 'Garlic', 'Carrots', 'Lettuce', 'Marigolds'],
      avoid: ['Potatoes — both crops share many diseases.'],
    },
    rotation: {
      family: 'Nightshade (Solanaceae)',
      avoidAfter: ['Tomatoes', 'Potatoes', 'Peppers', 'Eggplants'],
      goodBefore: ['Peas', 'Beans', 'Onions', 'Leafy greens'],
      note: 'Wait at least 3–4 years before growing tomatoes in the same location again.',
    },
    tips: [
      'Mulch once the soil has warmed.',
      'Shake flowering plants gently to improve pollination in greenhouses.',
      'Remove new flowers near the end of the season so the plant ripens existing fruit.',
      'Pick damaged fruit promptly to discourage pests.',
    ],
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    icon: 'cucumber',
    difficulty: 'Easy',
    growingSeason: 'Late spring to early autumn',
    harvestTime: '50–70 days',
    overview:
      'Cucumbers are fast-growing vines that thrive in warm weather and produce abundant harvests when picked regularly. They grow best in fertile soil with consistent moisture and are ideal for climbing trellises to save space.',
    conditions: {
      sun: 'Require full sun with at least 6 hours of direct sunlight daily.',
      soil: {
        summary: 'Cucumbers prefer rich, moisture-retentive but well-drained soil.',
        details: [
          'pH: 6.0–7.0',
          'Incorporate plenty of compost before planting.',
          'Avoid compacted or poorly drained soils.',
        ],
      },
      temperature: {
        lines: ['Germination: 22–30°C', 'Ideal growing temperature: 22–30°C', 'Frost tolerant: No'],
        note: 'Growth slows significantly below 15°C.',
      },
      water: 'Keep soil consistently moist throughout the growing season. Water shortages cause bitter fruit and poor yields.',
    },
    planting: {
      paragraphs: [
        'Sow outdoors after the last frost once soil temperatures exceed about 18°C.',
        'Alternatively, start indoors 3–4 weeks earlier and transplant carefully, disturbing the roots as little as possible.',
      ],
      spacing: '30–45 cm between plants.',
    },
    care: {
      watering:
        'Water deeply several times per week rather than lightly every day. Avoid wetting foliage whenever possible.',
      fertilizing: {
        intro: 'Cucumbers are heavy feeders.',
        bullets: [
          'Mix compost into the soil before planting.',
          'Begin feeding once flowering starts.',
          'Feed every 7–10 days in containers or every 10–14 days in garden beds using a balanced or potassium-rich fertilizer.',
        ],
      },
      support:
        'Growing vertically on a trellis improves airflow, saves space and produces straighter, cleaner fruit.',
    },
    commonProblems: [
      'powdery-mildew',
      'downy-mildew',
      'cucumber-beetles',
      'spider-mites',
      'bitter-fruit',
      'poor-pollination',
    ],
    harvest: [
      'Harvest while fruits are still young and tender.',
      'Frequent harvesting encourages continued flowering and fruit production.',
      'Do not allow fruits to become oversized unless growing varieties intended for mature harvest.',
    ],
    companions: {
      good: ['Dill', 'Beans', 'Lettuce', 'Radishes', 'Nasturtiums'],
      avoid: ['Potatoes', 'Strongly aromatic herbs like sage'],
    },
    rotation: {
      family: 'Cucurbitaceae',
      avoidAfter: ['Cucumbers', 'Squash', 'Pumpkins', 'Melons'],
      note: 'Rotate every 3–4 years.',
    },
    tips: [
      'Mulch helps maintain even soil moisture.',
      'Pick fruit every one or two days during peak production.',
      'Remove diseased leaves promptly.',
      'Encourage bees for better pollination.',
    ],
  },
  {
    id: 'pepper',
    name: 'Pepper (Bell & Chilli)',
    icon: 'pepper',
    difficulty: 'Moderate',
    growingSeason: 'Spring to autumn',
    harvestTime: '60–90+ days after transplanting',
    overview:
      'Peppers are heat-loving plants that require a long growing season to produce sweet or spicy fruits. They grow more slowly than tomatoes but reward patience with colourful harvests from summer into autumn.',
    conditions: {
      sun: 'Require full sun with at least 6–8 hours of direct light.',
      soil: {
        summary: 'Use fertile, well-drained soil rich in organic matter.',
        details: [
          'pH: 6.0–6.8',
          'Soil should warm quickly in spring.',
          'Avoid waterlogged conditions.',
        ],
      },
      temperature: {
        lines: [
          'Germination: 25–30°C',
          'Ideal growing temperature: 22–30°C',
          'Night temperatures should remain above 13°C.',
          'Frost tolerant: No',
        ],
      },
      water: 'Maintain evenly moist soil throughout the season. Sudden drying can cause flower drop and misshapen fruit.',
    },
    planting: {
      paragraphs: [
        'Start seeds indoors 8–10 weeks before the last frost.',
        'Transplant outdoors only after warm weather has become reliable.',
      ],
      spacing: '40–50 cm.',
    },
    care: {
      watering: 'Water deeply and consistently. Mulch helps maintain soil moisture and warmth.',
      fertilizing: {
        bullets: [
          'Use a balanced fertilizer while plants establish.',
          'Switch to a potassium-rich tomato fertilizer when flowering begins.',
          'Continue providing moderate nitrogen throughout the season.',
          'Avoid excessive nitrogen, which delays fruit production.',
        ],
      },
      support: 'Large-fruited varieties benefit from staking once fruit begins developing.',
    },
    commonProblems: [
      'flower-drop',
      'blossom-end-rot',
      'aphids',
      'spider-mites',
      'sunscald',
    ],
    harvest: [
      'Harvest green peppers once they reach full size, or leave them to ripen fully for sweeter flavour and higher vitamin content.',
      'Regular harvesting encourages additional fruit production.',
    ],
    companions: {
      good: ['Basil', 'Onions', 'Carrots', 'Lettuce'],
      avoid: ['Fennel'],
    },
    rotation: {
      family: 'Nightshade (Solanaceae)',
      avoidAfter: ['Tomatoes', 'Potatoes', 'Eggplants'],
      note: 'Rotate every 3–4 years.',
    },
    tips: [
      'Warm soil with black mulch in cool climates.',
      'Remove the first flower on young plants if early growth is weak.',
      'Protect from strong winds.',
    ],
  },
  {
    id: 'carrot',
    name: 'Carrot',
    icon: 'carrot',
    difficulty: 'Easy',
    growingSeason: 'Spring to autumn',
    harvestTime: '70–80 days',
    overview:
      'Carrots are easy root vegetables that produce the straightest, sweetest roots in loose, stone-free soil. They are best sown directly where they will mature because transplanting damages root development.',
    conditions: {
      sun: 'Grow in full sun or light partial shade.',
      soil: {
        summary: 'Deep, loose sandy loam is ideal.',
        details: [
          'pH: 6.0–6.8',
          'Stone-free soil produces straight roots.',
          'Never add fresh manure before sowing.',
          'Avoid compacted clay soils.',
        ],
      },
      temperature: {
        lines: [
          'Germination: 10–25°C',
          'Ideal growth: 15–21°C',
          'Frost tolerant: Yes',
        ],
      },
      water:
        'Maintain even soil moisture, especially during germination. Dry soil causes poor germination and woody roots.',
    },
    planting: {
      paragraphs: [
        'Direct sow from early spring through midsummer.',
        'Seeds germinate slowly and should remain evenly moist throughout this period.',
        'Thin seedlings gradually to 5–8 cm apart.',
      ],
    },
    care: {
      watering: 'Water deeply during dry weather to encourage long, straight roots.',
      fertilizing:
        'Carrots require little fertilizer. If compost is needed, incorporate it during the previous crop rather than immediately before sowing. Avoid high-nitrogen fertilizers.',
    },
    commonProblems: [
      'forked-roots',
      'hairy-roots',
      'carrot-fly',
      'poor-germination',
      'root-splitting',
    ],
    harvest: [
      'Harvest once roots reach the desired size.',
      'Flavour improves after light autumn frosts.',
    ],
    companions: {
      good: ['Onions', 'Garlic', 'Leeks', 'Lettuce', 'Peas'],
      avoid: ['Dill (when mature)'],
    },
    rotation: {
      family: 'Apiaceae',
      avoidAfter: ['Carrots', 'Parsley', 'Celery'],
      note: 'Rotate every 3 years.',
    },
    tips: [
      'Sow thinly to reduce thinning.',
      'Cover with fine mesh where carrot fly is common.',
      'Keep rows free of weeds during early growth.',
    ],
  },
  {
    id: 'radish',
    name: 'Radish',
    icon: 'radish',
    difficulty: 'Easy',
    growingSeason: 'Spring and autumn',
    harvestTime: '3–5 weeks',
    overview:
      'Radishes are one of the fastest-growing vegetables, making them ideal for beginners and succession sowing. They thrive in cool weather and develop the best flavour before summer heat arrives.',
    conditions: {
      sun: 'Full sun or partial shade. Light afternoon shade helps during warmer weather.',
      soil: {
        summary: 'Grow in light, fertile, well-drained soil.',
        details: ['pH: 6.0–7.0', 'Remove stones before sowing.', 'Avoid fresh manure.'],
      },
      temperature: {
        lines: [
          'Germination: 7–30°C',
          'Ideal growing temperature: 10–20°C',
          'Frost tolerant: Light frosts',
        ],
      },
      water: 'Keep soil consistently moist. Dry conditions produce woody, spicy roots.',
    },
    planting: {
      paragraphs: [
        'Direct sow from early spring.',
        'Repeat sowings every 2–3 weeks for a continuous harvest.',
        'Sow approximately 1 cm deep.',
        'Thin seedlings to 2–5 cm apart.',
      ],
    },
    care: {
      watering: 'Water regularly to maintain rapid growth.',
      fertilizing:
        'Usually unnecessary in fertile soil. Avoid excess nitrogen, which promotes leaves instead of roots.',
    },
    commonProblems: [
      'bolting',
      'pithy-roots',
      'flea-beetles',
      'root-splitting',
    ],
    harvest: [
      'Harvest promptly once roots reach usable size.',
      'Leaving radishes in the ground too long reduces quality.',
    ],
    companions: {
      good: ['Carrots', 'Lettuce', 'Spinach', 'Cucumbers', 'Peas'],
      avoid: ['Hyssop'],
    },
    rotation: {
      family: 'Brassicaceae',
      avoidAfter: ['Other brassicas'],
      note: 'Rotate every 3 years.',
    },
    tips: [
      'Spring and autumn crops usually have the best flavour.',
      'Harvest little and often.',
      'Young leaves are edible and can be used in salads or pesto.',
    ],
  },
  {
    id: 'onion',
    name: 'Onion',
    icon: 'onion',
    difficulty: 'Easy',
    growingSeason: 'Spring to late summer',
    harvestTime: '90–120 days from planting (depending on variety)',
    overview:
      'Onions are one of the easiest and most rewarding vegetables to grow. They can be grown from sets, seedlings, or seed and require a long growing season to develop large, firm bulbs. Cool weather encourages leafy growth, while longer summer days trigger bulb formation.',
    conditions: {
      sun: 'Grow onions in full sun with at least 6–8 hours of direct sunlight each day.',
      soil: {
        summary: 'Onions prefer loose, fertile, well-drained soil.',
        details: [
          'pH: 6.0–6.8',
          'Rich in organic matter',
          'Avoid compacted or waterlogged soils',
          'Stones and hard soil restrict bulb growth',
        ],
      },
      temperature: {
        lines: [
          'Germination: 10–30°C',
          'Ideal growing temperature: 13–24°C',
          'Sets tolerate light frosts.',
          'Frost tolerant: Yes',
        ],
      },
      water:
        'Keep soil evenly moist while leaves are actively growing. Reduce watering as bulbs mature and necks begin to soften.',
    },
    planting: {
      paragraphs: [
        'Plant onion sets in early to mid-spring as soon as the soil can be worked.',
        'Seeds are usually started indoors in late winter and transplanted once seedlings reach pencil thickness.',
        'Plant sets so only the tip remains visible above the soil.',
      ],
      spacing: '10–15 cm between plants.',
    },
    care: {
      watering:
        'Water regularly throughout spring and early summer. Reduce watering once most tops begin falling naturally to improve storage quality.',
      fertilizing: {
        intro: 'Onions are moderate to heavy feeders during leaf growth.',
        bullets: [
          'Apply compost before planting.',
          'Feed with a nitrogen-rich fertilizer every 2–3 weeks while leaves are growing.',
          'Stop nitrogen once bulbs begin swelling.',
          'If soil is poor, a light potassium-rich feed can support bulb development.',
        ],
      },
      maintenance:
        'Keep beds weed-free, as onions compete poorly with weeds. Avoid disturbing the roots once bulbs begin enlarging.',
    },
    commonProblems: [
      'bolting',
      'onion-fly',
      'downy-mildew',
      'soft-necks',
      'small-bulbs',
    ],
    harvest: [
      'Harvest when most tops naturally bend over and begin yellowing.',
      'Lift bulbs carefully and cure them in a dry, airy place for two to three weeks before storage.',
    ],
    companions: {
      good: ['Carrots', 'Lettuce', 'Beetroot', 'Strawberries', 'Brassicas'],
      avoid: ['Peas', 'Beans'],
    },
    rotation: {
      family: 'Amaryllidaceae',
      avoidAfter: ['Onions', 'Garlic', 'Leeks', 'Shallots'],
      note: 'Rotate every 3–4 years.',
    },
    tips: [
      'Early planting usually produces larger bulbs.',
      'Never force tops over to speed ripening.',
      'Cure bulbs thoroughly before long-term storage.',
      'Remove flower stalks if they appear unexpectedly.',
    ],
  },
  {
    id: 'garlic-winter',
    name: 'Garlic (Winter)',
    icon: 'garlic-alt',
    difficulty: 'Easy',
    growingSeason: 'Autumn to midsummer',
    harvestTime: '8–10 months',
    overview:
      'Winter garlic is planted in autumn and overwinters in the soil before resuming growth in spring. It generally produces larger bulbs than spring garlic and is well suited to colder climates.',
    conditions: {
      sun: 'Full sun.',
      soil: {
        summary: 'Fertile, loose, well-drained soil.',
        details: [
          'pH: 6.5–7.0',
          'Rich in organic matter',
          'Avoid heavy, wet clay',
        ],
      },
      temperature: {
        lines: [
          'Roots develop in cool autumn soil.',
          'Bulbs require winter chilling.',
          'Frost tolerant: Excellent',
        ],
      },
      water:
        'Requires little water during winter. Water regularly during spring growth, then reduce watering several weeks before harvest.',
    },
    planting: {
      paragraphs: [
        'Plant individual cloves in October or November.',
        'Plant with the pointed end facing upward.',
        'Depth: approximately 5 cm.',
      ],
      spacing: '15 cm.',
    },
    care: {
      watering:
        'Water during dry spring weather. Stop watering shortly before harvest.',
      fertilizing: {
        bullets: [
          'Apply compost before planting.',
          'Feed with nitrogen in early spring.',
          'Repeat once after several weeks.',
          'Stop feeding about one month before harvest.',
        ],
      },
      maintenance:
        'Remove flower stalks (scapes) from hardneck varieties once they curl. Weed regularly.',
    },
    commonProblems: [
      'white-rot',
      'rust',
      'bulb-rot',
      'onion-fly',
      'small-bulbs',
    ],
    harvest: [
      'Harvest once the lower leaves have browned while several upper leaves remain green.',
      'Cure bulbs thoroughly before storage.',
    ],
    companions: {
      good: ['Strawberries', 'Tomatoes', 'Roses', 'Carrots'],
      avoid: ['Peas', 'Beans'],
    },
    rotation: {
      family: 'Amaryllidaceae',
      avoidAfter: ['Onions', 'Garlic', 'Leeks'],
      note: 'Rotate every 3–4 years.',
    },
    tips: [
      'Use certified seed garlic.',
      'Do not separate cloves until planting time.',
      'Save the largest bulbs for next year\'s planting.',
    ],
  },
  {
    id: 'garlic-summer',
    name: 'Garlic (Spring)',
    icon: 'garlic-alt',
    difficulty: 'Easy',
    growingSeason: 'Spring to late summer',
    harvestTime: '5–6 months',
    overview:
      'Spring garlic is planted once the soil becomes workable in spring. Although bulbs are usually smaller than autumn-planted garlic, they generally store much longer.',
    conditions: {
      sun: 'Full sun.',
      soil: {
        summary: 'Loose, fertile, free-draining soil.',
        details: ['pH: 6.5–7.0', 'Rich in compost', 'Avoid heavy clay'],
      },
      temperature: {
        lines: ['Plant as early as possible.', 'Frost tolerant once established.'],
      },
      water: 'Keep evenly moist during active growth. Reduce watering as harvest approaches.',
    },
    planting: {
      paragraphs: ['Plant individual cloves in early spring.'],
      spacing: '15 cm.',
      depth: '5 cm.',
    },
    care: {
      watering:
        'Water consistently during spring growth. Allow bulbs to mature in relatively dry soil.',
      fertilizing: {
        bullets: [
          'Feed with nitrogen every 2–3 weeks while leaves develop.',
          'Stop feeding approximately one month before harvest.',
        ],
      },
      maintenance: 'Keep beds free from weeds.',
    },
    commonProblems: [
      'white-rot',
      'rust',
      'small-bulbs',
    ],
    harvest: [
      'Harvest once tops yellow and begin falling naturally.',
      'Cure thoroughly before storage.',
    ],
    companions: {
      good: ['Tomatoes', 'Carrots', 'Strawberries', 'Brassicas'],
      avoid: ['Peas', 'Beans'],
    },
    rotation: {
      family: 'Amaryllidaceae',
      note: 'Rotate every 3–4 years.',
    },
    tips: [
      'Plant as early as soil conditions allow.',
      'Larger planting cloves produce larger bulbs.',
      'Store only fully cured bulbs.',
    ],
  },
  {
    id: 'lettuce',
    name: 'Lettuce',
    icon: 'leafy-green',
    difficulty: 'Easy',
    growingSeason: 'Spring to autumn',
    harvestTime: '30–60 days',
    overview:
      'Lettuce is a fast-growing cool-season crop that provides fresh leaves over a long period when sown regularly. It grows quickly in spring and autumn but may bolt during hot weather.',
    conditions: {
      sun: 'Full sun to partial shade. Afternoon shade improves quality during summer.',
      soil: {
        summary: 'Moisture-retentive, fertile soil rich in compost.',
        details: ['pH: 6.0–7.0'],
      },
      temperature: {
        lines: [
          'Germination: 5–25°C',
          'Ideal growing temperature: 10–20°C',
          'Frost tolerant: Light frosts',
        ],
      },
      water:
        'Maintain consistently moist soil. Dry conditions cause bitterness and premature bolting.',
    },
    planting: {
      paragraphs: [
        'Sow from early spring through autumn.',
        'Seeds require very little covering as light improves germination.',
        'Succession sow every two to three weeks.',
      ],
    },
    care: {
      watering: 'Water frequently during dry weather. Mulching helps maintain even moisture.',
      fertilizing:
        'Usually little fertilizer is required in fertile soil. Container-grown lettuce benefits from a light nitrogen-rich liquid feed every two weeks.',
    },
    commonProblems: ['bolting', 'slugs', 'aphids', 'tip-burn', 'bitter-leaves'],
    harvest: [
      'Harvest whole heads or pick outer leaves continuously.',
      'Morning harvesting provides the crispest leaves.',
    ],
    companions: {
      good: ['Carrots', 'Radishes', 'Onions', 'Strawberries'],
      avoid: ['Parsley (can compete for space)'],
    },
    rotation: {
      family: 'Asteraceae',
      note: 'Rotate every 2–3 years.',
    },
    tips: [
      'Sow little and often.',
      'Grow in partial shade during summer.',
      'Keep soil evenly moist for the sweetest leaves.',
    ],
  },
  {
    id: 'pea',
    name: 'Pea',
    icon: 'peapod',
    difficulty: 'Easy',
    growingSeason: 'Spring to early summer',
    harvestTime: '60–70 days',
    overview:
      'Peas are cool-season legumes that produce sweet pods in spring and early summer. They improve soil fertility by fixing atmospheric nitrogen and are among the earliest vegetables harvested each year.',
    conditions: {
      sun: 'Full sun to light shade.',
      soil: {
        summary: 'Well-drained soil with moderate fertility.',
        details: ['pH: 6.0–7.5', 'Avoid excessive nitrogen.'],
      },
      temperature: {
        lines: [
          'Germination: 5–24°C',
          'Ideal growing temperature: 13–20°C',
          'Frost tolerant: Yes',
        ],
      },
      water: 'Water regularly during flowering and pod development.',
    },
    planting: {
      paragraphs: [
        'Direct sow as soon as the soil becomes workable in spring.',
        'Seeds may also be started in modules to protect against mice and birds.',
      ],
      spacing: '5–8 cm.',
      depth: '3–4 cm.',
    },
    care: {
      watering: 'Keep soil evenly moist during flowering and pod filling.',
      fertilizing:
        'Peas usually require little fertilizer. In poor soils, a light balanced fertilizer at planting is sufficient. Avoid high nitrogen fertilizers.',
      support: 'Provide netting, strings or branches for climbing varieties.',
    },
    commonProblems: [
      'powdery-mildew',
      'pea-moth',
      'aphids',
      'poor-pod-production',
      'heat-decline',
    ],
    harvest: [
      'Harvest frequently once pods reach full size.',
      'Regular picking encourages continued flowering.',
    ],
    companions: {
      good: ['Carrots', 'Radishes', 'Lettuce', 'Cucumbers'],
      avoid: ['Onions', 'Garlic'],
    },
    rotation: {
      family: 'Fabaceae',
      avoidAfter: ['Other legumes'],
      note: 'Rotate every 3 years.',
    },
    tips: [
      'Sow early for the sweetest peas.',
      'Mulch helps conserve moisture.',
      'Leave roots in the soil after harvest to return nitrogen to the ground.',
    ],
  },
  {
    id: 'squash',
    name: 'Squash, Courgette & Pumpkin',
    icon: 'pumpkin',
    difficulty: 'Easy',
    growingSeason: 'Late spring to autumn',
    harvestTime: '50–60 days for courgettes; 90–120 days for winter squash and pumpkins',
    overview:
      'Squash, courgettes (zucchini), and pumpkins are vigorous warm-season plants grown for their productive fruits. They require plenty of space, fertile soil, and regular watering, but a healthy plant can produce dozens of fruits throughout the season.',
    conditions: {
      sun: 'Grow in full sun with at least 6–8 hours of direct sunlight daily.',
      soil: {
        summary: 'Rich, fertile soil with plenty of organic matter.',
        details: [
          'pH: 6.0–6.8',
          'Moisture-retentive but well-drained',
          'Compost or well-rotted manure greatly improves yields',
        ],
      },
      temperature: {
        lines: [
          'Germination: 20–30°C',
          'Ideal growing temperature: 20–30°C',
          'Frost tolerant: No',
        ],
      },
      water:
        'Require abundant water throughout the growing season. Allowing plants to dry out reduces fruit production and quality.',
    },
    planting: {
      paragraphs: [
        'Start indoors 3–4 weeks before the last frost or sow directly once the soil has warmed.',
        'Harden off indoor seedlings before transplanting.',
        'Plant seeds on their edge about 2–3 cm deep.',
      ],
      spacing: '90–120 cm between plants.',
    },
    care: {
      watering:
        'Water deeply several times each week. Avoid wetting leaves to reduce disease.',
      fertilizing: {
        intro: 'Squash are heavy feeders.',
        bullets: [
          'Mix compost or well-rotted manure into the soil before planting.',
          'Feed every 7–14 days with a potassium-rich fertilizer once flowering begins.',
        ],
      },
      maintenance:
        'Mulch around plants to conserve moisture. Direct long vines where desired.',
    },
    commonProblems: [
      'powdery-mildew',
      'downy-mildew',
      'squash-bugs',
      'poor-pollination',
      'blossom-end-rot',
      'fruit-rot-wet-soil',
    ],
    harvest: [
      'Courgettes are best harvested while young (15–20 cm long).',
      'Harvest pumpkins and winter squash once skins harden and stems begin drying.',
      'Cut fruits with secateurs, leaving part of the stem attached.',
    ],
    companions: {
      good: ['Beans', 'Corn', 'Nasturtiums', 'Radishes'],
      avoid: ['Potatoes'],
    },
    rotation: {
      family: 'Cucurbitaceae',
      avoidAfter: ['Cucumbers', 'Melons', 'Other squash'],
      note: 'Rotate every 3–4 years.',
    },
    tips: [
      'Pick courgettes every few days for continuous production.',
      'Encourage bees for better pollination.',
      'Place straw or boards beneath pumpkins to reduce fruit rot.',
      'Remove damaged leaves during humid weather.',
    ],
  },
  {
    id: 'potato',
    name: 'Potato',
    icon: 'potato',
    difficulty: 'Easy',
    growingSeason: 'Spring to late summer',
    harvestTime: '70–140 days depending on variety',
    overview:
      'Potatoes are one of the easiest staple crops to grow and produce reliable harvests in gardens, raised beds and containers. They develop underground tubers that benefit from loose soil and regular earthing up throughout the growing season.',
    conditions: {
      sun: 'Full sun.',
      soil: {
        summary: 'Loose, well-drained soil.',
        details: [
          'pH: 5.2–6.2',
          'Moderate fertility',
          'Slightly acidic soil reduces common scab.',
          'Avoid compacted or waterlogged soils.',
        ],
      },
      temperature: {
        lines: [
          'Soil temperature: above 7°C for planting',
          'Ideal growing temperature: 15–22°C',
          'Frost tolerant: Young shoots are susceptible to frost.',
        ],
      },
      water:
        'Water consistently once tubers begin forming. Dry conditions reduce yields and encourage misshapen tubers.',
    },
    planting: {
      paragraphs: [
        'Plant sprouted seed potatoes once heavy frosts have passed.',
        'Plant 10–15 cm deep.',
        'Spacing: 30 cm between plants, 60 cm between rows.',
      ],
      spacing: '30 cm between plants; 60 cm between rows.',
      depth: '10–15 cm.',
    },
    care: {
      watering:
        'Keep soil evenly moist during tuber formation. Reduce watering shortly before harvest.',
      fertilizing: {
        bullets: [
          'Apply compost before planting.',
          'Use a balanced fertilizer at planting.',
          'If growth is weak, apply a light nitrogen feed early.',
          'Once tubers begin forming, avoid excessive nitrogen and favour potassium.',
        ],
      },
      maintenance:
        'Mound soil around stems several times during growth (earthing up). This increases yield and prevents sunlight reaching developing tubers.',
    },
    commonProblems: [
      'late-blight',
      'colorado-potato-beetle',
      'common-scab',
      'slugs',
      'green-tubers',
    ],
    harvest: [
      'Harvest early potatoes once plants flower.',
      'Maincrop potatoes are ready after foliage yellows and dies back.',
      'Allow skins to toughen for one to two weeks before long-term storage.',
    ],
    companions: {
      good: ['Beans', 'Cabbage', 'Horseradish', 'Marigolds'],
      avoid: ['Tomatoes', 'Cucumbers'],
    },
    rotation: {
      family: 'Nightshade (Solanaceae)',
      avoidAfter: ['Tomatoes', 'Peppers', 'Eggplants'],
      note: 'Rotate every 3–4 years.',
    },
    tips: [
      'Chit seed potatoes before planting for an earlier harvest.',
      'Never eat green potatoes.',
      'Harvest only during dry weather if possible.',
      'Cure potatoes before storing.',
    ],
  },
  {
    id: 'strawberry',
    name: 'Strawberry',
    icon: 'strawberry',
    difficulty: 'Easy',
    growingSeason: 'Spring to autumn',
    harvestTime: 'Fruiting begins the year after planting for most varieties',
    overview:
      'Strawberries are perennial plants that produce sweet fruit for several years. With proper care, they provide abundant harvests each summer and produce runners that can be used to establish new plants.',
    conditions: {
      sun: 'Full sun. At least 6 hours of direct sunlight each day.',
      soil: {
        summary: 'Rich, well-drained soil.',
        details: [
          'pH: 5.5–6.8',
          'High organic matter',
          'Avoid waterlogged soils.',
        ],
      },
      temperature: {
        lines: [
          'Ideal growing temperature: 15–25°C',
          'Frost tolerant: Yes, though flowers may need protection.',
        ],
      },
      water: 'Maintain evenly moist soil while flowering and fruiting.',
    },
    planting: {
      paragraphs: [
        'Plant in early spring or late summer.',
        'Position the crown exactly at soil level.',
      ],
      spacing: '30–40 cm.',
    },
    care: {
      watering:
        'Water consistently during flowering and fruit production. Avoid wetting ripening berries.',
      fertilizing: {
        bullets: [
          'Apply compost before planting.',
          'Feed lightly in early spring.',
          'Feed again after harvest with a balanced fertilizer.',
          'Avoid excessive nitrogen.',
        ],
      },
      maintenance:
        'Remove unwanted runners unless propagating new plants. Place straw beneath fruits to keep them clean.',
    },
    commonProblems: [
      'grey-mould',
      'slugs',
      'birds',
      'powdery-mildew',
      'root-rot',
    ],
    harvest: [
      'Harvest fully red berries every few days.',
      'Pick with the stem attached.',
      'Handle carefully to avoid bruising.',
    ],
    companions: {
      good: ['Garlic', 'Onions', 'Lettuce', 'Spinach'],
      avoid: ['Cabbage family planted too closely.'],
    },
    rotation: {
      family: 'Rosaceae',
      note: 'Replace plants every 3–4 years. Avoid replanting immediately into old strawberry beds.',
    },
    tips: [
      'Net plants against birds.',
      'Remove old leaves after harvest if appropriate.',
      'Replace ageing plants regularly.',
      'Propagate healthy runners each summer.',
    ],
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    icon: 'broccoli',
    difficulty: 'Moderate',
    growingSeason: 'Spring and autumn',
    harvestTime: '60–90 days',
    overview:
      'Broccoli is a cool-season brassica grown for its compact green flower heads. It prefers cool temperatures and fertile soil, producing additional side shoots after the main head is harvested.',
    conditions: {
      sun: 'Full sun.',
      soil: {
        summary: 'Firm, fertile soil rich in organic matter.',
        details: ['pH: 6.5–7.2', 'Moisture-retentive but well-drained'],
      },
      temperature: {
        lines: [
          'Germination: 10–30°C',
          'Ideal growing temperature: 15–20°C',
          'Frost tolerant: Yes',
        ],
      },
      water: 'Maintain consistently moist soil.',
    },
    planting: {
      paragraphs: [
        'Start indoors in early spring or sow directly for autumn crops.',
        'Transplant when seedlings are 4–6 weeks old.',
        'Firm plants well into the soil.',
      ],
      spacing: '45–60 cm.',
    },
    care: {
      watering: 'Water deeply during dry weather.',
      fertilizing: {
        intro: 'Broccoli is a heavy feeder.',
        bullets: [
          'Apply compost before planting.',
          'Feed with nitrogen every 2–3 weeks until heads begin forming.',
        ],
      },
      maintenance:
        'Mulch to retain moisture. Protect with insect netting where cabbage butterflies are common.',
    },
    commonProblems: [
      'cabbage-white-caterpillars',
      'clubroot',
      'aphids',
      'flea-beetles',
      'premature-heading',
    ],
    harvest: [
      'Harvest the central head before flower buds begin opening.',
      'Leave the plant in place to produce smaller side shoots.',
    ],
    companions: {
      good: ['Onions', 'Lettuce', 'Spinach', 'Beetroot'],
      avoid: ['Strawberries'],
    },
    rotation: {
      family: 'Brassicaceae',
      avoidAfter: ['Any brassica'],
      note: 'Rotate every 3–4 years.',
    },
    tips: [
      'Firm soil produces better heads.',
      'Keep plants growing steadily with regular watering.',
      'Harvest promptly for the best quality.',
    ],
  },
  {
    id: 'brussels-sprouts',
    name: 'Brussels Sprouts',
    icon: 'plant-growth',
    difficulty: 'Moderate',
    growingSeason: 'Spring to winter',
    harvestTime: '90–180 days',
    overview:
      'Brussels sprouts are long-season brassicas grown for the small buds that develop along a tall central stem. They require patience but produce excellent harvests from autumn into winter.',
    conditions: {
      sun: 'Full sun.',
      soil: {
        summary: 'Firm, fertile soil with excellent moisture retention.',
        details: ['pH: 6.5–7.5', 'Rich in organic matter'],
      },
      temperature: {
        lines: [
          'Germination: 10–30°C',
          'Ideal growing temperature: 15–20°C',
          'Frost tolerant: Excellent',
        ],
      },
      water: 'Require regular watering throughout summer.',
    },
    planting: {
      paragraphs: [
        'Start indoors in early spring.',
        'Transplant in late spring.',
        'Firm plants well into the soil.',
      ],
      spacing: '60–75 cm.',
    },
    care: {
      watering: 'Water regularly throughout dry weather.',
      fertilizing:
        'Feed with nitrogen-rich fertilizer every 2–3 weeks until sprouts begin developing.',
      maintenance:
        'Stake tall plants if exposed to wind. In early autumn, many gardeners remove the growing tip to encourage more uniform sprout development.',
    },
    commonProblems: [
      'cabbage-white-caterpillars',
      'aphids',
      'clubroot',
      'loose-sprouts',
      'wind-rock',
    ],
    harvest: [
      'Harvest from the bottom of the stem upward.',
      'Sprouts improve in flavour after light frosts.',
    ],
    companions: {
      good: ['Onions', 'Beets', 'Lettuce', 'Spinach'],
      avoid: ['Strawberries'],
    },
    rotation: {
      family: 'Brassicaceae',
      avoidAfter: ['Any brassica'],
      note: 'Rotate every 3–4 years.',
    },
    tips: [
      'Firm soil is one of the biggest secrets to producing tight sprouts.',
      'Net plants against pigeons and butterflies.',
      'Harvest gradually over several weeks.',
    ],
  },
  {
    id: 'basil',
    name: 'Basil',
    icon: 'leaf',
    difficulty: 'Easy',
    growingSeason: 'Late spring to early autumn',
    harvestTime: '30–60 days after sowing',
    overview:
      'Basil is a fragrant annual herb prized for its tender leaves, which are widely used in Mediterranean cuisine. It grows quickly in warm weather but is sensitive to cold, making it ideal for gardens, raised beds, containers, and greenhouses.',
    conditions: {
      sun: 'Basil thrives in full sun with 6–8 hours of direct sunlight daily. In very hot climates, light afternoon shade helps prevent scorching.',
      soil: {
        summary: 'Grow basil in fertile, well-drained soil rich in organic matter.',
        details: [
          'pH: 6.0–7.5',
          'Loamy soil is ideal.',
          'Avoid heavy, waterlogged soils.',
        ],
      },
      temperature: {
        lines: [
          'Germination: 20–25°C',
          'Ideal growing temperature: 20–30°C',
          'Frost tolerant: No',
        ],
        note: 'Cold temperatures below 10°C significantly slow growth.',
      },
      water:
        'Keep soil consistently moist but never waterlogged. Allow the surface of the soil to dry slightly between waterings.',
    },
    planting: {
      paragraphs: [
        'Start seeds indoors 4–6 weeks before the last frost or sow outdoors once the soil has warmed.',
        'Seeds require only a light covering of soil.',
        'Transplant after all danger of frost has passed.',
      ],
      spacing: '20–30 cm.',
    },
    care: {
      watering:
        'Water regularly, especially in containers. Avoid wetting the foliage late in the day.',
      fertilizing: {
        intro: 'Basil is a light to moderate feeder.',
        bullets: [
          'Mix compost into the soil before planting.',
          'Container-grown basil benefits from a balanced liquid fertilizer every 2–4 weeks.',
          'Avoid excessive nitrogen, which reduces flavour intensity.',
        ],
      },
      maintenance:
        'Pinch out the growing tips regularly to encourage branching. Remove flower buds as soon as they appear to prolong leaf production.',
    },
    commonProblems: [
      'downy-mildew',
      'fusarium-wilt',
      'aphids',
      'slugs',
      'yellow-leaves-overwatering',
    ],
    harvest: [
      'Harvest once plants have several pairs of true leaves.',
      'Cut stems just above a pair of leaves to encourage new shoots.',
      'Never remove more than one-third of the plant at one time.',
    ],
    companions: {
      good: ['Tomatoes', 'Peppers', 'Lettuce', 'Asparagus'],
      avoid: ['Rue'],
    },
    rotation: {
      family: 'Lamiaceae',
      note: 'Rotate every 2–3 years if grown extensively in the same location.',
    },
    tips: [
      'Frequent harvesting produces bushier plants.',
      'Basil grows exceptionally well in containers.',
      'Protect from cool nights.',
      'Harvest leaves before flowering for the strongest flavour.',
    ],
  },
  {
    id: 'dill',
    name: 'Dill',
    icon: 'seedling',
    difficulty: 'Easy',
    growingSeason: 'Spring to autumn',
    harvestTime: '40–60 days for leaves; 90–120 days for seeds',
    overview:
      'Dill is a fast-growing annual herb valued for both its aromatic leaves and seeds. It is easy to grow from seed and attracts many beneficial insects, making it an excellent companion plant in vegetable gardens.',
    conditions: {
      sun: 'Grow in full sun. Partial shade is acceptable during hot summers.',
      soil: {
        summary: 'Light, well-drained soil.',
        details: [
          'pH: 5.5–7.5',
          'Moderate fertility',
          'Avoid excessively rich soil, which reduces flavour.',
        ],
      },
      temperature: {
        lines: [
          'Germination: 15–25°C',
          'Ideal growing temperature: 16–24°C',
          'Frost tolerant: Light frosts',
        ],
      },
      water:
        'Water regularly while plants establish. Mature plants tolerate short dry periods.',
    },
    planting: {
      paragraphs: [
        'Direct sow from spring through midsummer.',
        'Because dill develops a long taproot, transplanting is not recommended.',
        'Sow seeds about 1 cm deep.',
      ],
      spacing: '20–30 cm.',
    },
    care: {
      watering: 'Keep the soil evenly moist during early growth.',
      fertilizing:
        'Usually unnecessary in fertile garden soil. If needed, apply a light balanced fertilizer once early in the season. Avoid excessive nitrogen.',
      maintenance:
        'Stake tall plants in windy locations. Allow some plants to flower if seed or beneficial insects are desired.',
    },
    commonProblems: [
      'aphids',
      'powdery-mildew',
      'premature-flowering',
      'wind-damage',
    ],
    harvest: [
      'Harvest leaves as needed once plants reach 15–20 cm tall.',
      'Harvest seed heads once they turn brown and begin drying.',
    ],
    companions: {
      good: ['Cucumbers', 'Cabbage', 'Onions', 'Lettuce'],
      avoid: [
        'Carrots (mature dill may cross-pollinate and compete)',
        'Fennel',
      ],
    },
    rotation: {
      family: 'Apiaceae',
      note: 'Rotate every 2–3 years.',
    },
    tips: [
      'Succession sow every few weeks for a continuous supply of fresh leaves.',
      'Flowering plants attract bees, hoverflies and parasitic wasps.',
      'Leave a few plants to self-seed if desired.',
    ],
  },
  {
    id: 'rucola',
    name: 'Rucola (Rocket / Arugula)',
    icon: 'lettuce',
    difficulty: 'Easy',
    growingSeason: 'Spring to autumn',
    harvestTime: '20–40 days',
    overview:
      'Rucola is a fast-growing leafy vegetable known for its peppery flavour. It thrives in cool weather and produces the highest-quality leaves in spring and autumn. Regular harvesting encourages continuous new growth.',
    conditions: {
      sun: 'Grow in full sun during spring and autumn. Provide light afternoon shade during hot summer weather.',
      soil: {
        summary: 'Fertile, moisture-retentive but well-drained soil.',
        details: [
          'pH: 6.0–7.0',
          'Rich in organic matter',
          'Avoid dry, nutrient-poor soils.',
        ],
      },
      temperature: {
        lines: [
          'Germination: 5–25°C',
          'Ideal growing temperature: 10–20°C',
          'Frost tolerant: Light frosts',
        ],
      },
      water:
        'Maintain consistently moist soil. Dry conditions increase bitterness and encourage bolting.',
    },
    planting: {
      paragraphs: [
        'Direct sow from early spring until early autumn.',
        'Succession sow every 2–3 weeks for continuous harvests.',
        'Sow seeds about 0.5–1 cm deep.',
      ],
      spacing: '10–15 cm.',
    },
    care: {
      watering:
        'Water regularly to maintain tender leaves. Mulch helps conserve moisture.',
      fertilizing: {
        intro: 'Rucola is a light feeder.',
        bullets: [
          'In fertile soil, additional feeding is usually unnecessary.',
          'Container-grown plants benefit from a light balanced liquid fertilizer every 2–3 weeks.',
        ],
      },
      maintenance: 'Remove flower stalks if growing primarily for leaves.',
    },
    commonProblems: [
      'flea-beetles',
      'slugs',
      'aphids',
      'bolting',
      'bitter-leaves',
    ],
    harvest: [
      'Begin harvesting once leaves reach 8–10 cm long.',
      'Pick outer leaves first, allowing the centre to continue producing.',
      'Harvest frequently for the best flavour.',
    ],
    companions: {
      good: ['Lettuce', 'Radishes', 'Carrots', 'Onions', 'Cucumbers'],
      avoid: ['Large brassicas that may heavily shade young plants.'],
    },
    rotation: {
      family: 'Brassicaceae',
      avoidAfter: ['Other brassicas'],
      note: 'Rotate every 3 years.',
    },
    tips: [
      'Spring and autumn crops produce the mildest flavour.',
      'Succession sow throughout the season for uninterrupted harvests.',
      'Harvest young leaves for the most tender texture.',
      'Grow in partial shade during summer to delay bolting.',
    ],
  },
];

export default DETAILED_VEGETABLES;
