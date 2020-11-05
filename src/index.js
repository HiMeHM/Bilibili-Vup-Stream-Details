'use strict';
import $ from 'jquery'
import * as signalR from '@microsoft/signalr'


let roomId = location.pathname.substring(1)

async function validate(){
    const id = parseInt(roomId)
    if (isNaN(id)) {
        throw error('this is not living room')
    }
    const userIdReg = /\/\/space\.bilibili\.com\/(?<id>\d+)\//g
    const roomLink = $('a.room-cover.dp-i-block.p-relative.bg-cover').attr('href')
    const userId = parseInt(userIdReg.exec(roomLink).groups.id)
    console.log('fetching vup api')
    const data = await fetch('https://vup.darkflame.ga/api/online').then(r => r.json())
    console.log('fetched successful')
    const roomIdVup = data.list.find(s => s.uid === userId)?.roomId
    if (roomIdVup && roomIdVup !== roomId){
        console.log(`roomId from url (${roomId}) is not match as roomId in vup.darkflame.ga (${roomIdVup}), gonna use roomId from vup.darkflame.ga`)
        roomId = roomIdVup
        return true
    }
    return false
}


function insertViewerDom(){
    const ele = $('div.upper-right-ctnr.p-absolute.none-select')
    ele.append(`
        <div style="color: gray" title="已知互動人數" class="right-action-ctnr dp-i-block">
            <i class="icon-font icon-view live-skin-normal-text v-middle"></i>
            <span class="action-text v-middle live-skin-normal-text dp-i-block" id="stream-viewer">--</span>
        </div>
        <div style="color: gray" title="真實彈幕數" class="right-action-ctnr dp-i-block">
            <i style="color: gray; font-size: 15px" class="icon-font live-icon-danmaku-on live-skin-normal-text v-middle"></i>
            <span class="action-text v-middle live-skin-normal-text dp-i-block" id="stream-danmaku">--</span>
            (<span id="stream-viewer-danmaku">--</span>人)
        </div>
    `)
    const popularEle = $('div[title=人气值]')
    popularEle.append(`
        (最高: <span id="stream-highest-popular">--</span>)
    `)       
    console.log(`room id is ${roomId}`)
}

const toDisplay =  (num) => num > 10000 ? num = (num / 10000).toFixed(1).concat("萬") : num

const display = {
    setEle: function(ele, num){
        $(ele)[0].innerText = toDisplay(num)
    },
    setViewer: function(num){
        this.setEle('#stream-viewer', num)
    },
    setDanmaku: function(num){
        this.setEle('#stream-danmaku', num)
    },
    setDanmakuViewer: function(num){
        this.setEle('#stream-viewer-danmaku', num)
    },
    setHighestPopular: function(num){
        this.setEle('#stream-highest-popular', num)
    }
}


// for vtuber
async function startVupSignalR(){
    const wss = `wss://vup.darkflame.ga/api/roomHub?roomId=${roomId}`
    const connection = new signalR.HubConnectionBuilder()
    .withUrl(wss, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect([1000, 5000, 10000])
    .build();
    await connection.start();
    console.log('signalR connected.')
    connection.on("ReceiveRoomData", (_, data) => {
        display.setViewer(data.participants)
        display.setDanmaku(data.realDanmaku)
        display.setDanmakuViewer(data.danmakuUser)
        display.setHighestPopular(data.maxPopularity)
    });
    connection.onclose(err => {
        console.warn(`web socket closed: ${err}`)
    })
    connection.onreconnected(() => console.log(`websocket reconnected...`))
    connection.onreconnecting(() => console.log(`websocket reconnecting...`))
}



async function start(){
    if (!await validate()) {
        console.log('this live room is not virtual up, skipped')
    }else{
        console.log('this live room is virtual up, using vup.darkflame.ga')
        insertViewerDom()
        await startVupSignalR()
    }
}

start().catch(err=>console.warn(`error happened: ${err}`))



