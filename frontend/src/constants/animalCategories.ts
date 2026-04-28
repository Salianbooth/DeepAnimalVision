export type AnimalCategory =
  | 'mammal'
  | 'bird'
  | 'reptile'
  | 'amphibian'
  | 'fish'
  | 'insect'
  | 'arachnid'
  | 'crustacean'
  | 'mollusk'
  | 'myriapod'
  | 'marine_invertebrate'
  | 'annelid'

export interface AnimalCategoryMeta {
  name: string
  description: string
  color: string
}

export const ANIMAL_CATEGORY_META: Record<AnimalCategory, AnimalCategoryMeta> = {
  mammal: {
    name: '哺乳动物',
    description: '主要特征是胎生或哺乳，常见于陆地与部分海洋环境。',
    color: '#0F766E',
  },
  bird: {
    name: '鸟类',
    description: '有羽毛、喙与翅膀，大多擅长飞行或栖息树上、水边。',
    color: '#2563EB',
  },
  reptile: {
    name: '爬行动物',
    description: '体表多有鳞片，常贴地活动，也包含龟、鳄等类型。',
    color: '#EA580C',
  },
  amphibian: {
    name: '两栖动物',
    description: '常在水域和陆地间活动，对潮湿环境依赖较高。',
    color: '#0891B2',
  },
  fish: {
    name: '鱼类',
    description: '主要生活在水中，通过鳍和尾部完成游动。',
    color: '#0284C7',
  },
  insect: {
    name: '昆虫类',
    description: '通常体型较小，许多种类拥有翅膀或明显分节结构。',
    color: '#7C3AED',
  },
  arachnid: {
    name: '蛛形类',
    description: '包含蜘蛛、蝎子、蜱虫等，外形与昆虫差异较明显。',
    color: '#DC2626',
  },
  crustacean: {
    name: '甲壳类',
    description: '常见于水边或海洋，具有坚硬外壳，如蟹和虾。',
    color: '#EC4899',
  },
  mollusk: {
    name: '软体类',
    description: '身体柔软，部分种类有壳，常见如蜗牛和鱿鱼。',
    color: '#64748B',
  },
  myriapod: {
    name: '多足类',
    description: '身体由多个体节组成，足数量明显较多，如蜈蚣。',
    color: '#9333EA',
  },
  marine_invertebrate: {
    name: '海洋无脊椎类',
    description: '生活在海洋中，没有脊椎结构，如海蜇、海星。',
    color: '#0EA5E9',
  },
  annelid: {
    name: '环节动物',
    description: '身体呈连续分节状，典型代表为蠕虫类。',
    color: '#A16207',
  },
}

export const UNKNOWN_CATEGORY_META: AnimalCategoryMeta = {
  name: '未分类',
  description: '当前结果还没有匹配到预设的大类说明。',
  color: '#94A3B8',
}

export const ANIMAL_CATEGORY_BY_LABEL: Record<string, AnimalCategory> = {
  Bear: 'mammal',
  'Brown bear': 'mammal',
  Bull: 'mammal',
  Butterfly: 'insect',
  Camel: 'mammal',
  Canary: 'bird',
  Caterpillar: 'insect',
  Cattle: 'mammal',
  Centipede: 'myriapod',
  Cheetah: 'mammal',
  Chicken: 'bird',
  Crab: 'crustacean',
  Crocodile: 'reptile',
  Deer: 'mammal',
  Duck: 'bird',
  Eagle: 'bird',
  Elephant: 'mammal',
  Fish: 'fish',
  Fox: 'mammal',
  Frog: 'amphibian',
  Giraffe: 'mammal',
  Goat: 'mammal',
  Goldfish: 'fish',
  Goose: 'bird',
  Hamster: 'mammal',
  'Harbor seal': 'mammal',
  Hedgehog: 'mammal',
  Hippopotamus: 'mammal',
  Horse: 'mammal',
  Jaguar: 'mammal',
  Jellyfish: 'marine_invertebrate',
  Kangaroo: 'mammal',
  Koala: 'mammal',
  Ladybug: 'insect',
  Leopard: 'mammal',
  Lion: 'mammal',
  Lizard: 'reptile',
  Lynx: 'mammal',
  Magpie: 'bird',
  Monkey: 'mammal',
  'Moths and butterflies': 'insect',
  Mouse: 'mammal',
  Mule: 'mammal',
  Ostrich: 'bird',
  Otter: 'mammal',
  Owl: 'bird',
  Panda: 'mammal',
  Parrot: 'bird',
  Penguin: 'bird',
  Pig: 'mammal',
  'Polar bear': 'mammal',
  Rabbit: 'mammal',
  Raccoon: 'mammal',
  Raven: 'bird',
  'Red panda': 'mammal',
  Rhinoceros: 'mammal',
  Scorpion: 'arachnid',
  'Sea lion': 'mammal',
  'Sea turtle': 'reptile',
  Seahorse: 'fish',
  Shark: 'fish',
  Sheep: 'mammal',
  Shrimp: 'crustacean',
  Snail: 'mollusk',
  Snake: 'reptile',
  Sparrow: 'bird',
  Spider: 'arachnid',
  Squid: 'mollusk',
  Squirrel: 'mammal',
  Starfish: 'marine_invertebrate',
  Swan: 'bird',
  Tick: 'arachnid',
  Tiger: 'mammal',
  Tortoise: 'reptile',
  Turkey: 'bird',
  Turtle: 'reptile',
  Whale: 'mammal',
  Woodpecker: 'bird',
  Worm: 'annelid',
  Zebra: 'mammal',
}

export function getAnimalCategory(label: string): AnimalCategory | 'unknown' {
  return ANIMAL_CATEGORY_BY_LABEL[label] || 'unknown'
}

export function getAnimalCategoryMeta(category: AnimalCategory | 'unknown'): AnimalCategoryMeta {
  if (category === 'unknown') return UNKNOWN_CATEGORY_META
  return ANIMAL_CATEGORY_META[category]
}

export function getAnimalCategoryMetaByLabel(label: string): AnimalCategoryMeta {
  return getAnimalCategoryMeta(getAnimalCategory(label))
}

export function getAnimalCategoryName(label: string): string {
  return getAnimalCategoryMetaByLabel(label).name
}

export function getAnimalCategoryDescription(label: string): string {
  return getAnimalCategoryMetaByLabel(label).description
}

export function getAnimalCategoryColor(label: string): string {
  return getAnimalCategoryMetaByLabel(label).color
}
