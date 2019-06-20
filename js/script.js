(function () {
  // ボタンと本体
  const openButton = document.querySelector('.js-openDrawer');
  const drawer = document.querySelector('.js-drawer');
  const closeButton = drawer.querySelector('.js-closeDrawer');
  // const backdrop = drawer.querySelector('.js-backdrop');

  // スクロール位置固定で使用するhtml要素
  const rootElement = document.documentElement;
  const scrollLockModifier = 'drawerOpen';
  // スクロール位置が固定された時にmargin-rightを追加する要素
  const scrollbarFixTargets = document.querySelectorAll('.js-scrollbarFix');
  // スクロール位置固定の状態
  let scrollbarFix = false;
  // iOS対策用
  const scrollableTarget = drawer.querySelector('.js-scrollable');
  let touchY = null;

  // 現在の状態（開いていたらtrue）
  let drawerOpen = false;

  // キー操作用
  const tabbableElements = drawer.querySelectorAll('a[href], button:not(:disabled)');
  const firstTabbable = tabbableElements[0];
  const lastTabbable = tabbableElements[tabbableElements.length - 1];

  // function
  // aria-expanded属性（stateは真偽値）
  function changeAriaExpanded(state) {
    const value = state ? 'true' : 'false';
    drawer.setAttribute('aria-expanded', value);
    openButton.setAttribute('aria-expanded', value);
    closeButton.setAttribute('aria-expanded', value);
  }

  // aria-expanded属性の設定（stateは真偽値）
  function changeState(state) {
    if(state === drawerOpen) {
      console.log('2回以上連続で同じ状態に変更しようとしました');
      return;
    }
    changeAriaExpanded(state);
    drawerOpen = state;
  }

  // DrawerOpen時の設定
  function openDrawer() {
    // 各aria-expanded=true,drawerOpen=true
    changeState(true);
  }

  // DrawerClose時の設定
  function closeDrawer() {
    // 各aria-expanded=false,drawerOpen=false
    changeState(false);
  }

  // 開くボタンクリック時
  function onClickOpenButton() {
    firstTabbable.focus();
    activateScrollLock();
    openDrawer();
  }

  // 閉じるボタンクリック時
  function onClickCloseButton() {
    closeDrawer();
  }

  // オーバーレイを擬似要素で作成した場合
  function onClickBackdrop(event) {
    // クリックされた要素が何なのかを判定する
    // event.targetはクリックされた要素そのもののこと（親要素には伝播しない）
    if (event.target !== drawer) {
      return;
    }
    closeDrawer();
  }

  // html要素に対して、drawerOpen時はoverflow:hiddenを指定する
  // スクロールバー分コンテンツがズレるのを防止する
  // スクロール位置固定
  function activateScrollLock() {
    addScrollbarWidth();
    rootElement.classList.add(scrollLockModifier);
  }

  // スクロール位置固定の解除
  function deactivateScrollLock() {
    removeScrollbarWidth();
    rootElement.classList.remove(scrollLockModifier);
  }

  // scrollLock解除時は「アニメーション終了時」
  function onTransitionendDrawer(event) {
    // 対象要素（drawer）のトランジション終了に合わせて処理を行う
    // 対象とするプロパティ（visibility）のトランジション終了であるかどうかを判定
    if (event.target !== drawer || event.propertyName !== 'visibility') {
      return;
    }
    if (!drawerOpen) {
      deactivateScrollLock();
      openButton.focus();
    }
  }

  // スクロール位置固定時のコンテンツのズレ対策
  // スクロールバーの幅分、ターゲット（body、header）にmargin-rightを付与
  // valueは文字列
  function addScrollbarMargin(value) {
    const targetsLength = scrollbarFixTargets.length;
    for (let i = 0; i < targetsLength; i++) {
      scrollbarFixTargets[i].style.marginRight = value;
    }
  }

  // スクロールバー分のmargin-rightを付与
  // スクロール位置固定の状態：true
  function addScrollbarWidth() {
    // スクロールバーの幅を取得
    const scrollbarWidth = window.innerWidth - rootElement.clientWidth;
    // オーバーレイタイプのスクロールバーの場合（Chromeなど）処理しない
    if (!scrollbarWidth) {
      scrollbarFix = false;
      return;
    }
    // スクロールバー分のmargin-rightを付与
    const value = scrollbarWidth + 'px';
    addScrollbarMargin(value);
    scrollbarFix = true;
  }

  // スクロールバー分のmargin-rightを削除
  // スクロール位置固定の状態：false
  function removeScrollbarWidth() {
    if (!scrollbarFix) {
      return;
    }
    addScrollbarMargin('');
    scrollbarFix = false;
  }

  // スクロール位置固定 iOS対策
  function onTouchStart(event) {
    // タッチのポイントが複数かどうかを判定
    // マルチタッチ動作（ピンチイン/アウトなど）の動作を妨害しないため
    if (event.targetTouches.length > 1) {
      return;
    }
    // touchstart時にタッチしたY座標を格納
    touchY = event.targetTouches[0].clientY;
  }

  function onTouchMove(event) {
    if (event.targetTouches.length > 1) {
      return;
    }
    // touchstart時と現在の差分から、スクロール方向を得る
    // 正：上方向へスクロール
    // 負：下方向へスクロール
    const touchMoveDiff = event.targetTouches[0].clientY - touchY;

    // スクロール対象の内容が一番上にある状態、かつ、スクロール方向が上のとき
    // touchmoveイベントのデフォルト動作（スクロール）をキャンセル
    if (scrollableTarget.scrollTop === 0 && touchMoveDiff > 0) {
      event.preventDefault();
      return;
    }
    // スクロールし終わっていて、かつ、スクロール方向が下の場合
    if (targetTotallyScrolled(scrollableTarget) && touchMoveDiff < 0) {
      event.preventDefault();
    }
  }

  // ターゲット要素がすべてスクロールし終わっているかどうかを判定
  function targetTotallyScrolled(element) {
    return element.scrollHeight - element.scrollTop <= element.clientHeight;
  }

  // オーバーレイでの処理（擬似要素で作成した場合）
  function onTouchMoveBackdrop(event) {
    if (event.target !== drawer || event.targetTouches.length > 1) {
      return;
    }
    event.preventDefault();
  }

  // Tabキー or Shift+Tabキー押下時の処理
  // Tabキー操作可能な最初の要素の処理
  function onKeydownTabKeyFirstTabbable(event) {
    // 押されたキーがTabキーではない、または、Shiftキーが一緒に押されていない場合は、何もしない
    if(event.key !== 'Tab' || !event.shiftKey) {
      return;
    }
    // 「Tab + Shift」キーが一緒に押された場合の処理
    // 最後のTabキー操作可能な要素をfocus
    event.preventDefault();
    lastTabbable.focus();
  }

  // Tabキー操作可能な最後の要素の処理
  function onKeydownTabKeyLastTabbable(event) {
    // 押されたキーがTabキーではない、または、Shiftキーが一緒に押された場合は、何もしない
    if(event.key !== 'Tab' || event.shiftKey) {
      return;
    }
    // 押されたキーがTabキー（Shiftキーは一緒に押されていない）場合の処理
    // 最初のTabキー操作可能な要素をfocus
    event.preventDefault();
    firstTabbable.focus();
  }

  // Escapeキー操作でドロワーを閉じる
  function onKeydownEsc(event) {
    if(!drawerOpen || event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    closeDrawer();
  }

  // 実行
  openButton.addEventListener('click', onClickOpenButton, false);
  closeButton.addEventListener('click', onClickCloseButton, false);
  // backdrop.addEventListener('click', onClickCloseButton, false);
  drawer.addEventListener('click', onClickBackdrop, false);
  drawer.addEventListener('transitionend', onTransitionendDrawer, false);

  firstTabbable.addEventListener('keydown', onKeydownTabKeyFirstTabbable, false);
  lastTabbable.addEventListener('keydown', onKeydownTabKeyLastTabbable, false);
  window.addEventListener('keydown', onKeydownEsc, false);

  scrollableTarget.addEventListener('touchstart', onTouchStart, false);
  scrollableTarget.addEventListener('touchmove', onTouchMove, false);
  drawer.addEventListener('touchmove', onTouchMoveBackdrop, false);
  // backdrop.addEventListener('touchmove', onTouchMoveBackdrop, false);
})();