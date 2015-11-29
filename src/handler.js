"use strict";

// require("source-map-support").install();

import Aws from "aws-sdk";
export const S3 = new Aws.S3();
export const BASE_URL = "https://s3-REGION_HERE.amazonaws.com/BUCKET_NAME_HERE/";
export const BUCKET_NAME = 'BUCKET_NAME_HERE';
export const RSS_NAME = 'podcast.rss';

function date2string(date) {
    var zero_padding = (v) => { return (v < 10) ? String("0" + v) : String(v); };
    var y   = date.getFullYear();
    var m   = date.getMonth();
    var d   = date.getDate();
    var hh  = date.getHours();
    var mm  = date.getMinutes();
    var ss  = date.getSeconds();
    var day = date.getDay();
    var JST = "+0900";
    var month_name = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var day_name = ["Sun", " Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${day_name[day]}, ${zero_padding(d)} ${month_name[m]} ${y} ${zero_padding(hh)}:${zero_padding(mm)}:${zero_padding(ss)} ${JST}`;
}

const itemXml = (d) => {
  var keys = d.Key.split('/');
  var name = {
    'ijuin': '伊集院光 深夜の馬鹿力',
    'bakusho': '爆笑問題カーボーイ',
    'yamasato': '山里亮太の不毛な議論',
    'ogiyahagi': 'おぎやはぎのメガネびいき',
    'bananaman': 'バナナマンのバナナムーンGOLD',
    'erekata': 'エレ片のコント太郎'
  }[keys[1]];
  var day = keys[2].split('.')[0];
  var url = BASE_URL + d.Key;
  var pub_date = date2string(d.LastModified);

  return `
    <item>
      <title>${name} (${day})</title>
      <itunes:subtitle>${day}</itunes:subtitle>
      <itunes:summary>${day}</itunes:summary>
      <enclosure url="${url}" length="${d.Size}" type="audio/mpeg" />
      <pubDate>${pub_date}</pubDate>
    </item>
`
}

const createXml = (items) => {
  var itemStr = items.join("\n");
  var now = date2string(new Date());

  return `
<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>TBS Junk</title>
    <description>JUNK: TBS ラジオ</description>
    <pubDate>${now}</pubDate>
    <language>ja</language>

    ${itemStr}

  </channel>
</rss>
`
}

export const handler = (event, context) => {
    var params = {
        Bucket: BUCKET_NAME,
        Prefix: 'data/'
    };

    var allItems = [];

    S3.listObjects(params, function(err, data) {
        if (err) {
            console.log(err);
            context.fail(err);
        } else {
            data.Contents.forEach(function(d){
                if (d.Key.match(/mp3$/)) {
                  allItems.push(itemXml(d));
                }
            })

            var xml = createXml(allItems);
            var putObjectParams = {
              Bucket: BUCKET_NAME,
              Key: RSS_NAME,
              ContentType: 'application/rss+xml',
              ACL: 'public-read',
              Body: xml,
              ServerSideEncryption: 'AES256',
              StorageClass: 'STANDARD'
            }

            S3.putObject(putObjectParams, function(err, data) {
              if (err) {
                console.log(err)
                context.fail(err);
              } else {
                context.succeed();
              }
            });
        }
    });
};
