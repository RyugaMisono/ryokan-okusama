// サイトの設定。ここだけ書き換えれば使えます。
window.RYOKAN = {
  // Apps Script の「ウェブアプリ URL」。空のままだとお試しモード（送信されません）
  GAS_URL: '',

  // 写真の差し替え：images フォルダに写真を入れて、ファイル名を書き換える
  PHOTOS: {
    hero:  'images/hero.svg',   // トップ（横長がおすすめ）
    room:  'images/room.svg',   // 客室
    meal:  'images/meal.svg',   // お食事
    bath:  'images/bath.svg'    // 湯殿
  }
};
