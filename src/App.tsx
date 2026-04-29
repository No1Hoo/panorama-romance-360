import { useCallback, useEffect, useMemo, useState } from 'react'
import PanoramaViewer from './PanoramaViewer'
import './App.css'

type CharacterId = 'qinglan' | 'yutang' | 'wanxing' | 'yumian' | 'zhixia' | 'suli'

type Character = {
  id: CharacterId
  name: string
  archetype: string
  tone: string
  color: string
}

type CharacterStats = Record<CharacterId, number>

type Hotspot = {
  id: string
  label: string
  note: string
  x: number
  y: number
  flag?: string
  effects?: Partial<CharacterStats>
}

type Choice = {
  text: string
  reply: string
  target: string
  effects?: Partial<CharacterStats>
  flags?: string[]
  requiresFlag?: string
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
  stats: CharacterStats
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

const characters: Character[] = [
  {
    id: 'qinglan',
    name: '林清澜',
    archetype: '知性投资顾问',
    tone: '偏爱真诚和可靠',
    color: '#8dd3c7',
  },
  {
    id: 'yutang',
    name: '夏语棠',
    archetype: '元气活动策划',
    tone: '喜欢被认真回应',
    color: '#ffb36b',
  },
  {
    id: 'wanxing',
    name: '程晚星',
    archetype: '自由摄影师',
    tone: '在意空间和理解',
    color: '#b7a6ff',
  },
  {
    id: 'yumian',
    name: '乔雨眠',
    archetype: '甜品主理人',
    tone: '会记住细节',
    color: '#ffd1dc',
  },
  {
    id: 'zhixia',
    name: '沈知夏',
    archetype: '成熟职场上司',
    tone: '看重担当和边界',
    color: '#80bfff',
  },
  {
    id: 'suli',
    name: '苏梨',
    archetype: '潮流直播主',
    tone: '讨厌被流量定义',
    color: '#ff7aa8',
  },
]

const initialStats: CharacterStats = {
  qinglan: 30,
  yutang: 30,
  wanxing: 30,
  yumian: 30,
  zhixia: 30,
  suli: 30,
}

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

const storyNodes: StoryNode[] = [
  {
    id: 'arrival',
    chapter: '第一章',
    time: '20:18',
    title: '意外入住',
    place: '共享公寓',
    image: asset('panoramas/chapter-01-arrival.png'),
    speaker: '旁白',
    mood: '开门的瞬间，六道目光同时落在你身上。',
    text: '租房平台发来的门锁密码竟然真的能打开。客厅、厨房、阳台和走廊都有人，她们像早就知道你会来，又像谁也不打算先解释。',
    hotspots: [
      {
        id: 'suitcase',
        label: '行李箱',
        note: '你的行李还停在门口，像是在提醒你：现在反悔还来得及。',
        x: 48,
        y: 76,
      },
      {
        id: 'phone-invite',
        label: '邀请短信',
        note: '短信没有署名，只写着“今晚八点，别迟到”。',
        x: 72,
        y: 58,
        flag: 'invite-clue',
        effects: { qinglan: 2, wanxing: 1 },
      },
      {
        id: 'fruit-plate',
        label: '水果盘',
        note: '夏语棠把水果递近了一点，像是把选择也递到了你手上。',
        x: 32,
        y: 55,
        effects: { yutang: 2, yumian: 1 },
      },
    ],
    choices: [
      {
        text: '先把事情说清楚：我可能走错了房间。',
        reply: '林清澜轻轻点头：“至少你没有急着表演镇定。”',
        target: 'dinner',
        effects: { qinglan: 7, zhixia: 4 },
        flags: ['honest-start'],
      },
      {
        text: '接过水果，笑着说“看来我来得正好”。',
        reply: '夏语棠笑得更灿烂了，苏梨也顺手把镜头压低，给你留了体面。',
        target: 'dinner',
        effects: { yutang: 7, suli: 4 },
        flags: ['easygoing-start'],
      },
      {
        text: '注意那条邀请短信，问是谁发来的。',
        reply: '程晚星的快门声很轻：“你比看起来敏锐。”',
        target: 'dinner',
        effects: { wanxing: 6, qinglan: 3 },
        flags: ['questioned-invite'],
      },
    ],
  },
  {
    id: 'dinner',
    chapter: '第二章',
    time: '21:03',
    title: '欢迎晚餐',
    place: '公寓餐桌',
    image: asset('panoramas/chapter-02-dinner.png'),
    speaker: '夏语棠',
    mood: '晚餐热闹得像一场不宣布规则的面试。',
    text: '水果、甜点、红茶和几句轻飘飘的试探一起递到你面前。每个人都在笑，但每个人都在等你把注意力交给谁。',
    hotspots: [
      {
        id: 'dessert',
        label: '新做甜点',
        note: '乔雨眠说这是试作品，却把最完整的一块留给了你。',
        x: 51,
        y: 62,
        effects: { yumian: 4 },
      },
      {
        id: 'camera',
        label: '相机',
        note: '程晚星的相机没有对准你，反而拍下了所有人的反应。',
        x: 79,
        y: 42,
        flag: 'camera-seen',
        effects: { wanxing: 2 },
      },
      {
        id: 'work-call',
        label: '未接电话',
        note: '沈知夏把手机扣在桌面，屏幕亮了又灭。',
        x: 22,
        y: 65,
        effects: { zhixia: 2 },
      },
    ],
    choices: [
      {
        text: '帮乔雨眠把甜点分给所有人。',
        reply: '乔雨眠低声说了句谢谢。她没有抢话，但眼神明显亮了一下。',
        target: 'blackout',
        effects: { yumian: 8, yutang: 2 },
        flags: ['shared-dessert'],
      },
      {
        text: '接住夏语棠的玩笑，把气氛热起来。',
        reply: '客厅笑声一下散开，夏语棠靠回椅背，像是终于不用一个人撑场。',
        target: 'blackout',
        effects: { yutang: 8, suli: 3 },
      },
      {
        text: '提醒沈知夏：如果电话重要，可以先处理。',
        reply: '沈知夏看了你两秒，才拿起手机：“你倒是不急着证明自己。”',
        target: 'blackout',
        effects: { zhixia: 8, qinglan: 2 },
      },
    ],
  },
  {
    id: 'blackout',
    chapter: '第三章',
    time: '22:26',
    title: '雨夜停电',
    place: '公寓客厅',
    image: asset('panoramas/chapter-03-blackout.png'),
    speaker: '旁白',
    mood: '窗外雷声压下来，房间忽然只剩手机光和呼吸声。',
    text: '停电发生得太巧。有人抓住你的手，有人让你去看电闸，还有人盯着那部亮屏的手机。你意识到，今晚不是租房乌龙那么简单。',
    hotspots: [
      {
        id: 'breaker',
        label: '电闸箱',
        note: '电闸没有跳。停电更像是整栋楼的问题。',
        x: 83,
        y: 48,
        flag: 'breaker-safe',
        effects: { zhixia: 3 },
      },
      {
        id: 'lit-phone',
        label: '亮屏手机',
        note: '屏幕上闪过同一条邀请格式，发送时间比你的短信更早。',
        x: 38,
        y: 68,
        flag: 'shared-invite',
        effects: { qinglan: 2, wanxing: 2 },
      },
      {
        id: 'held-hand',
        label: '被牵住的手',
        note: '对方没有用力，只是在等你决定要不要回握。',
        x: 57,
        y: 52,
        effects: { yutang: 2, yumian: 2 },
      },
    ],
    choices: [
      {
        text: '先确认所有人安全，再去查电闸。',
        reply: '沈知夏接过你的手电：“顺序对了，事情就不会乱。”',
        target: 'park',
        effects: { zhixia: 7, qinglan: 3, yumian: 2 },
        flags: ['kept-calm'],
      },
      {
        text: '回握那只手，开玩笑缓和紧张。',
        reply: '夏语棠笑出了声，雨声似乎也没那么近了。',
        target: 'park',
        effects: { yutang: 7, suli: 3 },
      },
      {
        text: '追问那条共同邀请短信。',
        reply: '程晚星没有躲开你的视线：“有些答案，太早知道就不好玩了。”',
        target: 'park',
        effects: { wanxing: 7, qinglan: 2 },
        flags: ['pressed-mystery'],
        requiresFlag: 'shared-invite',
      },
    ],
  },
  {
    id: 'park',
    chapter: '第四章',
    time: '07:12',
    title: '城市晨跑',
    place: '湖边公园',
    image: asset('panoramas/chapter-04-park.png'),
    speaker: '夏语棠',
    mood: '昨晚的选择没有消失，它们只是换成清晨的眼神。',
    text: '你被拉到公园跑道，原以为只是晨跑，却在湖边陆续遇见所有人。她们对昨晚的态度不一样，空气反而比停电时更难回答。',
    hotspots: [
      {
        id: 'coffee',
        label: '咖啡',
        note: '林清澜的咖啡多买了一杯，杯套上没有名字。',
        x: 67,
        y: 46,
        effects: { qinglan: 3 },
      },
      {
        id: 'photo-bench',
        label: '长椅照片',
        note: '照片里的你在停电时先看向了所有人，而不是某一个人。',
        x: 74,
        y: 58,
        flag: 'group-photo',
        effects: { wanxing: 3 },
      },
      {
        id: 'breakfast',
        label: '早餐袋',
        note: '乔雨眠说只是多买了，包装却刚好是你昨晚称赞过的口味。',
        x: 29,
        y: 61,
        effects: { yumian: 4 },
      },
    ],
    choices: [
      {
        text: '陪夏语棠跑完最后一圈。',
        reply: '夏语棠喘着气笑：“你不是最快的，但你没有半路消失。”',
        target: 'cafe',
        effects: { yutang: 8, suli: 1 },
      },
      {
        text: '接过林清澜的咖啡，问她真正想确认什么。',
        reply: '林清澜看向湖面：“确认你会不会把温柔当成策略。”',
        target: 'cafe',
        effects: { qinglan: 8, zhixia: 2 },
        flags: ['asked-qinglan'],
      },
      {
        text: '坐到程晚星旁边，不问照片，只陪她看光。',
        reply: '程晚星把相机放低：“你终于学会不急着解释画面了。”',
        target: 'cafe',
        effects: { wanxing: 8 },
      },
    ],
  },
  {
    id: 'cafe',
    chapter: '第五章',
    time: '15:40',
    title: '甜品店临时工',
    place: '乔雨眠的甜品店',
    image: asset('panoramas/chapter-05-cafe.png'),
    speaker: '乔雨眠',
    mood: '订单、采访、电话和误会一起挤进小小的甜品店。',
    text: '你刚系上围裙，门铃就响个不停。每个人都带着自己的麻烦出现，而乔雨眠第一次没有说“没关系”。',
    hotspots: [
      {
        id: 'new-cake',
        label: '新口味蛋糕',
        note: '酸甜平衡得很好，像乔雨眠终于说出口的一点坚持。',
        x: 46,
        y: 63,
        effects: { yumian: 4 },
      },
      {
        id: 'live-light',
        label: '补光灯',
        note: '苏梨把灯调暗，避开了不想出镜的顾客。',
        x: 81,
        y: 43,
        effects: { suli: 3 },
      },
      {
        id: 'urgent-folder',
        label: '文件夹',
        note: '沈知夏的文件边角被雨水打湿，她显然是临时赶来的。',
        x: 24,
        y: 56,
        effects: { zhixia: 3 },
      },
    ],
    choices: [
      {
        text: '先帮乔雨眠稳住后厨。',
        reply: '乔雨眠终于抬头：“我其实……是希望有人先问问我累不累。”',
        target: 'rooftop',
        effects: { yumian: 9, qinglan: 1 },
        flags: ['protected-yumian'],
      },
      {
        text: '提醒苏梨直播前先征得店里同意。',
        reply: '苏梨关掉预览，认真地说：“你没有把我当麻烦。”',
        target: 'rooftop',
        effects: { suli: 8, zhixia: 2 },
      },
      {
        text: '接过沈知夏的文件，同时安排店内订单。',
        reply: '沈知夏难得笑了一下：“你可以慌，但没有乱。”',
        target: 'rooftop',
        effects: { zhixia: 8, yumian: 2 },
        flags: ['handled-pressure'],
      },
    ],
  },
  {
    id: 'rooftop',
    chapter: '第六章',
    time: '18:35',
    title: '天台告白预演',
    place: '城市天台',
    image: asset('panoramas/chapter-06-rooftop.png'),
    speaker: '程晚星',
    mood: '夕阳很好，镜头也很好，只是现实总在最会破坏气氛的时候出现。',
    text: '程晚星让你配合一段告白预演。你刚站到镜头前，沈知夏带着工作危机赶到。浪漫和责任同时等你开口。',
    hotspots: [
      {
        id: 'camera-tripod',
        label: '三脚架',
        note: '镜头没有开录，程晚星只是想知道你会怎么面对真话。',
        x: 58,
        y: 47,
        effects: { wanxing: 3 },
      },
      {
        id: 'flower',
        label: '花束',
        note: '夏语棠说花只是道具，但包装纸明显重新扎过。',
        x: 32,
        y: 66,
        effects: { yutang: 3 },
      },
      {
        id: 'work-message',
        label: '紧急消息',
        note: '沈知夏没有要求你站队，只说：“你自己判断轻重。”',
        x: 76,
        y: 56,
        effects: { zhixia: 3 },
      },
    ],
    choices: [
      {
        text: '完成告白预演，但把话说给镜头后的每个人听。',
        reply: '程晚星沉默了很久：“你比我想象中贪心，也比我想象中坦白。”',
        target: 'launch',
        effects: { wanxing: 8, yutang: 2, yumian: 2 },
        flags: ['public-heart'],
      },
      {
        text: '先处理工作危机，回来后向大家解释。',
        reply: '沈知夏收起文件：“成年人不是没有心动，是知道心动之后还要负责。”',
        target: 'launch',
        effects: { zhixia: 9, qinglan: 2 },
        flags: ['chose-duty'],
      },
      {
        text: '暂停拍摄，承认自己不想用预演逃避真实选择。',
        reply: '林清澜看着你：“这句话，比任何告白都难。”',
        target: 'launch',
        effects: { qinglan: 8, wanxing: 2 },
        flags: ['refused-performance'],
      },
    ],
  },
  {
    id: 'launch',
    chapter: '第七章',
    time: '20:10',
    title: '发布会风波',
    place: '直播发布会',
    image: asset('panoramas/chapter-07-launch.png'),
    speaker: '苏梨',
    mood: '直播灯一亮，误会就有了自己的速度。',
    text: '剪辑片段被误读，你和她们的关系成了所有人的谈资。苏梨站在镜头前，第一次没有急着用笑容救场。',
    hotspots: [
      {
        id: 'muted-phone',
        label: '静音手机',
        note: '消息不断跳出，但你越看越说不清。',
        x: 44,
        y: 70,
        flag: 'public-pressure',
      },
      {
        id: 'water',
        label: '一杯水',
        note: '乔雨眠把水递给你，没有问你要怎么选。',
        x: 61,
        y: 62,
        effects: { yumian: 2 },
      },
      {
        id: 'stage-light',
        label: '直播灯',
        note: '苏梨没有关灯。她在等你决定是否站到光里。',
        x: 71,
        y: 39,
        effects: { suli: 3 },
      },
    ],
    choices: [
      {
        text: '公开说明：不消费任何人的善意，也不甩锅给苏梨。',
        reply: '苏梨低头笑了一下，像终于从镜头里走回真实世界。',
        target: 'finale',
        effects: { suli: 10, qinglan: 2, zhixia: 2 },
        flags: ['public-responsibility'],
      },
      {
        text: '先暂停发布会，把所有人带到后台沟通。',
        reply: '沈知夏替你挡住追问，林清澜则把门轻轻关上。',
        target: 'finale',
        effects: { zhixia: 6, qinglan: 5, yumian: 2 },
        flags: ['private-talk'],
      },
      {
        text: '承认自己一直在回避选择，请她们给你最后一次解释。',
        reply: '没有人立刻原谅你。但也没有人马上离开。',
        target: 'finale',
        effects: { wanxing: 3, yutang: 3, yumian: 3, suli: 3 },
        flags: ['confessed-avoidance'],
      },
    ],
  },
  {
    id: 'finale',
    chapter: '第八章',
    time: '23:48',
    title: '最后的全景房间',
    place: '共享公寓',
    image: asset('panoramas/chapter-08-finale.png'),
    speaker: '旁白',
    mood: '所有线索回到最初的房间，真相比误会更温柔。',
    text: '那条邀请短信不是恶作剧。她们都曾在不同时间被你帮助过，而今晚只是想确认：你是不是仍然会认真对待每一个人。',
    hotspots: [
      {
        id: 'memory-table',
        label: '回忆桌',
        note: '照片、甜点、咖啡、花和文件摆在一起，像你一路留下的答案。',
        x: 50,
        y: 65,
        flag: 'memory-table',
      },
      {
        id: 'closed-live',
        label: '关闭的直播',
        note: '苏梨把手机扣下：“这次，不给别人看。”',
        x: 75,
        y: 51,
        effects: { suli: 2 },
      },
      {
        id: 'old-message',
        label: '旧短信',
        note: '林清澜说：“现在你知道了，选择仍然算数。”',
        x: 27,
        y: 53,
        effects: { qinglan: 2 },
      },
    ],
    choices: [
      {
        text: '说出最想坚定选择的人。',
        reply: '房间安静下来，你终于不再把真诚拖到下一秒。',
        target: 'ending:auto',
        flags: ['single-ending'],
      },
      {
        text: '承认自己还没准备好恋爱，但想把误会全部解开。',
        reply: '她们没有为难你。成年人之间，清楚也是一种温柔。',
        target: 'ending:group',
        flags: ['group-ending'],
      },
      {
        text: '选择先离开这间房，认真处理事业和自己。',
        reply: '你带走行李，也带走了每个人留下的一点光。',
        target: 'ending:career',
        flags: ['career-ending'],
      },
    ],
  },
]

const endings: Record<string, string> = {
  qinglan: '林清澜线：理性之后的偏爱。她没有要求你立刻完美，只要求你以后别再用沉默装作成熟。',
  yutang: '夏语棠线：把热闹变成只属于两个人的勇气。她牵着你跑向清晨，说这次谁都不许半路消失。',
  wanxing: '程晚星线：镜头之外，她终于愿意出现。她给你看最后一张照片，里面的你没有逃开。',
  yumian: '乔雨眠线：温柔的人也被坚定选择。打烊后的甜品店只留一盏灯，她把新口味第一个交给你。',
  zhixia: '沈知夏线：成年人把责任和心动都说清楚。她站在夜风里，第一次没有把答案藏进工作里。',
  suli: '苏梨线：万人围观里，只听见彼此。她关掉直播，认真问你这一次是不是只看着她。',
  group: '群像和解线：你没有立刻拥有恋人，却拥有了一个愿意重新信任你的生活圈。',
  career: '事业独行线：你选择先处理事业与自我成长。城市清晨很亮，所有故事都还有回头看的余地。',
  failed: '失败结局：太多回避让关系冷掉。你离开公寓时，终于明白温柔也需要及时回应。',
}

const savePrefix = 'panorama-romance-slot-'
const autosaveKey = 'panorama-romance-autosave'

const nodeMap: Record<string, StoryNode> = Object.fromEntries(storyNodes.map((node) => [node.id, node]))

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const createInitialGame = (): GameState => ({
  nodeId: 'arrival',
  stats: initialStats,
  flags: [],
  unlocked: ['arrival'],
  history: [],
  lastReply: '门锁咔哒一声打开，你站在一场过于精心的意外里。',
})

const applyEffects = (stats: CharacterStats, effects?: Partial<CharacterStats>): CharacterStats => {
  const next = { ...stats }

  if (!effects) return next

  for (const character of characters) {
    const delta = effects[character.id] ?? 0
    next[character.id] = clamp(next[character.id] + delta, 0, 100)
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
    (choice) => !choice.requiresFlag || game.flags.includes(choice.requiresFlag),
  )

  const topCharacter = useMemo(
    () =>
      characters.reduce((best, character) =>
        game.stats[character.id] > game.stats[best.id] ? character : best,
      ),
    [game.stats],
  )

  const saveSlots = [1, 2, 3].map((slot) => ({ slot, save: getSave(slot) }))

  useEffect(() => {
    localStorage.setItem(autosaveKey, JSON.stringify(game))
  }, [game])

  const computeEnding = (state: GameState) => {
    const best = characters.reduce((winner, character) =>
      state.stats[character.id] > state.stats[winner.id] ? character : winner,
    )
    const bestScore = state.stats[best.id]
    const honestyScore = ['honest-start', 'public-responsibility', 'refused-performance'].filter((flag) =>
      state.flags.includes(flag),
    ).length

    if (bestScore < 48 && honestyScore === 0) return 'failed'
    return best.id
  }

  const choose = (choice: Choice) => {
    setSelectedHotspotId(null)
    setGame((current) => {
      const stats = applyEffects(current.stats, choice.effects)
      const flags = unique([...current.flags, ...(choice.flags ?? [])])
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
        const ending = choice.target === 'ending:auto' ? computeEnding(baseState) : choice.target.replace('ending:', '')
        return {
          ...baseState,
          ending,
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
      stats: applyEffects(current.stats, hotspot.effects),
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
          <span className="kicker">360 全景互动剧情</span>
          <h1>心动环绕线</h1>
          <p>
            一间共享公寓，一条无署名短信，六段靠近与试探。今晚，你必须认真回应每一次心动。
          </p>
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
      <section
        aria-label={`${node.title} 360 全景剧情画面`}
        className="panorama-stage"
      >
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
            <span>视角 {Math.round(yaw)}°</span>
          </div>
          <button onClick={() => setScreen('title')}>菜单</button>
        </header>

        <aside className="relationship-panel">
          {characters.map((character) => (
            <div className="relationship-row" key={character.id}>
              <div>
                <strong>{character.name}</strong>
                <span>{character.archetype}</span>
              </div>
              <meter max="100" min="0" value={game.stats[character.id]} />
            </div>
          ))}
        </aside>

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
            当前倾向：{topCharacter.name} · {topCharacter.tone}
          </p>
        </aside>
      </section>
    </main>
  )
}

export default App
