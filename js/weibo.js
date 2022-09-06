console.log("欢迎使用fuck weibo插件")

setInterval('fireContentLoadedEvent()', 3000)

function fireContentLoadedEvent() {
    let comments = document.querySelectorAll('.list_li.S_line1.clearfix');
    let cLen = comments.length
    for (let i = 0; i < cLen; i++) {
        let dom = createBlackListDom();
        let domParent = comments[i].querySelector(".arrow").parentElement;
        if (domParent.previousElementSibling.childNodes[0].innerHTML == '一键拉黑') {
            continue;
        }
        domParent.before(dom);
    }
}

function createBlackListDom() {
    let aDom = document.createElement('a')
    let blackText = document.createTextNode('一键拉黑')
    aDom.appendChild(blackText)
    aDom.setAttribute('class', 'S_txt1')

    let dom = document.createElement('li')
    dom.appendChild(aDom)
    dom.setAttribute("class", 'hover')
    dom.addEventListener("click", pullBlackList)
    return dom;
}

//主调用流程
function pullBlackList(e) {
    console.log("开始一键拉黑")
    let tempDom = e.srcElement.parentElement.parentElement.parentElement.parentElement.parentElement;
    let commentIdDom = tempDom.parentElement;
    let commentText = tempDom.getElementsByClassName('WB_text')[0].innerText;
    let commentId = commentIdDom.getAttribute('comment_id');
    let pageNum = 1;
    let totalpage = 100;
    if (confirmation(commentText)) {
        addBlackList(pageNum, commentId, totalpage);
    }
}

function confirmation(text) {
    return confirm("你确定要拉黑内容为：\n" + text + "\n\n点赞的人么?");
}

//一键拉黑，设置随机秒数，防止被夹总风控
function addBlackList(pageNum, objectId, totalpage) {
    if (pageNum > totalpage) {
        return;
    }
    lateTime = Math.floor(Math.random() * 6) + 5;
    setTimeout(() => {
        let res = getLikeBatch(pageNum, objectId);
        let uidList = res.uidList;
        for (let i = 0; i < uidList.length; i++) {
            pullBlack(uidList[i]);
        }
        totalpage = res.totalpage;
        pageNum++;
        addBlackList(pageNum, objectId, totalpage);
    }, lateTime * 500);
}

function likeBatchRes() {
    let totalpage;
    let uidList;
    return {totalpage, uidList}
}

//获取点赞人的列表（pageNum:页数，objectId:评论id）
function getLikeBatch(pageNum, objectId) {
    const xhr = new XMLHttpRequest();
    let url = "https://weibo.com/aj/like/object/big?object_type=comment&page=" + pageNum + "&object_id=" + objectId;
    xhr.open("GET", url, false);
    xhr.send();
    if (xhr.status != 200) {
        console.log("调用获取点赞列表失败:" + xhr.status);
        return null;
    }
    //解析返回值
    let responseBody = xhr.responseText;
    let resObj = JSON.parse(responseBody);
    let resHtml = resObj.data.html;
    let el = document.createElement('div');
    el.innerHTML = resHtml;
    let nameListDom = el.getElementsByTagName('li');
    let uidList = [];
    for (let i = 0; i < nameListDom.length; i++) {
        let uidTemp = nameListDom[i];
        uidList.push(uidTemp.getAttribute('uid'));
    }
    console.log("拉黑第" + pageNum + "页点赞列表");
    console.log(uidList);
    let resTotalPage = resObj.data.page.totalpage
    let res = likeBatchRes();
    res.totalpage = resTotalPage;
    res.uidList = uidList;
    return res;
}

//单用户拉黑
function pullBlack(uid) {
    var request = {
        uid: '',
        status: '1',
        interact: '1',
        follow: '1'
    };
    request.uid = uid;
    var requestJson = JSON.stringify(request)
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://weibo.com/ajax/statuses/filterUser")
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
    xhr.setRequestHeader("x-xsrf-token", "uRT_DiJLoc5pGnFUGlahmKoY")
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.send(requestJson);
}