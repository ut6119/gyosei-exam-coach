# 行政書士 合格ループコーチ

反復特化の学習法に合わせた、ローカル動作の学習管理アプリです。

## 特徴
- 本番日カウントダウン（11月第2日曜の暫定日を自動設定）
- 「連続満点でクリア / 1ミスでQ1に戻る」反復ドリル
- 各ドリルで「要点チェック(教科書) → 3択回答 → 解説確認」の順で学習
- 問題はすべて3択（選択式）
- 令和3〜7年度の公式過去問をもとに傾向化した3択問題を内蔵
- 各問いの「問題文・正答根拠・解説・間違えやすい点・関連用語」を保存
- 残日数と残問題数からの「今日の問題数」自動算出
- 専門用語集（検索・追加・更新）
- 誤答ログからの頻出ミス可視化
- 本番想定の180分・60問模試（法令等46問+基礎知識14問）
- D-60 / D-45 / D-30 / D-14 / D-7 の模試マイルストーン
- 公式情報と公式過去問5年分の出典リンクを表示

## 使い方
1. `index.html` をブラウザで開く
2. 本番日、学習時間、連続満点回数を設定
3. 問題セット（分野）と問題数を登録
4. 「今日のプランを再計算」→「ドリル開始」
5. 各ドリルで「要点を読む」→「3択を選ぶ」→「解説を読む」→「次へ」を繰り返す
6. 必要なら「問題と解説の登録」で、あなたの手持ち過去問の解説を蓄積
7. 「180分模試を開始」で本番形式トレーニング

## データ保存
- ブラウザの `localStorage` に保存
- サーバー送信なし

## 出典（アプリ内にも表示）
- https://www.gyosei-shiken.or.jp/doc/abstract/abstract.html
- https://www.gyosei-shiken.or.jp/pdf/basis.pdf
- https://www.gyosei-shiken.or.jp/pdf/r7_mondai.pdf
- https://www.gyosei-shiken.or.jp/pdf/r6_mondai.pdf
- https://www.gyosei-shiken.or.jp/pdf/r5_mondai.pdf
- https://www.gyosei-shiken.or.jp/pdf/r4_mondai.pdf
- https://www.gyosei-shiken.or.jp/pdf/r3_mondai.pdf
