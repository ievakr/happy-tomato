/**
 * Shared plant-health knowledge base.
 * Vegetable guides reference these by id so each problem is written once.
 */

const GUIDE_PROBLEMS = [
  {
    id: 'powdery-mildew',
    name: 'Powdery mildew',
    icon: 'blur_on',
    whatIsIt:
      'A fungal disease that coats leaves with a white, flour-like powder. It weakens plants and reduces yield, especially in warm, humid conditions with poor airflow.',
    identify: [
      'White or grey powdery patches on leaf surfaces',
      'Often starts on older leaves and spreads upward',
      'Leaves may yellow, distort, or die back',
    ],
    why: [
      'Warm days with humid nights',
      'Poor airflow around dense foliage',
      'Overcrowded plants',
    ],
    fix: [
      'Remove the worst-affected leaves promptly',
      'Improve spacing and airflow',
      'Avoid wetting foliage when watering',
      'Use a suitable fungicide if the infection becomes severe',
    ],
    prevent: [
      'Grow plants with good spacing',
      'Water at the base, not over the leaves',
      'Remove infected debris at the end of the season',
    ],
  },
  {
    id: 'downy-mildew',
    name: 'Downy mildew',
    icon: 'water_drop',
    whatIsIt:
      'A disease favoured by cool, damp weather. It often shows pale patches on the upper leaf surface and a downy growth underneath.',
    identify: [
      'Yellow or pale patches on upper leaf surfaces',
      'Grey or purple downy growth on leaf undersides',
      'Leaves may collapse quickly in wet weather',
    ],
    why: [
      'Cool, wet conditions',
      'Poor airflow',
      'Leaves staying wet for long periods',
    ],
    fix: [
      'Remove infected leaves as soon as they appear',
      'Improve airflow around plants',
      'Avoid overhead watering',
      'Destroy badly infected plants if the disease spreads rapidly',
    ],
    prevent: [
      'Water early in the day so leaves dry quickly',
      'Give plants enough space',
      'Rotate crops and clear infected debris',
    ],
  },
  {
    id: 'late-blight',
    name: 'Late blight',
    icon: 'coronavirus',
    whatIsIt:
      'A fast-spreading disease of tomatoes and potatoes. In cool, wet weather it can destroy foliage and fruit or tubers within days.',
    identify: [
      'Dark, water-soaked patches on leaves',
      'White mould may appear on leaf undersides in humid weather',
      'Fruit or tubers can develop firm brown or black lesions',
    ],
    why: [
      'Cool, wet weather',
      'Infected seed potatoes or nearby diseased plants',
      'Leaves remaining wet for long periods',
    ],
    fix: [
      'Remove and destroy infected foliage immediately',
      'Do not compost infected material',
      'Harvest healthy potatoes promptly if foliage collapses',
      'Consider a suitable fungicide in high-risk weather if needed',
    ],
    prevent: [
      'Use certified seed potatoes',
      'Avoid planting tomatoes next to potatoes',
      'Keep foliage dry and improve airflow',
      'Clear all crop debris after harvest',
    ],
  },
  {
    id: 'early-blight',
    name: 'Early blight',
    icon: 'healing',
    whatIsIt:
      'A common tomato and potato leaf disease that starts as dark spots and can defoliate plants if left unchecked.',
    identify: [
      'Dark brown spots, often with concentric rings',
      'Yellowing around the spots',
      'Usually begins on lower leaves',
    ],
    why: [
      'Warm, humid weather',
      'Soil splash onto leaves',
      'Stressed or overcrowded plants',
    ],
    fix: [
      'Remove affected lower leaves',
      'Mulch to reduce soil splash',
      'Water at the base of the plant',
      'Keep plants well supported and aired',
    ],
    prevent: [
      'Rotate nightshade crops',
      'Avoid wetting foliage',
      'Maintain steady growth with good watering and feeding',
    ],
  },
  {
    id: 'blossom-end-rot',
    name: 'Blossom-end rot',
    icon: 'contrast',
    whatIsIt:
      'Dark, sunken patches form on the bottom (blossom end) of fruits. It is usually caused by irregular watering that disrupts calcium movement into the fruit.',
    identify: [
      'Dark, leathery, sunken patches on the bottom of fruit',
      'Often appears first on early fruits',
      'Rest of the fruit may otherwise look healthy',
    ],
    why: [
      'Inconsistent soil moisture',
      'Letting plants dry out then watering heavily',
      'Root damage or cold soils that slow uptake',
    ],
    fix: [
      'Keep soil evenly moist',
      'Mulch to reduce moisture swings',
      'Do not overdo high-nitrogen fertiliser',
      'Remove badly affected fruit so the plant can focus on healthy ones',
    ],
    prevent: [
      'Water deeply and regularly',
      'Mulch once soil has warmed',
      'Avoid severe transplant shock',
    ],
  },
  {
    id: 'aphids',
    name: 'Aphids',
    icon: 'pest_control',
    whatIsIt:
      'Small soft-bodied insects that cluster on young shoots and leaves. They suck sap, distort growth, and can spread plant viruses.',
    identify: [
      'Green, black, yellow or grey insects on soft growth',
      'Sticky honeydew on leaves',
      'Curled or distorted young leaves',
    ],
    why: [
      'Soft, nitrogen-rich growth',
      'Warm weather that speeds reproduction',
      'Few natural predators present',
    ],
    fix: [
      'Wash them off with a strong jet of water',
      'Encourage ladybirds and other predators',
      'Pinch out heavily infested tips',
      'Use insecticidal soap if populations become large',
    ],
    prevent: [
      'Avoid excessive nitrogen feeding',
      'Grow flowering companions that attract beneficial insects',
      'Check plants regularly, especially new growth',
    ],
  },
  {
    id: 'whiteflies',
    name: 'Whiteflies',
    icon: 'pest_control',
    whatIsIt:
      'Tiny white winged insects that gather on the undersides of leaves. They weaken plants and can spread viruses, especially in greenhouses.',
    identify: [
      'Clouds of tiny white insects when foliage is disturbed',
      'Sticky honeydew on leaves',
      'Yellowing or weakened growth',
    ],
    why: [
      'Warm, sheltered conditions',
      'Greenhouse or polytunnel growing',
      'Crowded plants with poor airflow',
    ],
    fix: [
      'Vacuum or gently shake plants outdoors if practical',
      'Use yellow sticky traps in greenhouses',
      'Apply insecticidal soap to leaf undersides',
      'Encourage natural predators where possible',
    ],
    prevent: [
      'Inspect new plants before bringing them indoors',
      'Keep greenhouses well ventilated',
      'Avoid lush, soft growth from excess nitrogen',
    ],
  },
  {
    id: 'slugs',
    name: 'Slugs and snails',
    icon: 'pest_control',
    whatIsIt:
      'Soft-bodied pests that feed mainly at night, chewing holes in leaves, stems and fruit, and can destroy seedlings overnight.',
    identify: [
      'Irregular holes in leaves or fruit',
      'Silvery slime trails',
      'Seedlings disappearing or cut at soil level',
    ],
    why: [
      'Damp conditions and mild weather',
      'Lots of hiding places under debris or mulch edges',
      'Tender young growth close to the ground',
    ],
    fix: [
      'Hand-pick at dusk or after rain',
      'Use traps, barriers or wildlife-friendly pellets',
      'Protect seedlings with cloches or collars',
      'Clear nearby hiding places',
    ],
    prevent: [
      'Keep paths and bed edges tidy',
      'Water in the morning so surfaces dry by night',
      'Raise vulnerable seedlings until they are stronger',
    ],
  },
  {
    id: 'flea-beetles',
    name: 'Flea beetles',
    icon: 'bug_report',
    whatIsIt:
      'Tiny jumping beetles that pepper young leaves with small round holes. Heavy attacks can check seedlings badly.',
    identify: [
      'Many tiny shot-holes in leaves',
      'Beetles jump when disturbed',
      'Worst on young brassicas and salad crops',
    ],
    why: [
      'Warm, dry weather',
      'Exposed seedlings',
      'Brassica crops grown repeatedly in the same place',
    ],
    fix: [
      'Cover crops with fine insect mesh',
      'Keep soil moist to help plants outgrow damage',
      'Remove weeds that harbour beetles',
    ],
    prevent: [
      'Start seedlings under cover and plant out strong',
      'Use mesh from sowing or transplanting',
      'Rotate brassica crops',
    ],
  },
  {
    id: 'cabbage-white-caterpillars',
    name: 'Cabbage white caterpillars',
    icon: 'cruelty_free',
    whatIsIt:
      'Caterpillars of cabbage white butterflies that chew holes in brassica leaves and can strip plants quickly.',
    identify: [
      'Irregular holes in leaves',
      'Green or speckled caterpillars on leaf undersides',
      'Dark droppings on leaves',
    ],
    why: [
      'Butterflies laying eggs on brassicas in warm weather',
      'Uncovered plants',
      'Gardens with many brassicas in one place',
    ],
    fix: [
      'Check leaf undersides and remove eggs and caterpillars by hand',
      'Cover plants with insect netting',
      'Use a biological spray if infestations are severe',
    ],
    prevent: [
      'Net brassicas before butterflies appear',
      'Inspect plants weekly in summer',
      'Clear old brassica stumps after harvest',
    ],
  },
  {
    id: 'spider-mites',
    name: 'Spider mites',
    icon: 'grain',
    whatIsIt:
      'Tiny mites that thrive in hot, dry conditions. They suck sap from leaves, causing fine speckles and sometimes fine webbing.',
    identify: [
      'Pale speckled or bronzed leaves',
      'Fine webbing in severe cases',
      'Worst on the undersides of leaves in heat',
    ],
    why: [
      'Hot, dry weather',
      'Dusty greenhouse conditions',
      'Stressed plants short of water',
    ],
    fix: [
      'Mist foliage lightly to raise humidity where appropriate',
      'Wash leaf undersides with water',
      'Use insecticidal soap if needed',
      'Remove badly infested leaves',
    ],
    prevent: [
      'Keep plants watered in hot weather',
      'Maintain humidity in greenhouses',
      'Avoid dusty, overcrowded growing spaces',
    ],
  },
  {
    id: 'carrot-fly',
    name: 'Carrot fly',
    icon: 'flight',
    whatIsIt:
      'A fly whose larvae tunnel into carrot roots, leaving rusty tunnels and making roots unattractive and prone to rotting.',
    identify: [
      'Rusty brown tunnels in roots',
      'Foliage may redden or wilt in bad attacks',
      'Damage often worse on thinned rows',
    ],
    why: [
      'Adult flies attracted by the scent of bruised foliage',
      'Carrots grown without protection',
      'Successive carrot crops in the same spot',
    ],
    fix: [
      'Harvest affected roots early before damage spreads',
      'Cover remaining crops with fine mesh',
      'Avoid leaving damaged roots in the ground',
    ],
    prevent: [
      'Cover beds with fine insect mesh from sowing',
      'Sow thinly to reduce thinning',
      'Rotate carrot-family crops',
    ],
  },
  {
    id: 'onion-fly',
    name: 'Onion fly',
    icon: 'pest_control',
    whatIsIt:
      'A pest of onions and related crops. Maggots feed at the base of plants, causing wilting, yellowing and collapse of seedlings or young bulbs.',
    identify: [
      'Sudden wilting of seedlings or young plants',
      'Yellowing leaves',
      'Soft or damaged bases when plants are lifted',
    ],
    why: [
      'Flies laying eggs near onion-family crops',
      'Uncovered plantings in spring',
      'Repeated allium crops in the same bed',
    ],
    fix: [
      'Remove and destroy infested plants',
      'Cover remaining crops with fine mesh',
      'Do not leave rotting bulbs in the soil',
    ],
    prevent: [
      'Cover onions and garlic with mesh after planting',
      'Rotate allium crops',
      'Grow from healthy sets or transplants',
    ],
  },
  {
    id: 'clubroot',
    name: 'Clubroot',
    icon: 'sick',
    whatIsIt:
      'A soil-borne disease of brassicas that distorts roots into swollen clubs. Infected plants wilt easily and make poor growth.',
    identify: [
      'Wilting on hot days even when soil is moist',
      'Stunted, purple-tinged or weak growth',
      'Swollen, distorted roots when plants are lifted',
    ],
    why: [
      'Acid soils favour the disease',
      'Infected soil moved on tools or plants',
      'Brassicas grown too often in the same place',
    ],
    fix: [
      'Lift and destroy infected plants — do not compost them',
      'Improve drainage',
      'Raise soil pH toward neutral where suitable',
    ],
    prevent: [
      'Rotate brassicas for several years',
      'Lime acid soils before planting brassicas',
      'Clean tools and avoid moving infected soil',
    ],
  },
  {
    id: 'bolting',
    name: 'Bolting',
    icon: 'trending_up',
    whatIsIt:
      'Plants flower and set seed earlier than wanted, often making leaves or roots bitter, tough or unusable.',
    identify: [
      'A tall flowering stem appears suddenly',
      'Leaves become tougher or more bitter',
      'Root crops may become woody',
    ],
    why: [
      'Heat stress or drought',
      'Long day length in summer',
      'Cold stress followed by warm weather',
    ],
    fix: [
      'Harvest promptly once flowering starts',
      'Provide shade and water for remaining plants',
      'Sow a fresh batch for succession crops',
    ],
    prevent: [
      'Grow heat-sensitive crops mainly in spring and autumn',
      'Keep soil evenly moist',
      'Choose bolt-resistant varieties where available',
    ],
  },
  {
    id: 'flower-drop',
    name: 'Flower drop',
    icon: 'local_florist',
    whatIsIt:
      'Flowers fall off before fruit sets. Common on tomatoes and peppers when temperatures swing too high or too low, or when plants are stressed.',
    identify: [
      'Flowers yellow and drop without forming fruit',
      'Plants may otherwise look healthy',
      'Often coincides with heatwaves or cold nights',
    ],
    why: [
      'Night temperatures too low or daytime heat too high',
      'Irregular watering',
      'Sudden stress after transplanting',
    ],
    fix: [
      'Keep watering steady',
      'Provide shade during extreme heat',
      'Protect from cold nights where possible',
      'Avoid heavy feeding until fruit begins to set',
    ],
    prevent: [
      'Harden plants off carefully before planting out',
      'Plant only when nights are reliably warm enough',
      'Maintain even moisture with mulch',
    ],
  },
  {
    id: 'cracked-fruit',
    name: 'Cracked fruit',
    icon: 'broken_image',
    whatIsIt:
      'Fruit skins split after a sudden flush of water following dry weather. The fruit expands faster than the skin can stretch.',
    identify: [
      'Radial or concentric cracks on ripening fruit',
      'Often appears after heavy rain or deep watering after drought',
      'Cracks may invite rot or pests',
    ],
    why: [
      'Uneven watering',
      'Drought followed by heavy rain or irrigation',
      'Very rapid fruit swelling',
    ],
    fix: [
      'Keep soil moisture more even from now on',
      'Harvest cracked fruit promptly for eating',
      'Mulch to buffer moisture swings',
    ],
    prevent: [
      'Water regularly rather than in big irregular doses',
      'Mulch around fruiting plants',
      'Avoid letting pots dry out completely',
    ],
  },
  {
    id: 'poor-pollination',
    name: 'Poor pollination',
    icon: 'hive',
    whatIsIt:
      'Fruit fails to form properly, or forms misshapen, because flowers were not pollinated well enough.',
    identify: [
      'Misshapen fruit',
      'Flowers that open but set little or no fruit',
      'Common on cucumbers, squash and greenhouse crops',
    ],
    why: [
      'Few pollinating insects',
      'Very hot, wet or windy weather during flowering',
      'Enclosed greenhouse conditions',
    ],
    fix: [
      'Encourage bees with flowering companions',
      'Open greenhouse vents during the day',
      'Hand-pollinate if needed by transferring pollen between flowers',
    ],
    prevent: [
      'Avoid insecticides while plants are flowering',
      'Grow a mix of flowers near vegetable beds',
      'Ensure good airflow and daytime access for pollinators',
    ],
  },
  {
    id: 'bitter-fruit',
    name: 'Bitter fruit',
    icon: 'sentiment_dissatisfied',
    whatIsIt:
      'Fruit develops an unpleasant bitter flavour, most often in cucumbers stressed by irregular watering or heat.',
    identify: [
      'Bitter taste, especially near the stem end',
      'Often linked with dry spells',
      'Fruit may still look normal',
    ],
    why: [
      'Drought stress',
      'Wide swings in soil moisture',
      'High heat during fruiting',
    ],
    fix: [
      'Restore even watering immediately',
      'Mulch to hold moisture',
      'Harvest regularly so plants keep producing milder fruit',
    ],
    prevent: [
      'Never let cucumber roots dry out',
      'Use moisture-retentive, compost-rich soil',
      'Provide light shade during extreme heat if needed',
    ],
  },
  {
    id: 'bitter-leaves',
    name: 'Bitter leaves',
    icon: 'spa',
    whatIsIt:
      'Salad leaves turn bitter and less pleasant to eat, usually when plants are hot, dry, or beginning to bolt.',
    identify: [
      'Sharp or bitter flavour',
      'Leaves may toughen',
      'Often appears with heat or flowering stems',
    ],
    why: [
      'Heat and drought',
      'Bolting',
      'Harvesting leaves that are too old',
    ],
    fix: [
      'Harvest remaining mild leaves promptly',
      'Water thoroughly and add shade if possible',
      'Sow a fresh batch for cooler conditions',
    ],
    prevent: [
      'Keep soil evenly moist',
      'Grow lettuce and rocket mainly in cooler seasons',
      'Harvest young and often',
    ],
  },
  {
    id: 'tip-burn',
    name: 'Tip burn',
    icon: 'border_style',
    whatIsIt:
      'Leaf edges or tips turn brown and dry, commonly on lettuce. It is usually linked to uneven watering or calcium movement inside the plant.',
    identify: [
      'Brown or scorched leaf margins',
      'Otherwise healthy-looking heads',
      'Worse in hot, fast-growing conditions',
    ],
    why: [
      'Irregular watering',
      'Rapid growth in heat',
      'Dry spells that interrupt nutrient flow',
    ],
    fix: [
      'Keep soil moisture steady',
      'Harvest affected heads and grow the next sowing more evenly',
      'Provide light shade in hot spells',
    ],
    prevent: [
      'Water consistently',
      'Mulch salad beds',
      'Avoid forcing very soft, rapid growth with excess nitrogen',
    ],
  },
  {
    id: 'root-splitting',
    name: 'Root splitting',
    icon: 'call_split',
    whatIsIt:
      'Roots crack lengthways after irregular watering. Common in radishes and carrots when dry soil is suddenly soaked.',
    identify: [
      'Lengthwise cracks in roots',
      'Often after rain following drought',
      'Roots may still be edible if harvested quickly',
    ],
    why: [
      'Uneven moisture',
      'Sudden heavy watering after dry soil',
      'Leaving roots in the ground too long',
    ],
    fix: [
      'Return to steady watering',
      'Harvest cracked roots promptly',
      'Mulch to even out moisture',
    ],
    prevent: [
      'Keep soil evenly moist from germination onward',
      'Do not let beds dry hard between waterings',
      'Harvest root crops on time',
    ],
  },
  {
    id: 'forked-roots',
    name: 'Forked roots',
    icon: 'fork_right',
    whatIsIt:
      'Carrots and similar roots divide or twist instead of growing straight, usually because the soil is stony, compacted, or freshly manured.',
    identify: [
      'Split, twisted or multiple-rooted carrots',
      'Roots push against stones or hard layers',
      'Shape is affected more than flavour',
    ],
    why: [
      'Stones or compacted soil',
      'Fresh manure before sowing',
      'Heavy clay that was not loosened deeply',
    ],
    fix: [
      'Harvest and use misshapen roots as usual',
      'Improve the bed before the next sowing',
    ],
    prevent: [
      'Sow in deep, stone-free soil',
      'Never add fresh manure just before carrots',
      'Grow shorter-rooted varieties in shallow soils',
    ],
  },
  {
    id: 'hairy-roots',
    name: 'Hairy roots',
    icon: 'grass',
    whatIsIt:
      'Carrot roots grow many fine side roots, often after too much nitrogen or freshly enriched soil.',
    identify: [
      'Lots of fine lateral roots on the main carrot',
      'Roots may look rough or hairy when washed',
      'Shape can still be fairly straight',
    ],
    why: [
      'Excess nitrogen',
      'Fresh organic matter worked in just before sowing',
      'Over-rich soil',
    ],
    fix: [
      'Use the crop as normal',
      'For the next sowing, choose a bed that was enriched earlier',
    ],
    prevent: [
      'Feed the previous crop, not the carrot bed itself',
      'Avoid high-nitrogen fertilisers on carrots',
      'Use compost that is well matured',
    ],
  },
  {
    id: 'poor-germination',
    name: 'Poor germination',
    icon: 'psychiatry',
    whatIsIt:
      'Seeds fail to come up evenly, or come up sparsely. Drying out during germination is one of the most common causes.',
    identify: [
      'Few seedlings appear',
      'Germination is patchy along the row',
      'Soil surface has crusted or dried out',
    ],
    why: [
      'Soil drying during the germination period',
      'Sowing too deep or into cold soil',
      'Old seed with low viability',
    ],
    fix: [
      'Keep the seedbed evenly moist until seedlings establish',
      'Resow gaps once conditions improve',
      'Use fresh seed if germination remains poor',
    ],
    prevent: [
      'Water gently and regularly after sowing',
      'Cover seedbeds with fleece or fine mulch to hold moisture',
      'Sow at the recommended depth into workable soil',
    ],
  },
  {
    id: 'pithy-roots',
    name: 'Pithy roots',
    icon: 'contrast',
    whatIsIt:
      'Radishes and similar quick roots become spongy, hollow or woody when left in the ground too long or grown too slowly in heat.',
    identify: [
      'Soft, spongy or hollow centres',
      'Hot or unpleasant flavour',
      'Roots past their best size',
    ],
    why: [
      'Delayed harvesting',
      'Hot weather slowing quality',
      'Drought stress',
    ],
    fix: [
      'Harvest remaining roots immediately',
      'Sow a fresh batch for cooler conditions',
    ],
    prevent: [
      'Harvest as soon as roots reach usable size',
      'Sow little and often',
      'Keep moisture steady in warm weather',
    ],
  },
  {
    id: 'sunscald',
    name: 'Sunscald',
    icon: 'wb_sunny',
    whatIsIt:
      'Fruit skins bleach or blister where suddenly exposed to strong sun, often after foliage loss or aggressive pruning.',
    identify: [
      'Pale, papery or sunken patches on fruit',
      'Damage on the side facing the sun',
      'Often follows leaf loss or heavy pruning',
    ],
    why: [
      'Sudden exposure of fruit to intense sun',
      'Leaf disease stripping foliage',
      'Removing too many leaves at once',
    ],
    fix: [
      'Provide temporary shade during heatwaves',
      'Harvest damaged fruit for cooking if usable',
      'Preserve remaining leaf cover',
    ],
    prevent: [
      'Do not over-prune fruiting plants',
      'Control leaf diseases early',
      'Use shade cloth in extreme heat if needed',
    ],
  },
  {
    id: 'cucumber-beetles',
    name: 'Cucumber beetles',
    icon: 'bug_report',
    whatIsIt:
      'Striped or spotted beetles that chew cucumber-family leaves and flowers and can spread bacterial wilt.',
    identify: [
      'Beetles feeding on leaves and flowers',
      'Chewed foliage and damaged seedlings',
      'Wilting that does not recover after watering, if wilt disease follows',
    ],
    why: [
      'Warm weather bringing adults into the crop',
      'Unprotected young plants',
      'Cucurbit crops grown repeatedly in one area',
    ],
    fix: [
      'Cover young plants with fine mesh',
      'Hand-pick beetles where practical',
      'Remove badly wilted plants if disease takes hold',
    ],
    prevent: [
      'Use row covers until flowering',
      'Rotate cucurbit crops',
      'Clear old cucurbit debris after harvest',
    ],
  },
  {
    id: 'squash-bugs',
    name: 'Squash bugs',
    icon: 'bug_report',
    whatIsIt:
      'Shield-shaped bugs that suck sap from squash and pumpkin leaves, causing wilting and yellow or brown spots.',
    identify: [
      'Brown or grey bugs on leaves and stems',
      'Clusters of bronze eggs on leaf undersides',
      'Wilting leaves that may later crisp and die',
    ],
    why: [
      'Warm weather',
      'Unprotected squash plants',
      'Eggs left to hatch under leaves',
    ],
    fix: [
      'Hand-pick adults and crush eggs',
      'Trap under boards overnight and remove in the morning',
      'Keep the area clear of debris',
    ],
    prevent: [
      'Check leaf undersides weekly',
      'Remove old cucurbit vines after harvest',
      'Protect young plants early in the season',
    ],
  },
  {
    id: 'colorado-potato-beetle',
    name: 'Colorado potato beetle',
    icon: 'bug_report',
    whatIsIt:
      'A distinctive beetle whose larvae and adults can strip potato foliage rapidly if not controlled.',
    identify: [
      'Yellow-and-black striped adults',
      'Reddish soft-bodied larvae on leaves',
      'Leaves skeletonised or heavily chewed',
    ],
    why: [
      'Warm weather and nearby potato crops',
      'Beetles overwintering in soil',
      'Unprotected potato plantings',
    ],
    fix: [
      'Hand-pick adults, larvae and egg clusters',
      'Check plants every few days in early summer',
      'Remove heavily damaged leaves if needed',
    ],
    prevent: [
      'Rotate potatoes away from last year\'s bed',
      'Inspect plants early, before populations explode',
      'Clear leftover tubers that sprout as volunteers',
    ],
  },
  {
    id: 'pea-moth',
    name: 'Pea moth',
    icon: 'pest_control',
    whatIsIt:
      'A moth whose caterpillars feed inside pea pods, leaving maggoty peas and frass inside otherwise healthy-looking pods.',
    identify: [
      'Small caterpillars or frass inside pods',
      'Peas with holes or damaged seeds',
      'Outwardly normal pods until opened',
    ],
    why: [
      'Moths active while peas are flowering',
      'Unprotected pea crops',
      'Peas sown so flowering coincides with peak moth activity',
    ],
    fix: [
      'Harvest promptly and discard badly damaged peas',
      'Net flowering crops where moths are common',
    ],
    prevent: [
      'Sow early or late to avoid peak moth periods where possible',
      'Use fine mesh during flowering in problem areas',
      'Rotate peas and clear old haulm',
    ],
  },
  {
    id: 'common-scab',
    name: 'Common scab',
    icon: 'blur_circular',
    whatIsIt:
      'A soil-borne condition that roughens potato skins with corky scabs. Tubers are usually still edible after peeling.',
    identify: [
      'Corky, rough patches on tuber skins',
      'Damage is mostly cosmetic',
      'Worse in dry, alkaline soils',
    ],
    why: [
      'Dry soil while tubers are forming',
      'Alkaline conditions',
      'Sensitive potato varieties',
    ],
    fix: [
      'Use affected potatoes as normal after peeling',
      'Keep soil more evenly moist for the next crop',
    ],
    prevent: [
      'Water steadily once tubers begin forming',
      'Avoid liming potato beds',
      'Choose scab-resistant varieties if the problem recurs',
    ],
  },
  {
    id: 'green-tubers',
    name: 'Green tubers',
    icon: 'warning',
    whatIsIt:
      'Potato tubers turn green after light exposure. Green potatoes can contain higher levels of natural toxins and should not be eaten.',
    identify: [
      'Green patches on tuber skins',
      'Tubers pushed to the soil surface',
      'Often follows poor earthing up',
    ],
    why: [
      'Sunlight reaching developing tubers',
      'Shallow planting or insufficient earthing up',
      'Soil washing away in heavy rain',
    ],
    fix: [
      'Do not eat green potatoes',
      'Earth up remaining plants immediately',
      'Harvest and discard greened tubers',
    ],
    prevent: [
      'Plant at the recommended depth',
      'Earth up several times as shoots grow',
      'Use containers deep enough to keep tubers covered',
    ],
  },
  {
    id: 'grey-mould',
    name: 'Grey mould (Botrytis)',
    icon: 'cloud',
    whatIsIt:
      'A grey, fuzzy fungal rot that attacks soft tissue, flowers and ripening fruit, especially in damp, still air.',
    identify: [
      'Grey fuzzy mould on fruit, flowers or leaves',
      'Soft rotting tissue underneath',
      'Spreads quickly in humid weather',
    ],
    why: [
      'High humidity and poor airflow',
      'Damaged or overcrowded fruit',
      'Wet fruit sitting against soil or foliage',
    ],
    fix: [
      'Remove mouldy fruit and leaves immediately',
      'Improve airflow',
      'Avoid wetting flowers and fruit',
    ],
    prevent: [
      'Space plants well',
      'Harvest ripe fruit promptly',
      'Use straw or mats under strawberries',
    ],
  },
  {
    id: 'root-rot',
    name: 'Root rot',
    icon: 'opacity',
    whatIsIt:
      'Roots decay in waterlogged or poorly drained soil. Above ground, plants wilt, yellow and fail to thrive.',
    identify: [
      'Wilting despite wet soil',
      'Yellowing foliage',
      'Brown, soft or foul-smelling roots',
    ],
    why: [
      'Waterlogged soil',
      'Poor drainage or compacted ground',
      'Overwatering containers',
    ],
    fix: [
      'Improve drainage immediately if possible',
      'Reduce watering',
      'Lift and discard plants that are too far gone',
    ],
    prevent: [
      'Grow in well-drained soil or raised beds',
      'Use containers with drainage holes',
      'Avoid planting into heavy wet ground',
    ],
  },
  {
    id: 'white-rot',
    name: 'White rot',
    icon: 'sick',
    whatIsIt:
      'A serious soil-borne disease of onions, garlic and related crops. It produces white fluffy growth and black resting bodies around the bulb base.',
    identify: [
      'Yellowing and wilting leaves',
      'White fluffy mould around the bulb',
      'Small black sclerotia in the mould',
    ],
    why: [
      'Infected soil',
      'Alliums replanted too soon in the same place',
      'Moving contaminated soil on tools or plants',
    ],
    fix: [
      'Lift and destroy infected plants',
      'Do not compost them',
      'Avoid replanting alliums in that spot for several years',
    ],
    prevent: [
      'Rotate onions and garlic widely',
      'Buy clean planting material',
      'Clean tools after working in infected ground',
    ],
  },
  {
    id: 'rust',
    name: 'Rust',
    icon: 'blur_on',
    whatIsIt:
      'Fungal pustules, often orange or brown, appear on leaves of garlic, leeks and other crops. Severe cases weaken plants and reduce bulb size.',
    identify: [
      'Orange, brown or rust-coloured pustules on leaves',
      'Leaves may yellow and die early',
      'Common late in the season on alliums',
    ],
    why: [
      'Humid weather',
      'Crowded plants',
      'Repeated allium cropping',
    ],
    fix: [
      'Remove the worst-affected leaves',
      'Improve spacing and airflow',
      'Keep plants watered and growing strongly',
    ],
    prevent: [
      'Rotate allium crops',
      'Avoid overhead watering',
      'Clear old foliage after harvest',
    ],
  },
  {
    id: 'bulb-rot',
    name: 'Bulb rot',
    icon: 'dangerous',
    whatIsIt:
      'Onion or garlic bulbs soften and rot in the ground or in store, often after damage, wet soil or incomplete curing.',
    identify: [
      'Soft, wet or foul-smelling bulbs',
      'Discoloured skins or necks',
      'Rot spreading in storage',
    ],
    why: [
      'Waterlogged soil',
      'Damaged or poorly cured bulbs',
      'Storing wet or immature bulbs',
    ],
    fix: [
      'Remove rotting bulbs immediately',
      'Improve curing and storage dryness',
      'Use sound bulbs first',
    ],
    prevent: [
      'Grow on free-draining soil',
      'Cure thoroughly before storage',
      'Store only firm, dry bulbs in an airy place',
    ],
  },
  {
    id: 'soft-necks',
    name: 'Soft necks',
    icon: 'water',
    whatIsIt:
      'Onion necks stay thick and soft instead of drying down, making bulbs hard to ripen and poor keepers.',
    identify: [
      'Thick, fleshy necks at harvest',
      'Bulbs slow to dry',
      'Often follows late nitrogen feeding',
    ],
    why: [
      'Too much nitrogen late in the season',
      'Wet weather at ripening',
      'Overcrowding or delayed maturity',
    ],
    fix: [
      'Stop feeding and ease off watering',
      'Lift bulbs when tops fall naturally and cure thoroughly',
      'Use soft-necked bulbs sooner rather than storing long-term',
    ],
    prevent: [
      'Stop nitrogen once bulbs begin swelling',
      'Keep beds weed-free and well spaced',
      'Choose a sunny, free-draining site',
    ],
  },
  {
    id: 'small-bulbs',
    name: 'Small bulbs',
    icon: 'radio_button_unchecked',
    whatIsIt:
      'Onions or garlic produce undersized bulbs because of late planting, overcrowding, poor feeding, or insufficient sunlight.',
    identify: [
      'Bulbs much smaller than expected at harvest',
      'Foliage may have been weak or shaded',
      'Crowded planting is often visible',
    ],
    why: [
      'Late planting',
      'Overcrowding',
      'Insufficient sun or fertility',
    ],
    fix: [
      'Use small bulbs in the kitchen as usual',
      'Note the cause and adjust spacing or timing next season',
    ],
    prevent: [
      'Plant on time at the correct spacing',
      'Choose a full-sun site',
      'Feed during early leaf growth, then stop in good time',
    ],
  },
  {
    id: 'fusarium-wilt',
    name: 'Fusarium wilt',
    icon: 'sick',
    whatIsIt:
      'A soil-borne fungal wilt that blocks water movement in the plant. Affected plants yellow, wilt and may die even when soil moisture seems adequate.',
    identify: [
      'Wilting that does not recover overnight',
      'Yellowing, often starting on one side of the plant',
      'Brown staining inside the stem if cut open',
    ],
    why: [
      'Infected soil',
      'Warm soil temperatures',
      'Replanting susceptible crops in the same place',
    ],
    fix: [
      'Remove and destroy infected plants',
      'Do not compost them',
      'Avoid replanting the same crop in that spot',
    ],
    prevent: [
      'Rotate crops',
      'Use resistant varieties where available',
      'Practice good hygiene with tools and pots',
    ],
  },
  {
    id: 'yellow-leaves-overwatering',
    name: 'Yellow leaves from overwatering',
    icon: 'opacity',
    whatIsIt:
      'Leaves turn yellow when roots sit too wet and cannot breathe. Often confused with nutrient deficiency, but the soil usually feels soggy.',
    identify: [
      'General yellowing of leaves',
      'Soil stays wet for long periods',
      'Growth slows and plants look dull',
    ],
    why: [
      'Overwatering',
      'Poor drainage',
      'Containers without enough drainage holes',
    ],
    fix: [
      'Allow the top of the soil to dry before watering again',
      'Improve drainage if possible',
      'Empty saucers under pots',
    ],
    prevent: [
      'Water only when the surface begins to dry',
      'Use free-draining compost in containers',
      'Match watering to weather and plant size',
    ],
  },
  {
    id: 'birds',
    name: 'Birds',
    icon: 'visibility',
    whatIsIt:
      'Birds peck ripening fruit or pull at seedlings. Strawberries and soft fruit are especially attractive.',
    identify: [
      'Pecked or missing fruit',
      'Disturbed straw or mulch',
      'Damage often worse as fruit colours up',
    ],
    why: [
      'Ripening fruit in open beds',
      'Easy access without netting',
      'Hungry birds in dry weather',
    ],
    fix: [
      'Net crops as soon as fruit begins to colour',
      'Harvest ripe fruit daily',
      'Use temporary covers over vulnerable beds',
    ],
    prevent: [
      'Net soft fruit before ripening starts',
      'Keep nets taut so birds do not get trapped',
      'Harvest promptly',
    ],
  },
  {
    id: 'wind-damage',
    name: 'Wind damage',
    icon: 'air',
    whatIsIt:
      'Strong wind bruises leaves, snaps stems or rocks plants loose. Tall herbs and brassicas are particularly vulnerable.',
    identify: [
      'Torn or bruised leaves',
      'Leaning or snapped stems',
      'Plants loosened at the base',
    ],
    why: [
      'Exposed sites',
      'Tall, unsupported plants',
      'Soft growth after wet weather',
    ],
    fix: [
      'Stake or support damaged plants',
      'Firm soil back around rocked roots',
      'Trim broken stems cleanly',
    ],
    prevent: [
      'Stake tall crops early',
      'Choose sheltered sites or use windbreaks',
      'Do not overfeed soft, sappy growth',
    ],
  },
  {
    id: 'wind-rock',
    name: 'Wind rock',
    icon: 'air',
    whatIsIt:
      'Wind loosens tall plants at the base, creating a gap around the stem that fills with water and invites disease or poor rooting.',
    identify: [
      'Plants leaning after storms',
      'A socket of loose soil around the stem',
      'Common on Brussels sprouts and tall brassicas',
    ],
    why: [
      'Tall top growth on insufficiently firm soil',
      'Exposed windy sites',
      'Late staking',
    ],
    fix: [
      'Firm soil around stems after wind',
      'Add a stake if plants are tall',
      'Earth up slightly around the base',
    ],
    prevent: [
      'Plant into firm ground',
      'Stake exposed plants early',
      'Choose sturdy varieties for windy gardens',
    ],
  },
  {
    id: 'fruit-rot-wet-soil',
    name: 'Fruit rotting on wet soil',
    icon: 'water',
    whatIsIt:
      'Fruit resting on constantly wet ground softens and rots. Common with squash and pumpkins in wet seasons.',
    identify: [
      'Soft patches where fruit touches soil',
      'Mould or decay on the underside',
      'Worse in wet weather',
    ],
    why: [
      'Fruit sitting on wet soil',
      'Poor airflow under vines',
      'Prolonged rain',
    ],
    fix: [
      'Lift fruit onto straw, boards or tiles',
      'Improve drainage around plants if possible',
      'Harvest usable fruit early if rot starts',
    ],
    prevent: [
      'Place straw or boards under developing fruit',
      'Mulch to keep fruit cleaner and drier',
      'Avoid watering that leaves puddles under vines',
    ],
  },
  {
    id: 'loose-sprouts',
    name: 'Loose sprouts',
    icon: 'expand',
    whatIsIt:
      'Brussels sprouts open into loose “blown” buttons instead of staying tight. Warm weather and soft growth are common causes.',
    identify: [
      'Open, leafy sprouts instead of firm buttons',
      'Often worse after mild spells',
      'Plants may still be otherwise healthy',
    ],
    why: [
      'Warm autumn weather',
      'Soft, loose planting',
      'Excess nitrogen',
    ],
    fix: [
      'Harvest any firm sprouts that remain',
      'Firm soil around plants and stop late nitrogen feeds',
    ],
    prevent: [
      'Plant into firm ground',
      'Avoid excess nitrogen once sprouts begin forming',
      'Choose varieties suited to your climate',
    ],
  },
  {
    id: 'premature-heading',
    name: 'Premature heading',
    icon: 'event_busy',
    whatIsIt:
      'Broccoli forms tiny heads too early, often after a check in growth from cold, heat or irregular watering.',
    identify: [
      'Very small heads appearing earlier than expected',
      'Plants still relatively small',
      'Heads may flower quickly',
    ],
    why: [
      'Growth checked by cold or heat',
      'Irregular watering',
      'Transplanting stress',
    ],
    fix: [
      'Harvest the small head and leave the plant for side shoots if any appear',
      'Keep remaining plants evenly watered',
    ],
    prevent: [
      'Grow plants steadily without checks',
      'Harden off carefully',
      'Keep soil moisture consistent',
    ],
  },
  {
    id: 'poor-pod-production',
    name: 'Poor pod production',
    icon: 'inventory_2',
    whatIsIt:
      'Pea plants grow plenty of foliage but set few pods, often because of excess nitrogen or stress during flowering.',
    identify: [
      'Lush leafy plants with few pods',
      'Flowers dropping without setting',
      'Slow pod fill in dry weather',
    ],
    why: [
      'Too much nitrogen',
      'Dry soil during flowering',
      'Heat stress',
    ],
    fix: [
      'Water thoroughly during flowering and pod fill',
      'Stop nitrogen-rich feeds',
      'Mulch to hold moisture',
    ],
    prevent: [
      'Grow peas in moderately fertile soil',
      'Water well once flowers appear',
      'Avoid high-nitrogen fertilisers',
    ],
  },
  {
    id: 'heat-decline',
    name: 'Heat decline',
    icon: 'device_thermostat',
    whatIsIt:
      'Cool-season crops such as peas decline quickly once hot weather arrives, stopping flowering and drying off early.',
    identify: [
      'Sudden slowdown in flowering',
      'Yellowing or drying foliage in heat',
      'Crop finishes earlier than expected',
    ],
    why: [
      'High temperatures',
      'Dry soil in hot spells',
      'Late sowings that flower into midsummer',
    ],
    fix: [
      'Water deeply and mulch',
      'Harvest remaining pods promptly',
      'Accept the season end and sow earlier next year',
    ],
    prevent: [
      'Sow early for a spring crop',
      'Choose a cooler spot with light afternoon shade',
      'Keep roots moist during warm spells',
    ],
  },
  {
    id: 'premature-flowering',
    name: 'Premature flowering',
    icon: 'local_florist',
    whatIsIt:
      'Herbs such as dill or basil run to flower earlier than wanted, reducing leaf production and changing flavour.',
    identify: [
      'Flower stems appearing while plants are still young',
      'Leaf production slows',
      'Flavour may weaken or change',
    ],
    why: [
      'Heat and long days',
      'Drought stress',
      'Leaving flower buds unchecked',
    ],
    fix: [
      'Pinch out flower buds if you want more leaves',
      'Water more consistently',
      'Sow a fresh batch for continuous leaves',
    ],
    prevent: [
      'Succession sow leafy herbs',
      'Keep soil moisture steady',
      'Harvest and pinch regularly',
    ],
  },
];

export const guideProblemsById = Object.fromEntries(
  GUIDE_PROBLEMS.map((problem) => [problem.id, problem])
);

export function getGuideProblem(id) {
  return guideProblemsById[id] || null;
}

export function getGuideProblemsByIds(ids = []) {
  return ids.map((id) => getGuideProblem(id)).filter(Boolean);
}

/** Crops in the vegetable guide that list this problem. */
export function getCropsAffectedByProblem(problemId, vegetableGuide = []) {
  return vegetableGuide
    .filter((veg) => Array.isArray(veg.commonProblems) && veg.commonProblems.includes(problemId))
    .map((veg) => veg.name);
}

export default GUIDE_PROBLEMS;
