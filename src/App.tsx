import { useCallback, useEffect, useMemo, useState } from 'react'
import PanoramaViewer from './PanoramaViewer'
import './App.css'

type MetricId = 'kindness' | 'wisdom' | 'energy' | 'curiosity'

type Metric = {
  id: MetricId
  name: string
  archetype: string
  tone: string
}

type Metrics = Record<MetricId, number>

type Hotspot = {
  id: string
  label: string
  note: string
  x: number
  y: number
  flag?: string
  effects?: Partial<Metrics>
}

type Choice = {
  text: string
  reply: string
  target: string
  effects?: Partial<Metrics>
  flags?: string[]
  requiresFlag?: string
  requiresFlags?: string[]
}

type StoryNode = {
  id: string
  chapter: string
  time: string
  title: string
  place: string
  image: string
  speaker: string
  text: string
  mood: string
  hotspots: Hotspot[]
  choices: Choice[]
}

type HistoryItem = {
  nodeId: string
  choice: string
  reply: string
}

type GameState = {
  nodeId: string
  stats: Metrics
  flags: string[]
  unlocked: string[]
  history: HistoryItem[]
  lastReply: string
  ending?: string
}

type SaveSlot = {
  savedAt: string
  state: GameState
}

const metrics: Metric[] = [
  {
    id: 'kindness',
    name: '友善',
    archetype: '照顾伙伴',
    tone: '适合帮助居民、安抚大家',
  },
  {
    id: 'wisdom',
    name: '智慧',
    archetype: '观察推理',
    tone: '适合解谜、整理线索',
  },
  {
    id: 'energy',
    name: '活力',
    archetype: '行动执行',
    tone: '适合奔跑、搬运、带动气氛',
  },
  {
    id: 'curiosity',
    name: '好奇',
    archetype: '探索发现',
    tone: '适合寻找隐藏物和新办法',
  },
]

const initialStats: Metrics = {
  kindness: 35,
  wisdom: 35,
  energy: 35,
  curiosity: 35,
}

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

const firstLevelObjectives = [
  { flag: 'saw-windmill', label: '查看彩虹风车缺口' },
  { flag: 'plaza-map', label: '找到节日地图' },
  { flag: 'blue-ribbon', label: '确认蓝色飘带方向' },
  { flag: 'rabbit-ready', label: '小兔邮差准备通知卡' },
  { flag: 'toolkit-ready', label: '狐狸发明家准备工具车' },
  { flag: 'safety-ready', label: '绵羊老师安排安全队伍' },
]

const storyNodes: StoryNode[] = [
  {
    id: 'plaza',
    chapter: '第一章',
    time: '09:00',
    title: '欢迎广场',
    place: '彩虹尾巴城',
    image: asset('panoramas/animal-01-plaza.png'),
    speaker: '小兔邮差',
    mood: '彩虹风车刚要转动，六枚徽章忽然被风吹向城市各处。',
    text: '今天是彩虹尾巴城一年一度的嘉年华。小兔邮差、狐狸发明家、绵羊老师和许多动物居民都在广场等开幕，可风车上的徽章不见了。',
    hotspots: [
      {
        id: 'windmill',
        label: '彩虹风车',
        note: '风车中心空了六个位置。每找回一枚徽章，风车就会亮起一圈颜色。',
        x: 52,
        y: 42,
        flag: 'saw-windmill',
        effects: { curiosity: 3, wisdom: 2 },
      },
      {
        id: 'map',
        label: '节日地图',
        note: '地图上画着气球大道、发明工坊、花车森林、点心集市和星光舞台。',
        x: 29,
        y: 46,
        flag: 'plaza-map',
        effects: { wisdom: 3 },
      },
      {
        id: 'ribbon',
        label: '飘带线索',
        note: '一条蓝色飘带挂在路灯上，指向气球最多的街道。',
        x: 78,
        y: 36,
        flag: 'blue-ribbon',
        effects: { curiosity: 2 },
      },
    ],
    choices: [
      {
        text: '先安慰小兔邮差，告诉他徽章一定能找回来。',
        reply: '小兔邮差深吸一口气：“好，我来负责把消息送给每个摊位！”',
        target: 'plaza-plan',
        effects: { kindness: 6 },
        flags: ['comforted-rabbit'],
      },
      {
        text: '先看地图，判断第一枚徽章可能飞向哪里。',
        reply: '绵羊老师点点头：“先找线索，再行动，这是很棒的开头。”',
        target: 'plaza-plan',
        effects: { wisdom: 7, curiosity: 2 },
        flags: ['planned-route'],
      },
      {
        text: '举起手，邀请附近居民一起报名做小队。',
        reply: '广场响起欢呼声，狐狸发明家已经推来一辆小工具车。',
        target: 'plaza-plan',
        effects: { energy: 7, kindness: 2 },
        flags: ['team-start'],
      },
    ],
  },
  {
    id: 'plaza-plan',
    chapter: '第一章',
    time: '09:08',
    title: '广场线索',
    place: '彩虹尾巴城',
    image: asset('panoramas/animal-01-plaza.png'),
    speaker: '绵羊老师',
    mood: '第一关目标：先把三个线索找齐，再安排三位居民分工。',
    text: '风车缺口、节日地图和蓝色飘带会告诉大家第一枚徽章的方向。你可以继续转动画面点热点，也可以先整理已经发现的线索。',
    hotspots: [
      {
        id: 'windmill-plan',
        label: '彩虹风车',
        note: '风车中心空了六个位置。第一枚徽章的缺口正对着气球大道。',
        x: 52,
        y: 42,
        flag: 'saw-windmill',
        effects: { wisdom: 2 },
      },
      {
        id: 'map-plan',
        label: '节日地图',
        note: '地图上，广场到气球大道的路线最短，也最适合小队一起行动。',
        x: 29,
        y: 46,
        flag: 'plaza-map',
        effects: { wisdom: 2 },
      },
      {
        id: 'ribbon-plan',
        label: '蓝色飘带',
        note: '飘带被风吹向气球拱门，说明徽章大概率也往那边去了。',
        x: 78,
        y: 36,
        flag: 'blue-ribbon',
        effects: { curiosity: 2 },
      },
    ],
    choices: [
      {
        text: '三个线索都找到了，把路线贴到公告板上。',
        reply: '小队看着公告板一起点头：第一站，气球大道。',
        target: 'plaza-team',
        effects: { wisdom: 5, kindness: 2 },
        flags: ['clues-ready'],
        requiresFlags: ['saw-windmill', 'plaza-map', 'blue-ribbon'],
      },
      {
        text: '请小兔邮差念一遍任务清单。',
        reply: '“风车、地图、飘带。”小兔认真地数着，“少一个都可能走错路！”',
        target: 'plaza-plan',
        effects: { kindness: 2 },
      },
      {
        text: '回到广场中心，再仔细观察一圈。',
        reply: '你退回广场中央，彩带和气球在头顶慢慢转动。',
        target: 'plaza',
        effects: { curiosity: 2 },
      },
    ],
  },
  {
    id: 'plaza-team',
    chapter: '第一章',
    time: '09:16',
    title: '小队分工',
    place: '彩虹尾巴城',
    image: asset('panoramas/animal-01-plaza.png'),
    speaker: '狐狸发明家',
    mood: '路线确定了，现在要把居民小队组织起来。',
    text: '小兔邮差可以通知摊位，狐狸发明家可以带工具车，绵羊老师可以照看年幼的动物居民。三件事都安排好，第一关就能正式出发。',
    hotspots: [
      {
        id: 'mail-bag',
        label: '邮差背包',
        note: '背包里有三叠通知卡：摊位、乐队和巡逻员。',
        x: 34,
        y: 49,
        flag: 'mailbag-seen',
        effects: { curiosity: 2 },
      },
      {
        id: 'tool-cart',
        label: '工具车',
        note: '工具车里有安全绳、小铃铛和泡泡夹，都是全年龄安全工具。',
        x: 63,
        y: 48,
        flag: 'toolcart-seen',
        effects: { wisdom: 2 },
      },
      {
        id: 'safe-circle',
        label: '安全集合圈',
        note: '地上的彩色圆圈可以让小动物们排队等待，不会挤到舞台边。',
        x: 51,
        y: 53,
        flag: 'safe-circle-seen',
        effects: { kindness: 2 },
      },
    ],
    choices: [
      {
        text: '把通知卡交给小兔邮差，请他先通知气球大道。',
        reply: '小兔邮差把通知卡放进背包：“我会沿着安全路线跑，不抄近路！”',
        target: 'plaza-team',
        effects: { kindness: 4, energy: 2 },
        flags: ['rabbit-ready'],
      },
      {
        text: '帮狐狸发明家检查工具车，带上安全绳和小铃铛。',
        reply: '狐狸发明家合上工具箱：“没有危险工具，只有聪明办法。”',
        target: 'plaza-team',
        effects: { wisdom: 4, curiosity: 2 },
        flags: ['toolkit-ready'],
      },
      {
        text: '请绵羊老师带大家站进安全集合圈。',
        reply: '绵羊老师挥挥小旗：“先排好队，再出发，庆典就会又热闹又安全。”',
        target: 'plaza-team',
        effects: { kindness: 4, wisdom: 2 },
        flags: ['safety-ready'],
      },
      {
        text: '分工完成，带着小队前往气球大道。',
        reply: '第一关完成！你找齐线索、组织好小队，第一枚徽章的方向已经明确。',
        target: 'plaza-complete',
        effects: { kindness: 3, wisdom: 3, energy: 3, curiosity: 3 },
        flags: ['plaza-complete', 'badge-teamwork'],
        requiresFlags: ['clues-ready', 'rabbit-ready', 'toolkit-ready', 'safety-ready'],
      },
    ],
  },
  {
    id: 'plaza-complete',
    chapter: '第一章',
    time: '09:25',
    title: '第一关完成',
    place: '彩虹尾巴城',
    image: asset('panoramas/animal-01-plaza.png'),
    speaker: '旁白',
    mood: '第一枚徽章的线索找到了，小队也准备好了。',
    text: '彩虹风车亮起第一圈温暖的光。小兔邮差、狐狸发明家和绵羊老师都准备就绪，气球大道传来清脆的铃声，下一关正在等你。',
    hotspots: [
      {
        id: 'first-badge',
        label: '合作徽章',
        note: '这枚徽章不是靠一个人找到的，而是靠观察、分工和互相帮助。',
        x: 50,
        y: 43,
        flag: 'first-badge-seen',
        effects: { kindness: 2, wisdom: 2 },
      },
      {
        id: 'ready-team',
        label: '准备好的小队',
        note: '每个居民都有自己的任务。真正的冒险，从不需要一个人硬撑。',
        x: 39,
        y: 50,
        flag: 'ready-team-seen',
        effects: { energy: 2 },
      },
      {
        id: 'balloon-gate',
        label: '气球拱门',
        note: '拱门后的气球大道飘来一张蓝色路线卡。',
        x: 78,
        y: 50,
        flag: 'balloon-gate-seen',
        effects: { curiosity: 2 },
      },
    ],
    choices: [
      {
        text: '进入第二关：气球大道。',
        reply: '小队穿过气球拱门，第一枚徽章在背包里轻轻发光。',
        target: 'balloon',
        effects: { energy: 4 },
        flags: ['badge-kindness'],
      },
    ],
  },
  {
    id: 'balloon',
    chapter: '第二章',
    time: '09:35',
    title: '气球大道',
    place: '气球大道',
    image: asset('panoramas/animal-02-balloon-avenue.png'),
    speaker: '小兔邮差',
    mood: '一枚徽章卡在气球束里，颜色路线却被风吹乱了。',
    text: '小兔邮差要把邀请卡送到不同摊位，可气球颜色和路线卡混在一起。只要整理好颜色顺序，就能安全取下第一枚徽章。',
    hotspots: [
      {
        id: 'color-cards',
        label: '颜色路线卡',
        note: '红、黄、蓝、绿四张卡对应四条小路，蓝色卡背面有风车图案。',
        x: 42,
        y: 58,
        flag: 'color-route',
        effects: { wisdom: 4 },
      },
      {
        id: 'balloon-knot',
        label: '气球结',
        note: '气球线没有打死结，只要有人稳住绳子，就能轻轻解开。',
        x: 63,
        y: 35,
        effects: { kindness: 2, energy: 2 },
      },
      {
        id: 'tiny-bell',
        label: '小铃铛',
        note: '铃声会提醒小动物让开路线，适合在人多的地方使用。',
        x: 82,
        y: 64,
        effects: { curiosity: 3 },
      },
    ],
    choices: [
      {
        text: '按颜色路线卡重新排队，再取徽章。',
        reply: '队伍一下顺畅起来，第一枚“友善徽章”轻轻落到你的手心。',
        target: 'workshop',
        effects: { wisdom: 6, kindness: 4 },
        flags: ['badge-kindness'],
      },
      {
        text: '请大家一起稳住气球绳，小兔负责解结。',
        reply: '大家数到三同时用力，气球没有飞走，徽章也找回来了。',
        target: 'workshop',
        effects: { kindness: 7, energy: 3 },
        flags: ['badge-kindness'],
      },
      {
        text: '摇响小铃铛，先给道路清出安全空间。',
        reply: '小动物们笑着让出一圈空地，猎豹巡逻员向你竖起大拇指。',
        target: 'workshop',
        effects: { energy: 5, wisdom: 3 },
        flags: ['safe-route', 'badge-kindness'],
      },
    ],
  },
  {
    id: 'workshop',
    chapter: '第三章',
    time: '10:20',
    title: '发明工坊',
    place: '泡泡风车工坊',
    image: asset('panoramas/animal-03-workshop.png'),
    speaker: '狐狸发明家',
    mood: '泡泡风车停住了，第二枚徽章藏在一串透明泡泡里。',
    text: '狐狸发明家的泡泡风车本来要给嘉年华制造彩虹泡泡，可齿轮顺序装反了。工坊里到处是安全工具、泡泡瓶和小零件。',
    hotspots: [
      {
        id: 'gear-tray',
        label: '齿轮盘',
        note: '三个齿轮大小不同，最小的齿轮边缘有一滴彩虹色泡泡液。',
        x: 37,
        y: 66,
        flag: 'gear-clue',
        effects: { wisdom: 4 },
      },
      {
        id: 'bubble-jar',
        label: '泡泡瓶',
        note: '瓶子标签没有文字，但颜色从浅到深排成一条线。',
        x: 68,
        y: 57,
        effects: { curiosity: 3 },
      },
      {
        id: 'safety-gloves',
        label: '安全手套',
        note: '绵羊老师提醒：动手前先戴手套，发明也要注意安全。',
        x: 22,
        y: 51,
        effects: { kindness: 2, wisdom: 2 },
      },
    ],
    choices: [
      {
        text: '先戴好手套，再按大小顺序装回齿轮。',
        reply: '泡泡风车咔哒一声转起来，第二枚“智慧徽章”从泡泡里浮出。',
        target: 'forest',
        effects: { wisdom: 8, kindness: 2 },
        flags: ['badge-wisdom'],
      },
      {
        text: '观察泡泡颜色，找出风车缺少的方向。',
        reply: '狐狸发明家惊喜地拍了拍工具车：“你看见了风的颜色！”',
        target: 'forest',
        effects: { curiosity: 7, wisdom: 4 },
        flags: ['badge-wisdom'],
      },
      {
        text: '请小鼠学徒一起检查零件，每人负责一处。',
        reply: '工坊变得有条不紊，大家一起修好了泡泡风车。',
        target: 'forest',
        effects: { kindness: 6, energy: 4 },
        flags: ['badge-wisdom'],
      },
    ],
  },
  {
    id: 'forest',
    chapter: '第四章',
    time: '11:15',
    title: '花车森林',
    place: '花车森林',
    image: asset('panoramas/animal-04-flower-forest.png'),
    speaker: '长颈鹿园艺师',
    mood: '花车少了一圈花环，第三枚徽章挂在最高的叶子后面。',
    text: '花车森林里香气很轻，蝴蝶在彩带间飞来飞去。长颈鹿园艺师想让每辆花车都恢复颜色，但花环需要大家分工完成。',
    hotspots: [
      {
        id: 'tall-leaf',
        label: '高处叶片',
        note: '叶片后面有一小片金色闪光，像是徽章边缘。',
        x: 56,
        y: 29,
        flag: 'high-leaf',
        effects: { curiosity: 3 },
      },
      {
        id: 'petal-basket',
        label: '花瓣篮',
        note: '花瓣按大小分好，适合做从小到大的渐变花环。',
        x: 31,
        y: 68,
        effects: { wisdom: 3 },
      },
      {
        id: 'water-can',
        label: '洒水壶',
        note: '小刺猬们够不到水壶把手，但它们已经把路让出来了。',
        x: 73,
        y: 62,
        effects: { kindness: 3 },
      },
    ],
    choices: [
      {
        text: '请长颈鹿看高处，你负责整理地面的花瓣。',
        reply: '高处和低处同时完成，第三枚“好奇徽章”从叶片后亮了起来。',
        target: 'market',
        effects: { curiosity: 7, wisdom: 4 },
        flags: ['badge-curiosity'],
      },
      {
        text: '带小刺猬们传递花瓣，让每只动物都参与。',
        reply: '花环绕过整辆花车，大家都找到了自己能做的部分。',
        target: 'market',
        effects: { kindness: 7, energy: 3 },
        flags: ['badge-curiosity'],
      },
      {
        text: '先浇水，让花瓣恢复颜色再装饰。',
        reply: '花瓣重新舒展开，蝴蝶带着徽章飞回花车顶端。',
        target: 'market',
        effects: { wisdom: 4, energy: 5 },
        flags: ['badge-curiosity'],
      },
    ],
  },
  {
    id: 'market',
    chapter: '第五章',
    time: '12:10',
    title: '点心集市',
    place: '健康点心集市',
    image: asset('panoramas/animal-05-snack-market.png'),
    speaker: '河马厨师',
    mood: '午餐时间到了，第四枚徽章被放进了最受欢迎的健康点心篮。',
    text: '河马厨师准备了水果松饼、蔬菜串和清凉果汁。可是队伍太长，口味标记也被风吹乱了，需要有人帮忙重新安排摊位。',
    hotspots: [
      {
        id: 'fruit-muffin',
        label: '水果松饼',
        note: '松饼闻起来很香，旁边放着低糖水果牌，但没有文字。',
        x: 43,
        y: 60,
        effects: { curiosity: 2, kindness: 2 },
      },
      {
        id: 'smoothie-spinner',
        label: '果汁转盘',
        note: '转盘卡住了，狐狸发明家认为只要轻轻反转一格就好。',
        x: 69,
        y: 54,
        effects: { wisdom: 3 },
      },
      {
        id: 'recycle-bin',
        label: '回收桶',
        note: '企鹅一家正在找回收桶，保持集市干净也是庆典的一部分。',
        x: 20,
        y: 70,
        effects: { kindness: 3 },
      },
    ],
    choices: [
      {
        text: '先把回收桶和排队路线摆清楚。',
        reply: '集市变得干净又顺畅，第四枚“活力徽章”出现在点心篮旁。',
        target: 'stage',
        effects: { kindness: 6, wisdom: 4 },
        flags: ['badge-energy'],
      },
      {
        text: '修好果汁转盘，让大家按颜色选择口味。',
        reply: '果汁转盘转出一圈彩虹，河马厨师开心地挥起围裙。',
        target: 'stage',
        effects: { energy: 7, curiosity: 3 },
        flags: ['badge-energy'],
      },
      {
        text: '请大家轮流推荐一种健康点心。',
        reply: '每个摊位都有了笑声，连排队也像一场小游戏。',
        target: 'stage',
        effects: { kindness: 5, energy: 5 },
        flags: ['badge-energy'],
      },
    ],
  },
  {
    id: 'stage',
    chapter: '第六章',
    time: '19:30',
    title: '星光舞台',
    place: '星光舞台',
    image: asset('panoramas/animal-06-starry-stage.png'),
    speaker: '旁白',
    mood: '夜晚降临，彩虹风车终于等回了所有徽章。',
    text: '动物居民们聚到星光舞台。风车缺少最后一步：把今天学到的友善、智慧、活力和好奇一起点亮。',
    hotspots: [
      {
        id: 'badge-wheel',
        label: '徽章风车',
        note: '四枚徽章亮着不同颜色，还差大家一起喊出口号的那一刻。',
        x: 50,
        y: 43,
        flag: 'ready-final',
      },
      {
        id: 'music-shell',
        label: '音乐贝壳',
        note: '松鼠乐队把节奏藏在贝壳里，轻敲三下就能开始表演。',
        x: 27,
        y: 58,
        effects: { energy: 3 },
      },
      {
        id: 'thank-card',
        label: '感谢卡',
        note: '每张卡都画着今天帮助过你的动物朋友。',
        x: 76,
        y: 64,
        effects: { kindness: 3 },
      },
    ],
    choices: [
      {
        text: '邀请所有居民一起数到三，点亮彩虹风车。',
        reply: '彩虹风车转了起来，整座城市都被温暖的光照亮。',
        target: 'ending:team',
        effects: { kindness: 5, energy: 5 },
      },
      {
        text: '先回顾每一枚徽章的故事，再开始开幕表演。',
        reply: '大家听见自己的努力被记住，掌声从舞台传到街角。',
        target: 'ending:wise',
        effects: { wisdom: 5, curiosity: 5 },
      },
      {
        text: '把舞台让给动物居民，你在台下敲响音乐贝壳。',
        reply: '这场庆典不是一个人的冒险，而是整座城市共同完成的作品。',
        target: 'ending:gentle',
        effects: { kindness: 6, wisdom: 3 },
      },
    ],
  },
]

const endings: Record<string, string> = {
  team: '团队开幕结局：彩虹风车升起一圈光，大家发现最厉害的不是某一个人，而是愿意一起完成一件事。',
  wise: '智慧回顾结局：每枚徽章都有一段故事。动物居民把今天画成一本节日图册，留给下次嘉年华。',
  gentle: '温柔合奏结局：你没有站在最亮的地方，却让每个朋友都被看见。星光舞台响起最整齐的掌声。',
  explorer: '探索小队结局：你找到了最多隐藏线索，狐狸发明家邀请你成为下一届嘉年华路线设计师。',
}

const savePrefix = 'animal-carnival-slot-'
const autosaveKey = 'animal-carnival-autosave'

const nodeMap: Record<string, StoryNode> = Object.fromEntries(storyNodes.map((node) => [node.id, node]))

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const createInitialGame = (): GameState => ({
  nodeId: 'plaza',
  stats: initialStats,
  flags: [],
  unlocked: ['plaza'],
  history: [],
  lastReply: '彩带从头顶飘过，嘉年华的第一声鼓点已经响起。',
})

const applyEffects = (stats: Metrics, effects?: Partial<Metrics>): Metrics => {
  const next = { ...stats }

  if (!effects) return next

  for (const metric of metrics) {
    const delta = effects[metric.id] ?? 0
    next[metric.id] = clamp(next[metric.id] + delta, 0, 100)
  }

  return next
}

const unique = (items: string[]) => Array.from(new Set(items))

const getSave = (slot: number): SaveSlot | null => {
  const raw = localStorage.getItem(`${savePrefix}${slot}`)
  if (!raw) return null

  try {
    return JSON.parse(raw) as SaveSlot
  } catch {
    return null
  }
}

const getAutosave = (): GameState | null => {
  const raw = localStorage.getItem(autosaveKey)
  if (!raw) return null

  try {
    return JSON.parse(raw) as GameState
  } catch {
    return null
  }
}

function App() {
  const [game, setGame] = useState<GameState>(() => getAutosave() ?? createInitialGame())
  const [screen, setScreen] = useState<'title' | 'game' | 'archive'>('title')
  const [yaw, setYaw] = useState(50)
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null)
  const [, setSlotVersion] = useState(0)

  const node = nodeMap[game.nodeId] ?? storyNodes[0]
  const selectedHotspot = node.hotspots.find((hotspot) => hotspot.id === selectedHotspotId)
  const availableChoices = node.choices.filter(
    (choice) =>
      (!choice.requiresFlag || game.flags.includes(choice.requiresFlag)) &&
      (!choice.requiresFlags || choice.requiresFlags.every((flag) => game.flags.includes(flag))),
  )
  const isFirstLevel = node.id.startsWith('plaza')
  const firstLevelCompleted = firstLevelObjectives.filter((objective) => game.flags.includes(objective.flag)).length

  const topMetric = useMemo(
    () => metrics.reduce((best, metric) => (game.stats[metric.id] > game.stats[best.id] ? metric : best)),
    [game.stats],
  )

  const saveSlots = [1, 2, 3].map((slot) => ({ slot, save: getSave(slot) }))

  useEffect(() => {
    localStorage.setItem(autosaveKey, JSON.stringify(game))
  }, [game])

  const computeEnding = (state: GameState) => {
    if (state.flags.filter((flag) => flag.startsWith('badge-')).length >= 4 && state.stats.curiosity >= 55) {
      return 'explorer'
    }

    if (state.stats.wisdom >= state.stats.kindness && state.stats.wisdom >= state.stats.energy) return 'wise'
    if (state.stats.kindness >= state.stats.energy) return 'gentle'
    return 'team'
  }

  const choose = (choice: Choice) => {
    setSelectedHotspotId(null)
    setGame((current) => {
      const newChoiceFlags = (choice.flags ?? []).filter((flag) => !current.flags.includes(flag))
      const stats = applyEffects(current.stats, !choice.flags || newChoiceFlags.length > 0 ? choice.effects : undefined)
      const flags = unique([...current.flags, ...newChoiceFlags])
      const history = [
        ...current.history,
        {
          nodeId: current.nodeId,
          choice: choice.text,
          reply: choice.reply,
        },
      ]
      const baseState: GameState = {
        ...current,
        stats,
        flags,
        history,
        lastReply: choice.reply,
      }

      if (choice.target.startsWith('ending:')) {
        const requestedEnding = choice.target.replace('ending:', '')
        return {
          ...baseState,
          ending: requestedEnding === 'team' ? computeEnding(baseState) : requestedEnding,
        }
      }

      return {
        ...baseState,
        nodeId: choice.target,
        unlocked: unique([...current.unlocked, choice.target]),
      }
    })
  }

  const inspectHotspot = (hotspot: Hotspot) => {
    setSelectedHotspotId(hotspot.id)
    setGame((current) => ({
      ...current,
      stats: applyEffects(
        current.stats,
        !hotspot.flag || !current.flags.includes(hotspot.flag) ? hotspot.effects : undefined,
      ),
      flags: unique([...current.flags, ...(hotspot.flag ? [hotspot.flag] : [])]),
    }))
  }

  const restart = () => {
    setSelectedHotspotId(null)
    setGame(createInitialGame())
    setScreen('game')
    setYaw(50)
  }

  const saveToSlot = (slot: number) => {
    const save: SaveSlot = {
      savedAt: new Date().toISOString(),
      state: game,
    }
    localStorage.setItem(`${savePrefix}${slot}`, JSON.stringify(save))
    setSlotVersion((current) => current + 1)
  }

  const loadFromSlot = (slot: number) => {
    const save = getSave(slot)
    if (!save) return

    setSelectedHotspotId(null)
    setGame(save.state)
    setScreen('game')
  }

  const updateYaw = useCallback((nextYaw: number) => {
    setYaw(Math.round(nextYaw))
  }, [])

  if (screen === 'title') {
    return (
      <main className="title-screen">
        <div className="title-panorama" style={{ backgroundImage: `url(${storyNodes[0].image})` }} />
        <section className="title-panel">
          <span className="kicker">全年龄 360 全景互动游戏</span>
          <h1>彩虹尾巴城</h1>
          <p>动物嘉年华开幕前，彩虹徽章被风吹散。转动视角、寻找线索、帮助居民，把庆典重新点亮。</p>
          <div className="title-actions">
            <button onClick={() => setScreen('game')}>继续游戏</button>
            <button onClick={restart}>新游戏</button>
            <button onClick={() => setScreen('archive')}>章节回看</button>
          </div>
        </section>
      </main>
    )
  }

  if (screen === 'archive') {
    return (
      <main className="archive-screen">
        <header className="archive-header">
          <div>
            <span className="kicker">Archive</span>
            <h1>章节回看</h1>
          </div>
          <button onClick={() => setScreen('game')}>返回游戏</button>
        </header>
        <section className="archive-grid">
          {storyNodes.map((storyNode) => (
            <button
              className="archive-card"
              disabled={!game.unlocked.includes(storyNode.id)}
              key={storyNode.id}
              onClick={() => {
                setSelectedHotspotId(null)
                setGame((current) => ({ ...current, nodeId: storyNode.id, ending: undefined }))
                setScreen('game')
              }}
            >
              <img alt="" src={storyNode.image} />
              <span>{storyNode.chapter}</span>
              <strong>{storyNode.title}</strong>
            </button>
          ))}
        </section>
      </main>
    )
  }

  return (
    <main className="game-screen">
      <section aria-label={`${node.title} 360 全景剧情画面`} className="panorama-stage">
        <PanoramaViewer image={node.image} onYawChange={updateYaw} />
        <div className="vignette" />

        {node.hotspots.map((hotspot) => (
          <button
            className="hotspot"
            key={hotspot.id}
            onClick={(event) => {
              event.stopPropagation()
              inspectHotspot(hotspot)
            }}
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            title={hotspot.label}
          >
            <span />
          </button>
        ))}

        <header className="top-bar">
          <div className="chapter-chip">
            <span>{node.chapter}</span>
            <strong>{node.title}</strong>
          </div>
          <div className="top-meta">
            <span>{node.time}</span>
            <span>{node.place}</span>
            <span>视角 {yaw}°</span>
          </div>
          <button onClick={() => setScreen('title')}>菜单</button>
        </header>

        <aside className="relationship-panel">
          {metrics.map((metric) => (
            <div className="relationship-row" key={metric.id}>
              <div>
                <strong>{metric.name}</strong>
                <span>{metric.archetype}</span>
              </div>
              <meter max="100" min="0" value={game.stats[metric.id]} />
            </div>
          ))}
        </aside>

        {isFirstLevel ? (
          <aside className="level-panel">
            <strong>第一关任务</strong>
            <span>
              {firstLevelCompleted}/{firstLevelObjectives.length} 已完成
            </span>
            <div className="objective-list">
              {firstLevelObjectives.map((objective) => (
                <div className={game.flags.includes(objective.flag) ? 'is-done' : ''} key={objective.flag}>
                  <mark>{game.flags.includes(objective.flag) ? '✓' : '·'}</mark>
                  <p>{objective.label}</p>
                </div>
              ))}
            </div>
          </aside>
        ) : null}

        <section className="story-panel">
          <div className="story-copy">
            <span className="kicker">{node.speaker}</span>
            <h2>{node.mood}</h2>
            <p>{game.ending ? endings[game.ending] : node.text}</p>
            <small>{game.lastReply}</small>
          </div>

          {selectedHotspot ? (
            <div className="clue-box">
              <strong>{selectedHotspot.label}</strong>
              <p>{selectedHotspot.note}</p>
            </div>
          ) : null}

          {game.ending ? (
            <div className="ending-actions">
              <button onClick={restart}>重新开始</button>
              <button onClick={() => setScreen('archive')}>回看章节</button>
            </div>
          ) : (
            <div className="choices">
              {availableChoices.map((choice) => (
                <button key={choice.text} onClick={() => choose(choice)}>
                  {choice.text}
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="save-panel">
          <strong>本地存档</strong>
          {saveSlots.map(({ slot, save }) => (
            <div className="save-row" key={slot}>
              <button onClick={() => saveToSlot(slot)}>存 {slot}</button>
              <button disabled={!save} onClick={() => loadFromSlot(slot)}>
                读 {slot}
              </button>
              <span>{save ? new Date(save.savedAt).toLocaleString('zh-CN') : '空'}</span>
            </div>
          ))}
          <p>
            当前倾向：{topMetric.name} · {topMetric.tone}
          </p>
        </aside>
      </section>
    </main>
  )
}

export default App
