// p5tetris.

// クリアの際に一番最後に置いたブロックのゴーストが発生してしまうバグ発生(2021/01/28/23:57)
// 次の状態がクリアの場合にカレントを描画しないようにすることで対処→解消（2021/01/29/0:11）
// 下ボタン長押し中はスコアが5ずつアップするようにしたい（2021/01/29/0:16）
// playでupdate中は常に下ボタンでスコアが上がるように修正

// 画像関連、OK. なんだけど・・やっぱブラウザによるフォントの違いがでちゃうのよね。
// 固定フォント使うか、デジタル表記でアルファベットや数字を描画するかどっちかにした方がいいと思う。テキストは難しい・・・

// huiFontで統一、全体のサイズ調整完了。おけおけ。
// あとは消えるときのアニメーション。今後の課題。
// 斜めで背景に同化する感じで消した後全体を下方向にスライド
// 消えるとこはplay経由の画像をいじる、そのあとはタイルを直接データに基づいて再描画する感じで落とす

// 消すときの音も付けたしとりあえず完成です
// 次はブロック崩しとか作ってみたいです。おわり。

let mySystem;

// utility.
let dx = [0, -1, 0, 1];
let dy = [1, 0, -1, 0];

// KEYCODE変数
const K_ENTER = 13;
const K_RIGHT = 39;
const K_LEFT = 37;
const K_UP = 38;
const K_DOWN = 40;
const K_SPACE = 32;

// 音源
let playMusic; // playの間流れ続ける音楽で、selectかclearかpauseから来たらonにする。で、pauseかclearかgameoverに抜けるときにオフにする。
let clearMusic; // クリアしたら流れる。クラス内で止める。
let gameoverMusic; // ゲームオーバーで流れる。流れたら止める。
let titleMusic; // タイトル、セレクトで流れる。セレクトからどっか行ったら止める。
let eraseMusic; // 消すときの音
let myMusic;

let huiFont;

function preload(){
	playMusic = loadSound("https://inaridarkfox4231.github.io/SoundSet/tetris.mp3");
	clearMusic = loadSound("https://inaridarkfox4231.github.io/SoundSet/tetrisClear.mp3");
	gameoverMusic = loadSound("https://inaridarkfox4231.github.io/SoundSet/tetrisGameover.mp3");
	titleMusic = loadSound("https://inaridarkfox4231.github.io/SoundSet/tetrisTitle.wav");
	eraseMusic = loadSound("https://inaridarkfox4231.github.io/SoundSet/tetrisErase.wav");
	huiFont = loadFont("https://inaridarkfox4231.github.io/assets/HuiFont29.ttf");
}

function setup(){
	createCanvas(340, 500);
	mySystem = new System();
	myMusic = new Music();
  myMusic.loop("title");
}

function draw(){
	mySystem.update();
	mySystem.draw();
	mySystem.shift();
}

class Music{
	constructor(){
		this.soundFiles = {title:titleMusic, play:playMusic, clear:clearMusic, gameover:gameoverMusic, erase:eraseMusic};
	}
	loop(kind){
		this.soundFiles[kind].loop();
	}
	play(kind){
		this.soundFiles[kind].play();
	}
	stop(kind){
		this.soundFiles[kind].stop();
	}
	reset(kind){
		this.soundFiles[kind].jump(0, 0);
	}
	pause(kind){
		this.soundFiles[kind].pause();
	}
}

class System{
	constructor(){
		this.state = {title:new Title(this), select:new Select(this), play:new Play(this), erasing:new Erasing(this), clear:new Clear(this),
								  gameover:new Gameover(this), pause:new Pause(this)};
		this.currentState = this.state.title;
	}
  getState(stateName){
    if(stateName === ""){ return undefined; }
    return this.state[stateName];
  }
  setState(nextState){
    this.currentState.setNextState(""); // nextを先に初期化
    nextState.prepare(this.currentState); // 遷移前の諸準備
    this.currentState = nextState; // 移行
  }
	update(){
		this.currentState.update();
	}
	draw(){
		this.currentState.draw();
	}
	shift(){
    let nextState = this.currentState.getNextState();
    if(nextState !== undefined){
      this.setState(nextState);
    }
	}
}

class State{
	constructor(_node){
    this.node = _node;
    this.name = "";
		this.gr = createGraphics(340, 500);
    this.nextState = undefined; // 次のstateが未定義でないときに遷移させる
	}
	drawPrepare(){} // 準備描画（最初に一回だけやる）
  getNextState(){ return this.nextState; }
  setNextState(stateName){
    this.nextState = this.node.getState(stateName);
  }
  prepare(_state){
    // 新しい状態に遷移するとき、前の状態の情報を元になんかする（なんかです）
    // たとえばselectからplayに行くときにmodeの情報を与えるとか
  }
  keyAction(code){}
	update(){}
	draw(){}
}

class Title extends State{
	constructor(_node){
		super(_node);
    this.name = "title";
    this.drawPrepare();
	}
	drawPrepare(){
		this.gr.noStroke();
		this.gr.textFont(huiFont);
		this.gr.colorMode(HSB, 100);
		let sb;
		for(let i = 0; i < 270; i++){
			sb = 100 - i * 100 / 270;
			this.gr.fill(15, sb, sb);
			this.gr.rect(0, i * 2, 340, 2);
		}
		this.gr.textSize(76);
		this.gr.fill(0);
		this.gr.textAlign(CENTER, CENTER);
		this.gr.text("TETRIS", 170, 160);
		this.gr.textSize(38);
		this.gr.text("PRESS ENTER KEY", 170, 280);
	}
  prepare(_state){
    // ここでリセット
    // playに直接アクセスしてリセットする
    this.node.getState("play").reset();
		if(_state.name !== "select"){ myMusic.loop("title"); }
  }
  keyAction(code){
    // エンターキー押したらセレクトへ
    if(code === K_ENTER){
      this.setNextState("select");
    }
  }
  update(){
    // エンターキー押したら次に行くだけ
    // やることは何も無さそう・・タイトルアニメーションとか？？（フラッピーでやったやつ）
  }
  draw(){
    image(this.gr, 0, 0);
  }
}

class Select extends State{
  constructor(_node){
    super(_node);
    this.name = "select";
    this.mode = 0;
    this.choiceLength = 3;
		this.base = createGraphics(340, 500);
		this.drawPrepare();
  }
	drawPrepare(){
		this.base.colorMode(HSB, 100);
		this.base.noStroke();
		this.base.textFont(huiFont);
		let sb;
		for(let i = 0; i < 270; i++){
			sb = 100 - i * 100 / 270;
			this.base.fill(65, sb, sb);
			this.base.rect(0, i * 2, 340, 2);
		}
		this.base.fill(0, 0, 100);
		this.base.textSize(28);
	  this.base.text("SPACE KEY: PAUSE", 50, 330);
		this.base.text("↑: ROLLING", 50, 370);
		this.base.text("→←:MOVE", 50, 410);
		this.base.text("↓:FALL", 50, 450);
		this.gr.textSize(30);
		this.gr.noStroke();
		this.gr.textFont(huiFont);
	}
	prepare(_state){
		// モード変数を0に戻さないと
		this.mode = 0;
	}
  keyAction(code){
    // 上下キーで選択、エンターキーでタイトルに戻るかプレイへ移行
    switch(code){
      case K_UP:
        this.mode = (this.mode + this.choiceLength - 1) % this.choiceLength;
        break;
      case K_DOWN:
        this.mode = (this.mode + 1) % this.choiceLength;
        break;
      case K_ENTER:
        if(this.mode === 0){
          this.setNextState("title");
        }else{
          this.setNextState("play");
					myMusic.reset("title");
					myMusic.stop("title");
        }
        break;
    }
  }
  update(){
    // やることが、ない。
    // アニメーションでもするなら別だけど。
  }
  draw(){
    this.gr.image(this.base, 0, 0);
		let col = [0, 0, 0];
		let txt = ["TO TITLE", "STAGE CLEAR", "SCORE ATTACK"];
		col[this.mode] += 255;
		if(col[0] > 0){ this.gr.fill(0); this.gr.rect(50, 100, 130, 30); }
		this.gr.fill(col[0]);
		this.gr.text(txt[0], 52, 123);
		for(let k = 1; k < 3; k++){
			if(col[k] > 0){ this.gr.fill(0); this.gr.rect(50, 130 + 50 * k, 155 + 20 * k, 30); }
			this.gr.fill(col[k]);
			this.gr.text(txt[k], 52, 153 + 50 * k);
		}
    image(this.gr, 0, 0);
  }
}

class Play extends State{
  constructor(_node){
    super(_node);
    this.name = "play";
    // 次のテトリミノを表示する為のデータ
    this.nextTilePos = [[], [0, 2, 4, 6], [1, 2, 3, 4], [0, 2, 3, 5], [0, 1, 2, 4],
                           [0, 1, 3, 5], [0, 2, 3, 4], [2, 3, 4, 5]];
    // スコア計算用
    this.linescore = [0, 1000, 3000, 5000, 10000];
    this.level = 0; // レベル（初期値は1, MAXで15の予定。ステージクリアは1, 5, 9, 13に。）
    this.score = 0; // スコア（初期値は0, 999999でカンストの予定。）
    this.lines = 0; // 消した行の数。あるいは、ステージクリアだとノルマに使ったり。
    this.Matrix = []; // 積み上げ状況（12x24で作る）
    for(let j = 0; j < 25; j++){
      this.Matrix.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    this.tx = [0, 0, 0, 0];  // 落下するテトリミノのx座標(1～10)
    this.ty = [0, 0, 0, 0];  // 落下するテトリミノのy座標(0～23)（表示は4～23）
    this.phase = 0;  // フェイズ（回転用）
    this.type = 0; // これがcurrentTypeで、次のタイプを作るときにここにnextTypeをコピーする。
    this.nextType = Math.floor(Math.random() * 7) + 1;   // タイプ（テトリミノの形状：1～7）
    this.fallSpeed = 32; // 落下に要するフレーム数。つまり小さいほど速く落ちる。
    this.frame = 0; // 落下のタイミングを測るフレームカウント
    this.eraseLine = []; // 消去する行番号を格納する
    this.erasable = false; // 行消しが起こる場合これをtrueとし、フリーズに渡し、
    // 戻ってきたときにerasableなら事後処理をしたうえでerasableをfalseにする感じね。
    // つまりerasableがONの場合はerasingから戻ってきたということ。

		// 画像関連
		this.tiles = this.createTiles();
		this.numbers = this.createNumbers();
		this._gameBoard = this.createGameBoard();

    this.mode = 0; // モード変数。0:タイトルに戻る、1:ステージクリア、2:スコアアタックって感じ
  }
	createTiles(){
		// タイル画像を用意する
		let gr = createGraphics(180, 20);
		gr.noStroke();
		gr.colorMode(HSB, 70);
		gr.background(0);
  for(let i = 0; i < 7; i++){
    gr.fill(i * 10, 35, 70);
    gr.square((i + 1) * 20, 0, 20);
    gr.fill(i * 10, 70, 35);
    gr.square((i + 1) * 20 + 3, 3, 17);
    gr.fill(i * 10, 70, 70);
    gr.square((i + 1) * 20 + 3, 3, 14);
  }
  gr.fill(65);
  gr.square(8 * 20, 0, 20);
  gr.fill(5);
  gr.square(8 * 20 + 3, 3, 17);
  gr.fill(35);
  gr.square(8 * 20 + 3, 3, 14);
  return gr;
	}
	createNumbers(){
		// 数字画像を用意する
		let gr = createGraphics(180, 30);
		gr.noStroke();
		gr.textFont(huiFont);
		gr.textSize(28);
		gr.textAlign(CENTER, CENTER);
    for(let i = 0; i < 10; i++){
      gr.fill(255);
      gr.text(i, i * 18 + 9, 15);
    }
		return gr;
	}
	createGameBoard(){
		let gr = createGraphics(340, 500);
		gr.noStroke();
		gr.textFont(huiFont);
		gr.colorMode(HSB, 100);
    for(let i = 0; i < 270; i++){
      gr.fill(47, 100 - i * 100 / 270, 100 - i * 100 / 270);
      gr.rect(0, i * 2, 340, 2);
    }
    gr.fill(0, 0, 100);
    gr.rect(30, 10, 220, 420);
    gr.rect(270, 10, 60, 100);
    gr.fill(80);
    gr.rect(40, 20, 200, 400);
    gr.rect(280, 20, 40, 80);
    gr.fill(0, 0, 100);
		gr.textSize(29);
    gr.text("LEVEL:", 24, 462);
    gr.text("LINE:", 194, 462);
    gr.text("SCORE:", 24, 490);
		return gr;
	}
  prepare(_state){
    // selectから来たらmode変数の値を設定する
    // ステージクリアの場合clearから来る
    // 常に初期化？？？
		// 違う。erasingから来る場合は、だめだ！！！initializeしてはいけない！！！pauseから来る場合も！
    switch(_state.name){
      case "select":
        this.mode = _state.mode; this.initialize(); myMusic.reset("play"); myMusic.loop("play"); break;
			case "clear":
				this.initialize(); myMusic.loop("play"); break;
			case "pause":
				myMusic.loop("play"); break;
    }
		// pause, erasingからくる場合は何もしない
  }
  update(){
    if(this.erasable){
      // 消した後の諸処理
      let length = this.eraseLine.length;
      if(length > 0){
        for(let j = 0; j < length; j++){ this.Matrix.splice(this.eraseLine[length - j - 1], 1); }
        for(let j = 0; j < length; j++){ this.Matrix.unshift([8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8]); }
        this.eraseLine = [];
        this.score += this.linescore[length];  // 1, 2, 3, 4に応じて得点を加算する

        // ラインを消した場合のモードによる処理の分岐。
        if(this.mode == 1){
          this.lines -= length;
          if(this.lines < 0){ this.lines = 0; }  // ステージクリアではlengthだけlinesを減らす(負の数にはならない)。
        }else if(this.mode == 2){
          if(Math.floor(this.lines / 10) < Math.floor((this.lines + length) / 10)){
            this.level = Math.min(10, this.level + 1);
            this.fallSpeed = 32 - this.level * 2;  // 32～12.
          }
          this.lines += length;  // スコアアタックでは消したライン数をカウントする。
        }
      }
      this.erasable = false;
      // modeが1でlinesが0ならclearに移行する
      if(this.mode === 1 && this.lines === 0){
        this.setNextState("clear");
        return;
      }
			this.createBlock(); // 行消しの場合は消してからブロックを作る～（こっちに書かないとクリアした場合でもブロック作られちゃう）
    }
    if(this.Matrix[4][5] > 0 || this.Matrix[4][6] > 0){
      this.setNextState("gameover");
      return;
    }
    this.frame += 1;
		if(keyIsDown(K_DOWN)){ this.score += 5; this.frame += this.fallSpeed * 0.5; } // 下長押しでだーっと. その間は常にスコア+5ですね
    if(this.frame > this.fallSpeed){
      this.frame = 0;
      this.check();
      // this.createBlock();
    }
  }
  draw(){
    this.gr.image(this._gameBoard, 0, 0);
    // 配置済みのタイルを描画する
    this.drawAllTile();
    // 次に落ちてくるテトリミノをネクストボックスに描画する
    this.drawNextBlock();
		// 現在落下中のテトリミノを描画する（クリアするときは描画しない）
		this.drawCurrentBlock();
    // レベルを描画する
    this.drawLevel();
    // スコアを描画する
    this.drawScore();
    // ライン数を描画する
    this.drawLines();
    image(this.gr, 0, 0);
  }
  drawAllTile(){
    for(let j = 4; j < 24; j++){
      for(let i = 1; i < 11; i++){
        if(this.Matrix[j][i] > 0){
          this.drawTile(20 * (i - 1) + 40, 20 * j - 60, this.Matrix[j][i]);
        }
      }
    }
  }
  drawNextBlock(){
    let tmp;
    for(let k = 0; k < 4; k++){
      tmp = this.nextTilePos[this.nextType][k]
      this.drawTile(280 + 20 * (tmp % 2), 20 + 20 * (tmp >> 1), this.nextType);
    }
  }
	drawCurrentBlock(){
		if(this.nextState !== undefined && this.nextState.name === "clear"){ return; }
    for(let k = 0; k < 4; k++){
      if(this.ty[k] > 3){
        this.drawTile(20 * (this.tx[k] - 1) + 40, 20 * this.ty[k] - 60, this.type);
      }
    }
	}
  drawLevel(){
    let tmp = this.level;
    for(let i = 0; i < 2; i++){
      this.drawNumber(131 - 18 * i, 433, tmp % 10);
      tmp = Math.floor(tmp / 10);
    }
  }
  drawScore(){
    let tmp = this.score;
    for(let i = 0; i < 6; i++){
      this.drawNumber(203 - 18 * i, 463, tmp % 10);
      tmp = Math.floor(tmp / 10);
    }
  }
  drawLines(){
    let tmp = this.lines;
    for(let i = 0; i < 3; i++){
      this.drawNumber(302 - 18 * i, 433, tmp % 10);
      tmp = Math.floor(tmp / 10);
    }
  }
  drawTile(x, y, _type){
    // (x, y)の位置に_type色のタイルを配置する
    // 1~7で色を指定（青、赤、橙、黄緑、紫、緑、茶色）
    this.gr.image(this.tiles, x, y, 20, 20, 20 * _type, 0, 20, 20);
  }
  drawNumber(x, y, n){
    // (x, y)の位置に数字n(0～9)を描画する
    this.gr.image(this.numbers, x, y, 18, 30, 18 * n, 0, 18, 30);
  }
  getNextType(){
    // 次のテトリミノのタイプを取得する(1～7)
    return Math.floor(Math.random() * 7) + 1;
  }
  keyAction(code){
    // 上下左右キーでテトリミノを動かしスペースキーでポーズと行ったり来たりさせる。以上。
    switch(code){
      case K_RIGHT:
        this.slide(1);
        break;
      case K_LEFT:
        this.slide(-1);
        break;
      case K_UP:
        if(this.rollable()){
          this.phase = (this.phase + 1) % 4;
          this.setBlock();
        }
        break;
      case K_DOWN:
        this.frame = this.fallSpeed; // プレイ中の下ボタン押しで常にスコア+5となるように修正したのでこっちには書かないこととする
        break;
      case K_SPACE:
        this.setNextState("pause");
        break;
    }
  }
  initialize(){
    // 初期化。モードにより若干処理内容が異なる
    // とはいえ今はステージクリアしかないけどね
    for(let i = 0; i < 12; i++){
      for(let j = 0; j < 25; j++){
        this.Matrix[j][i] = 0; // とりあえず全部0にする
      }
    }
    // 両端を8にして判定に使う（jを回してi++やってしまった。。）
    for(let j = 0; j < 25; j++){ this.Matrix[j][0] = 8; this.Matrix[j][11] = 8; }
    // 最下段を8にして判定に使う
    for(let i = 0; i < 12; i++){ this.Matrix[24][i] = 8; }
    this.createBlock();
    // mode == 1ならlinesを10, 20, 30, 50(levelによる)で初期化。
    // mode == 2ならlinesを0で初期化。
    this.level += 1;
    if(this.mode == 1){  // ステージクリアモード
      this.fallSpeed = 60 / (this.level + 1); // 30, 20, 15, 12.
      this.lines = this.level * 10;
      if(this.level == 4){ this.lines += 10; } // 10, 20, 30, 50.
    }else{
      this.lines = 0;
    }
  }
  reset(){
    // タイトルに戻るときに内容を全部リセットする
    this.level = 0;
    this.score = 0;
    this.lines = 0;
    this.mode = 0;  // モード変数を0に戻す
    this.fallSpeed = 32;
    this.nextType = Math.floor(Math.random() * 7) + 1; // nextも初期化する
    for(let j = 0; j < 24; j++){
      for(let i = 1; i < 11; i++){
        this.Matrix[j][i] = 0;
      }
    }
  }
  createBlock(){
    this.type = this.nextType;
    this.nextType = this.getNextType();
    // 0番の位置の微調整
    let {type, tx, ty} = this;
    if(type == 5){
      tx[0] = 6;
    }else{
      tx[0] = 5;
    }
    if(type == 1){
      ty[0] = 2;
    }else if(type == 7){
      ty[0] = 4;
    }else{
      ty[0] = 3;
    }
    this.phase = 0;
    this.setBlock(); // typeとphaseをもとにしてテトリミノをセット。
  }
  setBlock(){
    // typeとphaseをもとに、tx, tyのデータを決定ないし更新する
    let {type, phase, tx, ty} = this;
    if(type < 4){
      let q = phase % 2;
      if(type == 1){
        tx[1] = tx[0] - q; tx[2] = tx[0] + q; tx[3] = tx[0] + 2 * q;
        ty[1] = ty[0] - 1 + q; ty[2] = ty[0] + 1 - q; ty[3] = ty[0] + 2 * (1 - q);
        return;
      }
      if(type == 2){
        tx[1] = tx[0]; tx[2] = tx[0] + 1 - 2 * q; tx[3] = tx[0] + 1;
        ty[1] = ty[0] + 1; ty[2] = ty[0]; ty[3] = ty[0] - 1 + 2 * q;
        return;
      }
      if(type == 3){
        tx[1] = tx[0] + 1; tx[2] = tx[0]; tx[3] = tx[0] + 1 - 2 * q;
        ty[1] = ty[0]; ty[2] = ty[0] - 1 + 2 * q; ty[3] = ty[0] + 1;
        return;
      }
    }
    if(type < 7){
      tx[1] = tx[0] + dx[phase]; tx[2] = tx[0] - dx[phase];
      ty[1] = ty[0] + dy[phase]; ty[2] = ty[0] - dy[phase];
      if(type == 4){
        tx[3] = tx[0] + dy[phase] - dx[phase];
        ty[3] = ty[0] - dx[phase] - dy[phase]; return;
      }
      if(type == 5){
        tx[3] = tx[0] - dx[phase] - dy[phase];
        ty[3] = ty[0] + dx[phase] - dy[phase]; return;
      }
      if(type == 6){
        tx[3] = tx[0] + dy[phase];
        ty[3] = ty[0] - dx[phase]; return;
      }
    }
    if(type == 7){
      tx[1] = tx[0]; tx[2] = tx[0] + 1; tx[3] = tx[0] + 1;
      ty[1] = ty[0] - 1; ty[2] = ty[0]; ty[3] = ty[0] - 1; return;
    }
  }
  slide(diff){
    // diffが1なら右移動、-1なら左移動
    if(diff > 0){
      for(let k = 0; k < 4; k++){ if(this.tx[k] >= 10){ return; }}
      for(let k = 0; k < 4; k++){ if(this.Matrix[this.ty[k]][this.tx[k] + 1] > 0){ return; }}
      for(let k = 0; k < 4; k++){ this.tx[k]++; }
    }else{
      for(let k = 0; k < 4; k++){ if(this.tx[k] <= 1){ return; }}
      for(let k = 0; k < 4; k++){ if(this.Matrix[this.ty[k]][this.tx[k] - 1] > 0){ return; }}
      for(let k = 0; k < 4; k++){ this.tx[k]--; }
    }
  }
  rollable(){
    // 回転可能性
    if(this.type == 7){ return true; }
    let a = this.tx[0];
    let b = this.ty[0];
		let q;
    if(this.type < 4){
      q = (this.phase + 1) % 2;
      if(this.type == 1){
        return (this.Matrix[b - 1 + a][a - q] == 0) && (this.Matrix[b + 1 - q][a + q] == 0) && (this.Matrix[b + 2 * (1 - q)][a + 2 * q] == 0);
      }
      if(this.type == 2){
        return (this.Matrix[b][a + 1 - 2 * q] == 0) && (this.Matrix[b - 1 + 2 * q][a + 1] == 0);
      }
      if(this.type == 3){
        return (this.Matrix[b - 1 + 2 * q][a] == 0) && (this.Matrix[b + 1][a + 1 - 2 * q] == 0);
      }
    }
    if(this.type < 7){
      // typeをtyって書いてた（信じられない）
      q = (this.phase + 1) % 4;  // qは次の位相
      if(this.Matrix[b + dy[q]][a + dx[q]] > 0 || this.Matrix[b - dy[q]][a - dx[q]] > 0){ return false; }
      if(this.type == 4){
        return this.Matrix[b - dx[q] - dy[q]][a + dy[q] - dx[q]] == 0;
      }
      if(this.type == 5){
        return this.Matrix[b + dx[q] - dy[q]][a - dx[q] - dy[q]] == 0;
      }
      if(this.type == 6){
        return this.Matrix[b - dx[q]][a + dy[q]] == 0;
      }
    }
  }
  check(){
    // 落とせないならFREEZEにする
    for(let k = 0; k < 4; k++){
      if(this.Matrix[this.ty[k] + 1][this.tx[k]] > 0){
        // 落とせない場合（1マス下が埋まってる）
        this.write();
        this.eraseCheck();
				// ブロックはerasableの場合は消してから作りましょう。
				if(!this.erasable){ this.createBlock(); } // こっちでブロックを作る(writeのあと)
        if(this.erasable){ this.setNextState("erasing"); } // erasableは戻ってきたときにオフにする。
        // systemがplayの情報をerasingに渡してerasingはそれを元にチカチカ処理みたいのを実行する。
        return;
      }
    }
    // そうでなければ1マス落とす
    for(let k = 0; k < 4; k++){ this.ty[k]++; }
  }
  write(){
    // 行列への書き込み操作
    for(let k = 0; k < 4; k++){
      if(this.ty[k] < 4){
        this.Matrix[this.ty[k]][this.tx[k]] = 0;
      }else{
        this.Matrix[this.ty[k]][this.tx[k]] = this.type;
      }
    }
  }
  eraseCheck(){
    // 行が消えるかどうかをチェック
    for(let j = 4; j < 24; j++){
      let is_erasable = true;
      for(let i = 1; i < 11; i++){
        if(this.Matrix[j][i] == 0){ is_erasable = false; }
      }
      if(is_erasable){ this.eraseLine.push(j); }
    }
    if(this.eraseLine.length > 0){ this.erasable = true; }
  }
}

// これ以降のあれこれはPlayからの往復ないしは移行で、
//

// 行消し状態のクラス
// アップデートはカウントを進めるだけ。このクラスはフリーズというよりErasingとかの方がいいかも。
// というわけで改名しました。

// さてと
class Erasing extends State{
  constructor(_node){
    super(_node);
    this.name = "erasing";
    this.base = createGraphics(340, 500);
    this.gr.noStroke();
    this.gr.colorMode(HSB, 100);
		this.gr.fill(80);
    this.eraseFlag = [0, 0, 0, 0];
    this.frame = 0;
		// シェーダ関連
    this.prepareShader();
  }
	prepareShader(){
    let vs =
    "precision mediump float;" +
    "attribute vec3 aPosition;" +
    "void main(){" +
    "  gl_Position = vec4(aPosition, 1.0);" +
    "}";

    // 今の状態で、p=(0,0)は左下隅という感じですねー。
    // やりたいのは中心から斜めにぎゅんっていう感じ。
    // 20カウントで終了させる
    let fs =
    "precision mediump float;" +
    "uniform vec2 u_resolution;" +
    "uniform float u_count;" +
    "uniform sampler2D base;" +
    // 対角線を交叉するように引いてそれが広がって消えていくイメージ
    "void erase0(in vec2 p, inout vec4 col){" +
    "  p.x = mod(p.x, 1.0);" +
    "  if(abs(p.x - p.y) < u_count / 40.0 || abs(1.0 - p.x - p.y) < u_count / 40.0){ col = vec4(0.0); }" +
    "}" +
    "void main(){" +
    "  vec2 p = gl_FragCoord.xy * 0.5 / min(u_resolution.x, u_resolution.y);" +
    "  vec4 col = texture2D(base, vec2(p.x / (u_resolution.x / u_resolution.y), p.y));" +
    "  erase0(p, col);" +
    "  gl_FragColor = col;" +
    "}";
	  this.gr_erase = createGraphics(200, 20, WEBGL);
	  this.eraseShader = this.gr_erase.createShader(vs, fs);
    this.gr_erase.shader(this.eraseShader);
		this.base_erase = createGraphics(200, 20); // ここにコピーする
	}
  prepare(_state){
    // play前提
    this.base.image(_state.gr, 0, 0); // これをベースにしてブランクでアニメーションする
		let index = 0;
		for(let k = 4; k < 24; k++){
			if(index < _state.eraseLine.length && _state.eraseLine[index] === k){
				this.eraseFlag.push(1);
				index++;
			}else{
				this.eraseFlag.push(0);
			}
		}
    //for(let k of _state.eraseLine){ this.eraseLine.push(k); } // コピーする。アニメが終わったら空にする
    this.frame = 0;
		for(let m = 0; m < _state.eraseLine.length; m++){ myMusic.play("erase"); }
  }
  update(){
    this.frame++;
  }
  draw(){
    this.gr.image(this.base, 0, 0);
		// 初めの30フレームで消して残りの30フレームで落とす
		this.gr.rect(40, 20, 200, 400);
		let y = 0;
	  if(this.frame < 20){
		  for(let k = 4; k < 24; k++){
			  y = 20 * k - 60;
			  if(this.eraseFlag[k]){
				  this.base_erase.image(this.base, 0, 0, 200, 20, 40, y, 200, 20);
				  this.eraseShader.setUniform("u_resolution", [200, 20]);
				  this.eraseShader.setUniform("base", this.base_erase);
				  this.eraseShader.setUniform("u_count", this.frame);
				  this.gr_erase.quad(-1, -1, -1, 1, 1, 1, 1, -1);
				  this.gr.image(this.gr_erase, 40, y, 200, 20, 0, 0, 200, 20);
			  }else{
				  this.gr.image(this.base, 40, y, 200, 20, 40, y, 200, 20);
			  }
		  }
		}else{
			// 落とす。普通に上から描画していく。
			// kよりも大きいフラグがいくつあるか調べてその数だけ下に描画する感じ
		  for(let k = 4; k < 24; k++){
				if(this.eraseFlag[k]){ continue; }
				y = 20 * k - 60;
				let prg = constrain((this.frame - 20) / 20, 0, 1);
				prg = 1 - sqrt(1 - prg * prg);
				let shift = 0;
				for(let m = k + 1; m < 24; m++){ if(this.eraseFlag[m]){ shift++; } }
				this.gr.image(this.base, 40, y + prg * 20 * shift, 200, 20, 40, y, 200, 20);
			}
		}
	  image(this.gr, 0, 0);
		// --- erasingは特殊な処理なのでdraw内でstate遷移させます --- //
    if(this.frame > 40){
			this.eraseFlag = [0, 0, 0, 0];
			this.setNextState("play");
		}
  }
}

// PlayとPauseを行き来
class Pause extends State{
  constructor(_node){
    super(_node);
    this.name = "pause";
		this.pauseText = this.createPauseText();
  }
	createPauseText(){
		let gr = createGraphics(200, 80);
		gr.background(0);
		gr.textFont(huiFont);
		gr.textAlign(CENTER, CENTER);
		gr.textSize(30);
		gr.fill(255);
		gr.text("----PAUSE----", 100, 15);
		gr.text("PRESS SPACE", 100, 55);
		return gr;
	}
  prepare(_state){
    // playからしか来ないよ
    this.gr.image(_state.gr, 0, 0);
    this.gr.background(0, 128);
    this.gr.image(this.pauseText, 40, 200);
		myMusic.pause("play");
  }
  keyAction(code){
    if(code === K_SPACE){ this.setNextState("play"); }
  }
  update(){
    // 処理なし
  }
  draw(){
    image(this.gr, 0, 0);
  }
}

// ゲームオーバー
class Gameover extends State{
  constructor(_node){
    super(_node);
    this.name = "gameover";
    this.playState = undefined;
    this.frame = 0;
		this.gameoverText = this.createGameoverText();
  }
	createGameoverText(){
		let gr = createGraphics(200, 80);
		gr.background(0);
		gr.textFont(huiFont);
		gr.textAlign(CENTER, CENTER);
		gr.textSize(30);
		gr.fill(255);
		gr.text("GAME OVER...", 100, 15);
		gr.text("PRESS RETURN", 100, 55);
		return gr;
	}
  prepare(_state){
    this.playState = _state; // 直接アクセスして灰色にしちゃう方がよさそう
    this.frame = 0;
		myMusic.reset("play");
		myMusic.stop("play");
		myMusic.play("gameover");
  }
  keyAction(code){
    // タイトルに戻れるのはアニメが終わってから
    if(this.frame > 80 && code === K_ENTER){
      this.setNextState("title");
    }
  }
  update(){
    this.frame++;
		if(this.frame > 80){ myMusic.stop("gameover"); }
  }
  draw(){
    let pl = this.playState;
    if(this.frame <= 40 && this.frame % 2 === 0){
      for(let i = 1; i < 11; i++){
				let f = Math.floor(this.frame / 2);
        if(pl.Matrix[f + 3][i] > 0){ pl.Matrix[f + 3][i] = 8; }
      }
    }
		pl.drawAllTile();
    this.gr.image(pl.gr, 0, 0);
    if(this.frame > 40){ this.gr.image(this.gameoverText, 40, 200); }
    image(this.gr, 0, 0);
  }
}

// まあそうはいっても直後に移行しないようにある程度インターバルおくか・・
class Clear extends State{
  constructor(_node){
    super(_node);
    this.name = "clear";
    this.mode = 1;
    this.level = 1;
		this.frame = 0;
		this.clearText = this.createClearText();
		this.allClearText = this.createAllClearText();
  }
	createClearText(){
		let gr = createGraphics(200, 80);
		gr.textFont(huiFont);
		gr.background(0);
		gr.textAlign(CENTER, CENTER);
		gr.textSize(30);
		gr.fill(255);
		gr.text("CLEAR!!", 100, 15);
		gr.text("PRESS RETURN", 100, 55);
		return gr;
	}
	createAllClearText(){
		let gr = createGraphics(200, 80);
		gr.textFont(huiFont);
		gr.background(0);
		gr.textAlign(CENTER, CENTER);
		gr.textSize(30);
		gr.fill(255);
		gr.text("ALL CLEAR!!!", 100, 15);
		gr.text("PRESS RETURN", 100, 55);
		return gr;
	}
  prepare(_state){
    // playから来る
    // ステージクリアの場合だけなのでlevelで場合分けしてOK
		this.frame = 0;
    this.gr.image(_state.gr, 0, 0);
    this.level = _state.level;
    if(this.level < 4){
      this.gr.image(this.clearText, 40, 200);
    }else{
      this.gr.image(this.allClearText, 40, 200);
    }
		myMusic.reset("play");
		myMusic.stop("play");
		myMusic.play("clear");
  }
  keyAction(code){
		if(this.frame < 40){ return; }
    // level < 4 ならplayへ（その後initialize）
    // level == 4 ならtitleへ（その後reset）
		if(code !== K_ENTER){ return; }
    if(this.level < 4){
      this.setNextState("play");
    }else{
      this.setNextState("title");
    }
  }
  update(){
    this.frame++;
		if(this.frame > 80){ myMusic.stop("clear"); }
  }
  draw(){
    image(this.gr, 0, 0);
  }
}

function keyPressed(){
  mySystem.currentState.keyAction(keyCode);
	return false;
}
