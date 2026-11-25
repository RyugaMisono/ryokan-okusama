// サイトの設定。ここだけ書き換えれば使えます。
window.RYOKAN = {
  // Apps Script の「ウェブアプリ URL」。空のままだとお試しモード（送信されません）
  GAS_URL: 'https://script.google.com/macros/s/AKfycbziiMMHW7tU2cSUFIW8BXkRvr7NfNL2Px97Lr7hgG2wKYQlN5doCHxMvwWazeyf2_sP/exec',

  // 写真の差し替え：images フォルダに写真を入れて、ファイル名を書き換える
  PHOTOS: {
    hero:  'images/hero.svg',   // トップ（横長がおすすめ）
    room:  'images/room.svg',   // 客室
    meal:  'images/meal.svg',   // お食事
    bath:  'images/bath.svg'    // 湯殿
  }
};
