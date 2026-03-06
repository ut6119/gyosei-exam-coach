"use strict";

(() => {
  const STORAGE_KEY = "gyoseiExamCoach.v1";
  const RESEARCH_UPDATED_AT = "2026-03-06";

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
      title: "合格者実例: 問題演習後に六法/テキストへ回帰",
      insight:
        "周回だけでなく、誤答根拠を条文で確認する復習が定着に有効。",
      url: "https://www.agaroot.jp/gyosei/column/r03-107/"
    },
    {
      title: "合格者実例: ジグザグ学習(インプット↔演習)",
      insight:
        "分野ごとに弱点を可視化し、短サイクルで修正する運用が有効。",
      url: "https://www.agaroot.jp/gyosei/column/r06-02/"
    },
    {
      title: "出題比重(学習配分参考)",
      insight:
        "行政法・民法の比重が高く、日次計画の優先度を高める。",
      url: "https://studying.jp/gyousei/about-more/jukenshikaku.html"
    },
    {
      title: "参考(フォーサイト型): 逆算カレンダー思想",
      insight:
        "試験日と進捗から日次タスクを自動生成する運用思想を採用。",
      url: "https://www.foresight.jp/strengths/learning-system/"
    },
    {
      title: "YouTube活用例",
      insight:
        "動画は補助教材。軸は過去問と誤答解説の反復に置く。",
      url: "https://ryotti-blog.com/gyosei-youtube/"
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

  let mockTimerId = null;

  let state = loadState();
  syncStateShape();
  bindEvents();
  renderAll();

  function defaultProgress() {
    return {
      nextQuestion: 1,
      perfectRounds: 0,
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
      answer: "",
      explanation: "",
      pitfall: "",
      terms: []
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
      primerReadTopicIds: []
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

    if (!Array.isArray(state.mock.queue)) {
      state.mock.queue = [];
    }

    state.mock.pointer = Math.max(0, Math.round(Number(state.mock.pointer) || 0));
    state.mock.score = Math.max(0, Math.round(Number(state.mock.score) || 0));
    state.mock.correctCount = Math.max(0, Math.round(Number(state.mock.correctCount) || 0));
    state.mock.wrongCount = Math.max(0, Math.round(Number(state.mock.wrongCount) || 0));
    state.mock.holdCount = Math.max(0, Math.round(Number(state.mock.holdCount) || 0));

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

    safe.nextQuestion = clampNumber(safe.nextQuestion, 1, topic.total, 1);
    safe.perfectRounds = Math.max(0, Math.round(Number(safe.perfectRounds) || 0));
    safe.attempts = Math.max(0, Math.round(Number(safe.attempts) || 0));
    safe.correct = Math.max(0, Math.round(Number(safe.correct) || 0));
    safe.mistakes = Math.max(0, Math.round(Number(safe.mistakes) || 0));

    if (safe.correct > safe.attempts) {
      safe.correct = safe.attempts;
    }

    if (safe.perfectRounds >= state.settings.targetPerfectRounds) {
      safe.mastered = true;
      safe.nextQuestion = topic.total;
    } else {
      safe.mastered = false;
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
    byId("saveExamDateBtn").addEventListener("click", onSaveExamDate);
    byId("saveSettingsBtn").addEventListener("click", onSaveSettings);
    byId("addTopicBtn").addEventListener("click", onAddTopic);
    byId("generatePlanBtn").addEventListener("click", () => {
      generateTodayPlan(true);
      renderAll();
    });
    byId("startDrillBtn").addEventListener("click", onStartDrill);
    byId("drillPrimerDoneBtn").addEventListener("click", onDrillPrimerDone);
    byId("revealAnswerBtn").addEventListener("click", onRevealDrillAnswer);
    byId("correctBtn").addEventListener("click", () => handleDrillAnswer(true));
    byId("incorrectBtn").addEventListener("click", () => handleDrillAnswer(false));
    byId("skipBtn").addEventListener("click", onSkipDrillQuestion);
    byId("editCurrentQuestionBtn").addEventListener("click", onEditCurrentQuestion);
    byId("backToPrimerBtn").addEventListener("click", onBackToPrimer);

    byId("topicsTableWrap").addEventListener("click", onTopicsTableClick);
    byId("topicsTableWrap").addEventListener("change", onTopicsTableChange);

    byId("loadQuestionBtn").addEventListener("click", onLoadQuestionEditor);
    byId("saveQuestionBtn").addEventListener("click", onSaveQuestionEditor);

    byId("startMockBtn").addEventListener("click", onStartMockExam);
    byId("finishMockBtn").addEventListener("click", () => finishMockExam("模試を手動終了しました。"));
    byId("mockCorrectBtn").addEventListener("click", () => handleMockAnswer("correct"));
    byId("mockIncorrectBtn").addEventListener("click", () => handleMockAnswer("wrong"));
    byId("mockSkipBtn").addEventListener("click", () => handleMockAnswer("hold"));

    byId("glossarySearchInput").addEventListener("input", renderGlossary);
    byId("addTermBtn").addEventListener("click", onAddTerm);
    byId("glossaryTableWrap").addEventListener("click", onGlossaryTableClick);
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

  function onStartDrill() {
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
      primerReadTopicIds: []
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
    state.drill.message = `${current.topic.name} の要点確認を完了。問題に進んでください。`;

    saveState();
    renderDrill();
  }

  function onRevealDrillAnswer() {
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

    state.drill.showExplanation = true;
    state.drill.message = "解説を読んだら『できた/できない』で判定してください。";

    saveState();
    renderDrill();
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
    state.drill.message = `${current.topic.name} の要点に戻りました。`;

    saveState();
    renderDrill();
  }

  function onSkipDrillQuestion() {
    if (!state.drill.active) {
      return;
    }

    state.drill.showExplanation = false;
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

  function handleDrillAnswer(isCorrect) {
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
      state.drill.message = "先に『答えと解説を見る』を押してください。";
      saveState();
      renderDrill();
      return;
    }

    const topicId = state.drill.queue[state.drill.pointer];
    const topic = state.topics.find((item) => item.id === topicId);
    if (!topic) {
      state.drill.showExplanation = false;
      state.drill.pointer += 1;
      finalizeDrillIfDone();
      saveState();
      renderAll();
      return;
    }

    const progress = state.progress[topicId] || defaultProgress();
    const questionNo = progress.nextQuestion;

    progress.attempts += 1;
    progress.lastStudied = todayISO();

    if (isCorrect) {
      progress.correct += 1;
      state.drill.correctCount += 1;

      if (!progress.mastered) {
        if (progress.nextQuestion < topic.total) {
          progress.nextQuestion += 1;
        } else {
          progress.perfectRounds += 1;
          if (progress.perfectRounds >= state.settings.targetPerfectRounds) {
            progress.mastered = true;
            progress.nextQuestion = topic.total;
            state.drill.message = `${topic.name} は連続満点達成でクリア。`;
          } else {
            progress.nextQuestion = 1;
            state.drill.message = `${topic.name} 1周満点。もう1周連続満点でクリア。`;
          }
        }
      }
    } else {
      progress.mistakes += 1;
      progress.perfectRounds = 0;
      progress.mastered = false;
      progress.nextQuestion = 1;
      state.drill.wrongCount += 1;

      const heatKey = `${topicId}:${questionNo}`;
      state.pitfallHeatmap[heatKey] = (state.pitfallHeatmap[heatKey] || 0) + 1;

      const restartBurst = Math.min(topic.total, 12);
      const penaltyQueue = new Array(restartBurst).fill(topicId);
      state.drill.queue.splice(state.drill.pointer + 1, 0, ...penaltyQueue);
      state.drill.message = `${topic.name} Q${questionNo} で不正解。Q1に戻して追加${restartBurst}問。`;
    }

    state.progress[topicId] = normalizeProgress(topic, progress);
    state.drill.showExplanation = false;
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
    state.drill.message = `本日のドリル終了: 正解 ${state.drill.correctCount} / 不正解 ${state.drill.wrongCount} / 正答率 ${correctRate}%`;
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

    const detail = {
      prompt: byId("questionPromptInput").value.trim(),
      answer: byId("questionAnswerInput").value.trim(),
      explanation: byId("questionExplanationInput").value.trim(),
      pitfall: byId("questionPitfallInput").value.trim(),
      terms: parseTerms(byId("questionTermsInput").value)
    };

    if (!state.questionBank[topicId] || typeof state.questionBank[topicId] !== "object") {
      state.questionBank[topicId] = {};
    }

    state.questionBank[topicId][questionNo] = normalizeQuestion(detail);

    state.questionEditor.topicId = topicId;
    state.questionEditor.questionNo = questionNo;
    state.questionEditor.message = `${topic.name} Q${questionNo} の解説を保存しました。`;

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
    renderTopics();
    renderTodayPlan();
    renderDrill();
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

    const daysLeft = daysUntil(state.settings.examDate);
    const phase = phaseByDays(daysLeft);
    const dailyTarget = getDailyTargetCount();

    byId("daysLeft").textContent = daysLeft >= 0 ? `${daysLeft}日` : "終了";
    byId("phaseLabel").textContent = phase.label;
    byId("dailyTarget").textContent = `${dailyTarget}問`;

    const likely = toISODate(getLikelyExamDate(todayLocal()));
    let note = "公式試験概要の『毎年11月第2日曜』を基準に逆算します。";

    if (state.settings.examDate === likely) {
      note += ` 現在の設定は ${state.settings.examDate}（暫定候補）です。`;
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
    const rows = state.topics.map((topic) => {
      const progress = state.progress[topic.id] || defaultProgress();
      const roundsText = `${progress.perfectRounds}/${state.settings.targetPerfectRounds}`;
      const status = progress.mastered ? "クリア" : `Q${progress.nextQuestion}から`;
      const accuracy = progress.attempts > 0
        ? `${Math.round((progress.correct / progress.attempts) * 100)}%`
        : "-";

      return `
        <tr>
          <td><input data-topic-id="${escapeAttr(topic.id)}" data-field="name" value="${escapeAttr(topic.name)}" /></td>
          <td><input data-topic-id="${escapeAttr(topic.id)}" data-field="total" type="number" min="1" value="${topic.total}" /></td>
          <td>${status}</td>
          <td>${roundsText}</td>
          <td>${progress.mistakes}</td>
          <td>${accuracy}</td>
          <td>
            <button type="button" data-topic-id="${escapeAttr(topic.id)}" data-action="reset">リセット</button>
            <button type="button" data-topic-id="${escapeAttr(topic.id)}" data-action="delete">削除</button>
          </td>
        </tr>
      `;
    });

    byId("topicsTableWrap").innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>セット名</th>
            <th>問題数</th>
            <th>進行位置</th>
            <th>満点連続</th>
            <th>ミス</th>
            <th>正答率</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join("")}
        </tbody>
      </table>
    `;
  }

  function renderTodayPlan() {
    const today = todayISO();
    if (state.todayPlan.date !== today || state.todayPlan.tasks.length === 0) {
      generateTodayPlan(false);
    }

    const list = byId("todayPlanList");
    list.innerHTML = "";

    if (state.todayPlan.tasks.length === 0) {
      const li = document.createElement("li");
      li.textContent = "全セットをクリア済み。模試または記述式の再演習を実施。";
      list.appendChild(li);
      return;
    }

    for (const task of state.todayPlan.tasks) {
      const topic = state.topics.find((item) => item.id === task.topicId);
      if (!topic) {
        continue;
      }
      const progress = state.progress[topic.id] || defaultProgress();
      const li = document.createElement("li");
      li.textContent = `${topic.name}: ${task.count}問 (現在Q${progress.nextQuestion}/${topic.total}, 連続満点 ${progress.perfectRounds}/${state.settings.targetPerfectRounds})`;
      list.appendChild(li);
    }
  }

  function renderDrill() {
    const idle = byId("drillIdle");
    const active = byId("drillActive");
    const primerPanel = byId("drillPrimerPanel");
    const questionPanel = byId("drillQuestionPanel");
    const reviewPanel = byId("drillReviewPanel");

    if (!state.drill.active) {
      idle.classList.remove("hidden");
      active.classList.add("hidden");
      byId("drillMessage").textContent = state.drill.message || "";
      byId("drillPrimerLead").textContent = "";
      byId("drillPrimerList").innerHTML = "";
      byId("drillPrimerTip").textContent = "";
      byId("drillPrompt").textContent = "";
      byId("drillRule").textContent = "";
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

    byId("drillProgress").textContent = `進捗: ${state.drill.pointer + 1} / ${state.drill.queue.length} 問`;
    byId("drillQuestion").textContent = `出題: ${current.topic.name} / Q${current.questionNo} / ${current.topic.total}`;
    byId("drillRule").textContent = `ルール: ${state.settings.targetPerfectRounds}回連続満点でクリア。不正解でQ1へ戻る。`;

    if (needsPrimer) {
      primerPanel.classList.remove("hidden");
      questionPanel.classList.add("hidden");
      reviewPanel.classList.add("hidden");

      byId("drillPrimerLead").textContent = textbook.lead;
      byId("drillPrimerList").innerHTML = textbook.points
        .map((point) => `<li>${escapeHtml(point)}</li>`)
        .join("");
      byId("drillPrimerTip").textContent = `暗記フレーズ: ${textbook.tip}`;

      byId("drillPrompt").textContent = "";
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

    if (state.drill.showExplanation) {
      reviewPanel.classList.remove("hidden");
      byId("drillAnswerLine").textContent = `正答根拠: ${detail.answer}`;
      byId("drillExplanationLine").textContent = `解説: ${detail.explanation}`;
      byId("drillPitfallLine").textContent = `間違えやすい点: ${detail.pitfall}`;
      byId("drillTermsLine").textContent = `関連用語: ${detail.terms.join(" / ")}`;
      byId("drillMessage").textContent = state.drill.message || "解説を読んだら、できた/できないを押してください。";
      return;
    }

    reviewPanel.classList.add("hidden");
    byId("drillAnswerLine").textContent = "";
    byId("drillExplanationLine").textContent = "";
    byId("drillPitfallLine").textContent = "";
    byId("drillTermsLine").textContent = "";
    byId("drillMessage").textContent = state.drill.message || "まず問題を考えてから『答えと解説を見る』を押してください。";
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
    byId("questionAnswerInput").value = detail.answer;
    byId("questionExplanationInput").value = detail.explanation;
    byId("questionPitfallInput").value = detail.pitfall;
    byId("questionTermsInput").value = detail.terms.join(", ");
    byId("questionEditorMessage").textContent = state.questionEditor.message || "";
  }

  function renderMockExam() {
    byId("mockExamSpec").textContent = OFFICIAL_SPEC_TEXT;

    const idle = byId("mockIdle");
    const active = byId("mockActive");

    if (!state.mock.active) {
      idle.classList.remove("hidden");
      active.classList.add("hidden");
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
    byId("mockQuestionPrompt").textContent = detail.prompt;
    byId("mockQuestionExplain").textContent = `正答根拠(答え合わせ用): ${detail.answer}`;
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

  function getCurrentDrillQuestionContext() {
    if (!state.drill.active) {
      return null;
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
        answer: "",
        explanation: "",
        pitfall: "",
        terms: []
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
    const terms = Array.isArray(source.terms) && source.terms.length > 0
      ? source.terms
      : defaultTermsForTopic(topic);

    return {
      prompt: source.prompt || buildAutoPrompt(topic, questionNo),
      answer: source.answer || "条文の根拠 + 判例結論 + 例外条件を1行で言えること。",
      explanation: source.explanation || GENERIC_EXPLANATION[categoryKey],
      pitfall: source.pitfall || "主語・語尾・期限の取り違いに注意。",
      terms
    };
  }

  function getTopicTextbook(topic) {
    const topicText = TOPIC_TEXTBOOK[topic.id];
    if (topicText) {
      return topicText;
    }

    const categoryKey = CATEGORY_TEXTBOOK[topic.category] ? topic.category : "minor";
    return CATEGORY_TEXTBOOK[categoryKey];
  }

  function buildAutoPrompt(topic, questionNo) {
    const textbook = getTopicTextbook(topic);
    const points = Array.isArray(textbook.points) && textbook.points.length > 0
      ? textbook.points
      : ["要件を確認する。", "効果を確認する。", "例外を確認する。"];

    const pattern = questionNo % 4;
    if (pattern === 1) {
      return `【問題】${topic.name} Q${questionNo}\n「${points[0]}」を自分の言葉で1行で説明してください。`;
    }
    if (pattern === 2) {
      return `【問題】${topic.name} Q${questionNo}\nこの論点の原則と例外を1つずつ挙げてください。`;
    }
    if (pattern === 3) {
      return `【問題】${topic.name} Q${questionNo}\n「${points[1]}」を意識して、結論まで30秒で説明してください。`;
    }
    return `【問題】${topic.name} Q${questionNo}\n${textbook.tip} を使って要点を3つ言ってください。`;
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

  function buildCurriculumItems() {
    const examDate = parseISODate(state.settings.examDate);
    const today = todayLocal();
    const daysLeft = daysUntil(state.settings.examDate);

    if (daysLeft < 0) {
      return ["設定された本番日は過去日です。日付を更新してください。"];
    }

    const phase1End = addDays(examDate, -120);
    const phase2End = addDays(examDate, -45);

    const items = [];

    if (today <= phase1End) {
      items.push(`${formatDateRange(today, phase1End)}: 基礎固め (行政法/民法優先 + 主要科目1周目)`);
      items.push(`${formatDateRange(addDays(phase1End, 1), phase2End)}: 周回強化 (過去問反復 + 六法/テキスト回帰)`);
    } else if (today <= phase2End) {
      items.push(`${formatDateRange(today, phase2End)}: 周回強化 (過去問反復 + 記述対策)`);
    }

    items.push(`${formatDateRange(addDays(phase2End, 1), addDays(examDate, -1))}: 直前総仕上げ (横断復習 + 時間配分訓練)`);

    const mockOffsets = [60, 45, 30, 14, 7];
    for (const offset of mockOffsets) {
      const mockDate = addDays(examDate, -offset);
      if (mockDate >= today) {
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
    const daysLeft = daysUntil(state.settings.examDate);

    if (daysLeft < 0) {
      state.todayPlan = { date: today, tasks: [] };
      saveState();
      return;
    }

    const activeTopics = state.topics
      .map((topic) => ({ topic, score: topicScore(topic, daysLeft) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (activeTopics.length === 0) {
      state.todayPlan = { date: today, tasks: [] };
      saveState();
      return;
    }

    const phase = phaseByDays(daysLeft);
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

    const targetRounds = state.settings.targetPerfectRounds;
    const roundsLeft = Math.max(0, targetRounds - progress.perfectRounds);
    if (roundsLeft === 0) {
      return 0;
    }

    const currentRoundRemaining = Math.max(0, topic.total - progress.nextQuestion + 1);
    const additionalFullRounds = Math.max(0, roundsLeft - 1);

    return currentRoundRemaining + topic.total * additionalFullRounds;
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
    const daysLeft = Math.max(1, daysUntil(state.settings.examDate));
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
    if (daysLeft > 150) {
      return { key: "base", label: "基礎固め" };
    }
    if (daysLeft > 45) {
      return { key: "loop", label: "周回強化" };
    }
    return { key: "final", label: "直前総仕上げ" };
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
