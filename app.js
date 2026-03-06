"use strict";

(() => {
  const STORAGE_KEY = "gyoseiExamCoach.v1";
  const RESEARCH_UPDATED_AT = "2026-03-06";
  const COMPLETE_BUFFER_DAYS = 7;
  const SECTION_CLEAR_TARGET = 5;

  const OFFICIAL_SPEC_TEXT = "公式情報ベース: 試験時間180分(13:00-16:00) / 出題60問(法令等46問+基礎知識14問) / 合格基準: 法令等122点以上・基礎知識24点以上・総得点180点以上";

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

  let mockTimerId = null;

  let state = loadState();
  syncStateShape();
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
      primerReadTopicIds: [],
      selectedChoice: -1,
      pendingResult: null,
      singleMode: false,
      singleTopicId: "",
      singleQuestionNo: 1,
      singleSectionName: ""
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

    for (const topic of topics) {
      progress[topic.id] = defaultProgress();
      questionBank[topic.id] = {};
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
      glossary: DEFAULT_GLOSSARY.map((item) => ({ ...item })),
      pitfallHeatmap: {},
      todayPlan: {
        date: "",
        tasks: []
      },
      drill: defaultDrill(),
      mock: defaultMock(),
      miniTest: defaultMiniTest(),
      trainingCycle: defaultTrainingCycle(),
      questionEditor: {
        topicId: topics[0].id,
        questionNo: 1,
        message: ""
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
    state.glossary = Array.isArray(state.glossary) ? state.glossary : fresh.glossary;
    state.pitfallHeatmap = state.pitfallHeatmap && typeof state.pitfallHeatmap === "object"
      ? state.pitfallHeatmap
      : {};
    state.todayPlan = state.todayPlan && typeof state.todayPlan === "object"
      ? state.todayPlan
      : fresh.todayPlan;
    state.drill = state.drill && typeof state.drill === "object" ? state.drill : defaultDrill();
    state.mock = state.mock && typeof state.mock === "object" ? state.mock : defaultMock();
    state.miniTest = state.miniTest && typeof state.miniTest === "object" ? state.miniTest : defaultMiniTest();
    state.trainingCycle = state.trainingCycle && typeof state.trainingCycle === "object"
      ? state.trainingCycle
      : defaultTrainingCycle();
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

    if (!Array.isArray(state.drill.queue)) {
      state.drill.queue = [];
    }
    if (!Array.isArray(state.drill.primerReadTopicIds)) {
      state.drill.primerReadTopicIds = [];
    } else {
      state.drill.primerReadTopicIds = state.drill.primerReadTopicIds
        .map((id) => String(id || "").trim())
        .filter(Boolean);
    }
    state.drill.showExplanation = Boolean(state.drill.showExplanation);
    state.drill.selectedChoice = Number.isInteger(state.drill.selectedChoice)
      ? state.drill.selectedChoice
      : -1;
    if (state.drill.selectedChoice < -1 || state.drill.selectedChoice > 2) {
      state.drill.selectedChoice = -1;
    }
    if (typeof state.drill.pendingResult !== "boolean") {
      state.drill.pendingResult = null;
    }
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

    const existingTopicIds = new Set(state.topics.map((topic) => topic.id));

    for (const topic of state.topics) {
      if (!state.progress[topic.id]) {
        state.progress[topic.id] = defaultProgress();
      }
      state.progress[topic.id] = normalizeProgress(topic, state.progress[topic.id]);

      if (!state.questionBank[topic.id] || typeof state.questionBank[topic.id] !== "object") {
        state.questionBank[topic.id] = {};
      }

      normalizeQuestionBankForTopic(topic);
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

  function bindEvents() {
    byId("homeNavGrid").addEventListener("click", onHomeNavClick);
    byId("saveExamDateBtn").addEventListener("click", onSaveExamDate);
    byId("saveSettingsBtn").addEventListener("click", onSaveSettings);
    byId("addTopicBtn").addEventListener("click", onAddTopic);
    byId("problemMenuList").addEventListener("click", onProblemMenuListClick);
    byId("generatePlanBtn").addEventListener("click", () => {
      generateTodayPlan(true);
      renderAll();
    });
    byId("startDrillBtn").addEventListener("click", onStartDrill);
    byId("drillPrimerDoneBtn").addEventListener("click", onDrillPrimerDone);
    byId("drillChoicesWrap").addEventListener("click", onDrillChoiceClick);
    byId("applyReviewResultBtn").addEventListener("click", onApplyReviewResult);
    byId("skipBtn").addEventListener("click", onSkipDrillQuestion);
    byId("editCurrentQuestionBtn").addEventListener("click", onEditCurrentQuestion);
    byId("backToPrimerBtn").addEventListener("click", onBackToPrimer);

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
    card.scrollIntoView({ behavior: "smooth", block: "start" });
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
      state.progress[topicId] = defaultProgress();
      state.todayPlan = { date: "", tasks: [] };
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

      state.todayPlan = { date: "", tasks: [] };

      if (state.questionEditor.topicId === topicId) {
        state.questionEditor.questionNo = clampQuestionNo(topicId, state.questionEditor.questionNo);
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
    if (action !== "single") {
      return;
    }

    const topicId = String(button.dataset.topicId || "");
    const questionNo = Number(button.dataset.questionNo);
    const sectionName = String(button.dataset.sectionName || "");

    if (!topicId || !Number.isInteger(questionNo)) {
      return;
    }

    startSingleQuestionDrill(topicId, questionNo, sectionName);
  }

  function startSingleQuestionDrill(topicId, questionNo, sectionName) {
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
    state.drill = {
      ...defaultDrill(),
      active: true,
      queue: [topic.id],
      pointer: 0,
      startedAt: todayISO(),
      message: `${topic.name} Q${safeQuestionNo} の単問演習を開始。要点→問題→解説の順で進めます。`,
      singleMode: true,
      singleTopicId: topic.id,
      singleQuestionNo: safeQuestionNo,
      singleSectionName: sectionName || ""
    };

    saveState();
    renderAll();
    byId("drillCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onStartDrill() {
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

    const queue = [];
    for (const task of state.todayPlan.tasks) {
      for (let i = 0; i < task.count; i += 1) {
        queue.push(task.topicId);
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
      message: "ドリル開始。まず要点を確認してから問題を解きます。",
      showExplanation: false,
      primerReadTopicIds: [],
      selectedChoice: -1,
      pendingResult: null,
      singleMode: false,
      singleTopicId: "",
      singleQuestionNo: 1,
      singleSectionName: ""
    };

    saveState();
    renderAll();
  }

  function onDrillPrimerDone() {
    if (!state.drill.active) {
      return;
    }

    const current = getCurrentDrillQuestionContext();
    if (!current) {
      return;
    }

    if (!state.drill.primerReadTopicIds.includes(current.topic.id)) {
      state.drill.primerReadTopicIds.push(current.topic.id);
    }
    state.drill.showExplanation = false;
    state.drill.selectedChoice = -1;
    state.drill.pendingResult = null;
    state.drill.message = `${current.topic.name} の要点確認を完了。問題に進んでください。`;

    saveState();
    renderDrill();
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

    if (!state.drill.primerReadTopicIds.includes(current.topic.id)) {
      state.drill.message = "先に要点チェックを完了してください。";
      saveState();
      renderDrill();
      return;
    }

    const detail = getQuestionDetail(current.topic.id, current.questionNo, false);
    const picked = Number(button.dataset.choiceIndex);
    if (!Number.isInteger(picked) || picked < 0 || picked > 2) {
      return;
    }

    state.drill.selectedChoice = picked;
    state.drill.pendingResult = picked === detail.correctIndex;
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
      state.drill.message = "先に3つの選択肢から1つ選んでください。";
      saveState();
      renderDrill();
      return;
    }

    applyDrillResult(state.drill.pendingResult);
  }

  function onBackToPrimer() {
    if (!state.drill.active) {
      return;
    }

    const current = getCurrentDrillQuestionContext();
    if (!current) {
      return;
    }

    state.drill.primerReadTopicIds = state.drill.primerReadTopicIds
      .filter((topicId) => topicId !== current.topic.id);
    state.drill.showExplanation = false;
    state.drill.selectedChoice = -1;
    state.drill.pendingResult = null;
    state.drill.message = `${current.topic.name} の要点に戻りました。`;

    saveState();
    renderDrill();
  }

  function onSkipDrillQuestion() {
    if (!state.drill.active) {
      return;
    }

    state.drill.showExplanation = false;
    state.drill.selectedChoice = -1;
    state.drill.pendingResult = null;
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

  function applyDrillResult(isCorrect) {
    if (!state.drill.active) {
      return;
    }

    const current = getCurrentDrillQuestionContext();
    if (!current) {
      return;
    }

    if (!state.drill.primerReadTopicIds.includes(current.topic.id)) {
      state.drill.message = "先に要点チェックを完了してください。";
      saveState();
      renderDrill();
      return;
    }

    if (!state.drill.showExplanation) {
      state.drill.message = "先に3択から1つ選んでください。";
      saveState();
      renderDrill();
      return;
    }

    const topicId = state.drill.queue[state.drill.pointer];
    const topic = state.topics.find((item) => item.id === topicId);
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
    const sectionLength = Math.max(1, currentSection.end - currentSection.start + 1);

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

      const restartBurst = Math.min(sectionLength, 6);
      const penaltyQueue = new Array(restartBurst).fill(topicId);
      state.drill.queue.splice(state.drill.pointer + 1, 0, ...penaltyQueue);
      state.drill.message = `${topic.name} ${currentSection.name} で不正解。セクション先頭に戻して追加${restartBurst}問。`;
    }

    state.progress[topicId] = normalizeProgress(topic, progress);
    state.drill.showExplanation = false;
    state.drill.selectedChoice = -1;
    state.drill.pendingResult = null;
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
    } else if (kind === "wrong") {
      state.mock.wrongCount += 1;
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
    renderProblemMenu();
    renderTopics();
    renderTodayPlan();
    renderDrill();
    renderMiniTest();
    renderQuestionEditor();
    renderMockExam();
    renderGlossary();
    renderPitfalls();
    renderCurriculum();
    renderResearch();
    ensureMockTimer();
  }

  function renderDashboard() {
    byId("examDateInput").value = state.settings.examDate;

    const examDaysLeft = daysUntil(state.settings.examDate);
    const completeDaysLeft = getDaysUntilCompleteDate();
    const completeDate = getCompleteDate();
    const phase = phaseByDays(completeDaysLeft);
    const dailyTarget = getDailyTargetCount();

    byId("daysLeft").textContent = completeDaysLeft >= 0 ? `${completeDaysLeft}日` : "期限超過";
    byId("phaseLabel").textContent = phase.label;
    byId("dailyTarget").textContent = `${dailyTarget}問`;

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

    const byNeed = getNeedBasedQuestions();
    const byTime = getTimeBasedQuestions();

    if (byNeed > byTime) {
      note += ` 現在の学習時間設定だと必要量(${byNeed}問/日)に不足するため、時間増加か問題数上書きを推奨。`;
    }

    byId("examDateNote").textContent = note;
  }

  function renderSettings() {
    byId("dailyMinutesInput").value = String(state.settings.dailyMinutes);
    byId("targetPerfectRoundsInput").value = String(state.settings.targetPerfectRounds);
    byId("todayQuestionOverrideInput").value = state.settings.todayQuestionOverride;
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
        const topicPercent = topicTotalSections > 0
          ? Math.round((topicClearedSections / topicTotalSections) * 100)
          : 0;
        const currentSection = getCurrentSection(topic, progress.nextQuestion);
        const topicOpen = topic.id === firstActiveTopicId ? "open" : "";
        const sectionHtml = sections.map((section) => {
          const sectionNo = section.index + 1;
          const count = section.end - section.start + 1;
          const isCleared = section.index < topicClearedSections;
          const isCurrent = !progress.mastered && section.index === currentSection.index;
          const sectionOpen = topic.id === firstActiveTopicId && isCurrent ? "open" : "";
          const miniHint = state.trainingCycle.pendingMiniTest
            ? "先に小テスト"
            : isCleared
              ? "クリア済み"
              : isCurrent
                ? `次の小テストまであと${Math.max(0, miniLeft - 1)}`
                : `小テストまであと${miniLeft}`;
          const chips = [];
          for (let questionNo = section.start; questionNo <= section.end; questionNo += 1) {
            chips.push(`
              <button
                type="button"
                class="questionChip"
                data-action="single"
                data-topic-id="${escapeAttr(topic.id)}"
                data-question-no="${questionNo}"
                data-section-name="${escapeAttr(section.name)}"
              >Q${questionNo}</button>
            `);
          }

          return `
            <details class="sectionFold" ${sectionOpen}>
              <summary class="sectionFoldSummary">
                <span class="sectionFoldTitle">${isCleared ? "★" : "☆"} S${sectionNo} ${escapeHtml(section.name)}</span>
                <span class="sectionFoldMeta">Q${section.start}-${section.end} / ${count}問 / ${miniHint}</span>
              </summary>
              <div class="sectionFoldBody">
                <div class="questionChipWrap">${chips.join("")}</div>
              </div>
            </details>
          `;
        }).join("");

        return `
          <details class="topicFold" ${topicOpen}>
            <summary class="topicFoldSummary">
              <span class="topicFoldTitle">${topicIndex + 1}. ${escapeHtml(topic.name)}</span>
              <span class="topicFoldMeta">★ ${topicClearedSections}/${topicTotalSections} (${topicPercent}%)</span>
            </summary>
            <div class="topicFoldBody">
              ${sectionHtml}
            </div>
          </details>
        `;
      })
      .join("");
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
    if (state.drill.startedAt === today && state.drill.queue.length > 0) {
      doneCount = Math.min(state.drill.pointer, state.drill.queue.length);
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

    const previewTopicIds = [];
    for (const task of state.todayPlan.tasks) {
      if (!previewTopicIds.includes(task.topicId)) {
        previewTopicIds.push(task.topicId);
      }
      if (previewTopicIds.length >= 3) {
        break;
      }
    }

    preview.innerHTML = previewTopicIds
      .map((topicId) => {
        const topic = state.topics.find((item) => item.id === topicId);
        if (!topic) {
          return "";
        }
        const textbook = getTopicTextbook(topic);
        return `
          <article class="previewItem">
            <p class="previewTitle">${escapeHtml(topic.name)} の予習</p>
            <p class="note">${escapeHtml(textbook.lead)}</p>
            <ul class="checkList compactList">
              ${textbook.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
          </article>
        `;
      })
      .join("");

    for (const task of state.todayPlan.tasks) {
      const topic = state.topics.find((item) => item.id === task.topicId);
      if (!topic) {
        continue;
      }
      const progress = state.progress[topic.id] || defaultProgress();
      const section = getCurrentSection(topic, progress.nextQuestion);
      const li = document.createElement("li");
      li.textContent = `${topic.name}: ${task.count}問 (現在 ${section.name} Q${section.start}-${section.end}, 周回 ${progress.perfectRounds}/${state.settings.targetPerfectRounds})`;
      list.appendChild(li);
    }
  }

  function renderDrill() {
    const idle = byId("drillIdle");
    const active = byId("drillActive");
    const primerPanel = byId("drillPrimerPanel");
    const questionPanel = byId("drillQuestionPanel");
    const reviewPanel = byId("drillReviewPanel");
    const choicesWrap = byId("drillChoicesWrap");
    const nextBtn = byId("applyReviewResultBtn");
    const skipBtn = byId("skipBtn");
    const editBtn = byId("editCurrentQuestionBtn");
    const today = todayISO();
    const doneCount = state.drill.queue.length > 0
      ? Math.min(state.drill.pointer, state.drill.queue.length)
      : 0;
    if (state.drill.active) {
      setGauge("drillGaugeFill", "drillGaugeLabel", doneCount, state.drill.queue.length, "0%");
    } else if (state.drill.startedAt === today && state.drill.queue.length > 0) {
      setGauge("drillGaugeFill", "drillGaugeLabel", doneCount, state.drill.queue.length, "0%");
    } else {
      setGauge("drillGaugeFill", "drillGaugeLabel", 0, 0, "未開始");
    }

    if (!state.drill.active) {
      idle.classList.remove("hidden");
      active.classList.add("hidden");
      nextBtn.classList.add("hidden");
      skipBtn.classList.remove("hidden");
      editBtn.classList.remove("hidden");
      byId("drillMessage").textContent = state.drill.message || "";
      byId("drillPrimerLead").textContent = "";
      byId("drillPrimerList").innerHTML = "";
      byId("drillPrimerTip").textContent = "";
      byId("drillProgress").textContent = "";
      byId("drillQuestion").textContent = "";
      byId("drillPrompt").textContent = "";
      choicesWrap.innerHTML = "";
      byId("drillRule").textContent = "";
      byId("drillResultLine").textContent = "";
      byId("drillResultLine").classList.remove("okText", "ngText");
      byId("drillChoiceLine").textContent = "";
      byId("drillAnswerLine").textContent = "";
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

    const detail = getQuestionDetail(current.topic.id, current.questionNo, false);
    const textbook = getTopicTextbook(current.topic);
    const needsPrimer = !state.drill.primerReadTopicIds.includes(current.topic.id);

    idle.classList.add("hidden");
    active.classList.remove("hidden");

    const section = getCurrentSection(current.topic, current.questionNo);
    if (state.drill.singleMode) {
      byId("drillProgress").textContent = `進捗: ${Math.min(state.drill.pointer + 1, state.drill.queue.length)}/${state.drill.queue.length}（単問）`;
      byId("drillQuestion").textContent = `出題: ${current.topic.name} / ${section.name} / Q${current.questionNo}`;
      byId("drillRule").textContent = "ルール: 単問モード。要点確認後にこの1問だけ解いて終了します。";
    } else {
      byId("drillProgress").textContent = `進捗: ${state.drill.pointer + 1} / ${state.drill.queue.length} 問`;
      byId("drillQuestion").textContent = `出題: ${current.topic.name} / ${section.name} / Q${current.questionNo} (${section.start}-${section.end})`;
      byId("drillRule").textContent = `ルール: 各セクションを${state.settings.targetPerfectRounds}回連続満点でクリア。不正解でそのセクション先頭へ戻る。`;
    }

    if (needsPrimer) {
      primerPanel.classList.remove("hidden");
      questionPanel.classList.add("hidden");
      reviewPanel.classList.add("hidden");
      nextBtn.classList.add("hidden");
      skipBtn.classList.remove("hidden");
      editBtn.classList.remove("hidden");

      byId("drillPrimerLead").textContent = textbook.lead;
      byId("drillPrimerList").innerHTML = textbook.points
        .map((point) => `<li>${escapeHtml(point)}</li>`)
        .join("");
      const trendText = detail.trendTag || PAST5_TREND_BY_TOPIC[current.topic.id] || "";
      byId("drillPrimerTip").textContent = trendText
        ? `暗記フレーズ: ${textbook.tip} / ${trendText}`
        : `暗記フレーズ: ${textbook.tip}`;

      byId("drillPrompt").textContent = "";
      choicesWrap.innerHTML = "";
      byId("drillResultLine").textContent = "";
      byId("drillResultLine").classList.remove("okText", "ngText");
      byId("drillChoiceLine").textContent = "";
      byId("drillAnswerLine").textContent = "";
      byId("drillExplanationLine").textContent = "";
      byId("drillPitfallLine").textContent = "";
      byId("drillTermsLine").textContent = "";

      byId("drillMessage").textContent = state.drill.message || "先に要点を読んでから問題に進んでください。";
      return;
    }

    primerPanel.classList.add("hidden");
    questionPanel.classList.remove("hidden");
    byId("drillPrompt").textContent = detail.prompt;
    byId("drillPrimerLead").textContent = "";
    byId("drillPrimerList").innerHTML = "";
    byId("drillPrimerTip").textContent = "";

    choicesWrap.innerHTML = detail.choices
      .map((choice, index) => {
        const label = `${index + 1}. ${choice}`;
        const disabled = state.drill.showExplanation ? "disabled" : "";
        return `<button type="button" class="choiceBtn" data-choice-index="${index}" ${disabled}>${escapeHtml(label)}</button>`;
      })
      .join("");

    if (state.drill.showExplanation) {
      reviewPanel.classList.remove("hidden");
      nextBtn.classList.remove("hidden");
      skipBtn.classList.add("hidden");
      editBtn.classList.add("hidden");
      const isCorrect = state.drill.pendingResult === true;
      const picked = detail.choices[state.drill.selectedChoice] || "未選択";
      const correct = detail.choices[detail.correctIndex] || "";
      byId("drillResultLine").textContent = isCorrect ? "結果: 正解" : "結果: 不正解";
      byId("drillResultLine").classList.toggle("okText", isCorrect);
      byId("drillResultLine").classList.toggle("ngText", !isCorrect);
      byId("drillChoiceLine").textContent = `あなたの回答: ${picked} / 正解: ${correct}`;
      byId("drillAnswerLine").textContent = `正答根拠: ${detail.answer}`;
      byId("drillExplanationLine").textContent = `解説: ${detail.explanation}`;
      byId("drillPitfallLine").textContent = `間違えやすい点: ${detail.pitfall}`;
      const trendTail = detail.trendTag ? ` / ${detail.trendTag}` : "";
      byId("drillTermsLine").textContent = `関連用語: ${detail.terms.join(" / ")}${trendTail}`;
      byId("drillMessage").textContent = state.drill.message || "解説を確認したら次の問題へ進んでください。";
      return;
    }

    reviewPanel.classList.add("hidden");
    nextBtn.classList.add("hidden");
    skipBtn.classList.remove("hidden");
    editBtn.classList.remove("hidden");
    byId("drillResultLine").textContent = "";
    byId("drillResultLine").classList.remove("okText", "ngText");
    byId("drillChoiceLine").textContent = "";
    byId("drillAnswerLine").textContent = "";
    byId("drillExplanationLine").textContent = "";
    byId("drillPitfallLine").textContent = "";
    byId("drillTermsLine").textContent = "";
    byId("drillMessage").textContent = state.drill.message || "3択から1つ選んでください。";
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
    byId("miniTestMessage").textContent = state.miniTest.message || "3択を選択してください。";
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
    byId("mockQuestionExplain").textContent = "本番風の書き方で出題中。3択を選択してください。";
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
    list.innerHTML = "";

    for (const source of RESEARCH_SOURCES) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${escapeHtml(source.title)}:</strong> ${escapeHtml(source.insight)} <a href="${escapeAttr(source.url)}" target="_blank" rel="noreferrer noopener">出典</a>`;
      list.appendChild(li);
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

    if (state.drill.singleMode) {
      const topic = state.topics.find((item) => item.id === state.drill.singleTopicId);
      if (!topic) {
        return null;
      }
      return {
        topic,
        questionNo: clampQuestionNo(topic.id, state.drill.singleQuestionNo)
      };
    }

    const topicId = state.drill.queue[state.drill.pointer];
    const topic = state.topics.find((item) => item.id === topicId);
    if (!topic) {
      return null;
    }

    const progress = state.progress[topic.id] || defaultProgress();

    return {
      topic,
      questionNo: clampQuestionNo(topic.id, progress.nextQuestion)
    };
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
    const bank = PAST5_CHOICE_BANK[topic.id];
    if (Array.isArray(bank) && bank.length > 0) {
      const picked = bank[(Math.max(1, questionNo) - 1) % bank.length];
      return normalizeQuestion({
        ...picked,
        trendTag: picked.trendTag || PAST5_TREND_BY_TOPIC[topic.id] || ""
      });
    }

    const textbook = getTopicTextbook(topic);
    const points = Array.isArray(textbook.points) && textbook.points.length >= 3
      ? textbook.points
      : ["主語を確認する。", "要件を確認する。", "例外を確認する。"];

    return normalizeQuestion({
      prompt: `【3択】${topic.name} Q${questionNo}\n次のうち正しい学習アクションはどれ？`,
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
        count: Math.max(1, provisional)
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

    const needBased = getNeedBasedQuestions();
    const timeBased = getTimeBasedQuestions();

    return Math.max(1, Math.min(Math.max(needBased, Math.ceil(timeBased * 0.6)), timeBased * 2));
  }

  function getNeedBasedQuestions() {
    const daysLeft = Math.max(1, getDaysUntilCompleteDate());
    let remaining = 0;

    for (const topic of state.topics) {
      const progress = state.progress[topic.id] || defaultProgress();
      remaining += remainingEffort(topic, progress);
    }

    return Math.max(1, Math.ceil(remaining / daysLeft));
  }

  function getTimeBasedQuestions() {
    const minutesPerQuestion = 2.5;
    return Math.max(1, Math.floor(state.settings.dailyMinutes / minutesPerQuestion));
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
