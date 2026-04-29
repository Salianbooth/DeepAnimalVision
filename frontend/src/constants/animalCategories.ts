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

// ─── Habitat dimension ────────────────────────────────────────────────────────

export type AnimalHabitat = 'terrestrial_wild' | 'aquatic' | 'aerial' | 'domestic'

export interface AnimalHabitatMeta {
  name: string
  color: string
  icon: string
}

export const ANIMAL_HABITAT_META: Record<AnimalHabitat, AnimalHabitatMeta> = {
  terrestrial_wild: { name: '陆地野生', color: '#15803D', icon: '🌿' },
  aquatic:          { name: '水域',     color: '#0284C7', icon: '🌊' },
  aerial:           { name: '空中/树栖', color: '#7C3AED', icon: '🌤️' },
  domestic:         { name: '家养驯化', color: '#B45309', icon: '🏠' },
}

export const UNKNOWN_HABITAT_META: AnimalHabitatMeta = {
  name: '未知栖息地',
  color: '#94A3B8',
  icon: '❓',
}

export interface AnimalInfo {
  habitat: AnimalHabitat
  info: string
}

export const ANIMAL_INFO_BY_LABEL: Record<string, AnimalInfo> = {
  Bear: {
    habitat: 'terrestrial_wild',
    info: '熊是一种大型杂食性哺乳动物，广泛分布于北美、欧亚大陆的森林与山地。它们是出色的游泳者和攀爬者，会在秋季大量进食以备冬眠。北美黑熊是熊科中数量最多的物种，嗅觉极为灵敏，是人类的七倍。',
  },
  'Brown bear': {
    habitat: 'terrestrial_wild',
    info: '棕熊是世界上体型最大的陆地肉食性动物之一，分布于北美阿拉斯加、欧洲及俄罗斯远东地区。它们以鱼类、浆果和根茎为食，每年秋季会囤积大量脂肪用于冬眠。堪察加半岛的棕熊个体体重可超过600公斤，是棕熊中体型最大的亚种。',
  },
  Bull: {
    habitat: 'domestic',
    info: '牛是最早被人类驯化的大型家畜之一，历史可追溯至约1万年前。公牛通常指未去势的雄性黄牛或其他牛种，被广泛用于农业耕作与繁殖。斗牛运动中使用的斗牛在激怒后会本能地向移动目标冲刺，反应速度极快。',
  },
  Butterfly: {
    habitat: 'aerial',
    info: '蝴蝶是鳞翅目中一类白天活动的昆虫，以其绚丽的翅膀图案和优雅的飞行方式著称，广泛分布于全球热带和温带地区。它们经历完全变态发育：卵、幼虫、蛹、成虫四个阶段，成虫主要以花蜜为食。帝王蝶每年会在北美进行长达4000公里以上的季节性迁徙，是已知迁徙距离最长的昆虫之一。',
  },
  Camel: {
    habitat: 'terrestrial_wild',
    info: '骆驼是荒漠地区的代表性哺乳动物，能在极端干旱和高温环境中生存，主要分布于中亚、中东及非洲撒哈拉地区。其驼峰储存的是脂肪而非水，可在代谢时转化为能量和水分。骆驼可以一次性喝下超过100升水，并在体温大幅波动时维持正常生理功能。',
  },
  Canary: {
    habitat: 'domestic',
    info: '金丝雀原产于大西洋的加那利群岛，因其婉转悦耳的鸣叫声而被广泛作为笼鸟饲养。野生金丝雀羽毛呈绿黄色，经过几个世纪的人工选育后出现了纯黄色等多种品系。矿工曾将金丝雀带入矿井作为有害气体的生物预警，一旦停止鸣叫，说明空气中可能存在危险浓度的一氧化碳。',
  },
  Caterpillar: {
    habitat: 'terrestrial_wild',
    info: '毛毛虫是蝴蝶或蛾类的幼虫阶段，通常有着柔软分节的身体和多对腹足，以植物叶片为主要食物来源。它们是许多鸟类和捕食性昆虫的重要食物来源，因此发展出了拟态、毒毛等多种防御机制。蚕蛾的幼虫可以吐出几百米长的连续丝线来结茧化蛹，是人类重要的经济昆虫。',
  },
  Cattle: {
    habitat: 'domestic',
    info: '家牛是全球最重要的家畜之一，提供肉类、牛奶、皮革和役力，在人类文明史中扮演了核心角色。它们是反刍动物，有四个胃室，能够通过反刍分解粗纤维植物。全球现有超过10亿头家牛，印度因宗教原因将牛视为神圣动物，养有世界最多数量的牛群。',
  },
  Centipede: {
    habitat: 'terrestrial_wild',
    info: '蜈蚣属多足纲，是一种夜行性的捕食性节肢动物，广泛分布于热带和温带地区的土壤、腐木和石块下。它们每个体节有一对足，不同种类从15对到几百对不等，第一对足变形为毒爪用于捕猎。热带巨人蜈蚣可以长达30厘米，能够捕食蜥蜴、青蛙甚至小型蝙蝠。',
  },
  Cheetah: {
    habitat: 'terrestrial_wild',
    info: '猎豹是陆地上速度最快的动物，冲刺时速可达110至120公里，分布于非洲撒哈拉以南地区。与其他大型猫科动物不同，猎豹的爪子不能完全收回，像钉鞋一样在奔跑时提供额外抓地力。每次冲刺后需要约15分钟喘息才能进食，此时容易被狮子等动物抢食。',
  },
  Chicken: {
    habitat: 'domestic',
    info: '家鸡是由原鸡驯化而来，是全球数量最多的家禽，分布于几乎所有有人居住的地区。它们是杂食性动物，能够消化种子、昆虫和蔬菜残余等多种食物来源。研究表明鸡拥有一定的自我控制能力和基本的共情意识，其认知能力比早期认为的要复杂得多。',
  },
  Crab: {
    habitat: 'aquatic',
    info: '螃蟹属十足目甲壳类动物，以其宽扁的甲壳和横向爬行方式著称，广泛分布于海洋、淡水和陆地环境。它们是重要的底栖生态系统清道夫，通过捕食藻类、贝类和有机碎屑维持生态平衡。雪蟹和帝王蟹是北太平洋重要的商业捕捞物种，每年捕捞量巨大。',
  },
  Crocodile: {
    habitat: 'aquatic',
    info: '鳄鱼是现存最大的爬行动物之一，分布于非洲、亚洲、美洲和澳大利亚的热带河流、湖泊与红树林中。它们的颚部咬合力是地球上已知动物中最强的之一，可以轻易咬碎骨骼。鳄鱼能在水下潜伏超过一小时等待猎物靠近，心脏结构接近哺乳动物，具有四心室。',
  },
  Deer: {
    habitat: 'terrestrial_wild',
    info: '鹿是鹿科哺乳动物的统称，广泛分布于欧亚大陆、美洲和亚洲的森林、草原与山地环境。雄鹿每年长出并脱落鹿角，这是脊椎动物中生长最快的组织之一，一天可以生长2.5厘米。梅花鹿因其背上的白色斑点图案而得名，在中国文化中象征着长寿与吉祥。',
  },
  Duck: {
    habitat: 'aquatic',
    info: '鸭是鸭科中体型较小的水禽，广泛分布于全球淡水湿地、河流和海岸线。它们的羽毛具有防水特性，喙边缘有特化的板状结构用于过滤水中的食物。绿头鸭是最常见的野生鸭种，也是大多数家鸭品种的祖先，雄鸭在繁殖季节有着闪亮的绿色头部羽毛。',
  },
  Eagle: {
    habitat: 'aerial',
    info: '鹰是鹰科中大型猛禽的泛称，以其敏锐的视力、强壮的爪和高超的飞行技巧著称，分布于除南极洲外的全球各大洲。它们是许多食物链中的顶端捕食者，能够从数百米高空精准锁定地面猎物。美洲白头海雕是美国国鸟，其视力约是人类的四到八倍，翅展可达2.4米。',
  },
  Elephant: {
    habitat: 'terrestrial_wild',
    info: '大象是现存最大的陆地动物，分布于非洲撒哈拉以南地区和南亚、东南亚的热带森林与草原。它们有着高度发达的社会结构，以年长雌象为首领，群体成员之间会相互照顾和哀悼死亡同伴。非洲象的鼻子可以精确地搬运几百公斤重的物体，也能拾起一枚硬币。',
  },
  Fish: {
    habitat: 'aquatic',
    info: '鱼类是脊椎动物中种类最多的一大类群，包含超过33000个已知物种，栖息于从深海到高山溪流的各类水体环境。它们通过鳃呼吸溶解在水中的氧气，大多数种类有鳔帮助控制浮力。弹涂鱼能够利用胸鳍在陆地上爬行，并通过皮肤直接进行气体交换。',
  },
  Fox: {
    habitat: 'terrestrial_wild',
    info: '狐狸是犬科中体型较小的肉食性哺乳动物，以赤狐最为常见，广泛分布于北半球的森林、草原、城市和北极地区。它们是机会主义杂食者，食物范围极广，从小型啮齿动物到浆果、昆虫都在其菜单上。研究显示赤狐能够运用磁场导航进行猎食，向北捕鼠时成功率显著高于其他方向。',
  },
  Frog: {
    habitat: 'aquatic',
    info: '青蛙属两栖动物，广泛分布于除南极洲外的全球各地，通常生活在靠近淡水的潮湿环境中。它们通过皮肤和肺部共同完成呼吸，皮肤需要保持湿润才能正常进行气体交换。毒箭蛙科的蛙类皮肤含有剧毒生物碱，南美原住民利用这些毒素涂抹吹箭矛头用于狩猎。',
  },
  Giraffe: {
    habitat: 'terrestrial_wild',
    info: '长颈鹿是世界上最高的陆地动物，成年雄性可达5至6米，分布于非洲撒哈拉以南地区的热带稀树草原。它们的脖子可长达2.5米，却与人类一样只有7节颈椎，每节椎骨的长度大幅延伸。长颈鹿的心脏重达11公斤，产生的血压约是人类的两倍，以确保血液能泵送到高高的头部。',
  },
  Goat: {
    habitat: 'domestic',
    info: '家山羊是人类最早驯化的家畜之一，大约在1万年前起源于西南亚，如今广泛分布于全球各地。它们适应能力极强，能够在陡峭的岩石山地、干旱荒漠等恶劣环境中生存和觅食。山羊的瞳孔是水平矩形的，这给了它们约340度的视野，有助于察觉来自四面八方的捕食者。',
  },
  Goldfish: {
    habitat: 'aquatic',
    info: '金鱼是鲤鱼的驯化变种，起源于中国，是世界上最早被人工饲养的观赏鱼，已有超过一千年的驯化历史。经过长期人工选育，金鱼形成了泡眼、绒球、狮子头等数十种极具特色的品系。金鱼的记忆能力远比"只有7秒记忆"的传言强，实验证明它们可以记住训练内容长达数月。',
  },
  Goose: {
    habitat: 'aquatic',
    info: '鹅是鸭科中体型较大的水禽，包括雁属的多个野生种和由灰雁或鸿雁驯化而来的家鹅，广泛分布于北半球湿地、草甸和农耕地。它们是高度社会性的动物，会结成终身配偶，并以嘈杂的鸣叫声和凶猛的领地防御行为闻名。加拿大鹅每年进行长达数千公里的季节性迁徙，飞行时以V形编队减少空气阻力。',
  },
  Hamster: {
    habitat: 'domestic',
    info: '仓鼠原产于中亚和中东的干旱草原与沙漠地区，因其可爱的外形和易于饲养的特点成为全球最流行的小型宠物之一。它们的颊囊可以延伸至肩部，用于搬运食物，单次可以装入相当于自身体重一半的食物。仓鼠天生是夜行动物，在跑轮上一夜可以跑出约8至10公里。',
  },
  'Harbor seal': {
    habitat: 'aquatic',
    info: '港海豹是最广泛分布的海豹物种之一，栖息于北大西洋和北太平洋的温带及亚北极海岸线。它们能下潜至600米深的海域，一次潜水可持续约30分钟，以鱼类、乌贼和甲壳类为食。港海豹的胡须极为敏感，能够感知水流中极微弱的振动，帮助它们在浑浊水域中追踪鱼群轨迹。',
  },
  Hedgehog: {
    habitat: 'terrestrial_wild',
    info: '刺猬是一种小型夜行性哺乳动物，身体背面覆盖着约5000至6000根硬刺，主要分布于欧洲、亚洲和非洲的草地、灌木丛及林缘地带。当受到威胁时，它们会将身体蜷缩成一个紧密的刺球，利用硬刺作为防御盔甲。刺猬对许多蛇毒具有天然免疫力，能够耐受大多数本地蛇的毒液剂量。',
  },
  Hippopotamus: {
    habitat: 'aquatic',
    info: '河马是非洲体型最大的哺乳动物之一，白天大部分时间在撒哈拉以南非洲的河流、湖泊和沼泽中浸泡，以减少水分流失和调节体温。尽管外形笨重，河马陆地短距离冲刺速度可达每小时30公里，是非洲每年导致人员死亡最多的大型野生动物之一。河马的皮肤能分泌一种红色液体，兼具防晒和抗菌的功效。',
  },
  Horse: {
    habitat: 'domestic',
    info: '马是人类最重要的驯化动物之一，约在5500年前于中亚草原被驯化，深刻影响了人类历史上的战争、贸易和运输。它们是高度社会化的动物，在自然状态下以小型家族群体生活，能够识别同伴的面部表情并产生相应的情绪反应。马只能通过鼻孔呼吸，奔跑时呼吸节律与步伐频率保持精确同步。',
  },
  Jaguar: {
    habitat: 'terrestrial_wild',
    info: '美洲虎是西半球最大的猫科动物，分布于墨西哥至阿根廷北部的热带雨林、沼泽和灌木地带，与非洲豹外形相似但体型更为粗壮。它们是出色的游泳者，能够主动捕猎凯门鳄和水豚，咬合力是猫科动物中最强的，能够直接咬穿龟壳和鳄鱼的头骨。美洲虎在中美洲原住民文化中被视为连接生死世界的神灵。',
  },
  Jellyfish: {
    habitat: 'aquatic',
    info: '水母是刺胞动物门的代表性海洋无脊椎动物，主体由95%以上的水分构成，身体呈钟形或伞形，触手中含有刺细胞用于捕食和防御。它们几乎没有中枢神经系统，靠弥散的神经网络协调简单的运动行为。灯塔水母是已知唯一能够逆转衰老回到幼年阶段的多细胞动物，被称为"生物上的不死生物"。',
  },
  Kangaroo: {
    habitat: 'terrestrial_wild',
    info: '袋鼠是澳大利亚最具代表性的有袋类哺乳动物，以强健的后腿和独特的育儿袋而著称，主要栖息于澳大利亚大陆的草原、灌木丛和稀树草原。它们以弹跳代步，高速移动时反而比慢速更省能量。雌袋鼠具有延迟着床的能力，可以在恶劣环境下暂停胚胎发育，待条件合适时再继续妊娠。',
  },
  Koala: {
    habitat: 'aerial',
    info: '树袋熊（考拉）是澳大利亚的有袋类哺乳动物，几乎完全以毒性较强的桉树叶为食，栖居于澳大利亚东部和南部的桉树林中。桉树叶营养极低且含有毒素，因此考拉每天需要睡眠18至22小时来节省能量、消化毒素。考拉的指纹在微观上与人类几乎完全相同，这一特征至今仍让研究者困惑。',
  },
  Ladybug: {
    habitat: 'terrestrial_wild',
    info: '瓢虫是鞘翅目瓢虫科的小型甲虫，以其鲜艳的红色或橙色圆形外壳和黑色斑点著称，广泛分布于全球温带和热带地区的农田、林地和园林。它们是重要的天敌昆虫，一只成年七星瓢虫在整个生命周期内可消灭5000只以上的蚜虫，对农业害虫防治具有极大价值。瓢虫鲜艳的体色是对捕食者的警告色，其血液中含有生物碱毒素，味道极苦。',
  },
  Leopard: {
    habitat: 'terrestrial_wild',
    info: '豹是非洲和亚洲分布最广的大型猫科动物，栖息于热带雨林、稀树草原、山地森林和半沙漠等多种生境。它们是独居的夜行猎手，擅长攀爬，会将捕获的猎物拖至树上储存，以避免被狮子和鬣狗抢食。黑豹并非独立物种，而是豹的黑化变型，其豹纹在特定光线下仍然清晰可见。',
  },
  Lion: {
    habitat: 'terrestrial_wild',
    info: '狮子是唯一真正群居生活的猫科动物，以"百兽之王"著称，主要分布于非洲撒哈拉以南的热带稀树草原，亚洲种群仅残存于印度吉尔森林。雄狮标志性的鬃毛是其健康状况和遗传质量的外部信号，鬃毛越深越浓密往往代表更强的雄性竞争力。狮群中的猎食工作主要由雌狮完成，雄狮主要负责领地防御。',
  },
  Lizard: {
    habitat: 'terrestrial_wild',
    info: '蜥蜴是爬行动物中种类最多的类群之一，超过6000个已知物种，遍布除南极洲外各大洲的从雨林到沙漠的各类生境。它们大多是日行性的变温动物，依靠阳光加热身体来维持新陈代谢。许多蜥蜴具有自断尾的能力，断落的尾巴会持续颤动以吸引捕食者注意，让蜥蜴本体趁机逃脱，之后尾部会逐渐再生。',
  },
  Lynx: {
    habitat: 'terrestrial_wild',
    info: '猞猁是一类中型猫科动物，以其簇状耳毛、宽大的脚掌和短尾巴为特征，分布于北美、欧洲和亚洲的寒温带森林和山地。加拿大猞猁的宽大脚掌功能如同雪鞋，让它们能在深雪中灵活追逐猎物，主要以雪兔为食。加拿大猞猁和雪兔的种群数量呈现约10年周期的同步波动，是生态学中捕食者-猎物动态关系的经典案例。',
  },
  Magpie: {
    habitat: 'aerial',
    info: '喜鹊是鸦科中体型较大的鸟类，以其黑白分明的体色和嘈杂的叫声闻名，广泛分布于欧洲、亚洲和北美洲的林地、农田和城市。喜鹊是已知极少数能够通过镜子测试的非哺乳类动物之一，展现出较高的认知能力。在中国文化中，喜鹊象征吉祥如意，成双入对的喜鹊尤其被视为婚姻美满的吉兆。',
  },
  Monkey: {
    habitat: 'aerial',
    info: '猴子是灵长目动物中除猿类以外的统称，包含约260个物种，主要分布于非洲、亚洲和美洲的热带及亚热带森林。它们是高度社会化的动物，种群内部有着复杂的等级结构和社交行为，包括相互梳毛、食物共享等。日本猕猴是世界上生活纬度最高的非人灵长类动物，在寒冷的冬季会泡温泉取暖。',
  },
  'Moths and butterflies': {
    habitat: 'aerial',
    info: '蛾与蝴蝶同属鳞翅目，共同构成了地球上种类最多的昆虫类群之一，已知约有18万个物种。蝴蝶通常白天活动，蛾则多在夜间行动；两者都经历完全变态发育，成虫的主要任务是繁殖和传播花粉。蚕蛾的幼虫（蚕）是人类最重要的经济昆虫之一，中国的丝绸生产历史超过5000年。',
  },
  Mouse: {
    habitat: 'domestic',
    info: '小鼠是啮齿目鼠科的小型哺乳动物，家鼠广泛分布于除南极洲外全球所有大陆，往往依附于人类聚居地生活。它们的繁殖速度极快，一对家鼠在理想条件下一年内可以产生超过2000个后代。实验室小鼠是医学和生物学研究中使用最广泛的哺乳类动物模型，与人类共享约85%的蛋白质编码基因。',
  },
  Mule: {
    habitat: 'domestic',
    info: '骡子是雄驴与雌马交配所生的杂交后代，综合了驴的耐力和马的力量，历史上曾是最重要的驮运畜力之一。由于染色体数目不匹配，骡子通常是不育的，无法自然繁殖。骡子比马更耐寒耐热、抗病力强，蹄子也更坚硬，适应复杂山地地形的能力优于马，至今在某些山区农业中仍有广泛应用。',
  },
  Ostrich: {
    habitat: 'terrestrial_wild',
    info: '鸵鸟是世界上最大的鸟类，体重可达150公斤，翅膀退化无法飞行，主要分布于非洲的热带草原和沙漠地带。它们是陆地上跑速最快的鸟类，冲刺时速可达70公里，奔跑时步幅约4米。鸵鸟蛋是现存动物中最大的单个细胞，一枚鸵鸟蛋相当于约24枚鸡蛋的体积，蛋壳厚度可抵抗100公斤以上的压力。',
  },
  Otter: {
    habitat: 'aquatic',
    info: '水獭是鼬科半水栖哺乳动物，以其灵活的水中捕食能力和可爱的外形著称，分布于北美、欧亚大陆和非洲的清洁河流、湖泊及海岸线。海獭是少数已知会使用工具的非灵长类哺乳动物，它们会将石块放在腹部当砧板，用来敲开贝类的外壳。水獭的皮毛是哺乳动物中密度最高的，每平方厘米可达125000根毛发。',
  },
  Owl: {
    habitat: 'aerial',
    info: '猫头鹰是鸮形目的夜行性猛禽，以其圆盘状的面盘、可旋转270度的脖子和极强的夜间视力著称，广泛分布于全球各类生境。它们的耳朵位于头部不对称的位置，使其能够精确定位黑暗中猎物发出的声音。猫头鹰的羽毛边缘有锯齿状结构，飞行时几乎无声，是自然界最安静的空中猎手之一。',
  },
  Panda: {
    habitat: 'terrestrial_wild',
    info: '大熊猫是中国特有的珍稀哺乳动物，主要栖息于四川、陕西和甘肃的竹林山地，是中国最具代表性的国宝级野生动物。它们在分类上属于熊科，但食物99%以上是竹子，每天需要消耗约10至18公斤竹子以满足营养需求。大熊猫的"拇指"实际上是腕骨的延伸，是进化出来专门用于抓握竹竿的独特结构。',
  },
  Parrot: {
    habitat: 'aerial',
    info: '鹦鹉是鹦鹉目鸟类的统称，以鲜艳的羽毛和出色的模仿人类语言的能力著称，主要分布于热带和亚热带地区，包括南美洲、非洲、南亚和澳大利亚。它们是鸟类中寿命最长的之一，非洲灰鹦鹉最长寿命可超过80年。研究表明非洲灰鹦鹉的认知能力可与5至6岁儿童相媲美，能够理解数量、颜色和形状的概念。',
  },
  Penguin: {
    habitat: 'aquatic',
    info: '企鹅是唯一一类完全不会飞行却能在水中高速游泳的鸟类，主要分布于南半球，以南极大陆为最大栖息地。它们的翅膀进化为鳍状肢，帝企鹅游速可达时速25公里，能下潜超过500米深的水域。南极帝企鹅是在最极端环境中繁殖的鸟类，雄性在零下60度的极夜中孵蛋，数月内几乎不进食。',
  },
  Pig: {
    habitat: 'domestic',
    info: '家猪是人类最重要的肉食来源之一，约在9000年前在中东和中国分别被独立驯化，如今是全球饲养量最大的家畜之一。猪的智商在家养动物中较高，实验表明其学习新技能的速度可与黑猩猩相媲美，并具备较强的记忆力。猪没有汗腺，无法通过出汗散热，因此在热天会在泥水中打滚来降低体温。',
  },
  'Polar bear': {
    habitat: 'terrestrial_wild',
    info: '北极熊是世界上最大的陆地肉食性哺乳动物，栖息于北冰洋沿岸的海冰、冻原和海岸地带，以海豹为主要猎物。它们的皮毛是中空的透明管状结构，借助光的散射呈现出白色外观，黑色皮肤则能吸收更多热量。北极熊曾有记录显示不间断游泳超过680公里横跨开放海域。',
  },
  Rabbit: {
    habitat: 'domestic',
    info: '兔子是兔形目的小型哺乳动物，包括野生穴兔和多种驯化家兔品系，分布于除南极洲外的全球各大洲。欧洲野兔会挖掘复杂的地下洞穴网络，家兔最早在中世纪欧洲修道院中作为肉食来源被系统繁育。兔子的眼睛位于头部两侧，视野接近360度，却几乎没有正前方的双目视觉，这是对捕食者的适应性进化。',
  },
  Raccoon: {
    habitat: 'terrestrial_wild',
    info: '浣熊是浣熊科的中型杂食性哺乳动物，以其特有的黑色"眼罩"面部标记和在进食前用水"洗"食物的行为著称，原产于北美洲，如今也作为入侵物种分布于欧洲和日本。它们是出色的城市适应者，能够打开门锁和垃圾桶盖子，解决问题的能力可媲美猴子。浣熊的前爪有着高度灵敏的触觉，触觉感受神经元密度是人类的四倍。',
  },
  Raven: {
    habitat: 'aerial',
    info: '渡鸦是鸦科中体型最大的鸟类，全身羽毛呈油亮的黑色，广泛分布于北半球的寒温带荒野、山地、海岸和北极苔原地带。它们被普遍认为是鸟类中智商最高的之一，能够解决多步骤问题、制造和使用简单工具，以及理解其他个体的思维意图。渡鸦会结成终身伴侣，在北欧神话中象征智慧与预知能力。',
  },
  'Red panda': {
    habitat: 'aerial',
    info: '小熊猫（红熊猫）是一种树栖哺乳动物，分布于中国西南部、尼泊尔、不丹和缅甸的喜马拉雅山区竹林中，独立成小熊猫科，并非大熊猫的近亲。它们以竹子和浆果为主食，"假拇指"结构与大熊猫类似，但两者是趋同进化的结果，并无直接亲缘关系。小熊猫才是最早被西方科学界命名为"panda"的动物。',
  },
  Rhinoceros: {
    habitat: 'terrestrial_wild',
    info: '犀牛是现存最大的奇蹄目哺乳动物，包括白犀、黑犀、印度犀、爪哇犀和苏门答腊犀五个物种，主要分布于非洲大草原和亚洲热带丛林。它们的角是由角蛋白紧密堆积而成，与马蹄和人类指甲的成分相同，并非骨质结构。北白犀目前仅剩2头雌性个体存活，是地球上最濒危的大型动物之一。',
  },
  Scorpion: {
    habitat: 'terrestrial_wild',
    info: '蝎子属蛛形纲蝎目，是地球上最古老的陆地节肢动物之一，化石记录超过4.3亿年，广泛分布于热带和亚热带的干旱荒漠、热带雨林和山地。它们用尾端的毒刺注入神经毒素来麻痹猎物，其中约25个物种的毒液对人类有致命危险。蝎子在紫外线照射下会发出蓝绿色荧光，这一特性的进化意义至今尚未完全解释。',
  },
  'Sea lion': {
    habitat: 'aquatic',
    info: '海狮是鳍足类哺乳动物，与海豹相似但能够用前肢在陆地上直立行走，分布于太平洋沿岸的温带至亚热带海域。它们是高度智能的社会性动物，在野外生活在大型繁殖群落中，雄性会激烈争夺对雌性群体的控制权。加州海狮是公认最易被驯化的鳍足类动物，表演能力极强，常见于水族馆和海洋表演中。',
  },
  'Sea turtle': {
    habitat: 'aquatic',
    info: '海龟是海洋中最古老的爬行动物之一，有超过1亿年的进化历史，包括棱皮龟、绿海龟、玳瑁等7个现存物种，广泛分布于热带和亚热带海域。它们可以通过感知地球磁场进行长途导航，雌性会不远万里返回出生地沙滩产卵。棱皮龟是最大的现存龟类，体重可超过900公斤，潜水深度可超过1000米。',
  },
  Seahorse: {
    habitat: 'aquatic',
    info: '海马是海龙科的小型海洋鱼类，以其独特的马头形状和直立游泳姿态著称，分布于全球温带和热带浅海的海草床、珊瑚礁和红树林。海马是动物界极为罕见的由雄性负责妊娠和生育的物种，雄性有一个育儿袋用于孵化受精卵。海马游泳能力极弱，却靠悄悄接近猎物后迅速吸食，捕食精准度接近100%。',
  },
  Shark: {
    habitat: 'aquatic',
    info: '鲨鱼是软骨鱼纲中的大型海洋捕食者，已有超过4.5亿年的进化历史，远早于恐龙的出现，目前约有500多个已知物种，广泛分布于全球海洋。它们的皮肤覆盖着被称为盾鳞的微小结构，可以减少水阻并加速游动。鲨鱼独特的电感器官能够探测其他生物肌肉收缩产生的极微弱电场。',
  },
  Sheep: {
    habitat: 'domestic',
    info: '绵羊是人类最早驯化的家畜之一，约在1万年前起源于西亚，因其羊毛、肉类和奶制品的利用价值被驯化，目前全球数量超过10亿头。它们有着良好的面孔识别能力，研究证明绵羊能够在两年后仍然识别出约50张不同的绵羊和人类面孔。绵羊的瞳孔是水平矩形的，这让它们拥有极宽的视野范围。',
  },
  Shrimp: {
    habitat: 'aquatic',
    info: '虾是甲壳纲中体型较小的十足目动物，广泛分布于全球海水和淡水环境，是全球最重要的水产养殖和捕捞物种之一。它们是重要的生态系统清道夫，通过分解有机废物在食物网中发挥关键作用。皮皮虾（虾蛄）拥有动物界最复杂的视觉系统，其眼睛可以感知16种光感受器类型，而人类只有3种。',
  },
  Snail: {
    habitat: 'terrestrial_wild',
    info: '蜗牛是软体动物门腹足纲中具有螺旋形外壳的陆生种类，广泛分布于全球各类湿润生境，从热带丛林到温带园林均有栖居。它们以腹部的肌肉足缓慢移动，分泌黏液以减少摩擦并防止自身受伤。非洲大蜗牛是已知最大的陆生蜗牛物种，壳长可超过20厘米，作为入侵物种对多个热带岛屿的农业生态系统造成严重破坏。',
  },
  Snake: {
    habitat: 'terrestrial_wild',
    info: '蛇是爬行动物中进化最成功的类群之一，全球约有3700个已知物种，适应了从热带雨林、草原到荒漠和海洋的几乎所有生境。它们通过移动上颌骨进行进食，能够吞下比自身头部宽数倍的猎物。蛇通过分叉的舌头收集空气中的化学分子，传递至口腔顶部的雅各布森氏器官进行"嗅觉"分析，极为灵敏。',
  },
  Sparrow: {
    habitat: 'aerial',
    info: '麻雀是雀科中体型小巧的鸟类，以家麻雀和树麻雀最为常见，是人类活动区域中最典型的"伴人物种"，广泛分布于除极地以外的全球各地。它们是高度社会化的鸟类，通常成群觅食，以种子、谷物和昆虫为主食。麻雀的海马体神经元数量会随季节变化，在需要大量空间记忆的秋季显著增多。',
  },
  Spider: {
    habitat: 'terrestrial_wild',
    info: '蜘蛛属蛛形纲蜘蛛目，全球已知超过47000个物种，是陆地上数量最多的捕食性动物类群之一，几乎遍布除极地冰盖外的所有陆地生境。它们产生的蜘蛛牵引丝的强度相当于同等粗细钢丝的五倍，同时比防弹材料凯夫拉更有韧性。据估计全球蜘蛛每年消灭的昆虫总量超过人类每年的食物消耗总量。',
  },
  Squid: {
    habitat: 'aquatic',
    info: '鱿鱼是头足纲枪形目的软体动物，广泛分布于全球各大洋的不同深度，包含超过300个已知物种。它们有三个心脏，其中两个负责向鳃泵送血液，一个负责全身循环；血液中含铜而非铁，因此呈蓝色。大王鱿是迄今已知体型最大的无脊椎动物，总长可超过13米，其眼球直径可达30厘米，是动物界最大的眼睛。',
  },
  Squirrel: {
    habitat: 'aerial',
    info: '松鼠是松鼠科的小型哺乳动物，包括树松鼠、地松鼠和飞鼠三大类，广泛分布于欧亚大陆、美洲和非洲的森林、公园和城市绿地。它们有储藏食物的习惯，秋季会将坚果埋藏于地下用于越冬，客观上促进了植物种子的传播和新树木的生长。飞鼠利用体侧的皮膜在树木间滑翔，最远可滑翔约90米。',
  },
  Starfish: {
    habitat: 'aquatic',
    info: '海星是棘皮动物门海星纲的海洋无脊椎动物，以其典型的五辐对称星形结构著称，广泛分布于全球各大洋的潮间带到深海。它们没有大脑和血液，通过充满海水的液压系统驱动数百个管足完成移动和捕食。海星具有极强的再生能力，部分种类只需一条切断的腕加上一部分中央体盘，就能完整再生出一个新个体。',
  },
  Swan: {
    habitat: 'aquatic',
    info: '天鹅是鸭科中体型最大的水禽，以其洁白的羽毛、优雅的姿态和忠贞的配偶关系闻名，分布于欧洲、北美、亚洲和澳大利亚的湖泊、河流和海湾。疣鼻天鹅翼展可达2.5米，是欧洲最重的飞行鸟类之一。天鹅是极少数确认具有终身一夫一妻制行为的鸟类，当配偶死亡后，存活的一方常常会进入较长时间的"悲恸期"。',
  },
  Tick: {
    habitat: 'terrestrial_wild',
    info: '蜱虫是蛛形纲寄生性吸血节肢动物，广泛分布于全球各大陆的草地、林地和灌木丛中，以鸟类、哺乳动物（包括人类）和爬行动物的血液为食。它们是许多严重人畜共患病的重要传播媒介，包括莱姆病、蜱传脑炎和落基山斑疹热等。蜱虫的唾液中含有麻醉成分，使宿主在叮咬初期感觉不到任何疼痛。',
  },
  Tiger: {
    habitat: 'terrestrial_wild',
    info: '虎是现存体型最大的猫科动物，是亚洲顶级捕食者，分布于西伯利亚森林、印度次大陆、东南亚热带雨林等多种生境，目前野生数量已不足4000头，多个亚种濒临灭绝。每只虎都有独一无二的条纹图案，如同人类指纹。虎是优秀的游泳者，喜欢在水中降温和捕猎。',
  },
  Tortoise: {
    habitat: 'terrestrial_wild',
    info: '陆龟是龟鳖目中完全陆生的类群，以其圆顶形厚重的外壳和缓慢的移动速度著称，分布于热带和亚热带的干旱草原、荒漠和丛林。它们是已知寿命最长的陆地动物之一，加拉帕戈斯象龟可以存活超过170年。乔纳森，一只阿尔达布拉象龟，在2022年时确认年龄至少为190岁，是有记录以来寿命最长的陆地动物。',
  },
  Turkey: {
    habitat: 'domestic',
    info: '火鸡是原产于北美的大型鸟类，由墨西哥印第安人最早驯化，现已成为全球广泛饲养的重要家禽，尤以北美感恩节传统饮食中的火鸡最为著名。野生火鸡雄性有着华丽的羽屏和肉垂，求偶时会展开尾羽炫耀。野生火鸡的奔跑速度可达时速40公里，还能飞行短距离，与笨重的家火鸡大相径庭。',
  },
  Turtle: {
    habitat: 'aquatic',
    info: '龟是龟鳖目中具有外壳保护的爬行动物，广义上包括淡水龟和部分半陆栖龟类，分布于全球温暖的淡水湖泊、河流、沼泽和湿地。它们的壳并非外在的铠甲，而是由肋骨和脊椎骨进化融合而来，是其身体的一部分，无法脱离。鳄龟舌上有肉质蠕虫状的诱饵附属物，会张开嘴静待鱼类游近后迅速合嘴捕食。',
  },
  Whale: {
    habitat: 'aquatic',
    info: '鲸是完全水生的哺乳动物，包括须鲸和齿鲸两大类，分布于全球所有大洋，从热带到极地海域均有踪迹。蓝鲸是地球上有史以来体型最大的动物，体长可达33米，心脏重达600公斤，其叫声是自然界中已知音量最大的生物发声之一。座头鲸会创作并传播复杂的"歌曲"，形成不断演变的音乐文化。',
  },
  Woodpecker: {
    habitat: 'aerial',
    info: '啄木鸟是鴷形目中以凿树觅食著称的鸟类，广泛分布于除澳大利亚、新几内亚和极地地区之外的全球各大洲森林。它们每秒钟可以啄击树干20次，头部承受的冲击力可达重力加速度的1000倍以上，却不会造成任何脑部损伤。啄木鸟的舌头极长，可伸出喙外超过5厘米，舌头绕着头骨弯曲延伸，充当减震缓冲器。',
  },
  Worm: {
    habitat: 'terrestrial_wild',
    info: '蚯蚓是环节动物门寡毛纲的陆生环节动物，以土壤为栖居环境，广泛分布于全球湿润、腐殖质丰富的土壤中。它们通过分解有机物和翻松土壤显著提升土壤肥力，被达尔文誉为"地球上最重要的生物"。蚯蚓的体内有五个"心脏"（主动脉弓），身体被切断后部分种类能够分别再生出头尾。',
  },
  Zebra: {
    habitat: 'terrestrial_wild',
    info: '斑马是非洲草原上最具辨识度的哺乳动物，以其黑白相间的条纹著称，主要分布于非洲东部和南部的热带稀树草原和草地。每匹斑马的条纹图案都是独一无二的，如同人类的指纹。最新研究倾向于认为条纹对马蝇等昆虫有干扰作用，因为马蝇的复眼无法分辨高频交替的图案，从而减少了叮咬次数。',
  },
}

export function getAnimalHabitat(label: string): AnimalHabitat | 'unknown' {
  return ANIMAL_INFO_BY_LABEL[label]?.habitat ?? 'unknown'
}

export function getAnimalHabitatMeta(habitat: AnimalHabitat | 'unknown'): AnimalHabitatMeta {
  if (habitat === 'unknown') return UNKNOWN_HABITAT_META
  return ANIMAL_HABITAT_META[habitat]
}

export function getAnimalInfo(label: string): AnimalInfo | null {
  return ANIMAL_INFO_BY_LABEL[label] ?? null
}

export function getAnimalInfoText(label: string): string {
  return ANIMAL_INFO_BY_LABEL[label]?.info ?? ''
}
