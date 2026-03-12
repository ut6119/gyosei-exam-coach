"use strict";

(() => {
  const STORAGE_KEY = "gyoseiExamCoach.v1";
  const SYNC_CONFIG_KEY = "gyoseiExamCoach.sync.v1";
  const SYNC_GIST_FILENAME = "gyosei-sync.json";
  const SYNC_SCHEMA_VERSION = 1;
  const NETLIFY_FIREBASE_CONFIG_URL = "/.netlify/functions/firebase-config";
  const FIREBASE_INIT_CONFIG_URL = "https://receipt-app-35ec3.web.app/__/firebase/init.json";
  const FIREBASE_SYNC_COLLECTION = "gyoseiExamCoach";
  const FIREBASE_SYNC_DOC_ID = "sync";
  const RESEARCH_UPDATED_AT = "2026-03-07";
  const COMPLETE_BUFFER_DAYS = 7;
  const SECTION_CLEAR_TARGET = 5;
  const DRILL_SECTION_FORMAT_RULES = {
    admin: [
      { match: "行政手続", format: "five" },
      { match: "行政不服審査", format: "five" },
      { match: "行政事件訴訟", format: "five" },
      { match: "国家賠償", format: "five" },
      { match: "地方自治", format: "five" }
    ],
    civil: [{ match: "", format: "five" }],
    const_basic: [{ match: "", format: "five" }],
    commercial: [{ match: "", format: "five" }],
    general: [{ match: "", format: "five" }],
    describe: [{ match: "", format: "written" }]
  };
  const FOCUS_TABS = ["home", "today", "primer", "drill"];
  const FOCUS_TAB_TARGETS = {
    home: ["dashboardCard", "homeCard"],
    today: ["todayPlanCard"],
    primer: ["primerBookCard"],
    drill: ["drillCard"]
  };
  const FOCUS_TAB_BY_CARD = {
    homeCard: "home",
    dashboardCard: "home",
    todayPlanCard: "today",
    primerBookCard: "primer",
    drillCard: "drill"
  };

  const OFFICIAL_SPEC_TEXT = "公式情報ベース: 試験時間180分(13:00-16:00) / 出題60問(法令等46問+基礎知識14問) / 形式: 主に5肢択一式（他に多肢選択式・記述式） / 合格基準: 法令等122点以上・基礎知識24点以上・総得点180点以上";

  const RESEARCH_SOURCES = [
    {
      title: "公式: 試験方式(時間・問題数・科目区分)",
      insight:
        "試験時間は180分、出題は60問(法令等46問+基礎知識14問)。模試モード設計に反映。",
      url: "https://www.gyosei-shiken.or.jp/doc/abstract/abstract.html"
    },
    {
      title: "公式: 合格基準",
      insight:
        "法令等122点以上・基礎知識24点以上・総得点180点以上を必須条件として採用。",
      url: "https://www.gyosei-shiken.or.jp/pdf/basis.pdf"
    },
    {
      title: "公式過去問: 令和7年度",
      insight:
        "過去5年分析の対象（語句出現と論点傾向の抽出元）。",
      url: "https://www.gyosei-shiken.or.jp/pdf/r7_mondai.pdf"
    },
    {
      title: "公式過去問: 令和6年度",
      insight:
        "過去5年分析の対象（語句出現と論点傾向の抽出元）。",
      url: "https://www.gyosei-shiken.or.jp/pdf/r6_mondai.pdf"
    },
    {
      title: "公式過去問: 令和5年度",
      insight:
        "過去5年分析の対象（語句出現と論点傾向の抽出元）。",
      url: "https://www.gyosei-shiken.or.jp/pdf/r5_mondai.pdf"
    },
    {
      title: "公式過去問: 令和4年度",
      insight:
        "過去5年分析の対象（語句出現と論点傾向の抽出元）。",
      url: "https://www.gyosei-shiken.or.jp/pdf/r4_mondai.pdf"
    },
    {
      title: "公式過去問: 令和3年度",
      insight:
        "過去5年分析の対象（語句出現と論点傾向の抽出元）。",
      url: "https://www.gyosei-shiken.or.jp/pdf/r3_mondai.pdf"
    },
    {
      title: "分析方針",
      insight:
        "令和3〜7年度の公式過去問から頻出語を抽出し、行政法・民法・憲法等の反復テーマを3択化。",
      url: "https://www.gyosei-shiken.or.jp/doc/abstract/abstract.html"
    }
  ];

  const PAST5_ANALYSIS_SUMMARY = [
    {
      topicLabel: "行政法",
      frequency: "高",
      trend: "行政手続・不服審査・訴訟類型の使い分けが反復。",
      measure: "主語（処分庁/審査庁/裁判所）と期限を同時に確認。"
    },
    {
      topicLabel: "民法",
      frequency: "高",
      trend: "無効/取消し、代理、債務不履行、保証の定番論点が継続。",
      measure: "原則→例外→効果の順で1行説明できるようにする。"
    },
    {
      topicLabel: "憲法・基礎法学",
      frequency: "中",
      trend: "人権の判例射程、統治の機関分担、法概念の基礎整理が頻出。",
      measure: "結論だけでなく理由（審査枠組み）まで短文で再現。"
    },
    {
      topicLabel: "商法・会社法",
      frequency: "中",
      trend: "機関設計、取締役責任、株主総会・取締役会の権限配分が中心。",
      measure: "誰が決めるかを表で整理して混同を防ぐ。"
    },
    {
      topicLabel: "基礎知識",
      frequency: "中",
      trend: "文章理解の時間管理、個人情報・情報分野の定義確認が重要。",
      measure: "設問先読みで必要情報を拾い、更新点を直前確認。"
    },
    {
      topicLabel: "記述式",
      frequency: "高",
      trend: "要件→当てはめ→結論の答案構成が得点差になりやすい。",
      measure: "主語・法令名・結論の3点チェックを固定化。"
    }
  ];

  const FORECAST_2026_STRATEGY = [
    "行政法: 義務付け訴訟/差止訴訟、執行停止、理由提示の組合せ問題を厚めに演習。",
    "民法: 取消し・無効・追認、代理権濫用、保証責任の範囲の比較問題を優先。",
    "憲法: 表現の自由・平等・政教分離で判例理由を問う問題を重点化。",
    "基礎知識: 個人情報・情報セキュリティ・文章理解の取りこぼし防止を最優先。",
    "記述式: 40字/80字を想定し、要件漏れを防ぐ型で毎日1問。"
  ];

  const DEFAULT_TOPICS = [
    { id: "admin", name: "行政法 肢別", total: 220, weight: 1.7, category: "major" },
    { id: "civil", name: "民法 肢別", total: 180, weight: 1.5, category: "major" },
    { id: "const_basic", name: "憲法・基礎法学", total: 120, weight: 1.1, category: "major" },
    { id: "commercial", name: "商法・会社法", total: 90, weight: 1.0, category: "minor" },
    { id: "general", name: "基礎知識", total: 120, weight: 1.2, category: "general" },
    { id: "describe", name: "記述式", total: 90, weight: 1.35, category: "describe" }
  ];

  const DEFAULT_GLOSSARY = [
    {
      term: "法律要件",
      definition: "法律効果が発生するために必要な事実要素。",
      pitfall: "効果と要件を逆に覚えない。"
    },
    {
      term: "法律効果",
      definition: "要件充足により発生する法的結果。",
      pitfall: "『できる』か『しなければならない』かの語尾差に注意。"
    },
    {
      term: "不作為",
      definition: "行政庁が申請に対し相当期間内に処分しないこと。",
      pitfall: "却下処分と不作為を混同しない。"
    },
    {
      term: "裁量権逸脱・濫用",
      definition: "裁量行為が社会通念上著しく妥当性を欠く違法状態。",
      pitfall: "単なる不当と違法の区別を曖昧にしない。"
    },
    {
      term: "信義則",
      definition: "権利行使や義務履行は誠実に行うべきという一般原則。",
      pitfall: "権利濫用との使い分けを整理する。"
    },
    {
      term: "取消し",
      definition: "有効に成立した行為を将来に向けて失効させること。",
      pitfall: "無効との効果発生時点の違いを押さえる。"
    },
    {
      term: "無効",
      definition: "初めから法律上の効力を認めないこと。",
      pitfall: "取消しと主張可能期間を混同しない。"
    },
    {
      term: "先取特権",
      definition: "法律上当然に成立する優先弁済権。",
      pitfall: "抵当権との成立要件の違いを整理。"
    },
    {
      term: "表見代理",
      definition: "代理権がないのに外観を信頼した相手方保護の制度。",
      pitfall: "本人帰責性の要否を要件ごとに分ける。"
    },
    {
      term: "既判力",
      definition: "確定判決の判断内容を後訴で争えなくする効力。",
      pitfall: "形成力・執行力との違いを明確化。"
    }
  ];

  const DEFAULT_PITFALLS = [
    "語尾トラップ: 『できる』『しなければならない』『してはならない』の違いを取り違える。",
    "主体トラップ: 行政庁・処分庁・審査庁・裁判所など、誰が行為主体かを誤る。",
    "期限トラップ: 審査請求期間・出訴期間・時効期間を混同する。",
    "原則例外トラップ: 原則だけ覚えて例外要件を落とす。",
    "判例射程トラップ: 結論だけ暗記し、事案の射程を外す。",
    "記述トラップ: 結論先行で要件の書き落としが起きる。"
  ];

  const GENERIC_EXPLANATION = {
    major: "条文の要件・効果・例外を3点で確認し、判例の結論を1行で再現できるまで反復。",
    minor: "頻出テーマを短サイクルで繰り返し、誤答論点は翌日再テスト。",
    general: "文章理解は設問先読み、情報通信/個人情報は定義と更新点をセットで確認。",
    describe: "記述は『要件→当てはめ→結論』の順で、主語と法令名を省略しない。"
  };

  const TOPIC_TEXTBOOK = {
    admin: {
      lead: "行政法は『誰が・いつまでに・何をするか』を先に固定してから解くと安定します。",
      points: [
        "主語を先に確認（行政庁/審査庁/裁判所）。",
        "要件→効果→例外の順で整理する。",
        "期限が出たら数字を先にチェックする。"
      ],
      tip: "主語→期限→例外"
    },
    civil: {
      lead: "民法は条文の原則と例外をセットで覚えると、ひっかけに強くなります。",
      points: [
        "『原則は何か』を最初に言語化する。",
        "例外が成立する条件を1つ添える。",
        "用語の定義を短く言える状態にする。"
      ],
      tip: "原則→例外→定義"
    },
    const_basic: {
      lead: "憲法・基礎法学は結論の暗記だけでなく、理由まで1文で言えるかが重要です。",
      points: [
        "論点ごとに『結論+理由』を1文で確認。",
        "人権主体・制約目的・手段の順で見る。",
        "判例は事案の違いまで意識する。"
      ],
      tip: "結論→理由→事案差"
    },
    commercial: {
      lead: "商法・会社法は細かい数字や機関の権限を表で覚えるとミスが減ります。",
      points: [
        "機関の権限を混同しない。",
        "数字・期限が出たら必ず復唱する。",
        "例外規定を1つセットで記憶する。"
      ],
      tip: "機関→数字→例外"
    },
    general: {
      lead: "基礎知識は知識問題を落とさないことが最優先です。",
      points: [
        "定義を短く言えるか確認する。",
        "文章理解は設問先読みで情報を拾う。",
        "更新されやすい分野は直前にも見直す。"
      ],
      tip: "定義→設問先読み→更新確認"
    },
    describe: {
      lead: "記述は書く順番を固定すると得点が安定します。",
      points: [
        "要件→当てはめ→結論の順で書く。",
        "主語と法令名を省略しない。",
        "結論先行で要件漏れを起こさない。"
      ],
      tip: "要件→当てはめ→結論"
    }
  };

  const CATEGORY_TEXTBOOK = {
    major: {
      lead: "まず『要件・効果・例外』の3点セットで確認してから問題に入ります。",
      points: [
        "主語（誰が行為主体か）を固定する。",
        "要件と効果を分けて整理する。",
        "例外条件を1つ補う。"
      ],
      tip: "主語→要件→例外"
    },
    minor: {
      lead: "短時間で回すため、1問ごとに要点1つを確実に言語化します。",
      points: [
        "原則を先に確認する。",
        "ひっかけ語尾を確認する。",
        "間違えた論点を次回先頭で復習する。"
      ],
      tip: "原則→語尾→復習"
    },
    general: {
      lead: "基礎知識は安定得点ゾーンです。定義と読解手順を先に確認します。",
      points: [
        "定義を短く言えるか確認する。",
        "設問先読みで必要情報だけ拾う。",
        "最新トピックは直前期に再確認する。"
      ],
      tip: "定義→先読み→再確認"
    },
    describe: {
      lead: "記述は型を崩さないことが最重要です。",
      points: [
        "要件→当てはめ→結論の順で固定する。",
        "主語と法令名を明示する。",
        "結論だけ先に書かない。"
      ],
      tip: "型固定で失点回避"
    }
  };

  const PAST5_TREND_BY_TOPIC = {
    admin: "過去5年頻出: 行政手続法 / 行政不服審査法 / 国家賠償法",
    civil: "過去5年頻出: 民法総則 / 契約 / 保証 / 取消し・無効",
    const_basic: "過去5年頻出: 憲法判例 / 人権 / 三権分立",
    commercial: "過去5年頻出: 会社機関 / 株主総会 / 取締役",
    general: "過去5年頻出: 個人情報 / 文章理解 / 情報分野",
    describe: "過去5年頻出: 要件→当てはめ→結論の型"
  };

  const TOPIC_SECTION_LABELS = {
    admin: ["行政手続", "行政不服審査", "行政事件訴訟", "国家賠償", "地方自治", "行政法総合"],
    civil: ["民法総則", "物権", "債権", "親族・相続", "民法総合"],
    const_basic: ["憲法人権", "憲法統治", "基礎法学", "判例総合"],
    commercial: ["会社機関", "株式", "役員責任", "商法総合"],
    general: ["個人情報", "情報通信", "文章理解", "時事・一般知識"],
    describe: ["答案構成", "要件抽出", "当てはめ", "結論表現"]
  };

  const PAST5_CHOICE_BANK = {
    admin: [
      {
        prompt: "【3択】申請を出したのに、役所が長く返事をしない状態はどれ？",
        choices: [
          "不作為",
          "却下処分",
          "行政指導"
        ],
        correctIndex: 0,
        answer: "申請に対して相当期間内に処分しないのは不作為。",
        explanation: "返事をしないこと自体が問題になる場面があります。まずは「返事なし=不作為」と覚えると整理しやすいです。",
        pitfall: "却下（はっきり断る）と不作為（返事しない）を混同しない。",
        terms: ["不作為", "申請", "行政庁"],
        trendTag: "過去5年頻出: 行政手続・不服申立て"
      },
      {
        prompt: "【3択】処分に納得できないとき、まず行政の中で見直しを求める手続は？",
        choices: [
          "審査請求",
          "民事訴訟",
          "住民投票"
        ],
        correctIndex: 0,
        answer: "行政内部の見直し手続は審査請求。",
        explanation: "いきなり裁判ではなく、先に不服申立てで解決できるケースがあります。",
        pitfall: "審査請求と裁判の順番・役割を混同しない。",
        terms: ["審査請求", "不服申立て", "処分"],
        trendTag: "過去5年頻出: 行政不服審査法"
      },
      {
        prompt: "【3択】公務員の違法行為で損害を受けた人が、国や自治体にお金を請求する制度は？",
        choices: [
          "国家賠償",
          "行政指導",
          "条例制定"
        ],
        correctIndex: 0,
        answer: "国や自治体への損害賠償請求は国家賠償。",
        explanation: "公務員の違法な公権力行使で損害が出たときの基本ルールです。",
        pitfall: "民間会社への請求と国家賠償を混同しない。",
        terms: ["国家賠償", "違法", "損害"],
        trendTag: "過去5年頻出: 国家賠償法"
      },
      {
        prompt: "【3択】違法な行政処分を消してほしいと裁判所に求める訴えは？",
        choices: [
          "取消訴訟",
          "給付訴訟",
          "告発"
        ],
        correctIndex: 0,
        answer: "処分の取り消しを求めるのは取消訴訟。",
        explanation: "処分の効力を争う代表的な訴訟です。",
        pitfall: "『取り消したい』なら取消訴訟、と目的で覚える。",
        terms: ["取消訴訟", "処分", "行政事件訴訟"],
        trendTag: "過去5年頻出: 行政事件訴訟法"
      },
      {
        prompt: "【3択】不利益な処分の前に、本人の言い分を聞く手続として代表的なものは？",
        choices: [
          "聴聞",
          "時効",
          "口頭弁論終結"
        ],
        correctIndex: 0,
        answer: "不利益処分前の意見聴取の代表は聴聞。",
        explanation: "先に言い分を聞くことで、処分の公平性を高めます。",
        pitfall: "処分後の救済手続と混同しない。",
        terms: ["聴聞", "不利益処分", "手続保障"],
        trendTag: "過去5年頻出: 行政手続法"
      },
      {
        prompt: "【3択】行政の判断が常識的に見てひどく不合理なとき、裁判で問題になる考え方は？",
        choices: [
          "裁量権の逸脱・濫用",
          "一事不再理",
          "時効取得"
        ],
        correctIndex: 0,
        answer: "著しく不合理なら裁量権逸脱・濫用として違法になり得る。",
        explanation: "行政には裁量があっても、何でも自由に決めてよいわけではありません。",
        pitfall: "不当（気に入らない）と違法（法的に問題）を分ける。",
        terms: ["裁量", "逸脱濫用", "違法"],
        trendTag: "過去5年頻出: 行政法総合"
      }
    ],
    civil: [
      {
        prompt: "【3択】契約が成立する基本の組み合わせはどれ？",
        choices: [
          "申込みと承諾",
          "申込みと撤回",
          "通知と催告"
        ],
        correctIndex: 0,
        answer: "契約成立の基本は申込みと承諾。",
        explanation: "まずはこの2つで契約が成立する、という骨格を押さえます。",
        pitfall: "撤回や解除は成立後の話なので別物。",
        terms: ["契約", "申込み", "承諾"],
        trendTag: "過去5年頻出: 契約総論"
      },
      {
        prompt: "【3択】『最初から効力がない』を表す言葉は？",
        choices: [
          "無効",
          "取消し",
          "追認"
        ],
        correctIndex: 0,
        answer: "最初から効力がないのは無効。",
        explanation: "無効はスタート時点から効力なし、取消しは有効に始まって後で消える、が基本です。",
        pitfall: "無効と取消しの時点の違いを混同しない。",
        terms: ["無効", "取消し", "効力"],
        trendTag: "過去5年頻出: 民法総則"
      },
      {
        prompt: "【3択】『いったん有効だが、あとで消せる』を表す言葉は？",
        choices: [
          "取消し",
          "無効",
          "時効"
        ],
        correctIndex: 0,
        answer: "あとから効力を消せるのは取消し。",
        explanation: "取消しは『後で取り消す』イメージで覚えると定着します。",
        pitfall: "無効と反対方向で覚えると整理しやすい。",
        terms: ["取消し", "意思表示", "効力"],
        trendTag: "過去5年頻出: 民法総則"
      },
      {
        prompt: "【3択】約束したことを果たさない状態はどれ？",
        choices: [
          "債務不履行",
          "代理",
          "相殺"
        ],
        correctIndex: 0,
        answer: "約束を守らないのは債務不履行。",
        explanation: "支払わない、渡さない、遅れるなどが典型です。",
        pitfall: "相手の責任があるか、自分の責任かを切り分ける。",
        terms: ["債務不履行", "損害賠償", "契約"],
        trendTag: "過去5年頻出: 債権"
      },
      {
        prompt: "【3択】代理人が契約すると、効果が帰属する先は原則どこ？",
        choices: [
          "本人",
          "代理人",
          "第三者"
        ],
        correctIndex: 0,
        answer: "代理行為の効果は原則として本人に帰属。",
        explanation: "代理人は『本人の代わりに』行動します。",
        pitfall: "代理人が自分のためにした行為と区別する。",
        terms: ["代理", "本人", "帰属"],
        trendTag: "過去5年頻出: 代理"
      },
      {
        prompt: "【3択】連帯保証人について正しい説明はどれ？",
        choices: [
          "債権者は主たる債務者を飛ばして請求できる",
          "主たる債務者にしか請求できない",
          "連帯保証人は絶対に支払わなくてよい"
        ],
        correctIndex: 0,
        answer: "連帯保証人には直接請求できる。",
        explanation: "連帯保証は責任が重い点が試験でよく問われます。",
        pitfall: "通常保証との違いを曖昧にしない。",
        terms: ["連帯保証", "保証債務", "請求"],
        trendTag: "過去5年頻出: 保証"
      }
    ],
    const_basic: [
      {
        prompt: "【3択】法の下の平等の考え方として最も近いのはどれ？",
        choices: [
          "合理的な理由なく差別してはいけない",
          "全員をいつも全く同じに扱う",
          "国は差別しても自由"
        ],
        correctIndex: 0,
        answer: "合理的理由のない差別は許されない、が基本。",
        explanation: "同じに扱うべきかは事情で変わるので、『合理的理由』がキーワードです。",
        pitfall: "平等=完全同一扱い、と短絡しない。",
        terms: ["平等原則", "合理的区別", "憲法"],
        trendTag: "過去5年頻出: 憲法人権"
      },
      {
        prompt: "【3択】表現の自由が特に大切とされる理由として近いのはどれ？",
        choices: [
          "民主主義で意見を出し合う土台になるから",
          "うわさを自由に広めるため",
          "他人の権利を無視できるから"
        ],
        correctIndex: 0,
        answer: "民主主義の土台だから重視される。",
        explanation: "ただし他人の権利との調整は必要です。",
        pitfall: "『自由=無制限』ではない。",
        terms: ["表現の自由", "民主主義", "公共の福祉"],
        trendTag: "過去5年頻出: 憲法人権"
      },
      {
        prompt: "【3択】三権分立の説明として正しいのはどれ？",
        choices: [
          "国会・内閣・裁判所で権力を分ける",
          "内閣がすべてを決める",
          "裁判所が法律を作る"
        ],
        correctIndex: 0,
        answer: "立法・行政・司法を分けるのが三権分立。",
        explanation: "権力を分けてチェックし合うことで、権力の暴走を防ぎます。",
        pitfall: "各機関の役割を入れ替えない。",
        terms: ["三権分立", "国会", "裁判所"],
        trendTag: "過去5年頻出: 統治"
      },
      {
        prompt: "【3択】法律が憲法に反していないか最終的に判断する役割はどこ？",
        choices: [
          "裁判所",
          "内閣",
          "都道府県"
        ],
        correctIndex: 0,
        answer: "違憲審査の中核は裁判所。",
        explanation: "具体的な争いの中で、法律の合憲性が判断されます。",
        pitfall: "国会が自分で最終判断するわけではない。",
        terms: ["違憲審査", "裁判所", "憲法"],
        trendTag: "過去5年頻出: 違憲審査"
      },
      {
        prompt: "【3択】信教の自由の説明として正しいのはどれ？",
        choices: [
          "どの宗教を信じるか、信じないかを自分で決められる",
          "国が宗教を強制できる",
          "学校で特定宗教を強制してよい"
        ],
        correctIndex: 0,
        answer: "信じる自由・信じない自由を含む。",
        explanation: "宗教に関する国家の中立性が重視されます。",
        pitfall: "『信じる自由』だけでなく『信じない自由』もある。",
        terms: ["信教の自由", "政教分離", "人権"],
        trendTag: "過去5年頻出: 憲法人権"
      },
      {
        prompt: "【3択】基礎法学の観点で正しい説明はどれ？",
        choices: [
          "法律は国家の強制力をともなうルール",
          "道徳と法律は常に同じ内容",
          "法律は裁判で使われない"
        ],
        correctIndex: 0,
        answer: "法律は公的な強制力を伴う規範。",
        explanation: "道徳と重なる部分はありますが、完全に同じではありません。",
        pitfall: "法律と道徳を同一視しすぎない。",
        terms: ["基礎法学", "規範", "強制力"],
        trendTag: "過去5年頻出: 基礎法学"
      }
    ],
    commercial: [
      {
        prompt: "【3択】株式会社で重要事項を最終的に決める機関はどれ？",
        choices: [
          "株主総会",
          "監査役",
          "会計監査人"
        ],
        correctIndex: 0,
        answer: "重要事項の決定機関は株主総会。",
        explanation: "会社の所有者である株主が集まって決める場です。",
        pitfall: "業務執行を決める取締役会と混同しない。",
        terms: ["株主総会", "会社機関", "会社法"],
        trendTag: "過去5年頻出: 会社機関"
      },
      {
        prompt: "【3択】取締役の基本的な役割として最も近いのはどれ？",
        choices: [
          "会社の業務を進める・決める",
          "裁判所の判決を書く",
          "行政処分を出す"
        ],
        correctIndex: 0,
        answer: "取締役は会社の業務執行に関わる。",
        explanation: "会社の運営を担う中心メンバーです。",
        pitfall: "行政機関や裁判所の役割と混同しない。",
        terms: ["取締役", "業務執行", "会社法"],
        trendTag: "過去5年頻出: 取締役"
      },
      {
        prompt: "【3択】代表取締役の説明として正しいのはどれ？",
        choices: [
          "会社を外部に対して代表する",
          "株主の代わりに裁判官を任命する",
          "税率を決める"
        ],
        correctIndex: 0,
        answer: "代表取締役は会社を代表する立場。",
        explanation: "契約など対外的な行為を行う中心です。",
        pitfall: "社内の意思決定機関との役割差を整理する。",
        terms: ["代表取締役", "代表権", "会社"],
        trendTag: "過去5年頻出: 代表機関"
      },
      {
        prompt: "【3択】定款とは何？",
        choices: [
          "会社の基本ルールをまとめたもの",
          "毎日の売上メモ",
          "裁判の判決文"
        ],
        correctIndex: 0,
        answer: "定款は会社の基本ルール。",
        explanation: "会社の目的や機関など、土台になる事項を定めます。",
        pitfall: "就業規則など他の社内文書と混同しない。",
        terms: ["定款", "会社設立", "会社法"],
        trendTag: "過去5年頻出: 設立・定款"
      },
      {
        prompt: "【3択】株主の責任として正しいものはどれ？",
        choices: [
          "原則として出資額の範囲で責任を負う",
          "会社の借金を無制限で負う",
          "会社の義務は一切ない"
        ],
        correctIndex: 0,
        answer: "株主は原則、有限責任（出資額まで）。",
        explanation: "無制限責任ではない点が株式会社の基本です。",
        pitfall: "合名会社などの無限責任と混同しない。",
        terms: ["有限責任", "株主", "出資"],
        trendTag: "過去5年頻出: 会社法基礎"
      },
      {
        prompt: "【3択】取締役会の役割として近いのはどれ？",
        choices: [
          "業務執行の決定と取締役の監督",
          "国会の法律審議",
          "市長の選挙管理"
        ],
        correctIndex: 0,
        answer: "取締役会は業務執行の決定と監督が中心。",
        explanation: "会社内部の統治を機能させるための機関です。",
        pitfall: "株主総会が決める事項との切り分けを意識する。",
        terms: ["取締役会", "監督", "業務執行"],
        trendTag: "過去5年頻出: 会社機関"
      }
    ],
    general: [
      {
        prompt: "【3択】個人情報として最も当てはまるのはどれ？",
        choices: [
          "名前と生年月日がセットで本人を特定できる情報",
          "天気予報の一般情報",
          "都市の人口ランキングだけの表"
        ],
        correctIndex: 0,
        answer: "本人を識別できる情報は個人情報。",
        explanation: "誰の情報か特定できるかがポイントです。",
        pitfall: "匿名化された統計データと混同しない。",
        terms: ["個人情報", "識別", "保護"],
        trendTag: "過去5年頻出: 個人情報分野"
      },
      {
        prompt: "【3択】文章理解問題を解く最初の行動として効果的なのはどれ？",
        choices: [
          "設問を先に読んで、探す情報を決める",
          "本文を何度も全部読むだけ",
          "本文を読まずに選択肢だけで答える"
        ],
        correctIndex: 0,
        answer: "先に設問を読むと必要情報を拾いやすい。",
        explanation: "時間を守るために、読む目的を先に決めます。",
        pitfall: "本文を漫然と読むだけにならない。",
        terms: ["文章理解", "設問先読み", "時間配分"],
        trendTag: "過去5年頻出: 文章理解"
      },
      {
        prompt: "【3択】情報セキュリティで安全な行動はどれ？",
        choices: [
          "同じパスワードを使い回さない",
          "全サービスで同じ短いパスワードにする",
          "パスワードをメモで公開する"
        ],
        correctIndex: 0,
        answer: "使い回し防止は基本の対策。",
        explanation: "1つ漏れると連鎖被害になるため、分けるのが安全です。",
        pitfall: "便利さだけで安全対策を省かない。",
        terms: ["情報セキュリティ", "パスワード", "リスク"],
        trendTag: "過去5年頻出: 情報分野"
      },
      {
        prompt: "【3択】グラフ読解で先に確認するとミスが減るのはどれ？",
        choices: [
          "単位と期間（％、人、年など）",
          "グラフの色の好み",
          "作成者の名前だけ"
        ],
        correctIndex: 0,
        answer: "単位・期間の確認が最優先。",
        explanation: "単位を見落とすと、計算や比較でミスしやすくなります。",
        pitfall: "数字だけ追って単位を飛ばさない。",
        terms: ["資料読解", "単位", "期間"],
        trendTag: "過去5年頻出: 基礎知識読解"
      },
      {
        prompt: "【3択】SNSで個人情報を守る行動として適切なのはどれ？",
        choices: [
          "公開範囲を必要最小限に設定する",
          "位置情報を常に全公開する",
          "パスワードを友人全員に教える"
        ],
        correctIndex: 0,
        answer: "公開範囲をしぼるのが基本。",
        explanation: "外部公開が広いほど情報漏えいリスクが上がります。",
        pitfall: "初期設定のまま公開しない。",
        terms: ["SNS", "公開範囲", "個人情報"],
        trendTag: "過去5年頻出: 情報分野"
      },
      {
        prompt: "【3択】ニュース問題の対策として有効なのはどれ？",
        choices: [
          "直前期に公式情報の更新を確認する",
          "1年前の情報だけを固定で覚える",
          "根拠なく予想だけで解く"
        ],
        correctIndex: 0,
        answer: "更新される分野は直前確認が有効。",
        explanation: "情報分野は改正や新制度などの更新に注意が必要です。",
        pitfall: "古い情報のまま本番に行かない。",
        terms: ["時事", "更新確認", "基礎知識"],
        trendTag: "過去5年頻出: 時事・情報"
      }
    ],
    describe: [
      {
        prompt: "【3択】記述問題で最も安定しやすい書き方の順番はどれ？",
        choices: [
          "要件→当てはめ→結論",
          "結論→結論→結論",
          "感想→要件→結論"
        ],
        correctIndex: 0,
        answer: "基本の型は要件→当てはめ→結論。",
        explanation: "順番を固定すると、書き漏れが減ります。",
        pitfall: "結論だけ先に書いて根拠を落とさない。",
        terms: ["記述", "要件", "当てはめ"],
        trendTag: "過去5年頻出: 記述式"
      },
      {
        prompt: "【3択】記述で失点しにくい表現はどれ？",
        choices: [
          "主語と法令名をはっきり書く",
          "誰の話か書かない",
          "略語だけで書く"
        ],
        correctIndex: 0,
        answer: "主語と法令名を明示すると採点者に伝わりやすい。",
        explanation: "短い答案ほど、主語の省略が失点に直結します。",
        pitfall: "『誰が何をするか』を曖昧にしない。",
        terms: ["主語", "法令名", "記述"],
        trendTag: "過去5年頻出: 記述式"
      },
      {
        prompt: "【3択】記述でまず避けるべきミスはどれ？",
        choices: [
          "要件を書かずに結論だけ書く",
          "要件を書いてから結論を書く",
          "字数を確認して書く"
        ],
        correctIndex: 0,
        answer: "要件抜けは大きな失点原因。",
        explanation: "正しい結論でも、根拠がなければ点が伸びません。",
        pitfall: "『当たっているはず』ではなく論理を見せる。",
        terms: ["要件漏れ", "結論", "失点回避"],
        trendTag: "過去5年頻出: 記述式"
      },
      {
        prompt: "【3択】字数指定がある記述問題で正しい対応はどれ？",
        choices: [
          "指定字数の範囲に合わせる",
          "字数指定を無視して長文にする",
          "短く1行だけで終える"
        ],
        correctIndex: 0,
        answer: "字数条件は採点条件なので守る。",
        explanation: "内容が良くても、形式違反は評価を下げます。",
        pitfall: "書き切る前に字数を使い切らないよう下書きする。",
        terms: ["字数指定", "採点条件", "記述"],
        trendTag: "過去5年頻出: 記述式"
      },
      {
        prompt: "【3択】記述で『当てはめ』にあたる部分はどれ？",
        choices: [
          "事実を要件に結び付けて説明する部分",
          "法律名だけを書く部分",
          "最後に感想を書く部分"
        ],
        correctIndex: 0,
        answer: "事実を要件へつなぐのが当てはめ。",
        explanation: "要件を書くだけでなく、具体的事実と結ぶことが得点源です。",
        pitfall: "条文暗記だけで答案を作らない。",
        terms: ["当てはめ", "事実評価", "要件"],
        trendTag: "過去5年頻出: 記述式"
      },
      {
        prompt: "【3択】記述の見直しで最初に確認するとよい点はどれ？",
        choices: [
          "主語・結論・法令名が入っているか",
          "文字の大きさだけ",
          "余白の広さだけ"
        ],
        correctIndex: 0,
        answer: "主語・結論・法令名は最低チェック項目。",
        explanation: "短時間の見直しでは、得点に直結する要素を優先します。",
        pitfall: "見直しを文章のきれいさだけで終えない。",
        terms: ["見直し", "主語", "結論"],
        trendTag: "過去5年頻出: 記述式"
      }
    ]
  };

  const EXTRA_CHOICE_BANK_BY_TOPIC = {
    admin: [
      {
        prompt: "【3択】申請に対する処分の判断ルールを、行政庁があらかじめ定めたものは？",
        choices: [
          "審査基準",
          "判例集",
          "政党規約"
        ],
        correctIndex: 0,
        answer: "事前に定める判断ルールは審査基準。",
        explanation: "申請処理の公平性を高めるため、判断基準を先に整える考え方です。",
        pitfall: "判断基準と処分理由の提示を混同しない。",
        terms: ["審査基準", "申請", "行政手続法"],
        trendTag: "過去5年頻出: 行政手続法"
      },
      {
        prompt: "【3択】不利益処分をするとき、行政庁が相手方に示すべきものは？",
        choices: [
          "理由提示",
          "即時執行",
          "黙示承認"
        ],
        correctIndex: 0,
        answer: "不利益処分では理由提示が重要。",
        explanation: "なぜその処分になったかを示すことで、納得性と検証可能性を確保します。",
        pitfall: "処分前の聴聞と、処分時の理由提示を区別する。",
        terms: ["理由提示", "不利益処分", "手続保障"],
        trendTag: "過去5年頻出: 行政手続法"
      },
      {
        prompt: "【3択】行政指導の基本的な性質として正しいものはどれ？",
        choices: [
          "相手方の任意の協力を前提にする",
          "必ず強制できる",
          "拒否すると自動で刑罰が科される"
        ],
        correctIndex: 0,
        answer: "行政指導は任意協力が前提。",
        explanation: "法的強制とは別の働きかけなので、相手の意思を無視できません。",
        pitfall: "行政指導と強制処分を同じにしない。",
        terms: ["行政指導", "任意", "強制処分"],
        trendTag: "過去5年頻出: 行政手続法"
      },
      {
        prompt: "【3択】審査請求中に処分の効力を一時的に止める制度はどれ？",
        choices: [
          "執行停止",
          "時効中断",
          "仮差押え"
        ],
        correctIndex: 0,
        answer: "効力を一時停止するのは執行停止。",
        explanation: "結論が出る前に回復困難な不利益が生じる場面で使われる代表制度です。",
        pitfall: "民事保全の用語と混同しない。",
        terms: ["執行停止", "審査請求", "不服審査"],
        trendTag: "過去5年頻出: 行政不服審査法"
      },
      {
        prompt: "【3択】処分を受けた人に不服申立先や期間を知らせる説明を何という？",
        choices: [
          "教示",
          "告知聴聞",
          "弁明録取"
        ],
        correctIndex: 0,
        answer: "不服申立て情報を示すのは教示。",
        explanation: "救済手段を実効的に使えるようにするため、案内の明示が重要です。",
        pitfall: "教示と処分理由の記載を同一視しない。",
        terms: ["教示", "不服申立て", "行政救済"],
        trendTag: "過去5年頻出: 行政不服審査法"
      },
      {
        prompt: "【3択】審査請求を受け、裁決を行う行政機関はどれ？",
        choices: [
          "審査庁",
          "監査法人",
          "法制審議会"
        ],
        correctIndex: 0,
        answer: "裁決を行う主体は審査庁。",
        explanation: "処分庁と審査庁の役割を分けて押さえると混乱しにくくなります。",
        pitfall: "処分庁と審査庁を同じものとして覚えない。",
        terms: ["審査庁", "裁決", "不服審査"],
        trendTag: "過去5年頻出: 行政不服審査法"
      },
      {
        prompt: "【3択】審査請求の期間として基本形に近いものはどれ？",
        choices: [
          "処分を知った日の翌日から3か月以内",
          "処分日から3日以内",
          "いつでも無期限で可能"
        ],
        correctIndex: 0,
        answer: "基本は『知った日の翌日から3か月以内』。",
        explanation: "期限問題は得点源になりやすいので、数字を一緒に覚えるのが有効です。",
        pitfall: "『知った日基準』と『処分日基準』を混同しない。",
        terms: ["審査請求期間", "3か月", "期限"],
        trendTag: "過去5年頻出: 行政不服審査法"
      },
      {
        prompt: "【3択】申請に対する返答がない場合の審査請求は、原則どのタイミングで可能？",
        choices: [
          "相当期間が経過した後",
          "申請した直後",
          "5年経過後のみ"
        ],
        correctIndex: 0,
        answer: "不作為への審査請求は相当期間経過後に可能。",
        explanation: "行政に判断のための合理的な時間を与えた後に争う構造です。",
        pitfall: "却下処分への審査請求と要件を混同しない。",
        terms: ["不作為", "相当期間", "審査請求"],
        trendTag: "過去5年頻出: 行政不服審査法"
      },
      {
        prompt: "【3択】道路など公の施設の管理ミスで損害が出た場合の根拠として適切なのはどれ？",
        choices: [
          "国家賠償法2条",
          "民法90条",
          "行政手続法5条"
        ],
        correctIndex: 0,
        answer: "公の営造物の瑕疵は国家賠償法2条が基本。",
        explanation: "公務員個人の行為責任だけでなく、施設管理の責任も別に問われます。",
        pitfall: "国家賠償法1条と2条の対象を混同しない。",
        terms: ["国家賠償法2条", "営造物", "瑕疵"],
        trendTag: "過去5年頻出: 国家賠償法"
      },
      {
        prompt: "【3択】処分に重大かつ明白な瑕疵があるとして、効力不存在の確認を求める訴訟は？",
        choices: [
          "無効等確認訴訟",
          "取消訴訟",
          "住民訴訟"
        ],
        correctIndex: 0,
        answer: "効力不存在の確認を求めるのは無効等確認訴訟。",
        explanation: "取消訴訟との違いは、争う対象が『取り消し』か『そもそも無効か』かです。",
        pitfall: "取消訴訟と無効等確認訴訟の目的を混同しない。",
        terms: ["無効等確認訴訟", "重大明白", "行政事件訴訟"],
        trendTag: "過去5年頻出: 行政事件訴訟法"
      },
      {
        prompt: "【3択】行政庁が本来すべき処分をしないとき、処分をするよう求める訴訟は？",
        choices: [
          "義務付け訴訟",
          "差止訴訟",
          "当事者訴訟"
        ],
        correctIndex: 0,
        answer: "処分の実施を求めるのは義務付け訴訟。",
        explanation: "『してほしい』を裁判所に求めるタイプの訴訟と整理すると覚えやすいです。",
        pitfall: "差止訴訟（止める）との向きを取り違えない。",
        terms: ["義務付け訴訟", "不作為", "行政事件訴訟"],
        trendTag: "過去5年頻出: 行政事件訴訟法"
      },
      {
        prompt: "【3択】これから行われる違法処分を事前に止めるための訴訟は？",
        choices: [
          "差止訴訟",
          "取消訴訟",
          "再審"
        ],
        correctIndex: 0,
        answer: "将来の違法処分の防止を求めるのは差止訴訟。",
        explanation: "取消訴訟は既にされた処分、差止訴訟はこれからの処分が対象です。",
        pitfall: "時点の違い（すでに処分済みか、これからか）を混同しない。",
        terms: ["差止訴訟", "将来処分", "行政事件訴訟"],
        trendTag: "過去5年頻出: 行政事件訴訟法"
      },
      {
        prompt: "【3択】自治体の違法・不当な財務行為を住民がまず監査委員に申し立てる手続は？",
        choices: [
          "住民監査請求",
          "審査請求",
          "告発"
        ],
        correctIndex: 0,
        answer: "最初の申立ては住民監査請求。",
        explanation: "住民訴訟に進む前段としての位置付けが重要です。",
        pitfall: "一般の行政不服審査と住民監査請求を混同しない。",
        terms: ["住民監査請求", "住民訴訟", "地方自治"],
        trendTag: "過去5年頻出: 地方自治法"
      },
      {
        prompt: "【3択】地方公共団体が地域のルールとして制定する法規はどれ？",
        choices: [
          "条例",
          "省令",
          "判決"
        ],
        correctIndex: 0,
        answer: "地方公共団体が定めるのは条例。",
        explanation: "国の法令（法律・政令・省令）とのレベル差を区別できることが大切です。",
        pitfall: "条例と省令の制定主体を混同しない。",
        terms: ["条例", "地方公共団体", "地方自治"],
        trendTag: "過去5年頻出: 地方自治法"
      },
      {
        prompt: "【3択】聴聞の対象者がとることができる対応として正しいものはどれ？",
        choices: [
          "代理人を選任できる",
          "必ず本人だけが出席しなければならない",
          "意見書の提出は一切できない"
        ],
        correctIndex: 0,
        answer: "聴聞では代理人の選任が可能。",
        explanation: "手続保障の一環として、本人の防御機会を実質化する仕組みです。",
        pitfall: "聴聞と裁判手続の要件を混同しない。",
        terms: ["聴聞", "代理人", "手続保障"],
        trendTag: "過去5年頻出: 行政手続法"
      }
    ]
  };

  const PREDICTION_CHOICE_BANK_BY_TOPIC = {
    admin: [
      {
        prompt: "【3択/2026予想】行政指導に従わないことだけを理由に、直ちに不利益取扱いをすることは？",
        choices: [
          "原則として許されない",
          "必ず許される",
          "常に刑事罰になる"
        ],
        correctIndex: 0,
        answer: "行政指導は任意協力が前提で、不利益取扱いは慎重な判断が必要。",
        explanation: "行政指導と強制処分の境界は、近年も問われやすい基本論点です。",
        pitfall: "『行政が言う=必ず従う義務』と誤解しない。",
        terms: ["行政指導", "任意", "不利益取扱い"],
        trendTag: "2026予想: 行政手続法（行政指導）"
      },
      {
        prompt: "【3択/2026予想】違法処分を争うとき、処分の効力を消すこと自体を主目的とする訴えは？",
        choices: [
          "取消訴訟",
          "義務付け訴訟",
          "差止訴訟"
        ],
        correctIndex: 0,
        answer: "処分の効力を争って消す主軸は取消訴訟。",
        explanation: "取消・義務付け・差止は目的の違いで整理すると失点しにくくなります。",
        pitfall: "将来処分を止める差止訴訟と混同しない。",
        terms: ["取消訴訟", "行政事件訴訟", "訴訟類型"],
        trendTag: "2026予想: 行政事件訴訟（訴訟類型）"
      }
    ],
    civil: [
      {
        prompt: "【3択/2026予想】契約当事者が同時に履行すべき関係で、相手が履行しないときに使う抗弁は？",
        choices: [
          "同時履行の抗弁",
          "時効の抗弁",
          "既判力の抗弁"
        ],
        correctIndex: 0,
        answer: "相手が履行しないなら自分も履行を拒めるのが同時履行の抗弁。",
        explanation: "契約実務で重要な論点で、条文知識を使った判断が求められます。",
        pitfall: "解除と抗弁を同じ効果として覚えない。",
        terms: ["同時履行の抗弁", "双務契約", "履行拒絶"],
        trendTag: "2026予想: 債権（双務契約）"
      },
      {
        prompt: "【3択/2026予想】意思表示に重要な勘違いがあり、法律要件を満たす場合の基本効果は？",
        choices: [
          "取消し得る",
          "必ず有効のまま",
          "当然に刑罰対象"
        ],
        correctIndex: 0,
        answer: "要件を満たす錯誤は取り消し得ると整理するのが基本。",
        explanation: "無効・取消しの区別は民法の頻出テーマです。",
        pitfall: "『最初から無効』と短絡しない。",
        terms: ["錯誤", "取消し", "意思表示"],
        trendTag: "2026予想: 民法総則（意思表示）"
      }
    ],
    const_basic: [
      {
        prompt: "【3択/2026予想】表現内容を事前に審査して発表を禁止する制度に最も近いのは？",
        choices: [
          "検閲",
          "事後的な名誉毀損訴訟",
          "住民監査請求"
        ],
        correctIndex: 0,
        answer: "事前審査で発表を禁じるのは検閲に該当する考え方。",
        explanation: "表現の自由では、事前規制と事後規制の区別が問われやすいです。",
        pitfall: "表現行為後の責任追及と混同しない。",
        terms: ["検閲", "表現の自由", "事前規制"],
        trendTag: "2026予想: 憲法人権（表現の自由）"
      },
      {
        prompt: "【3択/2026予想】法の下の平等に関する判断で重視される基準は？",
        choices: [
          "合理的理由の有無",
          "完全に同一取扱いかのみ",
          "行政の裁量のみ"
        ],
        correctIndex: 0,
        answer: "区別に合理的理由があるかが平等判断の中心。",
        explanation: "平等論点は『区別の根拠』を説明できるかが得点差になります。",
        pitfall: "平等=いつでも全員同じ、と覚えない。",
        terms: ["平等原則", "合理的区別", "審査"],
        trendTag: "2026予想: 憲法人権（平等）"
      }
    ],
    commercial: [
      {
        prompt: "【3択/2026予想】取締役に求められる基本的な注意義務はどれ？",
        choices: [
          "善管注意義務",
          "黙秘義務",
          "無過失責任"
        ],
        correctIndex: 0,
        answer: "取締役には善管注意義務が課される。",
        explanation: "役員責任分野の基本語句は近年も安定して出題対象です。",
        pitfall: "忠実義務と条文上の位置付けを混同しない。",
        terms: ["善管注意義務", "取締役", "会社法"],
        trendTag: "2026予想: 取締役責任"
      },
      {
        prompt: "【3択/2026予想】定款変更などの重要事項で必要になることが多い決議は？",
        choices: [
          "特別決議",
          "普通決議",
          "書面決議のみ"
        ],
        correctIndex: 0,
        answer: "重要事項は特別決議が要求される場面が多い。",
        explanation: "普通決議と特別決議の使い分けは機関法の基本です。",
        pitfall: "決議要件の重さを逆に覚えない。",
        terms: ["特別決議", "株主総会", "定款変更"],
        trendTag: "2026予想: 株主総会（決議要件）"
      }
    ],
    general: [
      {
        prompt: "【3択/2026予想】個人情報漏えいが疑われる場面で、最初に優先すべき対応は？",
        choices: [
          "影響範囲の確認と拡大防止",
          "根拠なくSNSで公表",
          "証拠を全削除"
        ],
        correctIndex: 0,
        answer: "初動は影響範囲の把握と拡大防止が基本。",
        explanation: "情報分野は手順の優先順位を問う問題が増えています。",
        pitfall: "焦って証拠保全を壊さない。",
        terms: ["個人情報", "漏えい対応", "初動"],
        trendTag: "2026予想: 情報分野（初動対応）"
      },
      {
        prompt: "【3択/2026予想】文章理解で時間切れを防ぐ実戦的な手順は？",
        choices: [
          "設問先読み→根拠段落特定→選択肢比較",
          "本文を最初から最後まで反復読み",
          "選択肢だけで推測"
        ],
        correctIndex: 0,
        answer: "設問先読みから根拠探索に入る流れが効率的。",
        explanation: "基礎知識は時間配分の技術で得点が安定します。",
        pitfall: "本文全読みに時間を使い過ぎない。",
        terms: ["文章理解", "設問先読み", "時間配分"],
        trendTag: "2026予想: 文章理解（時短手順）"
      }
    ],
    describe: [
      {
        prompt: "【3択/2026予想】記述で失点を抑える最優先チェックはどれ？",
        choices: [
          "主語・法令名・結論の3点確認",
          "修辞表現の華やかさ",
          "句読点の数だけ調整"
        ],
        correctIndex: 0,
        answer: "採点に直結する主語・法令名・結論を最優先で確認。",
        explanation: "短い字数ほど、要点の欠落がそのまま失点になります。",
        pitfall: "読みやすさだけで見直しを終えない。",
        terms: ["記述式", "主語", "法令名"],
        trendTag: "2026予想: 記述式（失点回避）"
      },
      {
        prompt: "【3択/2026予想】記述の当てはめで最も重要なのはどれ？",
        choices: [
          "事実を要件語に対応させる",
          "感想を先に書く",
          "判例名のみ列挙する"
        ],
        correctIndex: 0,
        answer: "事実を要件語に結びつける作業が当てはめの中心。",
        explanation: "要件だけ、結論だけでは加点されにくく、橋渡しの説明が必要です。",
        pitfall: "条文暗記をそのまま書き写さない。",
        terms: ["当てはめ", "要件事実", "記述答案"],
        trendTag: "2026予想: 記述式（当てはめ）"
      }
    ]
  };

  const ANSWER_DIVERSITY_WINDOW_BY_TOPIC = {
    admin: 10,
    civil: 8,
    const_basic: 8,
    commercial: 8,
    general: 8,
    describe: 8
  };

  const TOPIC_VARIANT_TAG = {
    admin: "行",
    civil: "民",
    const_basic: "憲",
    commercial: "商",
    general: "基",
    describe: "記"
  };

  const FORECAST_INSERT_INTERVAL = 12;

  let mockTimerId = null;
  let clockTimerId = null;
  let lastClockDate = "";
  const bankPickSequenceCache = new Map();
  let globalBankOccurrenceCacheKey = "";
  let globalBankOccurrenceMap = new Map();
  let syncBusy = false;
  let syncRuntimeStatus = "";
  let syncRuntimeError = false;
  let googleSyncBusy = false;
  let googleSyncRuntimeStatus = "";
  let googleSyncRuntimeError = false;
  let firebaseReady = false;
  let firebaseAuth = null;
  let firebaseDb = null;
  let firebaseUser = null;

  let state = loadState();
  let syncConfig = loadSyncConfig();
  syncStateShape();
  initGoogleCloudSync();
  bindEvents();
  renderAll();

  function defaultProgress() {
    return {
      nextQuestion: 1,
      perfectRounds: 0,
      sectionClears: 0,
      mastered: false,
      attempts: 0,
      correct: 0,
      mistakes: 0,
      lastStudied: ""
    };
  }

  function defaultQuestion() {
    return {
      prompt: "",
      choices: [],
      correctIndex: 0,
      answer: "",
      explanation: "",
      pitfall: "",
      terms: [],
      trendTag: ""
    };
  }

  function defaultQuestionStat() {
    return {
      attempts: 0,
      correct: 0,
      wrong: 0,
      lastStudied: ""
    };
  }

  function defaultDrill() {
    return {
      active: false,
      queue: [],
      pointer: 0,
      correctCount: 0,
      wrongCount: 0,
      startedAt: "",
      message: "",
      showExplanation: false,
      selectedChoice: -1,
      pendingResult: null,
      writtenAnswer: "",
      singleMode: false,
      singleTopicId: "",
      singleQuestionNo: 1,
      singleSectionName: ""
    };
  }

  function defaultSinglePractice() {
    return {
      active: false,
      topicId: "",
      questionNo: 1,
      sectionName: "",
      showExplanation: false,
      selectedChoice: -1,
      pendingResult: null,
      message: ""
    };
  }

  function createDrillQueueEntry(topicId, questionNo = 0) {
    return {
      topicId: String(topicId || ""),
      questionNo: Math.max(0, Math.round(Number(questionNo) || 0))
    };
  }

  function defaultMock() {
    return {
      active: false,
      queue: [],
      pointer: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      holdCount: 0,
      startedAt: "",
      endsAt: "",
      message: ""
    };
  }

  function defaultMiniTest() {
    return {
      active: false,
      queue: [],
      pointer: 0,
      correctCount: 0,
      wrongCount: 0,
      holdCount: 0,
      message: ""
    };
  }

  function defaultTrainingCycle() {
    return {
      sectionClearsSinceMiniTest: 0,
      pendingMiniTest: false
    };
  }

  function defaultState() {
    const topics = DEFAULT_TOPICS.map((topic) => ({ ...topic }));
    const progress = {};
    const questionBank = {};
    const questionStats = {};

    for (const topic of topics) {
      progress[topic.id] = defaultProgress();
      questionBank[topic.id] = {};
      questionStats[topic.id] = {};
    }

    return {
      settings: {
        examDate: toISODate(getLikelyExamDate(todayLocal())),
        dailyMinutes: 120,
        targetPerfectRounds: 2,
        todayQuestionOverride: "",
        mockDurationMinutes: 180
      },
      topics,
      progress,
      questionBank,
      questionStats,
      glossary: DEFAULT_GLOSSARY.map((item) => ({ ...item })),
      pitfallHeatmap: {},
      todayPlan: {
        date: "",
        tasks: []
      },
      drill: defaultDrill(),
      singlePractice: defaultSinglePractice(),
      mock: defaultMock(),
      miniTest: defaultMiniTest(),
      trainingCycle: defaultTrainingCycle(),
      primerView: {
        topicId: topics[0].id,
        sectionIndex: 0
      },
      questionEditor: {
        topicId: topics[0].id,
        questionNo: 1,
        message: ""
      },
      ui: {
        activeTab: "home"
      }
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return defaultState();
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : defaultState();
    } catch (_error) {
      return defaultState();
    }
  }

  function defaultSyncConfig() {
    return {
      token: "",
      gistId: "",
      lastRemoteUpdatedAt: "",
      lastLocalPushedAt: "",
      googleLastRemoteUpdatedAt: "",
      googleLastLocalPushedAt: "",
      googleLastPulledAt: ""
    };
  }

  function loadSyncConfig() {
    try {
      const raw = localStorage.getItem(SYNC_CONFIG_KEY);
      if (!raw) {
        return defaultSyncConfig();
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return defaultSyncConfig();
      }
      return {
        token: String(parsed.token || "").trim(),
        gistId: String(parsed.gistId || "").trim(),
        lastRemoteUpdatedAt: String(parsed.lastRemoteUpdatedAt || "").trim(),
        lastLocalPushedAt: String(parsed.lastLocalPushedAt || "").trim(),
        googleLastRemoteUpdatedAt: String(parsed.googleLastRemoteUpdatedAt || "").trim(),
        googleLastLocalPushedAt: String(parsed.googleLastLocalPushedAt || "").trim(),
        googleLastPulledAt: String(parsed.googleLastPulledAt || "").trim()
      };
    } catch (_error) {
      return defaultSyncConfig();
    }
  }

  function saveSyncConfig() {
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(syncConfig));
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function syncStateShape() {
    if (!state || typeof state !== "object") {
      state = defaultState();
      return;
    }

    const fresh = defaultState();

    state.settings = { ...fresh.settings, ...(state.settings || {}) };
    state.topics = Array.isArray(state.topics) && state.topics.length > 0
      ? state.topics
      : fresh.topics;
    state.progress = state.progress && typeof state.progress === "object" ? state.progress : {};
    state.questionBank = state.questionBank && typeof state.questionBank === "object" ? state.questionBank : {};
    state.questionStats = state.questionStats && typeof state.questionStats === "object" ? state.questionStats : {};
    state.glossary = Array.isArray(state.glossary) ? state.glossary : fresh.glossary;
    state.pitfallHeatmap = state.pitfallHeatmap && typeof state.pitfallHeatmap === "object"
      ? state.pitfallHeatmap
      : {};
    state.todayPlan = state.todayPlan && typeof state.todayPlan === "object"
      ? state.todayPlan
      : fresh.todayPlan;
    state.drill = state.drill && typeof state.drill === "object" ? state.drill : defaultDrill();
    state.singlePractice = state.singlePractice && typeof state.singlePractice === "object"
      ? state.singlePractice
      : defaultSinglePractice();
    state.mock = state.mock && typeof state.mock === "object" ? state.mock : defaultMock();
    state.miniTest = state.miniTest && typeof state.miniTest === "object" ? state.miniTest : defaultMiniTest();
    state.trainingCycle = state.trainingCycle && typeof state.trainingCycle === "object"
      ? state.trainingCycle
      : defaultTrainingCycle();
    state.ui = state.ui && typeof state.ui === "object" ? state.ui : { activeTab: "home" };
    state.primerView = state.primerView && typeof state.primerView === "object"
      ? state.primerView
      : fresh.primerView;
    state.questionEditor = state.questionEditor && typeof state.questionEditor === "object"
      ? state.questionEditor
      : fresh.questionEditor;

    state.settings.examDate = isISODate(state.settings.examDate)
      ? state.settings.examDate
      : toISODate(getLikelyExamDate(todayLocal()));
    state.settings.dailyMinutes = clampNumber(state.settings.dailyMinutes, 10, 600, 120);
    state.settings.targetPerfectRounds = clampNumber(state.settings.targetPerfectRounds, 1, 10, 2);
    state.settings.mockDurationMinutes = clampNumber(state.settings.mockDurationMinutes, 60, 240, 180);

    if (state.settings.todayQuestionOverride !== "") {
      const override = Number(state.settings.todayQuestionOverride);
      state.settings.todayQuestionOverride = Number.isFinite(override) && override > 0
        ? String(Math.round(override))
        : "";
    }

    if (!Array.isArray(state.todayPlan.tasks)) {
      state.todayPlan.tasks = [];
    }

    const existingTopicIds = new Set(state.topics.map((topic) => topic.id));
    state.todayPlan.tasks = state.todayPlan.tasks
      .map((task) => {
        const topicId = String((task && task.topicId) || "");
        const count = Math.max(0, Math.round(Number(task && task.count) || 0));
        const progress = state.progress[topicId] || defaultProgress();
        const attemptBaseRaw = Number(task && task.attemptBase);
        const attemptBase = Number.isFinite(attemptBaseRaw)
          ? Math.max(0, Math.round(attemptBaseRaw))
          : Math.max(0, progress.attempts - count);
        return { topicId, count, attemptBase };
      })
      .filter((task) => task.topicId && task.count > 0 && existingTopicIds.has(task.topicId));

    if (!Array.isArray(state.drill.queue)) {
      state.drill.queue = [];
    } else {
      state.drill.queue = state.drill.queue
        .map((item) => {
          if (typeof item === "string") {
            return createDrillQueueEntry(item, 0);
          }
          if (item && typeof item === "object") {
            return createDrillQueueEntry(item.topicId, item.questionNo);
          }
          return null;
        })
        .filter((entry) => entry && existingTopicIds.has(entry.topicId));
    }
    state.drill.showExplanation = Boolean(state.drill.showExplanation);
    state.drill.selectedChoice = Number.isInteger(state.drill.selectedChoice)
      ? state.drill.selectedChoice
      : -1;
    if (state.drill.selectedChoice < -1 || state.drill.selectedChoice > 4) {
      state.drill.selectedChoice = -1;
    }
    if (typeof state.drill.pendingResult !== "boolean") {
      state.drill.pendingResult = null;
    }
    state.drill.writtenAnswer = String(state.drill.writtenAnswer || "");
    state.drill.singleMode = Boolean(state.drill.singleMode);
    state.drill.singleTopicId = String(state.drill.singleTopicId || "");
    state.drill.singleQuestionNo = Math.max(1, Math.round(Number(state.drill.singleQuestionNo) || 1));
    state.drill.singleSectionName = String(state.drill.singleSectionName || "");
    if (state.drill.singleMode) {
      const singleTopic = state.topics.find((topic) => topic.id === state.drill.singleTopicId);
      if (!singleTopic) {
        state.drill.singleMode = false;
        state.drill.singleTopicId = "";
        state.drill.singleQuestionNo = 1;
        state.drill.singleSectionName = "";
      } else {
        state.drill.singleQuestionNo = clampQuestionNo(singleTopic.id, state.drill.singleQuestionNo);
      }
    }

    state.singlePractice.active = Boolean(state.singlePractice.active);
    state.singlePractice.topicId = String(state.singlePractice.topicId || "");
    state.singlePractice.questionNo = Math.max(1, Math.round(Number(state.singlePractice.questionNo) || 1));
    state.singlePractice.sectionName = String(state.singlePractice.sectionName || "");
    state.singlePractice.showExplanation = Boolean(state.singlePractice.showExplanation);
    state.singlePractice.selectedChoice = Number.isInteger(state.singlePractice.selectedChoice)
      ? state.singlePractice.selectedChoice
      : -1;
    if (state.singlePractice.selectedChoice < -1 || state.singlePractice.selectedChoice > 2) {
      state.singlePractice.selectedChoice = -1;
    }
    if (typeof state.singlePractice.pendingResult !== "boolean") {
      state.singlePractice.pendingResult = null;
    }
    state.singlePractice.message = String(state.singlePractice.message || "");
    if (state.singlePractice.active) {
      const singleTopic = state.topics.find((topic) => topic.id === state.singlePractice.topicId);
      if (!singleTopic) {
        state.singlePractice = defaultSinglePractice();
      } else {
        state.singlePractice.questionNo = clampQuestionNo(singleTopic.id, state.singlePractice.questionNo);
      }
    }

    if (!Array.isArray(state.mock.queue)) {
      state.mock.queue = [];
    }

    state.mock.pointer = Math.max(0, Math.round(Number(state.mock.pointer) || 0));
    state.mock.score = Math.max(0, Math.round(Number(state.mock.score) || 0));
    state.mock.correctCount = Math.max(0, Math.round(Number(state.mock.correctCount) || 0));
    state.mock.wrongCount = Math.max(0, Math.round(Number(state.mock.wrongCount) || 0));
    state.mock.holdCount = Math.max(0, Math.round(Number(state.mock.holdCount) || 0));

    if (!Array.isArray(state.miniTest.queue)) {
      state.miniTest.queue = [];
    }
    state.miniTest.pointer = Math.max(0, Math.round(Number(state.miniTest.pointer) || 0));
    state.miniTest.correctCount = Math.max(0, Math.round(Number(state.miniTest.correctCount) || 0));
    state.miniTest.wrongCount = Math.max(0, Math.round(Number(state.miniTest.wrongCount) || 0));
    state.miniTest.holdCount = Math.max(0, Math.round(Number(state.miniTest.holdCount) || 0));

    state.trainingCycle.sectionClearsSinceMiniTest = Math.max(
      0,
      Math.round(Number(state.trainingCycle.sectionClearsSinceMiniTest) || 0)
    );
    state.trainingCycle.pendingMiniTest = Boolean(state.trainingCycle.pendingMiniTest);
    state.ui.activeTab = normalizeFocusTab(state.ui.activeTab);

    for (const topic of state.topics) {
      if (!state.progress[topic.id]) {
        state.progress[topic.id] = defaultProgress();
      }
      state.progress[topic.id] = normalizeProgress(topic, state.progress[topic.id]);

      if (!state.questionBank[topic.id] || typeof state.questionBank[topic.id] !== "object") {
        state.questionBank[topic.id] = {};
      }
      if (!state.questionStats[topic.id] || typeof state.questionStats[topic.id] !== "object") {
        state.questionStats[topic.id] = {};
      }

      normalizeQuestionBankForTopic(topic);
      normalizeQuestionStatsForTopic(topic);
    }

    for (const topicId of Object.keys(state.progress)) {
      if (!existingTopicIds.has(topicId)) {
        delete state.progress[topicId];
      }
    }

    for (const topicId of Object.keys(state.questionBank)) {
      if (!existingTopicIds.has(topicId)) {
        delete state.questionBank[topicId];
      }
    }

    for (const topicId of Object.keys(state.questionStats)) {
      if (!existingTopicIds.has(topicId)) {
        delete state.questionStats[topicId];
      }
    }

    state.primerView.topicId = String(state.primerView.topicId || "");
    state.primerView.sectionIndex = Math.max(0, Math.round(Number(state.primerView.sectionIndex) || 0));
    if (!existingTopicIds.has(state.primerView.topicId)) {
      state.primerView.topicId = state.topics[0].id;
      state.primerView.sectionIndex = 0;
    }
    const primerTopic = state.topics.find((topic) => topic.id === state.primerView.topicId);
    if (primerTopic) {
      const maxSectionIndex = Math.max(0, getTopicSections(primerTopic).length - 1);
      if (state.primerView.sectionIndex > maxSectionIndex) {
        state.primerView.sectionIndex = maxSectionIndex;
      }
    }

    state.glossary = state.glossary
      .map((entry) => normalizeGlossaryEntry(entry))
      .filter((entry) => entry.term);

    for (const key of Object.keys(state.pitfallHeatmap)) {
      if (!/^.+:\d+$/.test(key)) {
        delete state.pitfallHeatmap[key];
        continue;
      }
      const count = Math.max(0, Math.round(Number(state.pitfallHeatmap[key]) || 0));
      if (count <= 0) {
        delete state.pitfallHeatmap[key];
      } else {
        state.pitfallHeatmap[key] = count;
      }
    }

    if (!existingTopicIds.has(state.questionEditor.topicId)) {
      state.questionEditor.topicId = state.topics[0].id;
    }
    state.questionEditor.questionNo = clampQuestionNo(state.questionEditor.topicId, state.questionEditor.questionNo);
    state.questionEditor.message = String(state.questionEditor.message || "");

    if (state.mock.active && state.mock.endsAt) {
      const remaining = secondsUntil(state.mock.endsAt);
      if (remaining <= 0) {
        state.mock = {
          ...defaultMock(),
          message: "前回の模試は時間切れで終了しました。"
        };
      }
    }

    saveState();
  }

  function normalizeProgress(topic, progress) {
    const safe = { ...defaultProgress(), ...(progress || {}) };
    const sections = getTopicSections(topic);
    const totalSections = Math.max(1, sections.length);

    safe.nextQuestion = clampNumber(safe.nextQuestion, 1, topic.total, 1);
    safe.perfectRounds = Math.max(0, Math.round(Number(safe.perfectRounds) || 0));
    safe.sectionClears = Math.max(0, Math.round(Number(safe.sectionClears) || 0));
    safe.attempts = Math.max(0, Math.round(Number(safe.attempts) || 0));
    safe.correct = Math.max(0, Math.round(Number(safe.correct) || 0));
    safe.mistakes = Math.max(0, Math.round(Number(safe.mistakes) || 0));

    if (safe.correct > safe.attempts) {
      safe.correct = safe.attempts;
    }

    if (safe.mastered && safe.sectionClears === 0) {
      safe.sectionClears = totalSections;
    }

    if (safe.sectionClears > totalSections) {
      safe.sectionClears = totalSections;
    }

    safe.mastered = safe.sectionClears >= totalSections;
    if (safe.mastered) {
      safe.nextQuestion = topic.total;
      safe.perfectRounds = state.settings.targetPerfectRounds;
    } else if (safe.perfectRounds >= state.settings.targetPerfectRounds) {
      safe.perfectRounds = 0;
    }

    return safe;
  }

  function normalizeQuestionBankForTopic(topic) {
    const bank = state.questionBank[topic.id];
    for (const key of Object.keys(bank)) {
      const questionNo = Number(key);
      if (!Number.isInteger(questionNo) || questionNo < 1 || questionNo > topic.total) {
        delete bank[key];
        continue;
      }
      bank[key] = normalizeQuestion(bank[key]);
    }
  }

  function normalizeQuestionStatsForTopic(topic) {
    const stats = state.questionStats[topic.id];
    for (const key of Object.keys(stats)) {
      const questionNo = Number(key);
      if (!Number.isInteger(questionNo) || questionNo < 1 || questionNo > topic.total) {
        delete stats[key];
        continue;
      }
      stats[key] = normalizeQuestionStat(stats[key]);
    }
  }

  function normalizeQuestionStat(stat) {
    const safe = { ...defaultQuestionStat(), ...(stat || {}) };
    safe.attempts = Math.max(0, Math.round(Number(safe.attempts) || 0));
    safe.correct = Math.max(0, Math.round(Number(safe.correct) || 0));
    safe.wrong = Math.max(0, Math.round(Number(safe.wrong) || 0));
    if (safe.correct > safe.attempts) {
      safe.correct = safe.attempts;
    }
    if (safe.wrong > safe.attempts) {
      safe.wrong = safe.attempts;
    }
    safe.lastStudied = String(safe.lastStudied || "");
    return safe;
  }

  function normalizeQuestion(question) {
    const safe = { ...defaultQuestion(), ...(question || {}) };
    safe.prompt = String(safe.prompt || "").trim();
    safe.answer = String(safe.answer || "").trim();
    safe.explanation = String(safe.explanation || "").trim();
    safe.pitfall = String(safe.pitfall || "").trim();
    safe.trendTag = String(safe.trendTag || "").trim();

    if (!Array.isArray(safe.choices)) {
      safe.choices = [];
    }
    safe.choices = safe.choices
      .map((choice) => String(choice || "").trim())
      .filter(Boolean)
      .slice(0, 3);

    const parsedCorrectIndex = Number(safe.correctIndex);
    safe.correctIndex = Number.isInteger(parsedCorrectIndex)
      ? parsedCorrectIndex
      : 0;
    if (safe.correctIndex < 0 || safe.correctIndex > 2) {
      safe.correctIndex = 0;
    }

    if (!Array.isArray(safe.terms)) {
      safe.terms = parseTerms(String(safe.terms || ""));
    }
    safe.terms = safe.terms
      .map((term) => String(term).trim())
      .filter(Boolean)
      .slice(0, 10);

    return safe;
  }

  function normalizeGlossaryEntry(entry) {
    const safe = {
      term: String((entry && entry.term) || "").trim(),
      definition: String((entry && entry.definition) || "").trim(),
      pitfall: String((entry && entry.pitfall) || "").trim()
    };

    return safe;
  }

  function getQuestionStat(topicId, questionNo) {
    const topicStats = state.questionStats[topicId];
    if (!topicStats || typeof topicStats !== "object") {
      return defaultQuestionStat();
    }
    const key = String(Math.max(1, Math.round(Number(questionNo) || 1)));
    const stat = topicStats[key];
    if (!stat) {
      return defaultQuestionStat();
    }
    return normalizeQuestionStat(stat);
  }

  function recordQuestionResult(topicId, questionNo, isCorrect) {
    const topic = state.topics.find((entry) => entry.id === topicId);
    if (!topic) {
      return;
    }
    if (!state.questionStats[topicId] || typeof state.questionStats[topicId] !== "object") {
      state.questionStats[topicId] = {};
    }
    const safeNo = clampQuestionNo(topicId, questionNo);
    const key = String(safeNo);
    const current = normalizeQuestionStat(state.questionStats[topicId][key]);
    current.attempts += 1;
    if (isCorrect) {
      current.correct += 1;
    } else {
      current.wrong += 1;
    }
    current.lastStudied = todayISO();
    state.questionStats[topicId][key] = current;
  }

  function resetTopicProgress(topicId) {
    const topic = state.topics.find((entry) => entry.id === topicId);
    if (!topic) {
      return;
    }
    state.progress[topicId] = defaultProgress();
    state.questionStats[topicId] = {};
    state.todayPlan = { date: "", tasks: [] };
    state.trainingCycle.pendingMiniTest = false;
    state.trainingCycle.sectionClearsSinceMiniTest = 0;
    if (state.singlePractice.active && state.singlePractice.topicId === topicId) {
      state.singlePractice = defaultSinglePractice();
    }
  }

  function resetSectionProgress(topicId, sectionIndex) {
    const topic = state.topics.find((entry) => entry.id === topicId);
    if (!topic) {
      return;
    }
    const sections = getTopicSections(topic);
    const safeIndex = Math.max(0, Math.min(sections.length - 1, Math.round(Number(sectionIndex) || 0)));
    const section = sections[safeIndex];
    if (!section) {
      return;
    }
    const progress = state.progress[topicId] || defaultProgress();
    progress.sectionClears = Math.min(progress.sectionClears, safeIndex);
    progress.perfectRounds = 0;
    progress.mastered = false;
    progress.nextQuestion = section.start;
    state.progress[topicId] = normalizeProgress(topic, progress);

    if (!state.questionStats[topicId] || typeof state.questionStats[topicId] !== "object") {
      state.questionStats[topicId] = {};
    }
    const stats = state.questionStats[topicId];
    for (let questionNo = section.start; questionNo <= section.end; questionNo += 1) {
      delete stats[String(questionNo)];
    }

    state.todayPlan = { date: "", tasks: [] };
    state.trainingCycle.pendingMiniTest = false;
    state.trainingCycle.sectionClearsSinceMiniTest = 0;
  }

  function bindEvents() {
    byId("focusTabBar").addEventListener("click", onFocusTabClick);
    byId("homeNavGrid").addEventListener("click", onHomeNavClick);
    byId("saveExamDateBtn").addEventListener("click", onSaveExamDate);
    byId("saveSettingsBtn").addEventListener("click", onSaveSettings);
    byId("googleSignInBtn").addEventListener("click", onGoogleSignIn);
    byId("googleSignOutBtn").addEventListener("click", onGoogleSignOut);
    byId("googleSyncPushBtn").addEventListener("click", onGoogleSyncPush);
    byId("googleSyncPullBtn").addEventListener("click", onGoogleSyncPull);
    byId("addTopicBtn").addEventListener("click", onAddTopic);
    byId("problemMenuList").addEventListener("click", onProblemMenuListClick);
    byId("generatePlanBtn").addEventListener("click", () => {
      generateTodayPlan(true);
      renderAll();
    });
    byId("todayPreviewList").addEventListener("click", onTodayPreviewClick);
    byId("primerTopicSelect").addEventListener("change", onPrimerTopicChange);
    byId("primerSectionSelect").addEventListener("change", onPrimerSectionChange);
    byId("primerPrevSectionBtn").addEventListener("click", onPrimerPrevSection);
    byId("primerNextSectionBtn").addEventListener("click", onPrimerNextSection);
    byId("startDrillBtn").addEventListener("click", onStartDrill);
    byId("drillStartFromTabBtn").addEventListener("click", onStartDrill);
    byId("drillPrevBtn").addEventListener("click", onDrillPrevQuestion);
    byId("drillNavNextBtn").addEventListener("click", onDrillNavNextQuestion);
    byId("drillChoicesWrap").addEventListener("click", onDrillChoiceClick);
    byId("drillWrittenSubmitBtn").addEventListener("click", onDrillWrittenSubmit);
    byId("applyReviewResultBtn").addEventListener("click", onApplyReviewResult);
    byId("skipBtn").addEventListener("click", onSkipDrillQuestion);
    byId("editCurrentQuestionBtn").addEventListener("click", onEditCurrentQuestion);
    byId("drillResetSectionBtn").addEventListener("click", onDrillResetSectionProgress);
    byId("drillResetTopicBtn").addEventListener("click", onDrillResetTopicProgress);

    byId("singlePrevBtn").addEventListener("click", onSinglePrevQuestion);
    byId("singleNextBtn").addEventListener("click", onSingleNextQuestion);
    byId("singleChoicesWrap").addEventListener("click", onSingleChoiceClick);
    byId("singleApplyBtn").addEventListener("click", onSingleApplyResult);
    byId("singleResetSectionBtn").addEventListener("click", onSingleResetSectionProgress);
    byId("singleResetTopicBtn").addEventListener("click", onSingleResetTopicProgress);
    byId("singleCloseBtn").addEventListener("click", onSingleClose);

    byId("topicsTableWrap").addEventListener("click", onTopicsTableClick);
    byId("topicsTableWrap").addEventListener("change", onTopicsTableChange);

    byId("loadQuestionBtn").addEventListener("click", onLoadQuestionEditor);
    byId("saveQuestionBtn").addEventListener("click", onSaveQuestionEditor);

    byId("startMockBtn").addEventListener("click", onStartMockExam);
    byId("finishMockBtn").addEventListener("click", () => finishMockExam("模試を手動終了しました。"));
    byId("mockChoicesWrap").addEventListener("click", onMockChoiceClick);
    byId("mockSkipBtn").addEventListener("click", () => handleMockAnswer("hold"));

    byId("startMiniTestBtn").addEventListener("click", onStartMiniTest);
    byId("finishMiniTestBtn").addEventListener("click", onFinishMiniTest);
    byId("miniTestChoicesWrap").addEventListener("click", onMiniTestChoiceClick);

    byId("glossarySearchInput").addEventListener("input", renderGlossary);
    byId("addTermBtn").addEventListener("click", onAddTerm);
    byId("glossaryTableWrap").addEventListener("click", onGlossaryTableClick);
  }

  function onHomeNavClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest("button[data-target]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    const cardId = button.dataset.target;
    if (!cardId) {
      return;
    }
    const card = document.getElementById(cardId);
    if (!card) {
      return;
    }
    const tabKey = FOCUS_TAB_BY_CARD[cardId];
    if (tabKey) {
      setFocusTab(tabKey, { save: true, scroll: false });
    }
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onFocusTabClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const button = target.closest("button[data-tab]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    const tabKey = normalizeFocusTab(button.dataset.tab);
    setFocusTab(tabKey, { save: false, scroll: true });
  }

  function normalizeFocusTab(tabKey) {
    const picked = String(tabKey || "home");
    if (FOCUS_TABS.includes(picked)) {
      return picked;
    }
    return "home";
  }

  function getFocusTabCards(tabKey) {
    const safeTab = normalizeFocusTab(tabKey);
    const targets = FOCUS_TAB_TARGETS[safeTab];
    return Array.isArray(targets) && targets.length > 0 ? targets : FOCUS_TAB_TARGETS.home;
  }

  function setFocusTab(tabKey, options = {}) {
    const safeTab = normalizeFocusTab(tabKey);
    state.ui.activeTab = safeTab;
    if (options.save !== false) {
      saveState();
    }
    applyFocusTabLayout(Boolean(options.scroll));
  }

  function applyFocusTabLayout(shouldScroll) {
    const safeTab = normalizeFocusTab(state.ui.activeTab);
    const showAll = safeTab === "home";
    const expandedIds = new Set(getFocusTabCards(safeTab));
    const cards = document.querySelectorAll(".grid .card");
    for (const card of cards) {
      if (!(card instanceof HTMLElement)) {
        continue;
      }
      if (showAll) {
        card.classList.remove("isFocused");
        card.classList.remove("isCompact");
        card.classList.remove("tabHidden");
        continue;
      }
      const isFocused = expandedIds.has(card.id);
      card.classList.toggle("isFocused", isFocused);
      card.classList.toggle("tabHidden", !isFocused);
      card.classList.remove("isCompact");
    }

    const tabButtons = document.querySelectorAll(".focusTabBtn");
    for (const button of tabButtons) {
      if (!(button instanceof HTMLButtonElement)) {
        continue;
      }
      const isActive = normalizeFocusTab(button.dataset.tab) === safeTab;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    }

    document.body.dataset.focusTab = safeTab;

    if (!shouldScroll) {
      return;
    }
    const firstCardId = getFocusTabCards(safeTab)[0];
    const targetCard = firstCardId ? document.getElementById(firstCardId) : null;
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onSaveExamDate() {
    const value = byId("examDateInput").value;
    if (!isISODate(value)) {
      alert("本番日はYYYY-MM-DD形式で入力してください。");
      return;
    }

    state.settings.examDate = value;
    state.todayPlan = { date: "", tasks: [] };
    state.drill = { ...defaultDrill(), message: state.drill.message };

    saveState();
    renderAll();
  }

  function onSaveSettings() {
    const dailyMinutes = clampNumber(byId("dailyMinutesInput").value, 10, 600, 120);
    const targetPerfectRounds = clampNumber(byId("targetPerfectRoundsInput").value, 1, 10, 2);
    const overrideRaw = byId("todayQuestionOverrideInput").value.trim();

    state.settings.dailyMinutes = dailyMinutes;
    state.settings.targetPerfectRounds = targetPerfectRounds;
    state.settings.todayQuestionOverride = "";

    if (overrideRaw !== "") {
      const override = Number(overrideRaw);
      if (Number.isFinite(override) && override > 0) {
        state.settings.todayQuestionOverride = String(Math.round(override));
      }
    }

    for (const topic of state.topics) {
      state.progress[topic.id] = normalizeProgress(topic, state.progress[topic.id]);
    }

    state.todayPlan = { date: "", tasks: [] };

    saveState();
    renderAll();
  }

  async function initGoogleCloudSync() {
    const sdk = window.firebase;
    if (!sdk || typeof sdk.initializeApp !== "function") {
      setGoogleSyncStatus("同期状態: Firebase SDKの読み込みに失敗しました。", true);
      return;
    }

    try {
      const firebaseWebConfig = await loadFirebaseWebConfig();
      if (!sdk.apps || sdk.apps.length === 0) {
        sdk.initializeApp(firebaseWebConfig);
      }
      firebaseAuth = sdk.auth();
      firebaseDb = sdk.firestore();
      firebaseReady = true;
      setGoogleSyncStatus("同期状態: Firebase接続OK。Googleログイン待ちです。");

      firebaseAuth.onAuthStateChanged((user) => {
        firebaseUser = user || null;
        if (firebaseUser) {
          setGoogleSyncStatus(`同期状態: ログイン中（${firebaseUser.email || firebaseUser.uid}）`);
        } else if (!googleSyncRuntimeError) {
          setGoogleSyncStatus("同期状態: 未ログイン");
        }
        renderSettings();
        renderHome();
      });

      firebaseAuth.getRedirectResult()
        .then(() => {
          renderSettings();
          renderHome();
        })
        .catch((error) => {
          setGoogleSyncStatus(`同期状態: ログイン失敗 (${formatGoogleAuthError(error)})`, true);
          renderSettings();
          renderHome();
        });
    } catch (error) {
      firebaseReady = false;
      firebaseAuth = null;
      firebaseDb = null;
      setGoogleSyncStatus(`同期状態: Firebase初期化失敗 (${formatGoogleAuthError(error)})`, true);
    }
  }

  async function loadFirebaseWebConfig() {
    let config;
    try {
      config = await fetchFirebaseConfigFromNetlify();
    } catch (_error) {
      config = await fetchFirebaseConfigFromHosting();
    }
    const hasRequired = config
      && typeof config === "object"
      && String(config.apiKey || "").trim()
      && String(config.appId || "").trim()
      && String(config.projectId || "").trim()
      && String(config.authDomain || "").trim();
    if (!hasRequired) {
      throw new Error("Firebase設定が不正です。");
    }
    return config;
  }

  async function fetchFirebaseConfigFromNetlify() {
    const response = await fetch(NETLIFY_FIREBASE_CONFIG_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Netlify設定取得失敗: ${response.status}`);
    }
    return await response.json();
  }

  async function fetchFirebaseConfigFromHosting() {
    const response = await fetch(FIREBASE_INIT_CONFIG_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Firebase設定取得失敗: ${response.status}`);
    }
    return await response.json();
  }

  async function onGoogleSignIn() {
    if (!firebaseReady || !firebaseAuth) {
      alert("Firebase同期の初期化に失敗しています。再読み込みしてください。");
      return;
    }
    if (googleSyncBusy) {
      return;
    }

    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    setGoogleSyncBusy(true);
    setGoogleSyncStatus("同期状態: Googleログインを開始します...");
    try {
      await firebaseAuth.signInWithPopup(provider);
      setGoogleSyncStatus("同期状態: Googleログインに成功しました。");
    } catch (error) {
      const code = String(error && error.code || "");
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        setGoogleSyncStatus("同期状態: リダイレクト方式でログインします...");
        await firebaseAuth.signInWithRedirect(provider);
        return;
      }
      setGoogleSyncStatus(`同期状態: ログイン失敗 (${formatGoogleAuthError(error)})`, true);
    } finally {
      setGoogleSyncBusy(false);
      renderSettings();
      renderHome();
    }
  }

  async function onGoogleSignOut() {
    if (!firebaseAuth) {
      return;
    }
    if (googleSyncBusy) {
      return;
    }
    setGoogleSyncBusy(true);
    try {
      await firebaseAuth.signOut();
      setGoogleSyncStatus("同期状態: ログアウトしました。");
    } catch (error) {
      setGoogleSyncStatus(`同期状態: ログアウト失敗 (${formatGoogleAuthError(error)})`, true);
    } finally {
      setGoogleSyncBusy(false);
      renderSettings();
      renderHome();
    }
  }

  async function onGoogleSyncPush() {
    if (googleSyncBusy) {
      return;
    }
    if (!firebaseReady || !firebaseDb || !firebaseUser) {
      alert("先にGoogleログインしてください。");
      return;
    }

    setGoogleSyncBusy(true);
    setGoogleSyncStatus("同期状態: クラウドへアップロード中...");
    try {
      const now = new Date().toISOString();
      const payload = {
        ...buildSyncPayload(),
        provider: "firebase-google",
        updatedAt: now,
        updatedBy: {
          uid: firebaseUser.uid,
          email: firebaseUser.email || ""
        }
      };
      await getFirebaseSyncDocRef().set(payload, { merge: false });
      syncConfig.googleLastLocalPushedAt = now;
      syncConfig.googleLastRemoteUpdatedAt = now;
      saveSyncConfig();
      setGoogleSyncStatus("同期状態: クラウドへ同期しました。");
    } catch (error) {
      setGoogleSyncStatus(`同期状態: アップロード失敗 (${formatGoogleAuthError(error)})`, true);
    } finally {
      setGoogleSyncBusy(false);
      renderSettings();
      renderHome();
    }
  }

  async function onGoogleSyncPull() {
    if (googleSyncBusy) {
      return;
    }
    if (!firebaseReady || !firebaseDb || !firebaseUser) {
      alert("先にGoogleログインしてください。");
      return;
    }
    if (!confirm("クラウドの進捗でこの端末を上書きします。実行しますか？")) {
      return;
    }

    setGoogleSyncBusy(true);
    setGoogleSyncStatus("同期状態: クラウドから読み込み中...");
    try {
      const snapshot = await getFirebaseSyncDocRef().get();
      if (!snapshot.exists) {
        setGoogleSyncStatus("同期状態: クラウドデータがまだありません。先にアップロードしてください。");
        return;
      }
      const remote = snapshot.data() || {};
      const remoteState = remote && typeof remote === "object" ? remote.state : null;
      if (!remoteState || typeof remoteState !== "object") {
        throw new Error("同期データの形式が不正です。");
      }

      state = remoteState;
      syncStateShape();
      saveState();

      const remoteUpdated = String(remote.updatedAt || remote.savedAt || new Date().toISOString());
      syncConfig.googleLastRemoteUpdatedAt = remoteUpdated;
      syncConfig.googleLastPulledAt = new Date().toISOString();
      saveSyncConfig();
      setGoogleSyncStatus("同期状態: クラウドから同期しました。");
      renderAll();
    } catch (error) {
      setGoogleSyncStatus(`同期状態: ダウンロード失敗 (${formatGoogleAuthError(error)})`, true);
    } finally {
      setGoogleSyncBusy(false);
      renderSettings();
      renderHome();
    }
  }

  function getFirebaseSyncDocRef() {
    if (!firebaseDb || !firebaseUser) {
      throw new Error("Googleログインが必要です。");
    }
    return firebaseDb
      .collection("users")
      .doc(String(firebaseUser.uid))
      .collection(FIREBASE_SYNC_COLLECTION)
      .doc(FIREBASE_SYNC_DOC_ID);
  }

  function setGoogleSyncBusy(value) {
    googleSyncBusy = Boolean(value);
    const isLoggedIn = Boolean(firebaseUser && firebaseUser.uid);
    byId("googleSignInBtn").disabled = googleSyncBusy || !firebaseReady || isLoggedIn;
    byId("googleSignOutBtn").disabled = googleSyncBusy || !isLoggedIn;
    byId("googleSyncPushBtn").disabled = googleSyncBusy || !isLoggedIn;
    byId("googleSyncPullBtn").disabled = googleSyncBusy || !isLoggedIn;
  }

  function setGoogleSyncStatus(message, isError = false) {
    googleSyncRuntimeStatus = String(message || "");
    googleSyncRuntimeError = Boolean(isError);
    const statusEl = byId("googleSyncStatusLine");
    statusEl.textContent = googleSyncRuntimeStatus;
    statusEl.classList.toggle("isError", googleSyncRuntimeError);
  }

  function formatGoogleAuthError(error) {
    const code = String(error && error.code || "");
    if (code === "auth/configuration-not-found") {
      return "[configuration-not-found] Firebase AuthのGoogleプロバイダとサポートメール設定を確認してください。";
    }
    if (code === "auth/unauthorized-domain") {
      return "[unauthorized-domain] このURLがauthorized domainsに未登録です。";
    }
    if (code === "auth/popup-blocked") {
      return "[popup-blocked] ポップアップがブロックされました。";
    }
    if (code === "auth/cancelled-popup-request" || code === "auth/popup-closed-by-user") {
      return "[popup-cancelled] ログイン画面が閉じられました。";
    }
    if (code === "auth/network-request-failed") {
      return "[network-request-failed] 通信または初期化情報を確認してください。";
    }
    return formatSyncError(error);
  }

  function buildSyncPayload() {
    return {
      schemaVersion: SYNC_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      app: "gyoseiExamCoach",
      state
    };
  }

  function formatSyncError(error) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error || "不明なエラー");
  }

  function formatSyncTimestamp(value) {
    const ts = Date.parse(String(value || ""));
    if (Number.isNaN(ts)) {
      return "-";
    }
    const date = new Date(ts);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${d} ${hh}:${mm}`;
  }

  function onAddTopic() {
    const name = byId("newTopicName").value.trim();
    const total = Number(byId("newTopicCount").value);

    if (!name) {
      alert("セット名を入力してください。");
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      alert("問題数は1以上の整数で入力してください。");
      return;
    }

    const topic = {
      id: `topic_${Date.now()}`,
      name,
      total: Math.round(total),
      weight: 1.0,
      category: "minor"
    };

    state.topics.push(topic);
    state.progress[topic.id] = defaultProgress();
    state.questionBank[topic.id] = {};
    state.questionStats[topic.id] = {};

    byId("newTopicName").value = "";
    byId("newTopicCount").value = "";

    state.todayPlan = { date: "", tasks: [] };
    state.questionEditor.topicId = topic.id;
    state.questionEditor.questionNo = 1;
    state.questionEditor.message = "";

    saveState();
    renderAll();
  }

  function onTopicsTableClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const topicId = target.dataset.topicId;
    if (!topicId) {
      return;
    }

    if (target.dataset.action === "delete") {
      if (state.topics.length <= 1) {
        alert("最低1セットは必要です。");
        return;
      }

      state.topics = state.topics.filter((topic) => topic.id !== topicId);
      delete state.progress[topicId];
      delete state.questionBank[topicId];
      delete state.questionStats[topicId];

      for (const key of Object.keys(state.pitfallHeatmap)) {
        if (key.startsWith(`${topicId}:`)) {
          delete state.pitfallHeatmap[key];
        }
      }

      if (state.drill.active) {
        state.drill = { ...defaultDrill(), message: "問題セット変更のためドリルを終了しました。" };
      }
      if (state.mock.active) {
        finishMockExam("問題セット変更のため模試を終了しました。");
      }
      if (state.miniTest.active) {
        finishMiniTest("問題セット変更のため小テストを終了しました。");
      }
      if (state.singlePractice.active && state.singlePractice.topicId === topicId) {
        state.singlePractice = defaultSinglePractice();
      }

      state.todayPlan = { date: "", tasks: [] };

      if (state.questionEditor.topicId === topicId) {
        state.questionEditor.topicId = state.topics[0].id;
        state.questionEditor.questionNo = 1;
      }

      saveState();
      renderAll();
      return;
    }

    if (target.dataset.action === "reset") {
      resetTopicProgress(topicId);
      saveState();
      renderAll();
    }
  }

  function onTopicsTableChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const topicId = target.dataset.topicId;
    if (!topicId) {
      return;
    }

    const topic = state.topics.find((item) => item.id === topicId);
    if (!topic) {
      return;
    }

    if (target.dataset.field === "total") {
      const value = Number(target.value);
      if (!Number.isFinite(value) || value <= 0) {
        target.value = String(topic.total);
        return;
      }

      topic.total = Math.round(value);
      state.progress[topicId] = normalizeProgress(topic, state.progress[topicId]);
      normalizeQuestionBankForTopic(topic);
      normalizeQuestionStatsForTopic(topic);

      state.todayPlan = { date: "", tasks: [] };

      if (state.questionEditor.topicId === topicId) {
        state.questionEditor.questionNo = clampQuestionNo(topicId, state.questionEditor.questionNo);
      }
      if (state.singlePractice.active && state.singlePractice.topicId === topicId) {
        state.singlePractice.questionNo = clampQuestionNo(topicId, state.singlePractice.questionNo);
      }

      saveState();
      renderAll();
    }

    if (target.dataset.field === "name") {
      const value = target.value.trim();
      if (!value) {
        target.value = topic.name;
        return;
      }
      topic.name = value;
      saveState();
      renderAll();
    }
  }

  function onProblemMenuListClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest("button[data-action]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const action = button.dataset.action;
    const topicId = String(button.dataset.topicId || "");
    if (action === "single") {
      const questionNo = Number(button.dataset.questionNo);
      const sectionName = String(button.dataset.sectionName || "");
      if (!topicId || !Number.isInteger(questionNo)) {
        return;
      }
      startSingleQuestionPractice(topicId, questionNo, sectionName);
      return;
    }

    if (action === "reset-section") {
      const sectionIndex = Math.max(0, Math.round(Number(button.dataset.sectionIndex) || 0));
      if (!topicId) {
        return;
      }
      if (!confirm("このセクションの進捗をリセットします。よろしいですか？")) {
        return;
      }
      resetSectionProgress(topicId, sectionIndex);
      saveState();
      renderAll();
    }
  }

  function startSingleQuestionPractice(topicId, questionNo, sectionName) {
    const topic = state.topics.find((item) => item.id === topicId);
    if (!topic) {
      return;
    }
    if (state.mock.active) {
      alert("模試が進行中です。先に模試を終了してください。");
      return;
    }
    if (state.miniTest.active) {
      alert("小テストが進行中です。先に小テストを終了してください。");
      return;
    }

    const safeQuestionNo = clampQuestionNo(topic.id, questionNo);
    state.singlePractice = {
      ...defaultSinglePractice(),
      active: true,
      topicId: topic.id,
      questionNo: safeQuestionNo,
      sectionName: sectionName || "",
      message: `${topic.name} Q${safeQuestionNo} の個別演習を開始しました。`
    };

    saveState();
    renderSinglePractice();
    byId("singleQuestionCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onTodayPreviewClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest("button[data-action]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    if (button.dataset.action !== "open-primer") {
      return;
    }

    const topicId = String(button.dataset.topicId || "");
    const sectionIndex = Math.max(0, Math.round(Number(button.dataset.sectionIndex) || 0));
    const topic = state.topics.find((item) => item.id === topicId);
    if (!topic) {
      return;
    }

    state.primerView.topicId = topic.id;
    state.primerView.sectionIndex = Math.min(sectionIndex, Math.max(0, getTopicSections(topic).length - 1));
    saveState();
    renderPrimerBook();
    byId("primerBookCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onPrimerTopicChange() {
    const topicId = byId("primerTopicSelect").value;
    const topic = state.topics.find((item) => item.id === topicId);
    if (!topic) {
      return;
    }
    const progress = state.progress[topic.id] || defaultProgress();
    const section = getCurrentSection(topic, progress.nextQuestion);
    state.primerView.topicId = topic.id;
    state.primerView.sectionIndex = section.index;
    saveState();
    renderPrimerBook();
  }

  function onPrimerSectionChange() {
    const topic = state.topics.find((item) => item.id === state.primerView.topicId);
    if (!topic) {
      return;
    }
    const pickedIndex = Math.max(0, Math.round(Number(byId("primerSectionSelect").value) || 0));
    state.primerView.sectionIndex = Math.min(pickedIndex, Math.max(0, getTopicSections(topic).length - 1));
    saveState();
    renderPrimerBook();
  }

  function onPrimerPrevSection() {
    const topic = state.topics.find((item) => item.id === state.primerView.topicId);
    if (!topic) {
      return;
    }
    state.primerView.sectionIndex = Math.max(0, state.primerView.sectionIndex - 1);
    saveState();
    renderPrimerBook();
  }

  function onPrimerNextSection() {
    const topic = state.topics.find((item) => item.id === state.primerView.topicId);
    if (!topic) {
      return;
    }
    const maxSectionIndex = Math.max(0, getTopicSections(topic).length - 1);
    state.primerView.sectionIndex = Math.min(maxSectionIndex, state.primerView.sectionIndex + 1);
    saveState();
    renderPrimerBook();
  }

  function onStartDrill() {
    if (state.singlePractice.active) {
      alert("個別問題演習が開いています。先に閉じてからドリルを開始してください。");
      return;
    }
    if (state.mock.active) {
      alert("模試が進行中です。先に模試を終了してください。");
      return;
    }
    if (state.miniTest.active) {
      alert("小テストが進行中です。先に小テストを終了してください。");
      return;
    }
    if (state.trainingCycle.pendingMiniTest) {
      alert("5セクションクリア済みです。先に小テストを実施してください。");
      state.drill.message = "小テスト完了後に次のセクションへ進みます。";
      saveState();
      renderDrill();
      return;
    }

    const today = todayISO();
    if (state.todayPlan.date !== today || state.todayPlan.tasks.length === 0) {
      generateTodayPlan(true);
    }

    state.todayPlan.tasks = state.todayPlan.tasks.map((task) => {
      const progress = state.progress[task.topicId] || defaultProgress();
      const baseRaw = Number(task.attemptBase);
      return {
        topicId: task.topicId,
        count: task.count,
        attemptBase: Number.isFinite(baseRaw) ? Math.max(0, Math.round(baseRaw)) : progress.attempts
      };
    });

    const queueSlots = state.todayPlan.tasks
      .map((task) => ({
        topicId: task.topicId,
        left: Math.max(0, Math.round(Number(task.count) || 0))
      }))
      .filter((slot) => slot.left > 0);

    const queue = [];
    let hasPending = true;
    while (hasPending) {
      hasPending = false;
      for (const slot of queueSlots) {
        if (slot.left <= 0) {
          continue;
        }
        queue.push(createDrillQueueEntry(slot.topicId, 0));
        slot.left -= 1;
        hasPending = true;
      }
    }

    if (queue.length === 0) {
      state.drill.message = "今日の対象がありません。問題セットを追加してください。";
      saveState();
      renderAll();
      return;
    }

    state.drill = {
      active: true,
      queue,
      pointer: 0,
      correctCount: 0,
      wrongCount: 0,
      startedAt: today,
      message: "ドリル開始。本番形式（5択/記述）で解き、解説を確認しながら進めます。",
      showExplanation: false,
      selectedChoice: -1,
      pendingResult: null,
      writtenAnswer: "",
      singleMode: false,
      singleTopicId: "",
      singleQuestionNo: 1,
      singleSectionName: ""
    };

    saveState();
    renderAll();
  }

  function onDrillPrevQuestion() {
    if (!state.drill.active) {
      return;
    }
    if (state.drill.pointer <= 0) {
      state.drill.message = "これより前の問題はありません。";
      saveState();
      renderDrill();
      return;
    }

    state.drill.pointer -= 1;
    state.drill.showExplanation = false;
    state.drill.selectedChoice = -1;
    state.drill.pendingResult = null;
    state.drill.writtenAnswer = "";
    state.drill.message = "前の問題へ移動しました。";
    saveState();
    renderDrill();
  }

  function onDrillNavNextQuestion() {
    if (!state.drill.active) {
      return;
    }
    if (state.drill.showExplanation && typeof state.drill.pendingResult === "boolean") {
      onApplyReviewResult();
      return;
    }
    onSkipDrillQuestion();
  }

  function onDrillChoiceClick(event) {
    if (!state.drill.active) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest("button[data-choice-index]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const current = getCurrentDrillQuestionContext();
    if (!current) {
      return;
    }

    const packet = getDrillQuestionPacket(current.topic, current.questionNo);
    if (packet.format === "written") {
      state.drill.message = "この問題は記述式です。入力欄に回答して『回答を判定』を押してください。";
      saveState();
      renderDrill();
      return;
    }
    const detail = packet.detail;
    const picked = Number(button.dataset.choiceIndex);
    if (!Number.isInteger(picked) || picked < 0 || picked >= detail.choices.length) {
      return;
    }

    state.drill.selectedChoice = picked;
    state.drill.writtenAnswer = "";
    state.drill.pendingResult = picked === detail.correctIndex;
    state.drill.showExplanation = true;
    state.drill.message = "解説を確認してから『次の問題へ』を押してください。";

    saveState();
    renderDrill();
  }

  function onDrillWrittenSubmit() {
    if (!state.drill.active) {
      return;
    }
    const current = getCurrentDrillQuestionContext();
    if (!current) {
      return;
    }
    const packet = getDrillQuestionPacket(current.topic, current.questionNo);
    if (packet.format !== "written") {
      state.drill.message = "この問題は選択式です。選択肢を選んでください。";
      saveState();
      renderDrill();
      return;
    }

    const input = String(byId("drillWrittenInput").value || "").trim();
    if (input.length < 2) {
      state.drill.message = "記述回答を入力してください。";
      saveState();
      renderDrill();
      return;
    }

    state.drill.writtenAnswer = input;
    state.drill.selectedChoice = -1;
    state.drill.pendingResult = judgeWrittenDrillAnswer(packet.detail, input);
    state.drill.showExplanation = true;
    state.drill.message = "解説を確認してから『次の問題へ』を押してください。";
    saveState();
    renderDrill();
  }

  function onApplyReviewResult() {
    if (!state.drill.active) {
      return;
    }

    if (!state.drill.showExplanation || typeof state.drill.pendingResult !== "boolean") {
      const current = getCurrentDrillQuestionContext();
      if (current) {
        const packet = getDrillQuestionPacket(current.topic, current.questionNo);
        state.drill.message = packet.format === "written"
          ? "先に記述回答を入力して『回答を判定』を押してください。"
          : "先に選択肢から1つ選んでください。";
      } else {
        state.drill.message = "先に回答してください。";
      }
      saveState();
      renderDrill();
      return;
    }

    applyDrillResult(state.drill.pendingResult);
  }

  function onSkipDrillQuestion() {
    if (!state.drill.active) {
      return;
    }

    state.drill.showExplanation = false;
    state.drill.selectedChoice = -1;
    state.drill.pendingResult = null;
    state.drill.writtenAnswer = "";
    state.drill.pointer += 1;
    state.drill.message = "スキップしました。";

    finalizeDrillIfDone();
    saveState();
    renderAll();
  }

  function onEditCurrentQuestion() {
    const current = getCurrentDrillQuestionContext();
    if (!current) {
      return;
    }

    state.questionEditor.topicId = current.topic.id;
    state.questionEditor.questionNo = current.questionNo;
    state.questionEditor.message = `現在の出題(${current.topic.name} Q${current.questionNo})を編集モードに設定しました。`;

    saveState();
    renderQuestionEditor();
  }

  function onDrillResetSectionProgress() {
    const current = getCurrentDrillQuestionContext();
    if (!current) {
      alert("ドリル開始後に実行してください。");
      return;
    }
    const section = getCurrentSection(current.topic, current.questionNo);
    if (!confirm(`${current.topic.name} ${section.name} の進捗をリセットしますか？`)) {
      return;
    }
    resetSectionProgress(current.topic.id, section.index);
    state.drill.message = `${current.topic.name} ${section.name} の進捗をリセットしました。`;
    saveState();
    renderAll();
  }

  function onDrillResetTopicProgress() {
    const current = getCurrentDrillQuestionContext();
    if (!current) {
      alert("ドリル開始後に実行してください。");
      return;
    }
    if (!confirm(`${current.topic.name} の進捗を全リセットしますか？`)) {
      return;
    }
    resetTopicProgress(current.topic.id);
    state.drill = {
      ...defaultDrill(),
      message: `${current.topic.name} の進捗をリセットしました。`
    };
    saveState();
    renderAll();
  }

  function getCurrentSingleQuestionContext() {
    if (!state.singlePractice.active) {
      return null;
    }
    const topic = state.topics.find((item) => item.id === state.singlePractice.topicId);
    if (!topic) {
      return null;
    }
    const questionNo = clampQuestionNo(topic.id, state.singlePractice.questionNo);
    return { topic, questionNo };
  }

  function onSinglePrevQuestion() {
    const current = getCurrentSingleQuestionContext();
    if (!current) {
      return;
    }
    state.singlePractice.questionNo = clampQuestionNo(current.topic.id, current.questionNo - 1);
    state.singlePractice.showExplanation = false;
    state.singlePractice.selectedChoice = -1;
    state.singlePractice.pendingResult = null;
    state.singlePractice.message = "前の問題へ移動しました。";
    saveState();
    renderSinglePractice();
  }

  function onSingleNextQuestion() {
    const current = getCurrentSingleQuestionContext();
    if (!current) {
      return;
    }
    state.singlePractice.questionNo = clampQuestionNo(current.topic.id, current.questionNo + 1);
    state.singlePractice.showExplanation = false;
    state.singlePractice.selectedChoice = -1;
    state.singlePractice.pendingResult = null;
    state.singlePractice.message = "次の問題へ移動しました。";
    saveState();
    renderSinglePractice();
  }

  function onSingleChoiceClick(event) {
    const current = getCurrentSingleQuestionContext();
    if (!current) {
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest("button[data-choice-index]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    const picked = Number(button.dataset.choiceIndex);
    if (!Number.isInteger(picked) || picked < 0 || picked > 2) {
      return;
    }

    const detail = getQuestionDetail(current.topic.id, current.questionNo, false);
    state.singlePractice.selectedChoice = picked;
    state.singlePractice.pendingResult = picked === detail.correctIndex;
    state.singlePractice.showExplanation = true;
    state.singlePractice.message = "解説を確認して結果を確定してください。";
    saveState();
    renderSinglePractice();
  }

  function onSingleApplyResult() {
    const current = getCurrentSingleQuestionContext();
    if (!current) {
      return;
    }
    if (!state.singlePractice.showExplanation || typeof state.singlePractice.pendingResult !== "boolean") {
      state.singlePractice.message = "先に選択肢を選んでください。";
      saveState();
      renderSinglePractice();
      return;
    }

    const isCorrect = state.singlePractice.pendingResult === true;
    recordQuestionResult(current.topic.id, current.questionNo, isCorrect);
    if (!isCorrect) {
      const heatKey = `${current.topic.id}:${current.questionNo}`;
      state.pitfallHeatmap[heatKey] = (state.pitfallHeatmap[heatKey] || 0) + 1;
    }
    state.singlePractice.message = isCorrect
      ? `${current.topic.name} Q${current.questionNo}: 正解です。`
      : `${current.topic.name} Q${current.questionNo}: 不正解です。`;
    state.singlePractice.showExplanation = false;
    state.singlePractice.selectedChoice = -1;
    state.singlePractice.pendingResult = null;
    saveState();
    renderAll();
  }

  function onSingleResetSectionProgress() {
    const current = getCurrentSingleQuestionContext();
    if (!current) {
      alert("問題メニューから個別問題を開いてください。");
      return;
    }
    const section = getCurrentSection(current.topic, current.questionNo);
    if (!confirm(`${current.topic.name} ${section.name} の進捗をリセットしますか？`)) {
      return;
    }
    resetSectionProgress(current.topic.id, section.index);
    state.singlePractice.message = `${current.topic.name} ${section.name} の進捗をリセットしました。`;
    saveState();
    renderAll();
  }

  function onSingleResetTopicProgress() {
    const current = getCurrentSingleQuestionContext();
    if (!current) {
      alert("問題メニューから個別問題を開いてください。");
      return;
    }
    if (!confirm(`${current.topic.name} の進捗を全リセットしますか？`)) {
      return;
    }
    resetTopicProgress(current.topic.id);
    state.singlePractice.message = `${current.topic.name} の進捗をリセットしました。`;
    saveState();
    renderAll();
  }

  function onSingleClose() {
    state.singlePractice = defaultSinglePractice();
    saveState();
    renderSinglePractice();
  }

  function applyDrillResult(isCorrect) {
    if (!state.drill.active) {
      return;
    }

    const current = getCurrentDrillQuestionContext();
    if (!current) {
      return;
    }

    if (!state.drill.showExplanation) {
      const packet = getDrillQuestionPacket(current.topic, current.questionNo);
      state.drill.message = packet.format === "written"
        ? "先に記述回答を入力して『回答を判定』を押してください。"
        : "先に選択肢から1つ選んでください。";
      saveState();
      renderDrill();
      return;
    }

    const topic = current.topic;
    const topicId = topic.id;
    if (!topic) {
      state.drill.showExplanation = false;
      state.drill.selectedChoice = -1;
      state.drill.pendingResult = null;
      state.drill.pointer += 1;
      finalizeDrillIfDone();
      saveState();
      renderAll();
      return;
    }

    const progress = state.progress[topicId] || defaultProgress();
    const questionNo = current.questionNo;
    const currentSection = getCurrentSection(topic, questionNo);
    recordQuestionResult(topicId, questionNo, isCorrect);
    progress.attempts += 1;
    progress.lastStudied = todayISO();

    if (state.drill.singleMode) {
      if (isCorrect) {
        progress.correct += 1;
        state.drill.correctCount += 1;
        state.drill.message = `${topic.name} Q${questionNo}: 正解。単問演習を完了しました。`;
      } else {
        progress.mistakes += 1;
        state.drill.wrongCount += 1;
        const heatKey = `${topicId}:${questionNo}`;
        state.pitfallHeatmap[heatKey] = (state.pitfallHeatmap[heatKey] || 0) + 1;
        state.drill.message = `${topic.name} Q${questionNo}: 不正解。解説を見直して再チャレンジしてください。`;
      }

      state.progress[topicId] = normalizeProgress(topic, progress);
      state.drill.showExplanation = false;
      state.drill.selectedChoice = -1;
      state.drill.pendingResult = null;
      state.drill.writtenAnswer = "";
      state.drill.pointer += 1;

      finalizeDrillIfDone();
      saveState();
      renderAll();
      return;
    }

    if (isCorrect) {
      progress.correct += 1;
      state.drill.correctCount += 1;

      if (!progress.mastered) {
        if (progress.nextQuestion < currentSection.end) {
          progress.nextQuestion += 1;
        } else {
          progress.perfectRounds += 1;
          if (progress.perfectRounds >= state.settings.targetPerfectRounds) {
            progress.sectionClears += 1;
            progress.perfectRounds = 0;

            const sections = getTopicSections(topic);
            const nextSectionIndex = currentSection.index + 1;
            if (nextSectionIndex < sections.length) {
              const nextSection = sections[nextSectionIndex];
              progress.nextQuestion = nextSection.start;
              state.drill.message = `${topic.name} ${currentSection.name} をクリア。次は ${nextSection.name}。`;
            } else {
              progress.mastered = true;
              progress.nextQuestion = topic.total;
              state.drill.message = `${topic.name} は全セクションをクリア。`;
            }

            onSectionCleared(topic, currentSection);
          } else {
            const remain = state.settings.targetPerfectRounds - progress.perfectRounds;
            progress.nextQuestion = currentSection.start;
            state.drill.message = `${topic.name} ${currentSection.name} 1周満点。あと${remain}周でセクションクリア。`;
          }
        }
      }
    } else {
      progress.mistakes += 1;
      progress.perfectRounds = 0;
      progress.mastered = false;
      progress.nextQuestion = currentSection.start;
      state.drill.wrongCount += 1;

      const heatKey = `${topicId}:${questionNo}`;
      state.pitfallHeatmap[heatKey] = (state.pitfallHeatmap[heatKey] || 0) + 1;
      state.drill.message = `${topic.name} ${currentSection.name} で不正解。セクション先頭に戻ります。`;
    }

    state.progress[topicId] = normalizeProgress(topic, progress);
    state.drill.showExplanation = false;
    state.drill.selectedChoice = -1;
    state.drill.pendingResult = null;
    state.drill.writtenAnswer = "";
    state.drill.pointer += 1;

    finalizeDrillIfDone();
    saveState();
    renderAll();
  }

  function finalizeDrillIfDone() {
    if (state.drill.pointer < state.drill.queue.length) {
      return;
    }

    const correctRate = state.drill.queue.length > 0
      ? Math.round((state.drill.correctCount / state.drill.queue.length) * 100)
      : 0;

    state.drill.active = false;
    state.drill.showExplanation = false;
    state.drill.selectedChoice = -1;
    state.drill.pendingResult = null;
    state.drill.writtenAnswer = "";
    if (state.drill.singleMode) {
      const topic = state.topics.find((item) => item.id === state.drill.singleTopicId);
      const label = topic
        ? `${topic.name} Q${state.drill.singleQuestionNo}`
        : "単問演習";
      state.drill.message = `${label} 終了: 正解 ${state.drill.correctCount} / 不正解 ${state.drill.wrongCount} / 正答率 ${correctRate}%`;
      return;
    }

    state.drill.message = `本日のドリル終了: 正解 ${state.drill.correctCount} / 不正解 ${state.drill.wrongCount} / 正答率 ${correctRate}%`;
    if (state.trainingCycle.pendingMiniTest) {
      state.drill.message += " / 次は小テストを実施してください。";
    }
    state.todayPlan = { date: "", tasks: [] };
  }

  function onLoadQuestionEditor() {
    const topicId = byId("questionTopicSelect").value;
    const questionNo = clampQuestionNo(topicId, byId("questionNumberInput").value);

    state.questionEditor.topicId = topicId;
    state.questionEditor.questionNo = questionNo;
    state.questionEditor.message = "";

    saveState();
    renderQuestionEditor();
  }

  function onSaveQuestionEditor() {
    const topicId = byId("questionTopicSelect").value;
    const questionNo = clampQuestionNo(topicId, byId("questionNumberInput").value);
    const topic = state.topics.find((item) => item.id === topicId);

    if (!topic) {
      return;
    }

    const choices = [
      byId("questionChoice1Input").value.trim(),
      byId("questionChoice2Input").value.trim(),
      byId("questionChoice3Input").value.trim()
    ];
    if (choices.some((choice) => !choice)) {
      alert("選択肢1〜3をすべて入力してください。");
      return;
    }

    const correctIndexRaw = Number(byId("questionCorrectIndexSelect").value);
    const correctIndex = Number.isInteger(correctIndexRaw) && correctIndexRaw >= 0 && correctIndexRaw <= 2
      ? correctIndexRaw
      : 0;

    const detail = {
      prompt: byId("questionPromptInput").value.trim(),
      choices,
      correctIndex,
      answer: byId("questionAnswerInput").value.trim(),
      explanation: byId("questionExplanationInput").value.trim(),
      pitfall: byId("questionPitfallInput").value.trim(),
      terms: parseTerms(byId("questionTermsInput").value),
      trendTag: PAST5_TREND_BY_TOPIC[topicId] || ""
    };

    if (!state.questionBank[topicId] || typeof state.questionBank[topicId] !== "object") {
      state.questionBank[topicId] = {};
    }

    state.questionBank[topicId][questionNo] = normalizeQuestion(detail);

    state.questionEditor.topicId = topicId;
    state.questionEditor.questionNo = questionNo;
    state.questionEditor.message = `${topic.name} Q${questionNo} の3択問題を保存しました。`;

    saveState();
    renderQuestionEditor();
    renderDrill();
  }

  function onAddTerm() {
    const term = byId("newTermInput").value.trim();
    const definition = byId("newDefinitionInput").value.trim();
    const pitfall = byId("newTermPitfallInput").value.trim();

    if (!term || !definition) {
      alert("用語と定義を入力してください。");
      return;
    }

    const existing = state.glossary.find((item) => item.term === term);
    if (existing) {
      existing.definition = definition;
      existing.pitfall = pitfall;
    } else {
      state.glossary.unshift({ term, definition, pitfall });
    }

    byId("newTermInput").value = "";
    byId("newDefinitionInput").value = "";
    byId("newTermPitfallInput").value = "";

    saveState();
    renderGlossary();
  }

  function onGlossaryTableClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const term = target.dataset.term;
    if (!term) {
      return;
    }

    if (target.dataset.action === "delete") {
      state.glossary = state.glossary.filter((item) => item.term !== term);
      saveState();
      renderGlossary();
    }
  }

  function onStartMockExam() {
    if (state.mock.active) {
      alert("模試が進行中です。終了してから再開してください。");
      return;
    }
    if (state.singlePractice.active) {
      alert("個別問題演習が開いています。先に閉じてください。");
      return;
    }
    if (state.drill.active) {
      alert("反復ドリルが進行中です。先にドリルを終了してください。");
      return;
    }
    if (state.miniTest.active) {
      alert("小テストが進行中です。先に小テストを終了してください。");
      return;
    }

    const queue = buildMockQueue();
    if (queue.length === 0) {
      alert("模試用の問題が作成できません。問題セットを確認してください。");
      return;
    }

    const durationSeconds = state.settings.mockDurationMinutes * 60;
    const endsAt = new Date(Date.now() + durationSeconds * 1000).toISOString();

    state.mock = {
      active: true,
      queue,
      pointer: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      holdCount: 0,
      startedAt: new Date().toISOString(),
      endsAt,
      message: "模試を開始しました。時間内に60問を解き切ってください。"
    };

    saveState();
    ensureMockTimer();
    renderAll();
  }

  function onMockChoiceClick(event) {
    if (!state.mock.active) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest("button[data-choice-index]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const picked = Number(button.dataset.choiceIndex);
    if (!Number.isInteger(picked) || picked < 0 || picked > 2) {
      return;
    }

    const item = state.mock.queue[state.mock.pointer];
    if (!item) {
      finishMockExam("模試を終了しました。");
      return;
    }

    const detail = getQuestionDetail(item.topicId, item.questionNo, false);
    const isCorrect = picked === detail.correctIndex;
    state.mock.message = isCorrect ? "この問題は正解です。" : `この問題は不正解です。正解: ${detail.choices[detail.correctIndex]}`;
    handleMockAnswer(isCorrect ? "correct" : "wrong");
  }

  function handleMockAnswer(kind) {
    if (!state.mock.active) {
      return;
    }

    const item = state.mock.queue[state.mock.pointer];
    if (!item) {
      finishMockExam("模試を終了しました。");
      return;
    }

    if (kind === "correct") {
      state.mock.correctCount += 1;
      state.mock.score += item.points;
      recordQuestionResult(item.topicId, item.questionNo, true);
    } else if (kind === "wrong") {
      state.mock.wrongCount += 1;
      recordQuestionResult(item.topicId, item.questionNo, false);
      const heatKey = `${item.topicId}:${item.questionNo}`;
      state.pitfallHeatmap[heatKey] = (state.pitfallHeatmap[heatKey] || 0) + 1;
    } else {
      state.mock.holdCount += 1;
      state.mock.message = "この問題は保留にしました。";
    }

    state.mock.pointer += 1;

    if (state.mock.pointer >= state.mock.queue.length) {
      finishMockExam("60問完了。模試を終了しました。");
      return;
    }

    saveState();
    renderMockExam();
    renderPitfalls();
  }

  function onStartMiniTest() {
    if (state.miniTest.active) {
      alert("小テストが進行中です。");
      return;
    }
    if (state.singlePractice.active) {
      alert("個別問題演習が開いています。先に閉じてください。");
      return;
    }
    if (state.drill.active) {
      alert("反復ドリルが進行中です。先にドリルを終えてください。");
      return;
    }
    if (state.mock.active) {
      alert("模試が進行中です。先に模試を終了してください。");
      return;
    }

    const queue = buildMiniTestQueue();
    if (queue.length === 0) {
      state.miniTest.message = "小テスト対象の問題を作れませんでした。問題セットを確認してください。";
      saveState();
      renderMiniTest();
      return;
    }

    state.miniTest = {
      active: true,
      queue,
      pointer: 0,
      correctCount: 0,
      wrongCount: 0,
      holdCount: 0,
      message: "小テスト開始。10問をテンポよく解きます。"
    };

    saveState();
    renderMiniTest();
  }

  function onFinishMiniTest() {
    finishMiniTest("小テストを手動終了しました。");
  }

  function onMiniTestChoiceClick(event) {
    if (!state.miniTest.active) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest("button[data-choice-index]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const picked = Number(button.dataset.choiceIndex);
    if (!Number.isInteger(picked) || picked < 0 || picked > 2) {
      return;
    }

    const item = state.miniTest.queue[state.miniTest.pointer];
    if (!item) {
      finishMiniTest("小テストを終了しました。");
      return;
    }

    const detail = getQuestionDetail(item.topicId, item.questionNo, false);
    const isCorrect = picked === detail.correctIndex;
    recordQuestionResult(item.topicId, item.questionNo, isCorrect);

    if (isCorrect) {
      state.miniTest.correctCount += 1;
      state.miniTest.message = "正解です。";
    } else {
      state.miniTest.wrongCount += 1;
      state.miniTest.message = `不正解です。正解: ${detail.choices[detail.correctIndex]}`;
      const heatKey = `${item.topicId}:${item.questionNo}`;
      state.pitfallHeatmap[heatKey] = (state.pitfallHeatmap[heatKey] || 0) + 1;
    }

    state.miniTest.pointer += 1;

    if (state.miniTest.pointer >= state.miniTest.queue.length) {
      finishMiniTest("10問完了。小テストを終了しました。");
      return;
    }

    saveState();
    renderMiniTest();
    renderPitfalls();
  }

  function finishMiniTest(message) {
    if (!state.miniTest.active) {
      state.miniTest.message = message || state.miniTest.message;
      saveState();
      renderMiniTest();
      return;
    }

    const total = state.miniTest.queue.length;
    const rate = total > 0 ? Math.round((state.miniTest.correctCount / total) * 100) : 0;
    const hadPending = state.trainingCycle.pendingMiniTest;

    state.miniTest = {
      ...defaultMiniTest(),
      message: `${message} 結果: 正解${state.miniTest.correctCount}/${total} (${rate}%), 不正解${state.miniTest.wrongCount}`
    };

    if (hadPending) {
      state.trainingCycle.pendingMiniTest = false;
      state.trainingCycle.sectionClearsSinceMiniTest = 0;
      state.miniTest.message += " / セクション学習を再開できます。";
    }

    saveState();
    renderMiniTest();
    renderTopics();
    renderPitfalls();
  }

  function finishMockExam(message) {
    if (!state.mock.active) {
      state.mock.message = message || state.mock.message;
      saveState();
      renderMockExam();
      return;
    }

    const total = state.mock.queue.reduce((sum, item) => sum + item.points, 0);
    const rate = total > 0 ? Math.round((state.mock.score / total) * 100) : 0;

    state.mock = {
      ...defaultMock(),
      message: `${message} 結果: ${state.mock.score}/${total}点 (${rate}%), 正解${state.mock.correctCount}, 不正解${state.mock.wrongCount}, 保留${state.mock.holdCount}`
    };

    saveState();
    ensureMockTimer();
    renderMockExam();
    renderPitfalls();
  }

  function ensureMockTimer() {
    if (mockTimerId) {
      clearInterval(mockTimerId);
      mockTimerId = null;
    }

    if (!state.mock.active) {
      return;
    }

    mockTimerId = setInterval(() => {
      if (!state.mock.active) {
        ensureMockTimer();
        return;
      }

      const remain = secondsUntil(state.mock.endsAt);
      if (remain <= 0) {
        finishMockExam("時間切れで模試を終了しました。");
        return;
      }

      renderMockExam();
    }, 1000);
  }

  function buildMockQueue() {
    const lawTopics = state.topics.filter((topic) => topic.category !== "general");
    const generalTopics = state.topics.filter((topic) => topic.category === "general");
    const fallbackLaw = lawTopics.length > 0
      ? lawTopics
      : state.topics.length > 0
        ? [state.topics[0]]
        : [];

    const fallbackGeneral = generalTopics.length > 0
      ? generalTopics
      : state.topics.length > 0
        ? [state.topics[0]]
        : [];

    const queue = [];

    queue.push(...createMockItems({
      count: 40,
      pool: fallbackLaw,
      format: "法令等 択一",
      points: 4
    }));

    queue.push(...createMockItems({
      count: 3,
      pool: fallbackLaw,
      format: "法令等 多肢",
      points: 8
    }));

    queue.push(...createMockItems({
      count: 3,
      pool: fallbackLaw,
      format: "法令等 記述",
      points: 20,
      preferDescribe: true
    }));

    queue.push(...createMockItems({
      count: 14,
      pool: fallbackGeneral,
      format: "基礎知識 択一",
      points: 4
    }));

    return queue;
  }

  function buildMiniTestQueue() {
    const desiredCount = 10;
    const today = todayISO();
    if (state.todayPlan.date !== today || state.todayPlan.tasks.length === 0) {
      generateTodayPlan(false);
    }

    let topicIds = state.todayPlan.tasks
      .map((task) => task.topicId)
      .filter((topicId) => state.topics.some((topic) => topic.id === topicId));

    if (topicIds.length === 0) {
      const studyDaysLeft = getDaysUntilCompleteDate();
      topicIds = state.topics
        .map((topic) => ({ topic, score: topicScore(topic, studyDaysLeft) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.topic.id);
    }

    if (topicIds.length === 0) {
      return [];
    }

    const queue = [];
    for (let i = 0; i < desiredCount; i += 1) {
      const topicId = topicIds[i % topicIds.length];
      const topic = state.topics.find((item) => item.id === topicId);
      if (!topic) {
        continue;
      }

      const progress = state.progress[topicId] || defaultProgress();
      const questionNo = ((progress.nextQuestion + i - 1) % Math.max(1, topic.total)) + 1;

      queue.push({
        topicId,
        questionNo,
        format: "小テスト"
      });
    }

    return queue;
  }

  function createMockItems({ count, pool, format, points, preferDescribe = false }) {
    if (!Array.isArray(pool) || pool.length === 0 || count <= 0) {
      return [];
    }

    const preparedPool = preferDescribe
      ? pool
          .map((topic) => ({ topic, weight: topic.category === "describe" ? topic.weight * 1.8 : topic.weight }))
      : pool.map((topic) => ({ topic, weight: topic.weight }));

    const items = [];
    for (let i = 0; i < count; i += 1) {
      const topic = pickWeightedTopic(preparedPool);
      if (!topic) {
        continue;
      }

      const questionNo = 1 + Math.floor(Math.random() * Math.max(1, topic.total));
      items.push({
        topicId: topic.id,
        questionNo,
        format,
        points
      });
    }

    return items;
  }

  function pickWeightedTopic(weightedTopics) {
    if (!weightedTopics.length) {
      return null;
    }

    let total = 0;
    for (const item of weightedTopics) {
      total += Math.max(0.1, Number(item.weight) || 1);
    }

    let pick = Math.random() * total;
    for (const item of weightedTopics) {
      pick -= Math.max(0.1, Number(item.weight) || 1);
      if (pick <= 0) {
        return item.topic;
      }
    }

    return weightedTopics[weightedTopics.length - 1].topic;
  }

  function renderAll() {
    const today = todayISO();
    if (state.todayPlan.date !== today || state.todayPlan.tasks.length === 0) {
      generateTodayPlan(false);
    }

    renderDashboard();
    renderSettings();
    renderHome();
    renderProblemMenu();
    renderSinglePractice();
    renderTopics();
    renderTodayPlan();
    renderPrimerBook();
    renderDrill();
    renderMiniTest();
    renderQuestionEditor();
    renderMockExam();
    renderGlossary();
    renderPitfalls();
    renderCurriculum();
    renderResearch();
    applyFocusTabLayout(false);
    ensureMockTimer();
    ensureClockTimer();
  }

  function renderHome() {
    const panel = byId("homeOverviewPanel");
    if (!panel) {
      return;
    }

    const completeDaysLeft = getDaysUntilCompleteDate();
    const phase = phaseByDays(completeDaysLeft);
    const dailyTarget = getDailyTargetCount();
    const totalSections = state.topics.reduce((sum, topic) => sum + getTopicSections(topic).length, 0);
    const clearedSections = state.topics.reduce((sum, topic) => {
      const progress = state.progress[topic.id] || defaultProgress();
      return sum + Math.min(getTopicSections(topic).length, progress.sectionClears);
    }, 0);
    const totalQuestions = state.topics.reduce((sum, topic) => sum + topic.total, 0);
    const solvedQuestions = state.topics.reduce((sum, topic) => {
      let solved = 0;
      for (let questionNo = 1; questionNo <= topic.total; questionNo += 1) {
        if (getQuestionStat(topic.id, questionNo).correct > 0) {
          solved += 1;
        }
      }
      return sum + solved;
    }, 0);
    const activeTopic = state.topics.find((topic) => !(state.progress[topic.id] || defaultProgress()).mastered) || state.topics[0] || null;
    const activeSection = activeTopic
      ? getCurrentSection(activeTopic, (state.progress[activeTopic.id] || defaultProgress()).nextQuestion)
      : null;
    const planCount = getTodayPlannedCount();
    const syncLoggedIn = Boolean(firebaseUser && firebaseUser.uid);
    const syncBadgeClass = syncLoggedIn ? "isOk" : googleSyncRuntimeError ? "isWarn" : "";
    const syncBadgeText = syncLoggedIn ? "Google同期オン" : googleSyncRuntimeError ? "同期要確認" : "未ログイン";
    const leadTitle = state.trainingCycle.pendingMiniTest
      ? "次は小テストを先に実施"
      : activeTopic && activeSection
        ? `${activeTopic.name} / ${activeSection.name} を進める日`
        : "まずは問題セットを確認";
    const leadBody = state.trainingCycle.pendingMiniTest
      ? `セクション${SECTION_CLEAR_TARGET}個クリア済みです。今日のドリルより先に小テストを入れる流れです。`
      : activeTopic && activeSection
        ? `今日の中心は Q${activeSection.start}-${activeSection.end} です。先に予習を読んでから反復ドリルに入る構成です。`
        : "ホームから学習設定と問題メニューを開いて準備してください。";

    panel.innerHTML = `
      <div class="homeOverviewHero">
        <section class="homeOverviewLead">
          <span class="eyebrow">Today Focus</span>
          <strong>${escapeHtml(leadTitle)}</strong>
          <p>${escapeHtml(leadBody)}</p>
        </section>
        <section class="homeOverviewSync">
          <span class="eyebrow">Sync</span>
          <strong>${syncLoggedIn ? escapeHtml(firebaseUser.email || "Google接続済み") : "この端末の同期状態"}</strong>
          <p>${escapeHtml(syncLoggedIn ? "PCとiPhoneで同じGoogleアカウントなら進捗を共通化できます。" : "GoogleログインするとPCとiPhoneで進捗を共有できます。")}</p>
          <span class="homeSyncBadge ${syncBadgeClass}">${escapeHtml(syncBadgeText)}</span>
        </section>
      </div>
      <div class="homeOverviewStats">
        <article class="overviewStat">
          <span class="overviewStatLabel">仕上げ期限まで</span>
          <span class="overviewStatValue">${completeDaysLeft >= 0 ? `${completeDaysLeft}日` : "超過"}</span>
          <span class="overviewStatSub">${escapeHtml(phase.label)}</span>
        </article>
        <article class="overviewStat">
          <span class="overviewStatLabel">今日のノルマ</span>
          <span class="overviewStatValue">${planCount || dailyTarget}問</span>
          <span class="overviewStatSub">${planCount > 0 ? `今日プラン ${planCount}問` : `最低 ${dailyTarget}問`}</span>
        </article>
        <article class="overviewStat">
          <span class="overviewStatLabel">セクション進捗</span>
          <span class="overviewStatValue">${clearedSections}/${totalSections || 0}</span>
          <span class="overviewStatSub">${totalSections > 0 ? `クリア率 ${Math.round((clearedSections / totalSections) * 100)}%` : "未設定"}</span>
        </article>
        <article class="overviewStat">
          <span class="overviewStatLabel">個別で正解済み</span>
          <span class="overviewStatValue">${solvedQuestions}/${totalQuestions || 0}</span>
          <span class="overviewStatSub">${activeTopic && activeSection ? `${activeTopic.name} / ${activeSection.name}` : "問題追加待ち"}</span>
        </article>
      </div>
    `;
  }

  function renderDashboard() {
    byId("examDateInput").value = state.settings.examDate;
    renderCurrentDateTime();

    const examDaysLeft = daysUntil(state.settings.examDate);
    const completeDaysLeft = getDaysUntilCompleteDate();
    const completeDate = getCompleteDate();
    const phase = phaseByDays(completeDaysLeft);
    const dailyTarget = getDailyTargetCount();
    const remainingQuestions = getRemainingUniqueQuestions();
    const solvedQuestions = getSolvedUniqueQuestions();
    const totalQuestions = remainingQuestions + solvedQuestions;
    const scheduleDays = Math.max(1, completeDaysLeft);
    const needPerDay = remainingQuestions > 0 ? Math.ceil(remainingQuestions / scheduleDays) : 0;
    const targetPerDay = dailyTarget;
    const forecastDays = Math.max(0, Math.ceil(remainingQuestions / Math.max(1, targetPerDay)));
    const paceGap = targetPerDay - needPerDay;

    byId("daysLeft").textContent = completeDaysLeft >= 0 ? `${completeDaysLeft}日` : "期限超過";
    byId("phaseLabel").textContent = phase.label;
    byId("dailyTarget").textContent = `${dailyTarget}問`;
    byId("needPerDayLine").textContent = `残り${remainingQuestions}問 ÷ ${scheduleDays}日 = ${needPerDay}問/日`;
    byId("capacityPerDayLine").textContent = `${targetPerDay}問/日`;
    byId("forecastLine").textContent = `今の設定なら ${forecastDays}日で消化見込み`;

    let deltaText = "ぴったり";
    let paceTone = "isGood";
    if (paceGap < 0) {
      deltaText = `${Math.abs(paceGap)}問/日 不足`;
      paceTone = "isBad";
    } else if (paceGap === 0) {
      deltaText = "ちょうど必要量";
      paceTone = "isWarn";
    } else {
      deltaText = `${paceGap}問/日 余裕`;
      paceTone = paceGap >= 5 ? "isGood" : "isWarn";
    }
    byId("paceDeltaLine").textContent = deltaText;

    setGauge("overallProgressGaugeFill", "overallProgressGaugeLabel", solvedQuestions, totalQuestions, "未設定");
    const paceTotal = Math.max(needPerDay, targetPerDay, 1);
    const pacePercent = setGauge("paceGaugeFill", "paceGaugeLabel", targetPerDay, paceTotal, "未設定");
    setProgressFillTone("overallProgressGaugeFill", totalQuestions > 0 && solvedQuestions >= totalQuestions ? "isGood" : "default");
    setProgressFillTone("paceGaugeFill", paceTone);

    const paceStatus = byId("paceStatusNote");
    if (paceGap < 0) {
      paceStatus.textContent = `今の目標ペースは必要量より ${Math.abs(paceGap)}問/日 足りません。1日の学習時間を増やすか、今日の問題数を上書きしてください。`;
      paceStatus.classList.add("isError");
    } else if (paceGap === 0) {
      paceStatus.textContent = `今の目標ペースで必要量ちょうどです。今日のノルマ ${dailyTarget}問 を崩さなければ締切線に乗ります。`;
      paceStatus.classList.remove("isError");
    } else {
      paceStatus.textContent = `今の目標ペースは必要量より ${paceGap}問/日 余裕があります。残り${remainingQuestions}問なら、今の設定で ${forecastDays}日ほどで消化見込みです。`;
      paceStatus.classList.remove("isError");
    }

    const likely = toISODate(getLikelyExamDate(todayLocal()));
    let note = `本番${COMPLETE_BUFFER_DAYS}日前の ${toISODate(completeDate)} を仕上げ期限として逆算します。`;

    if (state.settings.examDate === likely) {
      note += ` 現在の設定は ${state.settings.examDate}（暫定候補）です。`;
    }

    if (examDaysLeft >= 0) {
      note += ` 本番まで ${examDaysLeft}日。`;
    }
    if (completeDaysLeft < 0 && examDaysLeft >= 0) {
      note += " 仕上げ期限を過ぎています。今日の問題数を増やしてください。";
    }

    if (needPerDay > targetPerDay) {
      note += ` 残り${remainingQuestions}問に対して必要量(${needPerDay}問/日)に不足するため、時間増加か問題数上書きを推奨。`;
    } else if (pacePercent >= 100) {
      note += " 現在の設定ペースは必要量を満たしています。";
    }

    byId("examDateNote").textContent = note;
  }

  function ensureClockTimer() {
    if (clockTimerId) {
      return;
    }

    lastClockDate = todayISO();
    clockTimerId = setInterval(() => {
      renderCurrentDateTime();
      const nowDate = todayISO();
      if (nowDate !== lastClockDate) {
        lastClockDate = nowDate;
        renderAll();
      }
    }, 1000);
  }

  function renderCurrentDateTime() {
    const now = new Date();
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    byId("currentDateTime").textContent = `現在日時: ${y}/${m}/${d}(${weekdays[now.getDay()]}) ${hh}:${mm}:${ss}`;
  }

  function renderSettings() {
    byId("dailyMinutesInput").value = String(state.settings.dailyMinutes);
    byId("targetPerfectRoundsInput").value = String(state.settings.targetPerfectRounds);
    byId("todayQuestionOverrideInput").value = state.settings.todayQuestionOverride;

    const authLine = firebaseUser && firebaseUser.uid
      ? `ログイン状態: ${firebaseUser.email || firebaseUser.uid}`
      : "ログイン状態: 未ログイン";
    byId("googleAuthLine").textContent = authLine;
    setGoogleSyncBusy(googleSyncBusy);

    if (!googleSyncRuntimeStatus) {
      const pushed = syncConfig.googleLastLocalPushedAt
        ? formatSyncTimestamp(syncConfig.googleLastLocalPushedAt)
        : "未同期";
      const pulled = syncConfig.googleLastPulledAt
        ? formatSyncTimestamp(syncConfig.googleLastPulledAt)
        : "未同期";
      const remote = syncConfig.googleLastRemoteUpdatedAt
        ? formatSyncTimestamp(syncConfig.googleLastRemoteUpdatedAt)
        : "未同期";
      setGoogleSyncStatus(`同期状態: 最終アップロード ${pushed} / 最終取込 ${pulled} / 最終クラウド更新 ${remote}`);
    } else {
      const googleStatusEl = byId("googleSyncStatusLine");
      googleStatusEl.textContent = googleSyncRuntimeStatus;
      googleStatusEl.classList.toggle("isError", googleSyncRuntimeError);
    }

    const syncPanel = byId("syncStatusPanel");
    if (syncPanel) {
      const pushed = syncConfig.googleLastLocalPushedAt
        ? formatSyncTimestamp(syncConfig.googleLastLocalPushedAt)
        : "未同期";
      const remote = syncConfig.googleLastRemoteUpdatedAt
        ? formatSyncTimestamp(syncConfig.googleLastRemoteUpdatedAt)
        : "未同期";
      syncPanel.innerHTML = `
        <div class="syncStatusCard">
          <strong>アカウント</strong>
          <span>${escapeHtml(firebaseUser && firebaseUser.uid ? (firebaseUser.email || "Google接続済み") : "未ログイン")}</span>
        </div>
        <div class="syncStatusCard">
          <strong>最終クラウド更新</strong>
          <span>${escapeHtml(remote)}</span>
        </div>
        <div class="syncStatusCard">
          <strong>この端末から送信</strong>
          <span>${escapeHtml(pushed)}</span>
        </div>
        <div class="syncStatusCard">
          <strong>状態</strong>
          <span>${escapeHtml(googleSyncRuntimeStatus || (googleSyncBusy ? "同期処理中" : "待機中"))}</span>
        </div>
      `;
    }
  }

  function renderTopics() {
    const cycleBadge = state.trainingCycle.pendingMiniTest
      ? `<p class="note">小テスト待ち: セクション${SECTION_CLEAR_TARGET}個到達。先に小テストを実施してください。</p>`
      : `<p class="note">小テストまで: あと${Math.max(0, SECTION_CLEAR_TARGET - state.trainingCycle.sectionClearsSinceMiniTest)}セクション</p>`;

    const rows = state.topics.map((topic) => {
      const progress = state.progress[topic.id] || defaultProgress();
      const section = getCurrentSection(topic, progress.nextQuestion);
      const sectionProgress = getSectionProgressLabel(topic, progress);
      const roundsText = `${progress.perfectRounds}/${state.settings.targetPerfectRounds}`;

      return `
        <tr>
          <td><input data-topic-id="${escapeAttr(topic.id)}" data-field="name" value="${escapeAttr(topic.name)}" /></td>
          <td><input data-topic-id="${escapeAttr(topic.id)}" data-field="total" type="number" min="1" value="${topic.total}" /></td>
          <td>
            ${sectionProgress}<br />
            <span class="note">現在: ${section.name} / Q${section.start}-${section.end} / 周回 ${roundsText}</span>
          </td>
          <td class="topicOps">
            <button type="button" data-topic-id="${escapeAttr(topic.id)}" data-action="reset">リセット</button>
            <button type="button" data-topic-id="${escapeAttr(topic.id)}" data-action="delete">削除</button>
          </td>
        </tr>
      `;
    });

    byId("topicsTableWrap").innerHTML = `
      ${cycleBadge}
      <table class="table">
        <thead>
          <tr>
            <th>セット名</th>
            <th>問題数</th>
            <th>セクション進行</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join("")}
        </tbody>
      </table>
    `;
  }

  function renderProblemMenu() {
    const summary = byId("problemMenuSummary");
    const list = byId("problemMenuList");

    if (state.topics.length === 0) {
      summary.innerHTML = "<p class=\"note\">問題セットを追加すると問題メニューが表示されます。</p>";
      list.innerHTML = "";
      return;
    }

    const totalQuestions = state.topics.reduce((sum, topic) => sum + topic.total, 0);
    const totalSections = state.topics.reduce((sum, topic) => sum + getTopicSections(topic).length, 0);
    const clearedSections = state.topics.reduce((sum, topic) => {
      const progress = state.progress[topic.id] || defaultProgress();
      return sum + Math.min(getTopicSections(topic).length, progress.sectionClears);
    }, 0);
    const miniLeft = Math.max(0, SECTION_CLEAR_TARGET - state.trainingCycle.sectionClearsSinceMiniTest);
    const sectionGaugePercent = totalSections > 0
      ? Math.round((clearedSections / totalSections) * 100)
      : 0;
    const cycleNote = state.trainingCycle.pendingMiniTest
      ? "現在は小テスト待ち（5セクションクリア達成）。"
      : `現在の小テストまで: あと${miniLeft}セクション。`;

    summary.innerHTML = `
      <p class="note">総法数 ${state.topics.length} / 総問題数 ${totalQuestions}問 / 総セクション ${totalSections}</p>
      <p class="note">クリア: ★ ${clearedSections}/${totalSections}</p>
      <div class="progressWrap compactGauge">
        <div class="progressMeta">
          <span>全体セクション進捗</span>
          <span>${clearedSections}/${totalSections} (${sectionGaugePercent}%)</span>
        </div>
        <div class="progressTrack"><div class="progressFill" style="width: ${sectionGaugePercent}%"></div></div>
      </div>
      <p class="note">${cycleNote}</p>
    `;

    const firstActiveTopic = state.topics.find((topic) => {
      const progress = state.progress[topic.id] || defaultProgress();
      return !progress.mastered;
    });
    const firstActiveTopicId = firstActiveTopic ? firstActiveTopic.id : state.topics[0].id;

    list.innerHTML = state.topics
      .map((topic, topicIndex) => {
        const progress = state.progress[topic.id] || defaultProgress();
        const sections = getTopicSections(topic);
        const topicTotalSections = sections.length;
        const topicClearedSections = Math.min(topicTotalSections, progress.sectionClears);
        const topicGauge = getTopicGaugeProgress(topic, progress);
        const currentSection = getCurrentSection(topic, progress.nextQuestion);
        const topicOpen = topic.id === firstActiveTopicId ? "open" : "";
        const sectionGroups = [];
        for (let index = 0; index < sections.length; index += 10) {
          sectionGroups.push(sections.slice(index, index + 10));
        }
        const currentGroupIndex = Math.floor(currentSection.index / 10);
        const sectionGroupHtml = sectionGroups.map((group, groupIndex) => {
          const groupOpen = topic.id === firstActiveTopicId && groupIndex === currentGroupIndex ? "open" : "";
          const firstNo = group[0].index + 1;
          const lastNo = group[group.length - 1].index + 1;
          const groupCleared = group.filter((section) => section.index < topicClearedSections).length;

          const sectionHtml = group.map((section) => {
            const sectionNo = section.index + 1;
            const count = section.end - section.start + 1;
            const isCleared = section.index < topicClearedSections;
            const isCurrent = !progress.mastered && section.index === currentSection.index;
            const sectionOpen = topic.id === firstActiveTopicId && isCurrent ? "open" : "";
            const summaryClass = `sectionFoldSummary${isCleared ? " done" : ""}`;
            const sectionGauge = getSectionGaugeProgress(topic, progress, section);
            let solvedCount = 0;
            let attemptedCount = 0;
            const miniHint = state.trainingCycle.pendingMiniTest
              ? "先に小テスト"
              : isCleared
                ? "クリア済み"
                : isCurrent
                  ? `次の小テストまであと${Math.max(0, miniLeft - 1)}`
                  : `小テストまであと${miniLeft}`;
            const chips = [];
            for (let questionNo = section.start; questionNo <= section.end; questionNo += 1) {
              const stat = getQuestionStat(topic.id, questionNo);
              const isSolved = stat.correct > 0;
              const isAttempted = stat.attempts > 0;
              if (isSolved) {
                solvedCount += 1;
              }
              if (isAttempted) {
                attemptedCount += 1;
              }
              const chipClass = `questionChip${isSolved ? " done" : isAttempted ? " weak" : ""}`;
              const chipLabel = isSolved ? `★Q${questionNo}` : isAttempted ? `△Q${questionNo}` : `Q${questionNo}`;
              chips.push(`
                <button
                  type="button"
                  class="${chipClass}"
                  data-action="single"
                  data-topic-id="${escapeAttr(topic.id)}"
                  data-question-no="${questionNo}"
                  data-section-name="${escapeAttr(section.name)}"
                >${chipLabel}</button>
              `);
            }

            return `
              <details class="sectionFold" ${sectionOpen}>
                <summary class="${summaryClass}">
                  <span class="sectionFoldTitle">${isCleared ? "★" : "☆"} S${sectionNo} ${escapeHtml(section.name)}</span>
                  <span class="sectionFoldMeta">Q${section.start}-${section.end} / ${count}問 / 周回進捗 ${sectionGauge.done}/${sectionGauge.total} (${sectionGauge.percent}%) / 個別演習 正解済み ${solvedCount}/${count}（回答 ${attemptedCount}/${count}） / ${miniHint}</span>
                  <span class="summaryGauge"><span class="summaryGaugeFill" style="width: ${sectionGauge.percent}%"></span></span>
                </summary>
                <div class="sectionFoldBody">
                  <div class="questionChipWrap">${chips.join("")}</div>
                  <div class="row">
                    <button
                      type="button"
                      data-action="reset-section"
                      data-topic-id="${escapeAttr(topic.id)}"
                      data-section-index="${section.index}"
                    >このセクション進捗をリセット</button>
                  </div>
                </div>
              </details>
            `;
          }).join("");

          return `
            <details class="sectionGroupFold" ${groupOpen}>
              <summary class="sectionGroupSummary">
                <span class="sectionGroupTitle">セクション S${firstNo} - S${lastNo}</span>
                <span class="sectionGroupMeta">★ ${groupCleared}/${group.length}</span>
              </summary>
              <div class="sectionGroupBody">
                ${sectionHtml}
              </div>
            </details>
          `;
        }).join("");

        return `
          <details class="topicFold" ${topicOpen}>
            <summary class="topicFoldSummary">
              <span class="topicFoldTitle">${topicIndex + 1}. ${escapeHtml(topic.name)}</span>
              <span class="topicFoldMeta">★ ${topicClearedSections}/${topicTotalSections} / 進捗 ${topicGauge.percent}%</span>
              <span class="summaryGauge"><span class="summaryGaugeFill" style="width: ${topicGauge.percent}%"></span></span>
            </summary>
            <div class="topicFoldBody">
              ${sectionGroupHtml}
            </div>
          </details>
        `;
      })
      .join("");
  }

  function renderSinglePractice() {
    const idle = byId("singleIdle");
    const active = byId("singleActive");
    const choicesWrap = byId("singleChoicesWrap");
    const applyBtn = byId("singleApplyBtn");
    const resultBadge = byId("singleResultBadge");
    const explanation = byId("singleExplanationAccordion");

    if (!state.singlePractice.active) {
      idle.classList.remove("hidden");
      active.classList.add("hidden");
      byId("singleMessage").textContent = state.singlePractice.message || "";
      return;
    }

    const current = getCurrentSingleQuestionContext();
    if (!current) {
      state.singlePractice = defaultSinglePractice();
      saveState();
      idle.classList.remove("hidden");
      active.classList.add("hidden");
      byId("singleMessage").textContent = "個別演習を終了しました。";
      return;
    }

    const detail = getQuestionDetail(current.topic.id, current.questionNo, false);
    const section = getCurrentSection(current.topic, current.questionNo);
    const stat = getQuestionStat(current.topic.id, current.questionNo);

    idle.classList.add("hidden");
    active.classList.remove("hidden");
    byId("singleQuestionHead").textContent = `${current.topic.name} / ${section.name} / Q${current.questionNo}`;
    byId("singleProgress").textContent = `個別演習: Q${current.questionNo}/${current.topic.total} / この問題の実績 正解${stat.correct}・誤答${stat.wrong}`;
    byId("singlePrompt").textContent = detail.prompt;
    byId("singlePrevBtn").disabled = current.questionNo <= 1;
    byId("singleNextBtn").disabled = current.questionNo >= current.topic.total;

    const showResult = state.singlePractice.showExplanation && typeof state.singlePractice.pendingResult === "boolean";
    choicesWrap.innerHTML = detail.choices
      .map((choice, index) => {
        const label = `${index + 1}. ${choice}`;
        const disabled = showResult ? "disabled" : "";
        let mark = "";
        let markClass = "";
        if (showResult) {
          if (index === detail.correctIndex) {
            mark = "○";
            markClass = "ok";
          } else if (index === state.singlePractice.selectedChoice && state.singlePractice.selectedChoice !== detail.correctIndex) {
            mark = "×";
            markClass = "ng";
          }
        }
        return `
          <button type="button" class="choiceBtn" data-choice-index="${index}" ${disabled}>
            <span class="choiceText">${escapeHtml(label)}</span>
            <span class="choiceMark ${markClass}">${mark}</span>
          </button>
        `;
      })
      .join("");

    if (showResult) {
      const isCorrect = state.singlePractice.pendingResult === true;
      resultBadge.textContent = isCorrect ? "○ 正解" : "× 不正解";
      resultBadge.classList.toggle("ok", isCorrect);
      resultBadge.classList.toggle("ng", !isCorrect);
      applyBtn.classList.remove("hidden");
      explanation.classList.remove("hidden");
      explanation.open = true;

      const picked = detail.choices[state.singlePractice.selectedChoice] || "未選択";
      const correct = detail.choices[detail.correctIndex] || "";
      byId("singleChoiceLine").textContent = `あなたの回答: ${picked} / 正解: ${correct}`;
      byId("singleEasyLine").textContent = buildFriendlyDrillNote(current.topic, detail);
      byId("singleExplanationLine").textContent = `解説: ${enhanceExplanationLine(detail.explanation, detail)}`;
      byId("singlePitfallLine").textContent = `間違えやすい点: ${enhancePitfallLine(detail.pitfall, detail)}`;
    } else {
      resultBadge.textContent = "";
      resultBadge.classList.remove("ok", "ng");
      applyBtn.classList.add("hidden");
      explanation.classList.add("hidden");
      explanation.open = false;
      byId("singleChoiceLine").textContent = "";
      byId("singleEasyLine").textContent = "";
      byId("singleExplanationLine").textContent = "";
      byId("singlePitfallLine").textContent = "";
    }

    byId("singleMessage").textContent = state.singlePractice.message || "選択肢を選んで解説を確認してください。";
  }

  function renderTodayPlan() {
    const today = todayISO();
    if (state.todayPlan.date !== today || state.todayPlan.tasks.length === 0) {
      generateTodayPlan(false);
    }

    const list = byId("todayPlanList");
    const preview = byId("todayPreviewList");
    list.innerHTML = "";
    preview.innerHTML = "";

    const plannedCount = state.todayPlan.tasks.reduce((sum, task) => sum + Math.max(0, Number(task.count) || 0), 0);
    let doneCount = 0;
    for (const task of state.todayPlan.tasks) {
      const progress = state.progress[task.topicId] || defaultProgress();
      const baseRaw = Number(task.attemptBase);
      const attemptBase = Number.isFinite(baseRaw) ? Math.max(0, Math.round(baseRaw)) : progress.attempts;
      const delta = Math.max(0, progress.attempts - attemptBase);
      doneCount += Math.min(task.count, delta);
    }

    if (state.todayPlan.tasks.length === 0) {
      const li = document.createElement("li");
      li.textContent = "全セットをクリア済み。模試または記述式の再演習を実施。";
      list.appendChild(li);
      preview.innerHTML = "<p class=\"note\">予習: 模試の見直し用に、間違えやすいポイントを3つ読み返してください。</p>";
      setGauge("todayPlanGaugeFill", "todayPlanGaugeLabel", 1, 1, "完了");
      return;
    }

    setGauge("todayPlanGaugeFill", "todayPlanGaugeLabel", doneCount, plannedCount, "0%");

    const previewCards = [];
    for (const task of state.todayPlan.tasks) {
      const topic = state.topics.find((item) => item.id === task.topicId);
      if (!topic) {
        continue;
      }
      const progress = state.progress[topic.id] || defaultProgress();
      const section = getCurrentSection(topic, progress.nextQuestion);
      const primerHtml = buildSectionPreStudyAccordionHtml(topic, section, { openFirst: true });

      previewCards.push(`
        <article class="previewItem">
          <p class="previewTitle">${escapeHtml(topic.name)} / ${escapeHtml(section.name)} (Q${section.start}-${section.end})</p>
          <div class="primerQuestionList">${primerHtml}</div>
          <div class="row">
            <button
              type="button"
              data-action="open-primer"
              data-topic-id="${escapeAttr(topic.id)}"
              data-section-index="${section.index}"
            >このセクションの全問題を読む</button>
          </div>
        </article>
      `);
    }
    preview.innerHTML = previewCards.join("");

    for (const task of state.todayPlan.tasks) {
      const topic = state.topics.find((item) => item.id === task.topicId);
      if (!topic) {
        continue;
      }
      const progress = state.progress[topic.id] || defaultProgress();
      const baseRaw = Number(task.attemptBase);
      const attemptBase = Number.isFinite(baseRaw) ? Math.max(0, Math.round(baseRaw)) : progress.attempts;
      const delta = Math.max(0, progress.attempts - attemptBase);
      const taskDone = Math.min(task.count, delta);
      const section = getCurrentSection(topic, progress.nextQuestion);
      const li = document.createElement("li");
      li.textContent = `${topic.name}: ${taskDone}/${task.count}問 (現在 ${section.name} Q${section.start}-${section.end}, 周回 ${progress.perfectRounds}/${state.settings.targetPerfectRounds})`;
      list.appendChild(li);
    }
  }

  function getTodayPlannedCount() {
    return state.todayPlan.tasks.reduce((sum, task) => sum + Math.max(0, Number(task.count) || 0), 0);
  }

  function renderPrimerBook() {
    const topicSelect = byId("primerTopicSelect");
    const sectionSelect = byId("primerSectionSelect");
    const sectionMeta = byId("primerSectionMeta");
    const list = byId("primerQuestionList");

    if (state.topics.length === 0) {
      topicSelect.innerHTML = "";
      sectionSelect.innerHTML = "";
      sectionMeta.textContent = "問題セットがありません。";
      list.innerHTML = "";
      return;
    }

    topicSelect.innerHTML = state.topics
      .map((topic) => `<option value="${escapeAttr(topic.id)}">${escapeHtml(topic.name)}</option>`)
      .join("");

    const selectedTopic = state.topics.find((topic) => topic.id === state.primerView.topicId) || state.topics[0];
    state.primerView.topicId = selectedTopic.id;
    topicSelect.value = selectedTopic.id;

    const sections = getTopicSections(selectedTopic);
    const maxIndex = Math.max(0, sections.length - 1);
    state.primerView.sectionIndex = Math.min(Math.max(0, state.primerView.sectionIndex), maxIndex);
    const selectedSection = sections[state.primerView.sectionIndex];

    sectionSelect.innerHTML = sections
      .map((section) => {
        const sectionNo = section.index + 1;
        return `<option value="${section.index}">S${sectionNo} ${escapeHtml(section.name)} (Q${section.start}-${section.end})</option>`;
      })
      .join("");
    sectionSelect.value = String(selectedSection.index);

    byId("primerPrevSectionBtn").disabled = selectedSection.index <= 0;
    byId("primerNextSectionBtn").disabled = selectedSection.index >= maxIndex;

    const questionsInSection = selectedSection.end - selectedSection.start + 1;
    sectionMeta.textContent = `${selectedTopic.name} / ${selectedSection.name} / Q${selectedSection.start}-${selectedSection.end} (${questionsInSection}問)`;

    list.innerHTML = buildSectionPreStudyAccordionHtml(selectedTopic, selectedSection, { openFirst: true });
  }

  function renderDrill() {
    const idle = byId("drillIdle");
    const active = byId("drillActive");
    const questionPanel = byId("drillQuestionPanel");
    const choicesWrap = byId("drillChoicesWrap");
    const writtenWrap = byId("drillWrittenWrap");
    const writtenInput = byId("drillWrittenInput");
    const writtenSubmitBtn = byId("drillWrittenSubmitBtn");
    const nextBtn = byId("applyReviewResultBtn");
    const skipBtn = byId("skipBtn");
    const editBtn = byId("editCurrentQuestionBtn");
    const resultInline = byId("drillResultInline");
    const resultBadge = byId("drillResultBadge");
    const explanationAccordion = byId("drillExplanationAccordion");
    const drillStartFromTabBtn = byId("drillStartFromTabBtn");
    const doneCount = state.drill.queue.length > 0
      ? Math.min(state.drill.pointer, state.drill.queue.length)
      : 0;
    const todayPlannedCount = getTodayPlannedCount();
    byId("drillRuleTop").textContent = `ルール: 各セクションを${state.settings.targetPerfectRounds}回連続満点でクリア。不正解でそのセクション先頭へ戻る。`;

    if (state.drill.active) {
      setGauge("drillGaugeFill", "drillGaugeLabel", doneCount, state.drill.queue.length, "0%");
      drillStartFromTabBtn.textContent = "ドリル再開始";
    } else {
      setGauge("drillGaugeFill", "drillGaugeLabel", 0, todayPlannedCount, "未開始");
      drillStartFromTabBtn.textContent = "この画面からドリル開始";
    }

    if (!state.drill.active) {
      idle.classList.remove("hidden");
      active.classList.add("hidden");
      nextBtn.classList.add("hidden");
      skipBtn.classList.remove("hidden");
      editBtn.classList.remove("hidden");
      byId("drillMessage").textContent = state.drill.message || "";
      byId("drillPrevBtn").disabled = true;
      byId("drillNavNextBtn").disabled = true;
      byId("drillResetSectionBtn").disabled = true;
      byId("drillResetTopicBtn").disabled = true;
      byId("drillProgress").textContent = "";
      byId("drillQuestion").textContent = "";
      byId("drillPrompt").textContent = "";
      choicesWrap.innerHTML = "";
      choicesWrap.classList.remove("hidden");
      writtenWrap.classList.add("hidden");
      writtenInput.value = "";
      writtenInput.disabled = false;
      writtenSubmitBtn.classList.remove("hidden");
      writtenSubmitBtn.disabled = false;
      resultInline.classList.add("hidden");
      resultBadge.textContent = "";
      resultBadge.classList.remove("ok", "ng");
      explanationAccordion.classList.add("hidden");
      explanationAccordion.open = false;
      byId("drillChoiceLine").textContent = "";
      byId("drillEasyLine").textContent = "";
      byId("drillExplanationLine").textContent = "";
      byId("drillPitfallLine").textContent = "";
      byId("drillTermsLine").textContent = "";
      return;
    }

    const current = getCurrentDrillQuestionContext();
    if (!current) {
      state.drill.pointer += 1;
      finalizeDrillIfDone();
      saveState();
      renderAll();
      return;
    }

    const packet = getDrillQuestionPacket(current.topic, current.questionNo);
    const format = packet.format;
    const formatLabel = packet.formatLabel;
    const detail = packet.detail;

    idle.classList.add("hidden");
    active.classList.remove("hidden");
    questionPanel.classList.remove("hidden");
    byId("drillPrevBtn").disabled = state.drill.pointer <= 0;
    byId("drillNavNextBtn").disabled = false;
    byId("drillResetSectionBtn").disabled = false;
    byId("drillResetTopicBtn").disabled = false;

    const section = getCurrentSection(current.topic, current.questionNo);
    if (state.drill.singleMode) {
      byId("drillProgress").textContent = `進捗: ${Math.min(state.drill.pointer + 1, state.drill.queue.length)}/${state.drill.queue.length}（単問）`;
      byId("drillQuestion").textContent = `出題: ${current.topic.name} / ${section.name} / Q${current.questionNo} [${formatLabel}]`;
      byId("drillRuleTop").textContent = "ルール: 単問モード。この1問だけ解いて終了します。";
    } else {
      byId("drillProgress").textContent = `進捗: ${state.drill.pointer + 1} / ${state.drill.queue.length} 問`;
      byId("drillQuestion").textContent = `出題: ${current.topic.name} / ${section.name} / Q${current.questionNo} (${section.start}-${section.end}) [${formatLabel}]`;
    }

    byId("drillPrompt").textContent = buildDrillPromptText(detail.prompt, formatLabel);
    const showResult = state.drill.showExplanation && typeof state.drill.pendingResult === "boolean";
    const isWritten = format === "written";

    if (isWritten) {
      choicesWrap.innerHTML = "";
      choicesWrap.classList.add("hidden");
      writtenWrap.classList.remove("hidden");
      writtenInput.disabled = showResult;
      writtenInput.value = state.drill.writtenAnswer || "";
      writtenSubmitBtn.classList.toggle("hidden", showResult);
      writtenSubmitBtn.disabled = showResult;
    } else {
      writtenWrap.classList.add("hidden");
      writtenInput.value = "";
      writtenInput.disabled = false;
      writtenSubmitBtn.classList.remove("hidden");
      writtenSubmitBtn.disabled = false;
      choicesWrap.classList.remove("hidden");
      choicesWrap.innerHTML = detail.choices
        .map((choice, index) => {
          const label = `${index + 1}. ${choice}`;
          const disabled = showResult ? "disabled" : "";
          let mark = "";
          let markClass = "";
          if (showResult) {
            if (index === detail.correctIndex) {
              mark = "○";
              markClass = "ok";
            } else if (index === state.drill.selectedChoice && state.drill.selectedChoice !== detail.correctIndex) {
              mark = "×";
              markClass = "ng";
            }
          }
          return `
            <button type="button" class="choiceBtn" data-choice-index="${index}" ${disabled}>
              <span class="choiceText">${escapeHtml(label)}</span>
              <span class="choiceMark ${markClass}">${mark}</span>
            </button>
          `;
        })
        .join("");
    }

    if (showResult) {
      const isCorrect = state.drill.pendingResult === true;
      resultInline.classList.remove("hidden");
      nextBtn.classList.remove("hidden");
      resultBadge.textContent = isCorrect ? "○ 正解" : "× 不正解";
      resultBadge.classList.toggle("ok", isCorrect);
      resultBadge.classList.toggle("ng", !isCorrect);
      explanationAccordion.classList.remove("hidden");
      explanationAccordion.open = true;
      skipBtn.classList.add("hidden");
      editBtn.classList.add("hidden");

      if (isWritten) {
        const canonical = String(detail.answer || detail.choices[detail.correctIndex] || "").trim();
        byId("drillChoiceLine").textContent = `あなたの回答: ${state.drill.writtenAnswer || "未入力"} / 模範要点: ${canonical}`;
      } else {
        const picked = detail.choices[state.drill.selectedChoice] || "未選択";
        const correct = detail.choices[detail.correctIndex] || "";
        byId("drillChoiceLine").textContent = `あなたの回答: ${picked} / 正解: ${correct}`;
      }
      byId("drillEasyLine").textContent = buildFriendlyDrillNote(current.topic, detail);
      byId("drillExplanationLine").textContent = `解説: ${enhanceExplanationLine(detail.explanation, detail)}`;
      byId("drillPitfallLine").textContent = `間違えやすい点: ${enhancePitfallLine(detail.pitfall, detail)}`;
      const trendTail = detail.trendTag ? ` / ${detail.trendTag}` : "";
      byId("drillTermsLine").textContent = `関連用語: ${detail.terms.join(" / ")}${trendTail}`;
      byId("drillMessage").textContent = state.drill.message || "解説を確認したら次の問題へ進んでください。";
      return;
    }

    resultInline.classList.add("hidden");
    nextBtn.classList.add("hidden");
    resultBadge.textContent = "";
    resultBadge.classList.remove("ok", "ng");
    explanationAccordion.classList.add("hidden");
    explanationAccordion.open = false;
    skipBtn.classList.remove("hidden");
    editBtn.classList.remove("hidden");
    byId("drillChoiceLine").textContent = "";
    byId("drillEasyLine").textContent = "";
    byId("drillExplanationLine").textContent = "";
    byId("drillPitfallLine").textContent = "";
    byId("drillTermsLine").textContent = "";
    byId("drillMessage").textContent = state.drill.message || (isWritten
      ? "記述欄に回答し『回答を判定』を押してください。"
      : `${formatLabel}から1つ選んでください。`);
  }

  function renderQuestionEditor() {
    const select = byId("questionTopicSelect");
    const currentTopicId = state.questionEditor.topicId;

    select.innerHTML = state.topics
      .map((topic) => `<option value="${escapeAttr(topic.id)}">${escapeHtml(topic.name)}</option>`)
      .join("");

    if (state.topics.some((topic) => topic.id === currentTopicId)) {
      select.value = currentTopicId;
    } else if (state.topics.length > 0) {
      select.value = state.topics[0].id;
      state.questionEditor.topicId = state.topics[0].id;
    }

    state.questionEditor.questionNo = clampQuestionNo(state.questionEditor.topicId, state.questionEditor.questionNo);
    byId("questionNumberInput").value = String(state.questionEditor.questionNo);

    const detail = getQuestionDetail(state.questionEditor.topicId, state.questionEditor.questionNo, false);

    byId("questionPromptInput").value = detail.prompt;
    byId("questionChoice1Input").value = detail.choices[0] || "";
    byId("questionChoice2Input").value = detail.choices[1] || "";
    byId("questionChoice3Input").value = detail.choices[2] || "";
    byId("questionCorrectIndexSelect").value = String(detail.correctIndex);
    byId("questionAnswerInput").value = detail.answer;
    byId("questionExplanationInput").value = detail.explanation;
    byId("questionPitfallInput").value = detail.pitfall;
    byId("questionTermsInput").value = detail.terms.join(", ");
    byId("questionEditorMessage").textContent = state.questionEditor.message || "";
  }

  function renderMiniTest() {
    const idle = byId("miniTestIdle");
    const active = byId("miniTestActive");

    if (!state.miniTest.active) {
      idle.classList.remove("hidden");
      active.classList.add("hidden");
      byId("miniTestChoicesWrap").innerHTML = "";
      byId("miniTestQuestionPrompt").textContent = "";
      byId("miniTestMessage").textContent = state.miniTest.message || "";
      return;
    }

    idle.classList.add("hidden");
    active.classList.remove("hidden");

    const item = state.miniTest.queue[state.miniTest.pointer];
    if (!item) {
      finishMiniTest("小テストを終了しました。");
      return;
    }

    const topic = state.topics.find((entry) => entry.id === item.topicId);
    if (!topic) {
      state.miniTest.pointer += 1;
      saveState();
      renderMiniTest();
      return;
    }

    const detail = getQuestionDetail(item.topicId, item.questionNo, false);

    byId("miniTestProgress").textContent = `進捗: ${state.miniTest.pointer + 1}/${state.miniTest.queue.length}問`;
    byId("miniTestQuestionHead").textContent = `小テスト / ${topic.name} Q${item.questionNo}`;
    byId("miniTestQuestionPrompt").textContent = buildExamStylePrompt(topic, detail, "小テスト");
    byId("miniTestChoicesWrap").innerHTML = buildExamChoicesHtml(detail.choices);
    byId("miniTestMessage").textContent = state.miniTest.message || "学習3択を選択してください。";
  }

  function renderMockExam() {
    byId("mockExamSpec").textContent = OFFICIAL_SPEC_TEXT;

    const idle = byId("mockIdle");
    const active = byId("mockActive");

    if (!state.mock.active) {
      idle.classList.remove("hidden");
      active.classList.add("hidden");
      byId("mockChoicesWrap").innerHTML = "";
      byId("mockQuestionExplain").textContent = "";
      byId("mockMessage").textContent = state.mock.message || "";
      return;
    }

    idle.classList.add("hidden");
    active.classList.remove("hidden");

    const remain = Math.max(0, secondsUntil(state.mock.endsAt));
    byId("mockTimer").textContent = formatAsMinSec(remain);

    const totalPoints = state.mock.queue.reduce((sum, item) => sum + item.points, 0);
    byId("mockProgress").textContent = `進捗: ${state.mock.pointer + 1}/${state.mock.queue.length}問, 現在得点 ${state.mock.score}/${totalPoints}`;

    const item = state.mock.queue[state.mock.pointer];
    if (!item) {
      finishMockExam("模試を終了しました。");
      return;
    }

    const topic = state.topics.find((entry) => entry.id === item.topicId);
    if (!topic) {
      handleMockAnswer("hold");
      return;
    }

    const detail = getQuestionDetail(item.topicId, item.questionNo, false);

    byId("mockQuestionHead").textContent = `${item.format} / ${topic.name} Q${item.questionNo} / ${item.points}点`;
    byId("mockQuestionPrompt").textContent = buildExamStylePrompt(topic, detail, "模試");
    byId("mockChoicesWrap").innerHTML = buildExamChoicesHtml(detail.choices);
    byId("mockQuestionExplain").textContent = "本番風の文体で出題中（学習モードは3択）。";
    byId("mockMessage").textContent = state.mock.message || "";
  }

  function renderGlossary() {
    const query = byId("glossarySearchInput").value.trim().toLowerCase();

    const filtered = state.glossary.filter((entry) => {
      if (!query) {
        return true;
      }
      return `${entry.term} ${entry.definition} ${entry.pitfall}`.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      byId("glossaryTableWrap").innerHTML = "<p class=\"note\">該当する用語がありません。</p>";
      return;
    }

    const rows = filtered
      .map((entry) => `
        <tr>
          <td>${escapeHtml(entry.term)}</td>
          <td>${escapeHtml(entry.definition)}</td>
          <td>${escapeHtml(entry.pitfall || "-")}</td>
          <td><button type="button" data-action="delete" data-term="${escapeAttr(entry.term)}">削除</button></td>
        </tr>
      `)
      .join("");

    byId("glossaryTableWrap").innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>用語</th>
            <th>定義</th>
            <th>混同ポイント</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function renderPitfalls() {
    const list = byId("pitfallList");
    list.innerHTML = "";

    for (const tip of DEFAULT_PITFALLS) {
      const li = document.createElement("li");
      li.textContent = tip;
      list.appendChild(li);
    }

    const heatItems = Object.entries(state.pitfallHeatmap)
      .map(([key, count]) => {
        const [topicId, questionNoRaw] = key.split(":");
        const questionNo = Number(questionNoRaw);
        const topic = state.topics.find((item) => item.id === topicId);
        if (!topic) {
          return null;
        }
        const detail = getQuestionDetail(topicId, questionNo, false);
        return {
          topic,
          questionNo,
          count,
          pitfall: detail.pitfall
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    if (heatItems.length === 0) {
      const li = document.createElement("li");
      li.textContent = "誤答ログはまだありません。ドリル/模試で不正解になると自動で蓄積します。";
      list.appendChild(li);
      return;
    }

    for (const item of heatItems) {
      const li = document.createElement("li");
      li.textContent = `誤答頻度 ${item.count}回: ${item.topic.name} Q${item.questionNo} / ${item.pitfall}`;
      list.appendChild(li);
    }
  }

  function renderCurriculum() {
    const list = byId("curriculumList");
    list.innerHTML = "";

    const totalSections = state.topics.reduce((sum, topic) => sum + getTopicSections(topic).length, 0);
    const clearedSections = state.topics.reduce((sum, topic) => {
      const progress = state.progress[topic.id] || defaultProgress();
      return sum + Math.min(getTopicSections(topic).length, progress.sectionClears);
    }, 0);
    const completeDaysLeft = getDaysUntilCompleteDate();
    setGauge("curriculumGaugeFill", "curriculumGaugeLabel", clearedSections, totalSections, "0%");
    byId("curriculumGaugeNote").textContent = completeDaysLeft >= 0
      ? `仕上げ期限まであと${completeDaysLeft}日。小テストは5セクションクリアごとに実施。`
      : `仕上げ期限を過ぎています（${Math.abs(completeDaysLeft)}日超過）。弱点優先で圧縮学習してください。`;

    const items = buildCurriculumItems();
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    }
  }

  function renderResearch() {
    byId("researchUpdatedAt").textContent = RESEARCH_UPDATED_AT;

    const list = byId("researchList");
    const trendList = byId("researchTrendList");
    const forecastList = byId("researchForecastList");
    const policyNote = byId("researchPolicyNote");
    list.innerHTML = "";

    for (const source of RESEARCH_SOURCES) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${escapeHtml(source.title)}:</strong> ${escapeHtml(source.insight)} <a href="${escapeAttr(source.url)}" target="_blank" rel="noreferrer noopener">出典</a>`;
      list.appendChild(li);
    }

    if (trendList) {
      trendList.innerHTML = "";
      for (const item of PAST5_ANALYSIS_SUMMARY) {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${escapeHtml(item.topicLabel)}（頻度:${escapeHtml(item.frequency)}）</strong><br>${escapeHtml(item.trend)}<br><span class="noteInline">対策: ${escapeHtml(item.measure)}</span>`;
        trendList.appendChild(li);
      }
    }

    if (forecastList) {
      forecastList.innerHTML = "";
      for (const forecast of FORECAST_2026_STRATEGY) {
        const li = document.createElement("li");
        li.textContent = forecast;
        forecastList.appendChild(li);
      }
    }

    if (policyNote) {
      policyNote.textContent = `注記: ドリルは過去5年傾向ベース問題を優先し、予想問題は約${FORECAST_INSERT_INTERVAL}問に1問の割合で挿入します（オリジナル問題）。`;
    }
  }

  function getSectionSizeForTopic(topic) {
    if (topic.category === "describe") {
      return 4;
    }
    return 5;
  }

  function getTopicSections(topic) {
    const total = Math.max(1, Math.round(Number(topic.total) || 1));
    const sectionSize = Math.max(3, getSectionSizeForTopic(topic));
    const labels = TOPIC_SECTION_LABELS[topic.id] || [topic.name.replace(" 肢別", "")];
    const chunks = [];
    const labelCounter = {};

    let index = 0;
    let start = 1;
    while (start <= total) {
      const end = Math.min(total, start + sectionSize - 1);
      const baseLabel = labels[index % labels.length];
      labelCounter[baseLabel] = (labelCounter[baseLabel] || 0) + 1;
      const suffix = labels.length === 1 ? labelCounter[baseLabel] : Math.ceil((index + 1) / labels.length);
      const name = `${baseLabel} ${suffix}`;
      chunks.push({
        index,
        name,
        start,
        end
      });
      index += 1;
      start = end + 1;
    }

    return chunks;
  }

  function getCurrentSection(topic, questionNo) {
    const sections = getTopicSections(topic);
    for (const section of sections) {
      if (questionNo >= section.start && questionNo <= section.end) {
        return section;
      }
    }
    return sections[sections.length - 1];
  }

  function getSectionProgressLabel(topic, progress) {
    const sections = getTopicSections(topic);
    const totalSections = sections.length;
    if (progress.mastered) {
      return `完了 ${totalSections}/${totalSections}`;
    }
    const current = getCurrentSection(topic, progress.nextQuestion);
    return `${current.name} (${progress.sectionClears}/${totalSections})`;
  }

  function getTopicGaugeProgress(topic, progress) {
    const sections = getTopicSections(topic);
    const totalSections = sections.length;
    if (totalSections <= 0) {
      return {
        done: 0,
        total: 0,
        percent: 0
      };
    }

    const cleared = Math.max(0, Math.min(totalSections, Math.round(Number(progress.sectionClears) || 0)));
    const currentSection = getCurrentSection(topic, progress.nextQuestion);
    const currentSectionGauge = getSectionGaugeProgress(topic, progress, currentSection);
    let done = cleared;
    if (!progress.mastered && currentSection.index === cleared) {
      done += currentSectionGauge.percent / 100;
    }

    const safeDone = Math.max(0, Math.min(totalSections, done));
    const percent = Math.round((safeDone / totalSections) * 100);

    return {
      done: Number(safeDone.toFixed(2)),
      total: totalSections,
      percent
    };
  }

  function getSectionGaugeProgress(topic, progress, section) {
    const sectionSize = Math.max(1, section.end - section.start + 1);
    const targetRounds = Math.max(1, Math.round(Number(state.settings.targetPerfectRounds) || 1));
    const total = sectionSize * targetRounds;
    const cleared = Math.max(0, Math.round(Number(progress.sectionClears) || 0));

    let done = 0;
    if (progress.mastered || section.index < cleared) {
      done = total;
    } else if (section.index > cleared) {
      done = 0;
    } else {
      const safeRounds = Math.max(0, Math.round(Number(progress.perfectRounds) || 0));
      const safeNext = clampQuestionNo(topic.id, progress.nextQuestion);
      const answeredInRound = Math.max(0, Math.min(sectionSize, safeNext - section.start));
      done = Math.min(total, safeRounds * sectionSize + answeredInRound);
    }

    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return {
      done,
      total,
      percent
    };
  }

  function onSectionCleared(topic, section) {
    state.trainingCycle.sectionClearsSinceMiniTest += 1;

    if (state.trainingCycle.sectionClearsSinceMiniTest >= SECTION_CLEAR_TARGET) {
      state.trainingCycle.pendingMiniTest = true;
      state.drill.message = `${topic.name} ${section.name} クリア。${SECTION_CLEAR_TARGET}セクション到達のため、小テストへ進んでください。`;
    }
  }

  function getCurrentDrillQuestionContext() {
    if (!state.drill.active) {
      return null;
    }

    const queueItem = state.drill.queue[state.drill.pointer];
    if (!queueItem) {
      return null;
    }
    const topicId = typeof queueItem === "string"
      ? queueItem
      : String(queueItem.topicId || "");
    const topic = state.topics.find((item) => item.id === topicId);
    if (!topic) {
      return null;
    }

    const progress = state.progress[topic.id] || defaultProgress();
    let questionNo = 0;
    if (state.drill.singleMode) {
      questionNo = clampQuestionNo(topic.id, state.drill.singleQuestionNo);
      if (typeof queueItem === "object") {
        queueItem.questionNo = questionNo;
      }
    } else if (typeof queueItem === "object" && queueItem.questionNo > 0) {
      questionNo = clampQuestionNo(topic.id, queueItem.questionNo);
    } else {
      questionNo = clampQuestionNo(topic.id, progress.nextQuestion);
      if (typeof queueItem === "object") {
        queueItem.questionNo = questionNo;
      }
    }

    return {
      topic,
      questionNo
    };
  }

  function resolveDrillSectionFormat(topic, section, questionNo) {
    if (!topic || !section) {
      return "five";
    }
    const rules = DRILL_SECTION_FORMAT_RULES[topic.id];
    if (!Array.isArray(rules) || rules.length === 0) {
      return topic.id === "describe" ? "written" : "five";
    }
    const sectionName = String(section.name || "");
    for (const rule of rules) {
      const key = String((rule && rule.match) || "");
      if (!key || sectionName.includes(key)) {
        return String((rule && rule.format) || (topic.id === "describe" ? "written" : "five"));
      }
    }
    const fallback = String((rules[rules.length - 1] && rules[rules.length - 1].format) || "");
    if (fallback === "written" || fallback === "five") {
      return fallback;
    }
    return topic.id === "describe" ? "written" : "five";
  }

  function getDrillQuestionPacket(topic, questionNo) {
    const detail = getQuestionDetail(topic.id, questionNo, false);
    const section = getCurrentSection(topic, questionNo);
    const format = resolveDrillSectionFormat(topic, section, questionNo);
    const formatLabel = format === "written" ? "記述式" : "5択";

    if (format === "five") {
      return {
        format,
        formatLabel,
        detail: buildFiveChoiceDetail(topic, questionNo, detail)
      };
    }

    return {
      format,
      formatLabel,
      detail
    };
  }

  function buildFiveChoiceDetail(topic, questionNo, detail) {
    const safe = normalizeQuestion(detail);
    if (!Array.isArray(safe.choices) || safe.choices.length === 0) {
      return safe;
    }
    const parsedCorrect = Math.round(Number(safe.correctIndex));
    const safeCorrectIndex = Number.isInteger(parsedCorrect) && parsedCorrect >= 0 && parsedCorrect < safe.choices.length
      ? parsedCorrect
      : 0;
    const correctText = String(safe.choices[safeCorrectIndex] || "").trim();
    if (!correctText) {
      return safe;
    }

    const bank = resolveAutoChoiceBank(topic.id, questionNo);
    const pool = buildTopicDistractorPool(bank, correctText);
    const distractors = pickTopicDistractors(pool, correctText, 4, `${topic.id}:${questionNo}:five`);
    const fallbackPool = safe.choices
      .filter((choice, index) => index !== safeCorrectIndex)
      .map((choice) => String(choice || "").trim())
      .filter(Boolean);
    for (const fallback of fallbackPool) {
      if (distractors.length >= 4) {
        break;
      }
      if (!distractors.some((item) => normalizeKeyText(item) === normalizeKeyText(fallback))) {
        distractors.push(fallback);
      }
    }
    while (distractors.length < 4) {
      const n = distractors.length + 1;
      const filler = `${topic.name}の一般論${n}`;
      if (!distractors.some((item) => normalizeKeyText(item) === normalizeKeyText(filler))) {
        distractors.push(filler);
      } else {
        break;
      }
    }

    const baseChoices = [correctText, ...distractors.slice(0, 4)];
    const order = buildDeterministicOrder(baseChoices.length, `${topic.id}:${questionNo}:five-order`);
    const shuffledChoices = order.map((index) => baseChoices[index]);
    const nextCorrectIndex = Math.max(0, order.indexOf(0));

    return {
      ...safe,
      choices: shuffledChoices,
      correctIndex: nextCorrectIndex
    };
  }

  function judgeWrittenDrillAnswer(detail, inputText) {
    const rawInput = String(inputText || "").trim();
    if (!rawInput) {
      return false;
    }
    const inputKey = normalizeKeyText(rawInput);
    if (!inputKey) {
      return false;
    }

    const answerCandidates = [
      String(detail.answer || "").trim(),
      String(detail.choices[detail.correctIndex] || "").trim(),
      String(detail.explanation || "").trim()
    ].filter(Boolean);

    const answerKeywords = new Set();
    for (const source of answerCandidates) {
      for (const token of buildWrittenKeywords(source)) {
        answerKeywords.add(token);
      }
    }
    if (Array.isArray(detail.terms)) {
      for (const term of detail.terms) {
        const token = normalizeKeyText(term);
        if (token && token.length >= 2) {
          answerKeywords.add(token);
        }
      }
    }

    const keywords = Array.from(answerKeywords).filter((token) => token.length >= 2);
    if (keywords.length === 0) {
      return false;
    }

    const matched = keywords.filter((token) => inputKey.includes(token));
    const target = Math.min(2, Math.max(1, Math.ceil(keywords.length * 0.25)));
    return matched.length >= target;
  }

  function buildWrittenKeywords(text) {
    return String(text || "")
      .replace(/[【】「」『』（）()［］\[\]{}]/gu, " ")
      .split(/[\s、。,:：;；!?！？・\-/]+/u)
      .map((token) => normalizeKeyText(token))
      .filter(Boolean);
  }

  function getQuestionDetail(topicId, questionNo, autoCreate) {
    const topic = state.topics.find((item) => item.id === topicId);
    if (!topic) {
      return {
        prompt: "問題セットが存在しません。",
        choices: ["-", "-", "-"],
        correctIndex: 0,
        answer: "",
        explanation: "",
        pitfall: "",
        terms: [],
        trendTag: ""
      };
    }

    if (!state.questionBank[topicId] || typeof state.questionBank[topicId] !== "object") {
      state.questionBank[topicId] = {};
    }

    const key = String(questionNo);
    const stored = state.questionBank[topicId][key];
    if (stored) {
      const normalized = normalizeQuestion(stored);
      state.questionBank[topicId][key] = normalized;
      if (autoCreate) {
        saveState();
      }
      return withFallbackQuestionDetail(topic, questionNo, normalized);
    }

    const generated = withFallbackQuestionDetail(topic, questionNo, defaultQuestion());

    if (autoCreate) {
      state.questionBank[topicId][key] = normalizeQuestion(generated);
      saveState();
    }

    return generated;
  }

  function withFallbackQuestionDetail(topic, questionNo, source) {
    const categoryKey = GENERIC_EXPLANATION[topic.category] ? topic.category : "minor";
    const auto = buildAutoChoiceDetail(topic, questionNo);
    const hasSourceChoices = hasCompleteChoices(source.choices);
    const parsedSourceCorrect = Number(source.correctIndex);
    const sourceCorrectValid = Number.isInteger(parsedSourceCorrect) && parsedSourceCorrect >= 0 && parsedSourceCorrect <= 2;
    const terms = Array.isArray(source.terms) && source.terms.length > 0 ? source.terms : auto.terms;

    return normalizeQuestion({
      prompt: hasSourceChoices ? (source.prompt || auto.prompt) : auto.prompt,
      choices: hasSourceChoices ? source.choices : auto.choices,
      correctIndex: hasSourceChoices && sourceCorrectValid ? parsedSourceCorrect : auto.correctIndex,
      answer: source.answer || auto.answer || `正解は「${auto.choices[auto.correctIndex]}」。`,
      explanation: source.explanation || auto.explanation || GENERIC_EXPLANATION[categoryKey],
      pitfall: source.pitfall || auto.pitfall || "主語・語尾・期限の取り違いに注意。",
      terms,
      trendTag: source.trendTag || auto.trendTag || PAST5_TREND_BY_TOPIC[topic.id] || ""
    });
  }

  function getTopicTextbook(topic) {
    const topicText = TOPIC_TEXTBOOK[topic.id];
    if (topicText) {
      return topicText;
    }

    const categoryKey = CATEGORY_TEXTBOOK[topic.category] ? topic.category : "minor";
    return CATEGORY_TEXTBOOK[categoryKey];
  }

  function buildAutoChoiceDetail(topic, questionNo) {
    const safeQuestionNo = Math.max(1, Math.round(Number(questionNo) || 1));
    const bank = resolveAutoChoiceBank(topic.id, safeQuestionNo);
    if (Array.isArray(bank) && bank.length > 0) {
      const picked = pickBankQuestionByNo(topic, bank, safeQuestionNo);
      const base = normalizeQuestion({
        ...picked.entry,
        prompt: toExamLikeDrillPrompt(picked.entry && picked.entry.prompt || "", topic),
        trendTag: picked.entry && picked.entry.trendTag || PAST5_TREND_BY_TOPIC[topic.id] || ""
      });
      return buildPastLikeChoiceSet(topic, safeQuestionNo, base, bank);
    }

    const textbook = getTopicTextbook(topic);
    const points = Array.isArray(textbook.points) && textbook.points.length >= 3
      ? textbook.points
      : ["主語を確認する。", "要件を確認する。", "例外を確認する。"];

    return normalizeQuestion({
      prompt: toExamLikeDrillPrompt(`【3択】${topic.name} Q${safeQuestionNo}\n次のうち正しい学習アクションはどれ？`, topic),
      choices: [
        `${points[0]} を先に確認する`,
        "主語や期限を見ずに感覚で解く",
        "例外を捨てて原則だけで答える"
      ],
      correctIndex: 0,
      answer: `${points[0]} を先に確認するのが基本。`,
      explanation: "要点→問題→解説の順で進めると、ミスの原因を特定しやすくなります。",
      pitfall: "原則だけ覚えて例外を落とさない。",
      terms: defaultTermsForTopic(topic),
      trendTag: PAST5_TREND_BY_TOPIC[topic.id] || "過去5年傾向に合わせた基礎問題"
    });
  }

  function buildPastLikeChoiceSet(topic, questionNo, detail, bank) {
    const safe = normalizeQuestion(detail);
    if (!hasCompleteChoices(safe.choices)) {
      return safe;
    }

    const correctText = String(safe.choices[safe.correctIndex] || "").trim();
    if (!correctText) {
      return safe;
    }

    const pool = buildTopicDistractorPool(bank, correctText);
    if (pool.length < 2) {
      return safe;
    }

    const distractors = pickTopicDistractors(pool, correctText, 2, `${topic.id}:${questionNo}:d`);
    if (distractors.length < 2) {
      return safe;
    }

    const baseChoices = [correctText, distractors[0], distractors[1]];
    const order = buildDeterministicOrder(baseChoices.length, `${topic.id}:${questionNo}:o`);
    const shuffled = order.map((idx) => baseChoices[idx]);
    const nextCorrectIndex = order.indexOf(0);

    return normalizeQuestion({
      ...safe,
      choices: shuffled,
      correctIndex: nextCorrectIndex
    });
  }

  function buildTopicDistractorPool(bank, correctText) {
    if (!Array.isArray(bank) || bank.length === 0) {
      return [];
    }

    const correctKey = normalizeKeyText(correctText);
    const seen = new Set();
    const pool = [];

    for (const rawEntry of bank) {
      const entry = normalizeQuestion(rawEntry);
      for (const rawChoice of entry.choices) {
        const choice = String(rawChoice || "").trim();
        if (!choice) {
          continue;
        }
        const key = normalizeKeyText(choice);
        if (!key || key === correctKey || seen.has(key)) {
          continue;
        }
        seen.add(key);
        pool.push(choice);
      }
    }

    return pool;
  }

  function pickTopicDistractors(pool, correctText, count, seedText) {
    const correctLen = Math.max(1, String(correctText || "").trim().length);
    const ranked = pool
      .map((choice) => {
        const len = Math.max(1, String(choice || "").trim().length);
        return {
          choice,
          score: Math.abs(len - correctLen)
        };
      })
      .sort((a, b) => a.score - b.score || String(a.choice).localeCompare(String(b.choice), "ja"));

    const shortlist = ranked.slice(0, Math.max(count + 4, 8)).map((item) => item.choice);
    const picked = [];
    let seed = seedFromString(seedText);
    const source = shortlist.length >= count ? shortlist : pool.slice();

    while (picked.length < count && source.length > 0) {
      seed = nextDeterministicSeed(seed);
      const index = seed % source.length;
      picked.push(source[index]);
      source.splice(index, 1);
    }

    return picked;
  }

  function buildDeterministicOrder(length, seedText) {
    const order = [];
    for (let i = 0; i < length; i += 1) {
      order.push(i);
    }
    let seed = seedFromString(seedText);
    for (let i = order.length - 1; i > 0; i -= 1) {
      seed = nextDeterministicSeed(seed);
      const j = seed % (i + 1);
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    return order;
  }

  function nextDeterministicSeed(seed) {
    const base = Math.max(1, Math.round(Number(seed) || 1));
    return (base * 48271) % 2147483647;
  }

  function toExamLikeDrillPrompt(rawPrompt, topic) {
    const normalized = normalizePromptCore(rawPrompt, topic);
    if (!normalized) {
      return `${topic.name}に関する記述として、最も適切なものはどれか。`;
    }
    if (/最も(妥当|適切)なものはどれか/u.test(normalized)) {
      return normalized;
    }
    if (/(状態|場合|場面|とき|時)$/u.test(normalized)) {
      return `${normalized}を指す用語として、最も適切なものはどれか。`;
    }
    if (/(制度|手続|訴訟|訴え|効果|原則|抗弁|基準|説明|権限|機関|決議|義務|考え方|行為|対応|根拠)$/u.test(normalized)) {
      return `${normalized}として、最も適切なものはどれか。`;
    }
    return `${normalized}に関する記述として、最も適切なものはどれか。`;
  }

  function normalizePromptCore(rawPrompt, topic) {
    let text = String(rawPrompt || "")
      .replace(/^【[^】]*】/u, "")
      .replace(/\r?\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) {
      return "";
    }

    text = text
      .replace(new RegExp(`^${escapeRegex(String(topic && topic.name || "").trim())}\\s*Q\\d+\\s*`, "u"), "")
      .replace(/^(本番風問題|小テスト問題|模試問題)\s*[:：]\s*/u, "")
      .replace(/^[QＱ]\d+\s*/u, "")
      .replace(/次のうち/u, "")
      .replace(/[？?]+$/u, "")
      .trim();

    text = text
      .replace(/はどれ(か)?$/u, "")
      .replace(/はどれか$/u, "")
      .replace(/どれか$/u, "")
      .replace(/どれ$/u, "")
      .replace(/[。．]+$/u, "")
      .trim();

    return text;
  }

  function escapeRegex(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function buildFriendlyDrillNote(topic, detail) {
    const corpus = `${String(detail && detail.prompt || "")} ${String(detail && detail.answer || "")} ${String(detail && detail.explanation || "")} ${String(detail && detail.pitfall || "")}`;

    if (/国家賠償法1条と2条/u.test(corpus)) {
      return "かんたんに言うと、1条は公務員の違法な仕事による損害、2条は道路や橋などの公共施設の管理ミスによる損害、という分け方を覚える問題です。";
    }
    if (/国家賠償法2条|営造物|瑕疵|道路など公の施設/u.test(corpus)) {
      return "かんたんに言うと、道路や橋などの公共施設の管理ミスで損害が出たときは、国家賠償法2条を使うってことです。";
    }
    if (/申請.*相当期間.*処分.*しない|不作為/u.test(corpus)) {
      return "かんたんに言うと、申請を出したのに役所が長く返事をしない状態を、法律では不作為と呼ぶってことです。";
    }
    if (/取消訴訟/u.test(corpus) && /無効等確認訴訟/u.test(corpus)) {
      return "かんたんに言うと、取消訴訟は処分をあとから取り消す裁判、無効等確認訴訟は最初から無効かを確認する裁判、という違いを押さえる問題です。";
    }
    if (/義務付け訴訟/u.test(corpus) && /差止訴訟/u.test(corpus)) {
      return "かんたんに言うと、義務付け訴訟は『してもらう』、差止訴訟は『止める』を求める裁判、という向きの違いを確認する問題です。";
    }

    const source = String(detail && (detail.answer || detail.explanation || detail.pitfall) || "").trim();
    const simplified = simplifyFriendlySentence(source);
    if (simplified) {
      return `かんたんに言うと、${simplified}`;
    }
    return "かんたんに言うと、正解のルールを1つずつ覚えるための問題です。";
  }

  function simplifyFriendlySentence(text) {
    let value = String(text || "").trim();
    if (!value) {
      return "";
    }

    value = value
      .replace(/^補足[:：]\s*/u, "")
      .replace(/\s+/g, " ")
      .replace(/公の営造物/u, "道路や橋などの公共施設")
      .replace(/瑕疵/u, "管理ミス")
      .replace(/不作為/u, "役所が返事をしない状態")
      .replace(/審査請求/u, "行政への見直し申立て")
      .replace(/処分庁/u, "最初に処分した役所")
      .replace(/審査庁/u, "見直しを判断する役所")
      .replace(/執行停止/u, "いったん効力を止める手続")
      .replace(/教示/u, "不服申立て先などの案内")
      .replace(/義務付け訴訟/u, "行政に処分をするよう求める裁判")
      .replace(/差止訴訟/u, "違法な処分を止める裁判")
      .replace(/取消訴訟/u, "すでに出た処分を取り消す裁判")
      .replace(/無効等確認訴訟/u, "最初から無効かを確認する裁判")
      .replace(/が基本。?$/u, "が基本ルール。")
      .replace(/を対象とする。?$/u, "が対象になる。")
      .replace(/と整理する。?$/u, "と覚える。")
      .replace(/[。．]+$/u, "。");

    if (!/[。！？]$/u.test(value)) {
      value = `${value}。`;
    }
    return value;
  }

  function enhanceAnswerLine(answer, detail) {
    return appendSupplementText(answer, buildDeepDiveSupplement(detail));
  }

  function enhanceExplanationLine(explanation, detail) {
    return appendSupplementText(explanation, buildDeepDiveSupplement(detail));
  }

  function enhancePitfallLine(pitfall, detail) {
    return appendSupplementText(pitfall, buildPitfallSupplement(detail));
  }

  function appendSupplementText(base, supplement) {
    const main = String(base || "").trim();
    const extra = String(supplement || "").trim();
    if (!extra) {
      return main;
    }
    if (!main) {
      return extra;
    }
    if (main.includes(extra)) {
      return main;
    }
    return `${main} ${extra}`;
  }

  function buildDeepDiveSupplement(detail) {
    const corpus = `${String(detail && detail.answer || "")} ${String(detail && detail.explanation || "")} ${String(detail && detail.pitfall || "")} ${String(detail && detail.trendTag || "")}`;
    if (/国家賠償法1条と2条/u.test(corpus) || /国家賠償法2条/u.test(corpus)) {
      return "補足: 国家賠償法1条は公務員の違法な職務行為で生じた損害、2条は道路など公の営造物の設置・管理の瑕疵で生じた損害を対象とする。";
    }
    if (/取消訴訟と無効等確認訴訟/u.test(corpus)) {
      return "補足: 取消訴訟は既にされた処分の効力を取り消す訴え、無効等確認訴訟は重大かつ明白な瑕疵による無効を確認する訴えとして整理する。";
    }
    if (/差止訴訟.*義務付け訴訟|義務付け訴訟.*差止訴訟/u.test(corpus)) {
      return "補足: 義務付け訴訟は『処分をしてもらう』、差止訴訟は『違法処分を止める』という向きの違いで区別する。";
    }
    return "";
  }

  function buildPitfallSupplement(detail) {
    const corpus = `${String(detail && detail.answer || "")} ${String(detail && detail.explanation || "")} ${String(detail && detail.pitfall || "")} ${String(detail && detail.trendTag || "")}`;
    if (/国家賠償法1条と2条/u.test(corpus) || /国家賠償法2条/u.test(corpus)) {
      return "1条=公務員行為、2条=営造物瑕疵、の対応で覚えると混同しにくい。";
    }
    return "";
  }

  function getPastLikeChoiceBank(topicId) {
    const base = Array.isArray(PAST5_CHOICE_BANK[topicId]) ? PAST5_CHOICE_BANK[topicId] : [];
    const extra = Array.isArray(EXTRA_CHOICE_BANK_BY_TOPIC[topicId]) ? EXTRA_CHOICE_BANK_BY_TOPIC[topicId] : [];
    return [...base, ...extra];
  }

  function getForecastChoiceBank(topicId) {
    return Array.isArray(PREDICTION_CHOICE_BANK_BY_TOPIC[topicId]) ? PREDICTION_CHOICE_BANK_BY_TOPIC[topicId] : [];
  }

  function shouldUseForecastChoice(topicId, questionNo) {
    const forecastBank = getForecastChoiceBank(topicId);
    if (forecastBank.length === 0) {
      return false;
    }
    const safeQuestionNo = Math.max(1, Math.round(Number(questionNo) || 1));
    const qIndex = safeQuestionNo - 1;
    const offset = seedFromString(topicId) % FORECAST_INSERT_INTERVAL;
    return ((qIndex + offset) % FORECAST_INSERT_INTERVAL) === 0;
  }

  function resolveAutoChoiceBank(topicId, questionNo) {
    const pastLike = getPastLikeChoiceBank(topicId);
    const forecast = getForecastChoiceBank(topicId);
    if (pastLike.length === 0 && forecast.length === 0) {
      return [];
    }
    if (pastLike.length === 0) {
      return forecast;
    }
    if (shouldUseForecastChoice(topicId, questionNo)) {
      return forecast.length > 0 ? forecast : pastLike;
    }
    return pastLike;
  }

  function buildTopicChoiceBank(topicId) {
    return [...getPastLikeChoiceBank(topicId), ...getForecastChoiceBank(topicId)];
  }

  function pickBankQuestionByNo(topic, bank, questionNo) {
    if (!Array.isArray(bank) || bank.length === 0) {
      return {
        entry: defaultQuestion(),
        index: 0
      };
    }
    const safeQuestionNo = Math.max(1, Math.round(Number(questionNo) || 1));
    const totalQuestions = Math.max(1, Math.round(Number(topic && topic.total) || 1));
    const safeNo = Math.min(safeQuestionNo, totalQuestions);
    const sequence = getBankPickSequence(topic, bank);
    const index = sequence[safeNo - 1] ?? sequence[sequence.length - 1] ?? 0;
    return {
      entry: bank[index],
      index
    };
  }

  function getBankPickSequence(topic, bank) {
    const length = Math.max(1, Math.round(Number(bank.length) || 1));
    const totalQuestions = Math.max(1, Math.round(Number(topic && topic.total) || 1));
    const topicId = String((topic && topic.id) || "topic");
    const cacheKey = `${topicId}:${length}:${totalQuestions}`;
    const cached = bankPickSequenceCache.get(cacheKey);
    if (Array.isArray(cached) && cached.length === totalQuestions) {
      return cached;
    }

    const permutation = buildBankPermutation(topicId, length);
    const sequence = [];
    const window = resolveAnswerDiversityWindow(topicId, length);
    for (let qNo = 1; qNo <= totalQuestions; qNo += 1) {
      const preferred = mapBaseBankIndex(topicId, length, qNo, permutation);
      const picked = pickDiverseBankIndex(bank, preferred, sequence, window, qNo);
      sequence.push(picked);
    }

    bankPickSequenceCache.set(cacheKey, sequence);
    return sequence;
  }

  function applyGlobalUniquenessVariant(topic, questionNo, entry) {
    const safeEntry = normalizeQuestion(entry);
    const safeQuestionNo = Math.max(1, Math.round(Number(questionNo) || 1));
    const occurrence = getGlobalBankOccurrence(topic.id, safeQuestionNo);
    if (occurrence.promptOccurrence <= 1 && occurrence.answerOccurrence <= 1) {
      return safeEntry;
    }

    const variantLabel = buildQuestionVariantLabel(topic.id, safeQuestionNo);
    const prompt = appendVariantLabel(safeEntry.prompt, variantLabel);
    const choices = Array.isArray(safeEntry.choices)
      ? safeEntry.choices.map((choice) => appendVariantLabel(choice, variantLabel))
      : [];

    return {
      ...safeEntry,
      prompt,
      choices
    };
  }

  function buildQuestionVariantLabel(topicId, questionNo) {
    const safeNo = Math.max(1, Math.round(Number(questionNo) || 1));
    const tag = TOPIC_VARIANT_TAG[topicId] || "法";
    return `${tag}${String(safeNo).padStart(3, "0")}`;
  }

  function appendVariantLabel(text, label) {
    const base = String(text || "").trim();
    if (!label) {
      return base;
    }
    const suffix = `（${label}）`;
    if (!base) {
      return suffix;
    }
    return base.endsWith(suffix) ? base : `${base}${suffix}`;
  }

  function getGlobalBankOccurrence(topicId, questionNo) {
    const safeQuestionNo = Math.max(1, Math.round(Number(questionNo) || 1));
    const map = getGlobalBankOccurrenceMap();
    return map.get(`${topicId}:${safeQuestionNo}`) || {
      promptOccurrence: 1,
      answerOccurrence: 1
    };
  }

  function getGlobalBankOccurrenceMap() {
    const cacheKey = buildGlobalBankOccurrenceCacheKey();
    if (cacheKey === globalBankOccurrenceCacheKey && globalBankOccurrenceMap.size > 0) {
      return globalBankOccurrenceMap;
    }

    const nextMap = new Map();
    const promptCount = new Map();
    const answerCount = new Map();

    for (const topic of state.topics) {
      const totalQuestions = Math.max(1, Math.round(Number(topic.total) || 1));
      for (let questionNo = 1; questionNo <= totalQuestions; questionNo += 1) {
        const bank = resolveAutoChoiceBank(topic.id, questionNo);
        if (!Array.isArray(bank) || bank.length === 0) {
          continue;
        }
        const picked = pickBankQuestionByNo(topic, bank, questionNo);
        const entry = picked.entry || defaultQuestion();
        const promptKey = getBankEntryPromptKey(entry) || `prompt:${topic.id}:${picked.index}:${questionNo}`;
        const answerKey = getBankEntryAnswerKey(entry) || `answer:${topic.id}:${picked.index}:${questionNo}`;
        const promptOccurrence = incrementCount(promptCount, promptKey);
        const answerOccurrence = incrementCount(answerCount, answerKey);
        nextMap.set(`${topic.id}:${questionNo}`, {
          promptOccurrence,
          answerOccurrence
        });
      }
    }

    globalBankOccurrenceCacheKey = cacheKey;
    globalBankOccurrenceMap = nextMap;
    return globalBankOccurrenceMap;
  }

  function buildGlobalBankOccurrenceCacheKey() {
    return state.topics
      .map((topic) => {
        const total = Math.max(1, Math.round(Number(topic.total) || 1));
        const pastLikeLength = getPastLikeChoiceBank(topic.id).length;
        const forecastLength = getForecastChoiceBank(topic.id).length;
        return `${topic.id}:${total}:${pastLikeLength}:${forecastLength}:${FORECAST_INSERT_INTERVAL}`;
      })
      .join("|");
  }

  function incrementCount(map, key) {
    const current = Math.max(0, Math.round(Number(map.get(key)) || 0));
    const next = current + 1;
    map.set(key, next);
    return next;
  }

  function mapBaseBankIndex(topicId, length, questionNo, permutation) {
    const qIndex = Math.max(0, Math.round(Number(questionNo) || 1) - 1);
    const cycle = Math.floor(qIndex / length);
    const pos = qIndex % length;
    const cycleOffset = (cycle * (String(topicId || "").length + 1)) % length;
    const mappedPos = cycle % 2 === 1 ? (length - 1 - pos) : pos;
    return permutation[(mappedPos + cycleOffset) % length];
  }

  function resolveAnswerDiversityWindow(topicId, bankLength) {
    const configured = Math.max(1, Math.round(Number(ANSWER_DIVERSITY_WINDOW_BY_TOPIC[topicId]) || 6));
    const cap = Math.max(1, Math.min(bankLength - 1, Math.round(bankLength * 0.8)));
    return Math.max(1, Math.min(configured, cap));
  }

  function pickDiverseBankIndex(bank, preferredIndex, pickedIndices, window, questionNo) {
    const length = Math.max(1, Math.round(Number(bank.length) || 1));
    if (length === 1) {
      return 0;
    }

    const recentAnswerKeys = new Set();
    const recentPromptKeys = new Set();
    const from = Math.max(0, pickedIndices.length - Math.max(1, window));
    for (let i = from; i < pickedIndices.length; i += 1) {
      const recent = bank[pickedIndices[i]];
      recentAnswerKeys.add(getBankEntryAnswerKey(recent));
      recentPromptKeys.add(getBankEntryPromptKey(recent));
    }

    const step = pickCoprimeStepBySeed(length, Math.max(1, Math.round(Number(questionNo) || 1)) + preferredIndex);
    const order = [];
    for (let offset = 0; offset < length; offset += 1) {
      order.push((preferredIndex + step * offset) % length);
    }

    for (const index of order) {
      const entry = bank[index];
      const answerKey = getBankEntryAnswerKey(entry);
      const promptKey = getBankEntryPromptKey(entry);
      if (!recentAnswerKeys.has(answerKey) && !recentPromptKeys.has(promptKey)) {
        return index;
      }
    }

    for (const index of order) {
      const entry = bank[index];
      const answerKey = getBankEntryAnswerKey(entry);
      if (!recentAnswerKeys.has(answerKey)) {
        return index;
      }
    }

    if (pickedIndices.length > 0) {
      const lastIndex = pickedIndices[pickedIndices.length - 1];
      for (const index of order) {
        if (index !== lastIndex) {
          return index;
        }
      }
    }

    return preferredIndex;
  }

  function pickCoprimeStepBySeed(length, seed) {
    const candidates = [];
    for (let step = 1; step < length; step += 1) {
      if (gcd(step, length) === 1) {
        candidates.push(step);
      }
    }
    if (candidates.length === 0) {
      return 1;
    }
    const safeSeed = Math.max(0, Math.round(Number(seed) || 0));
    return candidates[safeSeed % candidates.length];
  }

  function getBankEntryAnswerKey(entry) {
    if (!entry || typeof entry !== "object") {
      return "";
    }
    const choices = Array.isArray(entry.choices) ? entry.choices : [];
    const parsedCorrect = Math.round(Number(entry.correctIndex));
    const correctIndex = Number.isInteger(parsedCorrect) && parsedCorrect >= 0 && parsedCorrect < choices.length
      ? parsedCorrect
      : 0;
    const raw = String(choices[correctIndex] || entry.answer || "").trim();
    return normalizeKeyText(raw);
  }

  function getBankEntryPromptKey(entry) {
    if (!entry || typeof entry !== "object") {
      return "";
    }
    return normalizeKeyText(String(entry.prompt || "").trim());
  }

  function normalizeKeyText(value) {
    return String(value || "")
      .replace(/[「」『』【】（）()［］\[\]{}]/gu, "")
      .replace(/[、。・,.:：!?！？\s]/gu, "")
      .toLowerCase();
  }

  function buildBankPermutation(topicId, length) {
    const start = seedFromString(topicId) % length;
    const step = pickCoprimeStep(length);
    const order = [];
    for (let i = 0; i < length; i += 1) {
      order.push((start + step * i) % length);
    }
    return order;
  }

  function pickCoprimeStep(length) {
    if (length <= 2) {
      return 1;
    }
    for (let step = length - 1; step >= 2; step -= 1) {
      if (gcd(step, length) === 1) {
        return step;
      }
    }
    return 1;
  }

  function gcd(a, b) {
    let x = Math.abs(Math.round(Number(a) || 0));
    let y = Math.abs(Math.round(Number(b) || 0));
    while (y !== 0) {
      const r = x % y;
      x = y;
      y = r;
    }
    return x || 1;
  }

  function seedFromString(value) {
    const text = String(value || "");
    let seed = 0;
    for (let i = 0; i < text.length; i += 1) {
      seed = (seed * 31 + text.charCodeAt(i)) % 2147483647;
    }
    return Math.max(1, seed);
  }

  function hasCompleteChoices(choices) {
    if (!Array.isArray(choices) || choices.length !== 3) {
      return false;
    }
    return choices.every((choice) => String(choice || "").trim().length > 0);
  }

  function buildExamStylePrompt(topic, detail, modeLabel) {
    const trend = detail.trendTag || PAST5_TREND_BY_TOPIC[topic.id] || "";
    const head = `${modeLabel}問題: ${topic.name}に関する次の記述のうち、最も妥当なものはどれか。`;
    if (trend) {
      return `${head}\n（論点: ${trend}）`;
    }
    return head;
  }

  function buildDrillPromptText(rawPrompt, formatLabel) {
    const prompt = String(rawPrompt || "")
      .replace(/^【[^】]*】/u, "")
      .trim();
    return `[${formatLabel}] ${prompt || "次の設問に答えなさい。"}`;
  }

  function buildSectionPreStudyAccordionHtml(topic, section, options = {}) {
    const openFirst = Boolean(options.openFirst);
    const rows = [];

    for (let questionNo = section.start; questionNo <= section.end; questionNo += 1) {
      const detail = getQuestionDetail(topic.id, questionNo, false);
      const openAttr = openFirst && questionNo === section.start ? "open" : "";
      rows.push(`
        <details class="primerQuestionFold" ${openAttr}>
          <summary class="primerQuestionSummary">
            <span class="primerQuestionNo">Q${questionNo}</span>
            <span class="primerSentence">${escapeHtml(buildPreStudySentence(topic, section, questionNo, detail))}</span>
          </summary>
          <div class="primerQuestionBody">
            <p class="note">解説: ${escapeHtml(enhanceExplanationLine(detail.explanation, detail))}</p>
            <p class="note">間違えやすい点: ${escapeHtml(enhancePitfallLine(detail.pitfall, detail))}</p>
          </div>
        </details>
      `);
    }

    return rows.join("");
  }

  function buildPreStudySentence(topic, section, questionNo, detail) {
    const context = buildPreStudyContext(topic, detail.prompt || "");
    const rawChoice = String(detail.choices[detail.correctIndex] || "").trim();
    const fallbackChoice = String(detail.answer || "").trim();
    const choice = (rawChoice || fallbackChoice || "条文と要件を確認する")
      .replace(/[。．]$/u, "")
      .trim();

    return `${topic.name} ${section.name} Q${questionNo}: ${context}、当てはまる内容は「${choice}」である。`;
  }

  function buildPreStudyContext(topic, rawPrompt) {
    let text = String(rawPrompt || "")
      .replace(/^【[^】]*】/u, "")
      .replace(/^(本番風問題|小テスト問題|模試問題)\s*[:：]\s*/u, "")
      .replace(/\s+/g, " ")
      .trim();

    text = text
      .replace(/次のうち.*$/u, "")
      .replace(/次の記述.*$/u, "")
      .replace(/最も妥当なものは.*$/u, "")
      .replace(/最も適切なものは.*$/u, "")
      .replace(/誤っているものは.*$/u, "")
      .replace(/正しいものは.*$/u, "")
      .replace(/どれか.*$/u, "")
      .replace(/どれ.*$/u, "")
      .replace(/[？?。．]+$/u, "")
      .trim();

    text = text
      .replace(/のは$/u, "")
      .replace(/とは$/u, "")
      .replace(/は$/u, "")
      .trim();

    if (!text || text.length < 6 || /(してはいけない|しなければならない|である|となる)$/u.test(text)) {
      return `${topic.name}の重要ポイントを確認するとき`;
    }

    if (/(とき|場合|時)$/u.test(text)) {
      return text;
    }

    if (/[はがをにでとへの]$/u.test(text)) {
      return `${topic.name}の重要ポイントを確認するとき`;
    }

    if (/(する|される|できる|求める|定める|扱う|判断する|確認する|納得できない|争う|保護する|成立する|取り消す|取消す)$/u.test(text) || /ない$/u.test(text)) {
      return `${text}とき`;
    }

    if (/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9・ー\s]{2,36}$/u.test(text)) {
      return `${text}について考えるとき`;
    }

    return `${text}のとき`;
  }

  function buildExamChoicesHtml(choices) {
    const labels = ["ア", "イ", "ウ"];
    return choices
      .map((choice, index) => {
        const text = normalizeExamStyleChoice(choice);
        const label = `${labels[index]}. ${text}`;
        return `<button type="button" class="choiceBtn" data-choice-index="${index}">${escapeHtml(label)}</button>`;
      })
      .join("");
  }

  function normalizeExamStyleChoice(choice) {
    const text = String(choice || "").trim();
    if (!text) {
      return "-";
    }
    if (/[。．]$/.test(text)) {
      return text;
    }
    if (text.length <= 14) {
      return `${text}である。`;
    }
    return `${text}。`;
  }

  function defaultTermsForTopic(topic) {
    if (topic.category === "major") {
      return ["要件", "効果", "取消し", "無効"];
    }
    if (topic.category === "general") {
      return ["個人情報", "文章理解", "情報通信"];
    }
    if (topic.category === "describe") {
      return ["要件事実", "当てはめ", "結論"];
    }
    return ["原則", "例外", "条文"];
  }

  function parseTerms(raw) {
    return String(raw || "")
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  function clampQuestionNo(topicId, value) {
    const topic = state.topics.find((entry) => entry.id === topicId);
    if (!topic) {
      return 1;
    }
    return clampNumber(value, 1, topic.total, 1);
  }

  function secondsUntil(isoTime) {
    const ts = Date.parse(isoTime);
    if (Number.isNaN(ts)) {
      return 0;
    }
    return Math.floor((ts - Date.now()) / 1000);
  }

  function formatAsMinSec(totalSeconds) {
    const sec = Math.max(0, totalSeconds);
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function getCompleteDate() {
    const examDate = parseISODate(state.settings.examDate);
    return addDays(examDate, -COMPLETE_BUFFER_DAYS);
  }

  function getDaysUntilCompleteDate() {
    const completeDate = getCompleteDate();
    const today = todayLocal();
    return Math.ceil((completeDate.getTime() - today.getTime()) / 86400000);
  }

  function buildCurriculumItems() {
    const examDate = parseISODate(state.settings.examDate);
    const today = todayLocal();
    const completeDate = getCompleteDate();
    const daysLeft = daysUntil(state.settings.examDate);
    const completeDaysLeft = getDaysUntilCompleteDate();

    if (daysLeft < 0) {
      return ["設定された本番日は過去日です。日付を更新してください。"];
    }

    const phase1End = addDays(completeDate, -90);
    const phase2End = addDays(completeDate, -30);

    const items = [];

    if (completeDaysLeft < 0) {
      items.push(`仕上げ期限(${formatDate(completeDate)})を過ぎています。弱点分野を最優先で圧縮復習。`);
    } else if (today <= phase1End) {
      items.push(`${formatDateRange(today, phase1End)}: 基礎固め (行政法/民法優先 + 主要科目1周目)`);
      items.push(`${formatDateRange(addDays(phase1End, 1), phase2End)}: 周回強化 (過去問反復 + 六法/テキスト回帰)`);
    } else if (today <= phase2End) {
      items.push(`${formatDateRange(today, phase2End)}: 周回強化 (過去問反復 + 記述対策)`);
    }

    if (today <= completeDate) {
      items.push(`${formatDateRange(addDays(phase2End, 1), completeDate)}: 仕上げ期間 (模試完了・弱点潰し・到達確認)`);
    }

    const finalWeekStart = addDays(completeDate, 1);
    const dayBeforeExam = addDays(examDate, -1);
    if (finalWeekStart <= dayBeforeExam && today <= dayBeforeExam) {
      const start = today > finalWeekStart ? today : finalWeekStart;
      items.push(`${formatDateRange(start, dayBeforeExam)}: 最終調整 (軽い総復習・体調管理・時間配分確認)`);
    }

    const mockOffsets = [45, 30, 21, 14, 10, 7];
    for (const offset of mockOffsets) {
      const mockDate = addDays(examDate, -offset);
      if (mockDate >= today && mockDate <= completeDate) {
        items.push(`${formatDate(mockDate)}: 模試実施(D-${offset}) + 当日中に復習`);
      }
    }

    items.push(`${formatDate(examDate)}: 本番`);
    return items;
  }

  function generateTodayPlan(forceRebuild) {
    const today = todayISO();

    if (!forceRebuild && state.todayPlan.date === today && state.todayPlan.tasks.length > 0) {
      return;
    }

    const targetCount = getDailyTargetCount();
    const examDaysLeft = daysUntil(state.settings.examDate);
    const completeDaysLeft = getDaysUntilCompleteDate();
    const planningDaysLeft = Math.max(0, completeDaysLeft);

    if (examDaysLeft < 0) {
      state.todayPlan = { date: today, tasks: [] };
      saveState();
      return;
    }

    const activeTopics = state.topics
      .map((topic) => ({ topic, score: topicScore(topic, planningDaysLeft) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (activeTopics.length === 0) {
      state.todayPlan = { date: today, tasks: [] };
      saveState();
      return;
    }

    const phase = phaseByDays(planningDaysLeft);
    const focusLimit = phase.key === "final" ? 4 : 3;
    const focus = activeTopics.slice(0, Math.min(focusLimit, activeTopics.length));
    const scoreTotal = focus.reduce((sum, item) => sum + item.score, 0);

    let tasks = focus.map((item) => {
      const provisional = Math.floor((targetCount * item.score) / scoreTotal);
      return {
        topicId: item.topic.id,
        count: Math.max(1, provisional),
        attemptBase: (state.progress[item.topic.id] || defaultProgress()).attempts
      };
    });

    let allocated = tasks.reduce((sum, task) => sum + task.count, 0);
    let cursor = 0;

    while (allocated < targetCount) {
      tasks[cursor % tasks.length].count += 1;
      allocated += 1;
      cursor += 1;
    }

    while (allocated > targetCount) {
      const reduceIndex = tasks.findIndex((task) => task.count > 1);
      if (reduceIndex === -1) {
        break;
      }
      tasks[reduceIndex].count -= 1;
      allocated -= 1;
    }

    tasks = tasks.filter((task) => task.count > 0);

    state.todayPlan = {
      date: today,
      tasks
    };

    saveState();
  }

  function topicScore(topic, daysLeft) {
    const progress = state.progress[topic.id] || defaultProgress();
    if (progress.mastered) {
      return 0;
    }

    const effort = remainingEffort(topic, progress);
    if (effort <= 0) {
      return 0;
    }

    let score = effort * topic.weight;

    const missRate = progress.attempts > 0 ? progress.mistakes / progress.attempts : 0.25;
    score *= 1 + missRate;

    const phase = phaseByDays(daysLeft);
    if (phase.key === "base" && topic.category === "major") {
      score *= 1.25;
    }
    if (phase.key === "final" && (topic.category === "general" || topic.category === "describe")) {
      score *= 1.25;
    }

    return score;
  }

  function remainingEffort(topic, progress) {
    if (progress.mastered) {
      return 0;
    }

    const sections = getTopicSections(topic);
    if (sections.length === 0) {
      return 0;
    }

    const targetRounds = state.settings.targetPerfectRounds;
    const currentSection = getCurrentSection(topic, progress.nextQuestion);
    const sectionRemaining = Math.max(0, currentSection.end - progress.nextQuestion + 1);
    const currentRoundsLeft = Math.max(1, targetRounds - progress.perfectRounds);
    const currentSectionLength = Math.max(1, currentSection.end - currentSection.start + 1);

    let effort = sectionRemaining + (currentRoundsLeft - 1) * currentSectionLength;

    const nextStartIndex = currentSection.index + 1;
    for (let i = nextStartIndex; i < sections.length; i += 1) {
      const section = sections[i];
      const len = Math.max(1, section.end - section.start + 1);
      effort += len * targetRounds;
    }

    if (effort <= 0) {
      return 0;
    }
    return Math.ceil(effort);
  }

  function getDailyTargetCount() {
    const override = Number(state.settings.todayQuestionOverride);
    if (Number.isFinite(override) && override > 0) {
      return Math.round(override);
    }

    return getNeedBasedQuestions();
  }

  function getNeedBasedQuestions() {
    const daysLeft = Math.max(1, getDaysUntilCompleteDate());
    const remaining = getRemainingUniqueQuestions();
    if (remaining <= 0) {
      return 0;
    }
    return Math.ceil(remaining / daysLeft);
  }

  function getSolvedUniqueQuestions() {
    let solved = 0;
    for (const topic of state.topics) {
      for (let questionNo = 1; questionNo <= topic.total; questionNo += 1) {
        if (getQuestionStat(topic.id, questionNo).correct > 0) {
          solved += 1;
        }
      }
    }
    return solved;
  }

  function getRemainingUniqueQuestions() {
    const totalQuestions = state.topics.reduce((sum, topic) => sum + topic.total, 0);
    return Math.max(0, totalQuestions - getSolvedUniqueQuestions());
  }

  function phaseByDays(daysLeft) {
    if (daysLeft > 120) {
      return { key: "base", label: "基礎固め" };
    }
    if (daysLeft > 30) {
      return { key: "loop", label: "周回強化" };
    }
    return { key: "final", label: "仕上げ期（D-7まで）" };
  }

  function getLikelyExamDate(baseDate) {
    const currentYear = baseDate.getFullYear();
    const candidate = secondSundayOfNovember(currentYear);
    if (baseDate <= candidate) {
      return candidate;
    }
    return secondSundayOfNovember(currentYear + 1);
  }

  function secondSundayOfNovember(year) {
    const day = new Date(year, 10, 1);
    while (day.getDay() !== 0) {
      day.setDate(day.getDate() + 1);
    }
    day.setDate(day.getDate() + 7);
    return day;
  }

  function daysUntil(dateStr) {
    const target = parseISODate(dateStr);
    const today = todayLocal();
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  }

  function addDays(date, days) {
    const copied = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    copied.setDate(copied.getDate() + days);
    return copied;
  }

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  }

  function formatDateRange(start, end) {
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  function parseISODate(dateStr) {
    const [y, m, d] = String(dateStr || "").split("-").map((v) => Number(v));
    return new Date(y, m - 1, d);
  }

  function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function todayLocal() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function todayISO() {
    return toISODate(todayLocal());
  }

  function isISODate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value));
  }

  function clampNumber(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return fallback;
    }
    if (num < min) {
      return min;
    }
    if (num > max) {
      return max;
    }
    return Math.round(num);
  }

  function setGauge(fillId, labelId, done, total, emptyText) {
    const fill = byId(fillId);
    const label = byId(labelId);
    const safeDone = Math.max(0, Math.round(Number(done) || 0));
    const safeTotal = Math.max(0, Math.round(Number(total) || 0));

    if (safeTotal <= 0) {
      fill.style.width = "0%";
      label.textContent = emptyText || "0/0 (0%)";
      return 0;
    }

    const boundedDone = Math.min(safeDone, safeTotal);
    const percent = Math.round((boundedDone / safeTotal) * 100);
    fill.style.width = `${percent}%`;
    label.textContent = `${boundedDone}/${safeTotal} (${percent}%)`;
    return percent;
  }

  function setProgressFillTone(fillId, tone) {
    const fill = byId(fillId);
    fill.classList.remove("isGood", "isWarn", "isBad");
    if (tone && tone !== "default") {
      fill.classList.add(tone);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function byId(id) {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Missing element: ${id}`);
    }
    return element;
  }
})();
