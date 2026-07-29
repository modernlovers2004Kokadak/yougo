#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const 対象フォルダ = path.resolve(process.argv[2] || '.');
const 新版番号 = process.argv[3];

if (!/^\d+\.\d+\.\d+$/.test(新版番号 || '')) {
  console.error('使用方法: node 公開版更新.js 対象フォルダ 3.0.158');
  process.exit(1);
}

const 今日 = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date()).replaceAll('/', '');

const 変更規則 = [
  {
    ファイル: 'glossaryApp.js',
    規則: [[/const APP_VERSION='[^']+'/g, `const APP_VERSION='${新版番号}'`]]
  },
  {
    ファイル: 'index.html',
    規則: [
      [/(<title>理容師国家試験 用語集 Version )[^<]+(<\/title>)/g, `$1${新版番号}$2`],
      [/(\.(?:css|js)\?v=)[^"'<>]+/g, `$1${新版番号}`]
    ]
  },
  {
    ファイル: 'infection-classification-guide.html',
    規則: [[/(\.(?:css|js)\?v=)[^"'<>]+/g, `$1${新版番号}`]]
  },
  {
    ファイル: 'taisaku-youten.html',
    規則: [[/(\.(?:css|js)\?v=)[^"'<>]+/g, `$1${新版番号}`]]
  },
  {
    ファイル: 'manifest.webmanifest',
    規則: [[/("version"\s*:\s*")[^"]+(")/g, `$1${新版番号}$2`]]
  },
  {
    ファイル: 'sw.js',
    規則: [
      [/const CACHE=CACHE_PREFIX\+'[^']+'/g, `const CACHE=CACHE_PREFIX+'v${新版番号}-${今日}'`],
      [/(\.(?:css|js)\?v=)[^"',\]]+/g, `$1${新版番号}`]
    ]
  }
];

const 更新内容 = [];

for (const 対象 of 変更規則) {
  const ファイルパス = path.join(対象フォルダ, 対象.ファイル);
  if (!fs.existsSync(ファイルパス)) {
    throw new Error(`対象ファイルがありません: ${対象.ファイル}`);
  }

  const 元内容 = fs.readFileSync(ファイルパス, 'utf8');
  let 新内容 = 元内容;

  for (const [検索, 置換] of 対象.規則) {
    const 一致数 = [...新内容.matchAll(検索)].length;
    if (一致数 === 0) {
      throw new Error(`更新箇所を確認できません: ${対象.ファイル} / ${検索}`);
    }
    新内容 = 新内容.replace(検索, 置換);
  }

  if (新内容 !== 元内容) {
    fs.writeFileSync(ファイルパス, 新内容);
    更新内容.push(対象.ファイル);
  }
}

const 確認対象 = [
  ['glossaryApp.js', new RegExp(`APP_VERSION='${新版番号.replaceAll('.', '\\.')}'`)],
  ['index.html', new RegExp(`Version ${新版番号.replaceAll('.', '\\.')}`)],
  ['manifest.webmanifest', new RegExp(`"version"\\s*:\\s*"${新版番号.replaceAll('.', '\\.')}"`)],
  ['sw.js', new RegExp(`CACHE_PREFIX\\+'v${新版番号.replaceAll('.', '\\.')}-${今日}'`)]
];

for (const [ファイル, 規則] of 確認対象) {
  const 内容 = fs.readFileSync(path.join(対象フォルダ, ファイル), 'utf8');
  if (!規則.test(内容)) {
    throw new Error(`更新後の確認に失敗しました: ${ファイル}`);
  }
}

console.log(`公開版番号を ${新版番号} に統一しました`);
console.log(`変更ファイル: ${更新内容.join('、')}`);
